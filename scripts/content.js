// 使用立即执行函数来避免全局变量污染
(function() {
  let isProcessing = false;
  let zoomScale = 1; // Initialize zoom scale

  function createFloatingContainer() {
    const container = document.createElement('div');
    container.id = 'mindmap-container';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 800px;
      height: 600px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 10000;
      overflow: auto;
      resize: both;
      padding: 10px;
      font-family: Arial, sans-serif;
    `;
    
    const titleBar = document.createElement('div');
    titleBar.style.cssText = `
      padding: 8px;
      background: #f5f5f5;
      cursor: move;
      display: flex;
      justify-content: space-between;
      margin: -10px -10px 10px -10px;
    `;
    titleBar.innerHTML = `
      <span>研学思维导图</span>
      <div>
        <button id="zoom-in" style="cursor:pointer; margin-right: 5px; font-size: 16px; padding: 5px 10px;">+</button>
        <input id="zoom-percentage" type="text" value="100%" style="width: 60px; text-align: center; margin-right: 5px; font-size: 16px;" />
        <button id="zoom-out" style="cursor:pointer; font-size: 16px; padding: 5px 10px;">-</button>
        <button id="close-mindmap" style="cursor:pointer; margin-left: 5px; font-size: 16px; padding: 5px 10px;">×</button>
      </div>
    `;
    
    const content = document.createElement('div');
    content.id = 'mindmap-content';
    content.style.cssText = `
      width: 100%;
      height: calc(100% - 40px);
    `;
    
    container.appendChild(titleBar);
    container.appendChild(content);
    document.body.appendChild(container);
    
    const closeButton = document.getElementById('close-mindmap');
    closeButton.addEventListener('click', () => {
      container.remove();
    });

    const zoomInButton = document.getElementById('zoom-in');
    const zoomOutButton = document.getElementById('zoom-out');
    const zoomPercentageInput = document.getElementById('zoom-percentage');
    
    zoomInButton.addEventListener('click', () => {
      zoomScale *= 1.2; // Increase zoom scale
      updateZoomDisplay();
      applyZoom();
    });

    zoomOutButton.addEventListener('click', () => {
      zoomScale /= 1.2; // Decrease zoom scale
      updateZoomDisplay();
      applyZoom();
    });

    zoomPercentageInput.addEventListener('input', () => {
      const newZoom = parseFloat(zoomPercentageInput.value) / 100;
      if (!isNaN(newZoom) && newZoom > 0) {
        zoomScale = newZoom;
        applyZoom();
      }
    });

    zoomPercentageInput.addEventListener('blur', () => {
      updateZoomDisplay(); // Reset to current zoom if input is invalid
    });
    
    implementDrag(titleBar, container);
  }

  function updateZoomDisplay() {
    const zoomPercentageInput = document.getElementById('zoom-percentage');
    if (zoomPercentageInput) {
      zoomPercentageInput.value = `${(zoomScale * 100).toFixed(0)}%`;
    }
  }

  function applyZoom() {
    const svg = document.querySelector('#mindmap-content svg');
    if (svg) {
      svg.style.transform = `scale(${zoomScale})`;
      svg.style.transformOrigin = '0 0'; // Set transform origin to top-left
    }
  }

  function implementDrag(titleBar, container) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    titleBar.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      container.style.top = (container.offsetTop - pos2) + "px";
      container.style.left = (container.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  function displaySummary(markdown) {
    const container = document.getElementById('mindmap-content');
    if (!container) {
      throw new Error('Container not found');
    }

    // Clear previous content
    container.innerHTML = '';

    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.width = '100%';
    svg.style.height = '100%';
    container.appendChild(svg);

    // Check if d3 library is loaded
    if (typeof d3 === 'undefined') {
      throw new Error('d3 library not loaded');
    }

    // Load markmap script
    const loadMarkmapScript = () => {
      return new Promise((resolve, reject) => {
        if (window.markmap) {
          resolve(window.markmap);
          return;
        }

        const scripts = [
          chrome.runtime.getURL('lib/markmap-lib.min.js'),
          chrome.runtime.getURL('lib/markmap-view.min.js')
        ];

        Promise.all(scripts.map(src => {
          return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        })).then(() => {
          if (window.markmap) {
            resolve(window.markmap);
          } else {
            reject(new Error('Failed to load markmap'));
          }
        }).catch(reject);
      });
    };

    // Use async function to wait for library loading
    return loadMarkmapScript()
      .then(markmap => {
        const transformer = new markmap.Transformer();
        const { root } = transformer.transform(markdown);
        const mm = markmap.Markmap.create(svg, null, root);
        mm.fit(); // Fit view
      })
      .catch(error => {
        console.error('Error loading markmap:', error);
        container.innerHTML = `<div style="color: red;">Error loading mind map: ${error.message}</div>`;
      });
  }

  async function summarizeWithAI(content) {
    try {
      // 从 chrome.storage 获取设置
      const { apiKey, apiBase } = await chrome.storage.sync.get(['apiKey', 'apiBase']);
      if (!apiKey || !apiBase) {
        throw new Error('API settings not configured');
      }

      const response = await fetch(`${apiBase}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo-16k',
          messages: [{
            role: "user",
            content: `请将以下内容总结为思维导图的形式，使用Markdown格式，必须使用#、##、###等标题语法来表示层级关系。
            
            示例格式：
            # 主题
            ## 子主题1
            ### 详细信息1
            ### 详细信息2
            ## 子主题2
            ### 详细信息3
            
            忽略与内容主体无关的信息，需要总结的内容：${content}`
          }],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  }

  function cleanText(node) {
    // 跳过脚本和样式标签
    if (node.tagName === 'SCRIPT' || 
        node.tagName === 'STYLE' || 
        node.tagName === 'NOSCRIPT' ||
        node.tagName === 'IFRAME' ||
        node.tagName === 'CODE' ||
        node.tagName === 'PRE') {
      return '';
    }

    // 检查元素是否可见
    if (node.nodeType === Node.ELEMENT_NODE) {
      const style = window.getComputedStyle(node);
      if (style.display === 'none' || 
          style.visibility === 'hidden' || 
          style.opacity === '0') {
        return '';
      }
    }

    // 获取文本内容
    let text = '';
    
    // 如果是文本节点，直接获取内容
    if (node.nodeType === Node.TEXT_NODE) {
      text = node.textContent.trim();
      // 如果文本只包含空白字符，返回空字符串
      if (!text.replace(/\s+/g, '')) {
        return '';
      }
      return text;
    }
    
    // 处理子节点
    for (const child of node.childNodes) {
      const childText = cleanText(child);
      if (childText) {
        text += childText + ' ';
      }
    }

    // 对于标题和段落，添加换行
    if (node.tagName && /^H[1-6]$|^P$/.test(node.tagName)) {
      text += '\n';
    }
    
    return text.trim();
  }

  async function extractContent() {
    if (document.getElementById('mindmap-container')) {
      console.log('Container already exists');
      return;
    }

    if (isProcessing) {
      console.log('Already processing a request');
      return;
    }

    isProcessing = true;

    try {
      const mainContent = document.querySelector('article, main, .article, .content') || document.body;
      let cleanedText = cleanText(mainContent)
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();

      if (!cleanedText) {
        console.log('No content extracted');
        return;
      }

      const summary = await summarizeWithAI(cleanedText);
      if (!document.getElementById('mindmap-container')) {
        createFloatingContainer();
        await displaySummary(summary); // 等待思维导图渲染完成
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    } finally {
      isProcessing = false;
    }
  }

  // 确保只注册一次监听器
  if (!window.hasRegisteredContentListener) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'extractContent') {
        extractContent()
          .then(() => sendResponse({success: true}))
          .catch(error => sendResponse({success: false, error: error.message}));
        return true;
      }
    });
    window.hasRegisteredContentListener = true;
  }

})();
