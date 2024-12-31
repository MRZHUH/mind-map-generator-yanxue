// 加载保存的设置
document.addEventListener('DOMContentLoaded', async () => {
  const { apiKey, apiBase, model } = await chrome.storage.sync.get(['apiKey', 'apiBase', 'model']);
  if (apiKey) document.getElementById('apiKey').value = apiKey;
  if (apiBase) document.getElementById('apiBase').value = apiBase;
  if (model) document.getElementById('model').value = model;
});

// 保存设置
document.getElementById('save').addEventListener('click', async () => {
  const apiKey = document.getElementById('apiKey').value.trim();
  const apiBase = document.getElementById('apiBase').value.trim();
  const model = document.getElementById('model').value.trim();
  
  if (!apiKey || !apiBase || !model) {
    document.getElementById('status').textContent = '请填写所有字段';
    return;
  }

  try {
    await chrome.storage.sync.set({ apiKey, apiBase, model });
    document.getElementById('status').textContent = '设置已保存';
  } catch (error) {
    document.getElementById('status').textContent = '保存失败: ' + error.message;
  }
});

// 生成思维导图
document.getElementById('generate').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  try {
    const { apiKey, apiBase, model } = await chrome.storage.sync.get(['apiKey', 'apiBase', 'model']);
    if (!apiKey || !apiBase || !model) {
      document.getElementById('status').textContent = '请先配置 API 设置';
      return;
    }

    document.getElementById('status').textContent = '后台生成中，请等待...';

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['scripts/content.js']
    });

    const response = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab.id, { 
        action: 'extractContent',
        config: { apiKey, apiBase, model }
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });

    if (response.success) {
      window.close();
    } else {
      throw new Error(response.error || 'Failed to generate mind map');
    }
  } catch (error) {
    document.getElementById('status').textContent = 'Error: ' + error.message;
  }
});
