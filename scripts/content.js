// 使用立即执行函数来避免全局变量污染
(function() {
  let isProcessing = false;
  let isListenerRegistered = false;

  function createFloatingContainer() {
    const container = document.createElement('div');
    container.id = 'mindmap-container';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 400px;
      height: 300px;
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
      <span>Content Summary</span>
      <button id="close-mindmap" style="cursor:pointer;">×</button>
    `;
    
    const content = document.createElement('div');
    content.id = 'summary-content';
    content.style.cssText = `
      white-space: pre-wrap;
      line-height: 1.5;
      padding: 10px;
    `;
    
    container.appendChild(titleBar);
    container.appendChild(content);
    document.body.appendChild(container);
    
    const closeButton = document.getElementById('close-mindmap');
    closeButton.addEventListener('click', () => {
      container.remove();
    });
    
    implementDrag(titleBar, container);
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
    const container = document.getElementById('summary-content');
    if (!container) {
      throw new Error('Container not found');
    }
    
    // 增强 markdown 转换逻辑
    const formattedText = markdown
      .replace(/### (.*?)(\n|$)/g, '<h3>$1</h3>')
      .replace(/## (.*?)(\n|$)/g, '<h2>$1</h2>')
      .replace(/# (.*?)(\n|$)/g, '<h1>$1</h1>')
      // 处理列表
      .replace(/^\s*[-*]\s+(.*?)(\n|$)/gm, '<li>$1</li>')
      // 处理段落
      .replace(/([^\n]+)\n\n/g, '<p>$1</p>')
      // 处理单行换行
      .replace(/\n/g, '<br>');
    
    console.log('Formatted Text:', formattedText);
    
    container.innerHTML = formattedText;
    
    // 添加基本样式
    const style = document.createElement('style');
    style.textContent = `
      #summary-content h1, #summary-content h2, #summary-content h3 {
        margin: 10px 0;
        color: #333;
      }
      #summary-content h1 { font-size: 1.5em; }
      #summary-content h2 { font-size: 1.3em; }
      #summary-content h3 { font-size: 1.1em; }
      #summary-content p { margin: 8px 0; }
      #summary-content li { margin: 4px 0; }
    `;
    document.head.appendChild(style);
  }

  async function summarizeWithAI(content) {
   
    try {
      const response = await fetch('https://one.iqiy.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer sk-KTZRgAPOwZciYuhA1c03E5De1f8b40C189B7632000717300`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo-16k',
          messages: [{
            role: "user",
            content: `请使用标记标题（#表示主主题，##表示子主题，###表示详细信息）以层次结构总结以下内容。内容： ${content}`
          }],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`API Error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
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
    // 检查是否已经存在容器
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
      if (!document.getElementById('mindmap-container')) {  // 再次检查确保不重复创建
        createFloatingContainer();
        displaySummary(summary);
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