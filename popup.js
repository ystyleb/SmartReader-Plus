// 添加调试工具
const debug = {
    log: function(category, ...args) {
        console.log(`[SmartReader+][${category}]`, ...args);
    },
    error: function(category, ...args) {
        console.error(`[SmartReader+][${category}]`, ...args);
    },
    warn: function(category, ...args) {
        console.warn(`[SmartReader+][${category}]`, ...args);
    }
};

// 加载设置
document.addEventListener('DOMContentLoaded', () => {
    debug.log('Popup', '弹出窗口已加载');

    // 加载设置
    chrome.storage.local.get('settings', (data) => {
        const settings = data.settings || {
            readingModeEnabled: true,  // 默认开启自动检测
            autoSavePrompt: true,      // 默认开启保存提示
            pocketEnabled: false,
            readwiseEnabled: false,
            pocketApiKey: '',
            readwiseApiKey: ''
        };
        
        debug.log('Popup', '加载设置:', settings);
        
        // 设置复选框状态
        document.getElementById('reading-mode-enabled').checked = settings.readingModeEnabled;
        document.getElementById('auto-save-prompt').checked = settings.autoSavePrompt;
        document.getElementById('pocket-enabled').checked = settings.pocketEnabled;
        document.getElementById('readwise-enabled').checked = settings.readwiseEnabled;
        
        // 设置 API key
        document.getElementById('pocket-api-key').value = settings.pocketApiKey || '';
        document.getElementById('readwise-api-key').value = settings.readwiseApiKey || '';
    });

    // 添加阅读模式按钮
    document.getElementById('start-reading-mode').addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const activeTab = tabs[0];
            debug.log('Popup', '开始检查内容:', activeTab.url);
            
            chrome.tabs.sendMessage(activeTab.id, {action: 'checkContent'}, (response) => {
                if (chrome.runtime.lastError) {
                    debug.error('Popup', '发送消息失败:', chrome.runtime.lastError);
                    return;
                }
                if (response && response.success) {
                    debug.log('Popup', '成功触发内容检查');
                    window.close(); // 关闭弹出窗口
                }
            });
        });
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
    
    debug.log('Popup', '保存设置:', settings);
    
    chrome.storage.local.set({ settings }, () => {
        // 显示保存成功提示
        const button = document.getElementById('save-settings');
        const originalText = button.textContent;
        button.textContent = '已保存';
        button.style.background = '#28a745';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#28a745';
        }, 2000);
        
        debug.log('Popup', '设置已保存');
    });
}); 