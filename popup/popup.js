document.getElementById('generate').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  try {
    // 检查是否已注入，但不重复注入
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['scripts/content.js']
    });

    // 直接发送消息
    await chrome.tabs.sendMessage(tab.id, { action: 'extractContent' });
    window.close();
  } catch (error) {
    document.getElementById('status').textContent = 'Error: ' + error.message;
  }
}); 