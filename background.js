// Service Worker 生命周期处理
self.addEventListener('install', (event) => {
    console.log('Service Worker 安装完成');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker 已激活');
});

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'SAVE_TO_POCKET') {
        // TODO: 实现 Pocket API 集成
        console.log('保存到 Pocket:', request.url);
        sendResponse({success: true});
    } else if (request.type === 'SAVE_TO_READWISE') {
        // TODO: 实现 Readwise API 集成
        console.log('保存到 Readwise:', request.url);
        sendResponse({success: true});
    }
    return true; // 保持消息通道开放
});

// 扩展安装时的处理
chrome.runtime.onInstalled.addListener(() => {
    console.log('扩展已安装/更新');
    // 初始化存储
    chrome.storage.local.set({
        settings: {
            readingModeEnabled: true,
            autoSavePrompt: true,
            pocketEnabled: false,
            readwiseEnabled: false,
            pocketApiKey: '',
            readwiseApiKey: ''
        }
    }, () => {
        console.log('初始设置已完成');
    });
});

// 保持Service Worker活跃
chrome.runtime.onConnect.addListener((port) => {
    console.log('建立了新的连接');
    port.onDisconnect.addListener(() => {
        console.log('连接已断开');
    });
}); 