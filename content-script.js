/$$
 $ @Author       : winsonyang 
 $ @Date         : 2025-02-18 14:04:58
 $ @LastEditors  : winsonyang 
 $ @LastEditTime : 2025-02-18 14:10:15
 $ @FilePath     : /SmartReader+/content-script.js
 $ @Description  : 
 $ @
 $ @Copyright (c) 2025 by Tencent, All Rights Reserved. 
 $/
// 添加页面宽度设置相关的常量
const MIN_CONTENT_WIDTH = 600;
const MAX_CONTENT_WIDTH = 1200;
const DEFAULT_CONTENT_WIDTH = 800;
const WIDTH_STEP = 100;

// 从 chrome.storage 中获取保存的宽度设置
async function getSavedWidth() {
    const result = await chrome.storage.sync.get('contentWidth');
    return result.contentWidth || DEFAULT_CONTENT_WIDTH;
}

// 保存宽度设置到 chrome.storage
async function saveWidth(width) {
    await chrome.storage.sync.set({ contentWidth: width });
}

// 创建阅读模式工具栏
function createReadingModeToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'reading-mode-toolbar';
    
    const controls = document.createElement('div');
    controls.className = 'reading-controls';
    
    // 添加宽度调节控件
    const widthControls = document.createElement('div');
    widthControls.className = 'width-controls';
    
    const decreaseBtn = document.createElement('button');
    decreaseBtn.innerHTML = '➖';
    decreaseBtn.title = '减小宽度';
    decreaseBtn.className = 'toolbar-btn';
    
    const widthValue = document.createElement('span');
    widthValue.className = 'width-value';
    
    const increaseBtn = document.createElement('button');
    increaseBtn.innerHTML = '➕';
    increaseBtn.title = '增加宽度';
    increaseBtn.className = 'toolbar-btn';
    
    widthControls.appendChild(decreaseBtn);
    widthControls.appendChild(widthValue);
    widthControls.appendChild(increaseBtn);
    
    // 添加分隔线
    const separator = document.createElement('div');
    separator.className = 'separator';
    
    controls.appendChild(widthControls);
    controls.appendChild(separator);
    
    // 添加其他现有的控件
    // ... existing code ...
    
    toolbar.appendChild(controls);
    
    // 设置宽度调节事件处理
    let currentWidth;
    
    const updateWidth = (width) => {
        if (width >= MIN_CONTENT_WIDTH && width <= MAX_CONTENT_WIDTH) {
            currentWidth = width;
            document.documentElement.style.setProperty('--content-width', `${width}px`);
            widthValue.textContent = `${width}px`;
            saveWidth(width);
        }
    };
    
    decreaseBtn.addEventListener('click', () => {
        if (currentWidth > MIN_CONTENT_WIDTH) {
            updateWidth(currentWidth - WIDTH_STEP);
        }
    });
    
    increaseBtn.addEventListener('click', () => {
        if (currentWidth < MAX_CONTENT_WIDTH) {
            updateWidth(currentWidth + WIDTH_STEP);
        }
    });
    
    // 初始化宽度设置
    getSavedWidth().then(width => {
        updateWidth(width);
    });
    
    return toolbar;
}