// 加载设置
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get('settings', (data) => {
        const settings = data.settings || {};
        
        // 设置复选框状态
        document.getElementById('reading-mode-enabled').checked = settings.readingModeEnabled;
        document.getElementById('auto-save-prompt').checked = settings.autoSavePrompt;
        document.getElementById('pocket-enabled').checked = settings.pocketEnabled;
        document.getElementById('readwise-enabled').checked = settings.readwiseEnabled;
        
        // 设置 API key
        document.getElementById('pocket-api-key').value = settings.pocketApiKey || '';
        document.getElementById('readwise-api-key').value = settings.readwiseApiKey || '';
    });
});

// 保存设置
document.getElementById('save-settings').addEventListener('click', () => {
    const settings = {
        readingModeEnabled: document.getElementById('reading-mode-enabled').checked,
        autoSavePrompt: document.getElementById('auto-save-prompt').checked,
        pocketEnabled: document.getElementById('pocket-enabled').checked,
        readwiseEnabled: document.getElementById('readwise-enabled').checked,
        pocketApiKey: document.getElementById('pocket-api-key').value,
        readwiseApiKey: document.getElementById('readwise-api-key').value
    };
    
    chrome.storage.local.set({ settings }, () => {
        // 显示保存成功提示
        const button = document.getElementById('save-settings');
        const originalText = button.textContent;
        button.textContent = '设置已保存！';
        button.style.background = '#28a745';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#007AFF';
        }, 2000);
    });
}); 