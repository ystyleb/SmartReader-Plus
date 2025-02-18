// 阅读时间估算函数
function estimateReadingTime(text) {
    // 计算中文字符数
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    const chineseCount = chineseChars.length;
    
    // 计算英文单词数
    const englishText = text.replace(/[\u4e00-\u9fa5]/g, ' '); // 将中文字符替换为空格
    const englishWords = englishText.split(/\s+/).filter(word => word.length > 0);
    const englishCount = englishWords.length;
    
    // 中文阅读速度：平均每分钟300字
    // 英文阅读速度：平均每分钟200词
    const chineseMinutes = chineseCount / 300;
    const englishMinutes = englishCount / 200;
    
    const totalMinutes = Math.ceil(chineseMinutes + englishMinutes);
    
    console.log('内容分析：', {
        中文字数: chineseCount,
        英文单词数: englishCount,
        估计阅读时间: totalMinutes + '分钟'
    });
    
    return totalMinutes;
}

// 获取页面主要内容
function getMainContent() {
    // 检查是否是腾讯文档系统
    const isKMArticle = window.location.hostname.includes('km.woa.com');
    
    if (isKMArticle) {
        // 针对腾讯文档系统的特殊处理
        const articleContent = document.querySelector('#km-container > div.app-container > div.article-show-container > div.article-show-wrapper > div > div.article-present-wrapper > div.article-main');
        
        if (articleContent) {
            // 过滤掉不需要的内容
            const filteredContent = Array.from(articleContent.children).filter(child => {
                // 排除二维码、头像等元素
                if (child.querySelector('img')) return false;
                // 排除更新时间、标签等元数据
                if (child.textContent.includes('更新于:') || 
                    child.textContent.includes('标签:') ||
                    child.textContent.includes('微信扫一扫赞赏') ||
                    child.textContent.includes('人已赞赏') ||
                    child.textContent.includes('最近访问此文') ||
                    child.textContent.includes('我顶') ||
                    child.textContent.includes('收藏') ||
                    child.textContent.includes('已转载') ||
                    child.textContent.includes('暂未转载') ||
                    child.textContent.includes('转载到') ||
                    child.textContent.includes('未加入K吧')) {
                    return false;
                }
                return true;
            });

            // 创建一个新的容器来存放过滤后的内容
            const container = document.createElement('div');
            filteredContent.forEach(element => container.appendChild(element.cloneNode(true)));

            console.log('找到腾讯文档文章内容元素:', {
                原始内容长度: articleContent.innerText.length,
                过滤后内容长度: container.innerText.length,
                过滤后内容预览: container.innerText.substring(0, 200) + '...'
            });

            return {
                element: container,
                text: container.innerText
            };
        }
    }

    const selectors = [
        // 腾讯文档系统特定选择器
        '#article-content-wrap',
        '.article-detail',
        '.article-content-wrap',
        '#article_content',
        '.km-article-content',
        // 原有的通用选择器
        'article',
        '.article',
        '.post-content',
        '.content',
        '.entry-content',
        '.post',
        'main',
        '#main-content',
        '.main-content',
        '.article-content',
        '.blog-post',
        '[role="main"]',
        '.notion-page-content',
        '.notion-text-block',
        '.super-content',
        '.super-content-wrapper',
        '[class*="content"]',
        '[class*="article"]',
        '[class*="post"]'
    ];

    let mainElement = null;
    let maxLength = 0;
    let bestScore = 0;

    // 尝试所有选择器
    for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            console.log('找到内容元素：', selector, elements.length, '个');
            
            elements.forEach(el => {
                // 跳过隐藏元素
                if (el.offsetParent === null) return;
                
                const text = (el.innerText || '').trim();
                // 计算内容质量分数
                let score = text.length;
                
                // 提高包含特定标签的元素的分数
                if (el.querySelector('h1, h2, h3, p, img')) {
                    score *= 1.5;
                }
                
                // 降低包含广告、导航等元素的分数
                if (el.querySelector('.ad, .nav, .menu, .sidebar, .comment')) {
                    score *= 0.5;
                }
                
                // 检查是否在可视区域内
                const rect = el.getBoundingClientRect();
                if (rect.top >= 0 && rect.left >= 0) {
                    score *= 1.2;
                }

                if (score > bestScore) {
                    bestScore = score;
                    maxLength = text.length;
                    mainElement = el;
                }
            });
        }
    }

    // 如果没有找到足够长的内容，使用备用方法
    if (!mainElement || maxLength < 1000) {
        console.log('使用备用方法查找内容...');
        const allElements = document.body.getElementsByTagName('*');
        
        for (const element of allElements) {
            if (!element || 
                element.tagName === 'SCRIPT' || 
                element.tagName === 'STYLE' || 
                element.offsetParent === null) continue;
            
            const text = (element.innerText || '').trim();
            let score = text.length;
            
            // 提高包含特定标签的元素的分数
            if (element.querySelector('h1, h2, h3, p, img')) {
                score *= 1.5;
            }
            
            if (score > bestScore) {
                bestScore = score;
                maxLength = text.length;
                mainElement = element;
            }
        }
    }

    if (mainElement) {
        console.log('找到主要内容元素：', mainElement.tagName, mainElement.className);
        console.log('内容长度：', maxLength, '字符');
        console.log('内容质量分数：', bestScore);
    }

    return {
        element: mainElement,
        text: mainElement ? mainElement.innerText : ''
    };
}

// 创建阅读模式提示UI
function createReadingModePrompt(defaultContent) {
    const prompt = document.createElement('div');
    prompt.className = 'smartreader-prompt';
    prompt.innerHTML = `
        <div class="smartreader-prompt-content">
            <h3>检测到较长文章</h3>
            <p>是否切换到阅读模式以获得更好的阅读体验？</p>
            <button id="enable-reading-mode">开启阅读模式</button>
            <button id="select-content">选择内容</button>
            <button id="dismiss-prompt">暂不需要</button>
        </div>
    `;
    document.body.appendChild(prompt);
    
    // 绑定事件
    document.getElementById('enable-reading-mode').addEventListener('click', () => {
        prompt.remove();
        enableReadingMode(defaultContent);
    });
    
    document.getElementById('select-content').addEventListener('click', () => {
        prompt.remove();
        createElementSelector();
    });
    
    document.getElementById('dismiss-prompt').addEventListener('click', () => prompt.remove());
}

// 创建收藏提示UI
function createSavePrompt() {
    const prompt = document.createElement('div');
    prompt.className = 'smartreader-save-prompt';
    prompt.innerHTML = `
        <div class="smartreader-prompt-content">
            <h3>保存文章？</h3>
            <p>将文章保存到：</p>
            <button id="save-to-pocket">Pocket</button>
            <button id="save-to-readwise">Readwise</button>
            <button id="dismiss-save">关闭</button>
        </div>
    `;
    document.body.appendChild(prompt);
    
    // 绑定事件
    document.getElementById('save-to-pocket').addEventListener('click', saveToPocket);
    document.getElementById('save-to-readwise').addEventListener('click', saveToReadwise);
    document.getElementById('dismiss-save').addEventListener('click', () => prompt.remove());
}

// 启用阅读模式
function enableReadingMode(contentElement) {
    if (!contentElement) return;

    // 提取文章标题
    const title = document.title || '';
    
    // 提取文章内容
    const content = extractContent(contentElement);
    
    // 打印调试信息
    console.log('启用阅读模式:', {
        标题: title,
        内容元素: contentElement,
        内容元素类名: contentElement.className,
        内容元素ID: contentElement.id,
        原始内容长度: contentElement.innerText.length,
        处理后内容长度: content.length
    });

    const readingContainer = document.createElement('div');
    readingContainer.className = 'smartreader-reading-mode';
    readingContainer.innerHTML = `
        <div class="reading-mode-toolbar">
            <div class="reading-mode-toolbar-inner">
                <button id="exit-reading-mode">退出阅读模式</button>
                <div class="reading-controls">
                    <button id="increase-font">放大字体</button>
                    <button id="decrease-font">缩小字体</button>
                </div>
            </div>
        </div>
        <div class="reading-mode-content">
            <article class="article-content">
                <h1 class="article-title">${title}</h1>
                ${content}
            </article>
        </div>
    `;
    
    document.body.appendChild(readingContainer);
    
    // 触发进入动画
    requestAnimationFrame(() => {
        readingContainer.classList.add('active');
    });

    // 字体大小调节
    let currentFontSize = 16;
    const articleContent = readingContainer.querySelector('.article-content');
    
    // 更新字体大小的函数
    function updateFontSize(size) {
        currentFontSize = size;
        articleContent.style.fontSize = `${size}px`;
        const paragraphs = articleContent.querySelectorAll('p, li, blockquote');
        paragraphs.forEach(p => {
            p.style.fontSize = `${size}px`;
        });
        const h1 = articleContent.querySelector('.article-title');
        if (h1) h1.style.fontSize = `${size * 1.75}px`;
        const h2 = articleContent.querySelectorAll('h2');
        h2.forEach(h => h.style.fontSize = `${size * 1.5}px`);
        const h3 = articleContent.querySelectorAll('h3');
        h3.forEach(h => h.style.fontSize = `${size * 1.25}px`);
        console.log('字体大小已更新为:', size);
    }

    // 初始化字体大小
    updateFontSize(currentFontSize);
    
    // 绑定退出按钮事件
    document.getElementById('exit-reading-mode').addEventListener('click', () => {
        readingContainer.classList.add('exit');
        readingContainer.classList.remove('active');
        setTimeout(() => {
            readingContainer.remove();
            document.body.style.overflow = 'auto';
        }, 400);
    });

    // 绑定字体大小调节事件
    document.getElementById('increase-font').addEventListener('click', () => {
        const newSize = Math.min(currentFontSize + 2, 24);
        updateFontSize(newSize);
    });

    document.getElementById('decrease-font').addEventListener('click', () => {
        const newSize = Math.max(currentFontSize - 2, 14);
        updateFontSize(newSize);
    });
    
    // 禁用页面滚动
    document.body.style.overflow = 'hidden';
    
    // 开始计时
    startReadingTimer();
    
    // 平滑滚动到顶部
    readingContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    // 添加退出阅读模式的快捷键
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            readingContainer.classList.add('exit');
            readingContainer.classList.remove('active');
            setTimeout(() => {
                readingContainer.remove();
                document.body.style.overflow = 'auto';
            }, 400);
        }
    });
}

// 提取文章内容
function extractContent(element) {
    let content = '';
    let debugContent = ''; // 用于调试的纯文本内容
    
    // 递归处理节点
    function processNode(node) {
        // 跳过不需要的元素
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            if (['script', 'style', 'iframe', 'nav', 'header', 'footer'].includes(tagName)) {
                return;
            }
            
            // 跳过广告、分享按钮等
            const className = (node.className || '').toString();
            if (className && (
                className.includes('ad') || 
                className.includes('advertisement') || 
                className.includes('social') || 
                className.includes('share') || 
                className.includes('comment')
            )) {
                return;
            }
        }
        
        // 处理文本节点
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text) {
                debugContent += text + '\n';
                const parentTag = node.parentElement ? node.parentElement.tagName.toLowerCase() : '';
                
                // 根据父元素类型处理文本
                if (['p', 'div', 'article', 'section'].includes(parentTag)) {
                    content += `<p>${text}</p>\n`;
                } else if (['li'].includes(parentTag)) {
                    // 列表项内的文本不需要额外包装
                    content += text;
                } else if (!['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'].includes(parentTag)) {
                    // 其他普通文本节点
                    content += `<p>${text}</p>\n`;
                }
            }
            return;
        }
        
        // 处理元素节点
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            
            // 保留标题标签
            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
                const headingText = node.textContent.trim();
                if (headingText) {
                    content += `<${tagName}>${headingText}</${tagName}>\n`;
                }
                return;
            }
            
            // 保留图片
            if (tagName === 'img' && node.src) {
                content += `<figure><img src="${node.src}" alt="${node.alt || ''}" /></figure>\n`;
                return;
            }
            
            // 保留列表
            if (tagName === 'ul' || tagName === 'ol') {
                const listItems = Array.from(node.children)
                    .filter(child => child.tagName.toLowerCase() === 'li')
                    .map(li => `<li>${li.textContent.trim()}</li>`)
                    .join('\n');
                if (listItems) {
                    content += `<${tagName}>\n${listItems}\n</${tagName}>\n`;
                }
                return;
            }
            
            // 保留引用
            if (tagName === 'blockquote') {
                const quoteText = node.textContent.trim();
                if (quoteText) {
                    content += `<blockquote>${quoteText}</blockquote>\n`;
                }
                return;
            }
            
            // 保留代码块
            if (tagName === 'pre' || tagName === 'code') {
                const codeText = node.textContent.trim();
                if (codeText) {
                    content += `<pre><code>${codeText}</code></pre>\n`;
                }
                return;
            }
            
            // 递归处理子节点
            node.childNodes.forEach(processNode);
        }
    }
    
    // 处理根元素
    processNode(element);
    
    // 打印提取的内容摘要
    console.log('提取的内容摘要:', {
        原始元素: element.tagName,
        原始元素类名: element.className,
        原始文本长度: element.textContent.length,
        处理后HTML长度: content.length,
        纯文本长度: debugContent.length,
        纯文本预览: debugContent.substring(0, 200) + '...',
        HTML预览: content.substring(0, 200) + '...'
    });
    
    return content;
}

// 保存到Pocket
function saveToPocket() {
    // TODO: 实现Pocket API集成
    console.log('保存到Pocket');
}

// 保存到Readwise
function saveToReadwise() {
    // TODO: 实现Readwise API集成
    console.log('保存到Readwise');
}

// 开始阅读计时器
let readingStartTime = null;
function startReadingTimer() {
    readingStartTime = new Date();
    setTimeout(checkReadingDuration, 10 * 60 * 1000); // 10分钟后检查
}

// 检查阅读时长
function checkReadingDuration() {
    if (!readingStartTime) return;
    
    const now = new Date();
    const readingDuration = (now - readingStartTime) / 1000 / 60; // 转换为分钟
    
    if (readingDuration >= 10) {
        createSavePrompt();
    }
}

// 初始化
function initialize() {
    console.log('SmartReader+ 初始化中...');
    
    // 等待页面加载完成
    if (document.readyState === 'complete') {
        waitForContent();
    } else {
        window.addEventListener('load', waitForContent);
    }
}

// 等待内容加载
function waitForContent() {
    console.log('等待内容加载...');
    
    // 检查是否是腾讯文档系统
    const isKMArticle = window.location.hostname.includes('km.woa.com');
    
    // 初始延迟，等待可能的动态内容加载
    setTimeout(() => {
        // 检查内容是否已加载
        const checkContent = () => {
            // 针对腾讯文档系统的特殊处理
            if (isKMArticle) {
                const articleContent = document.querySelector('#km-container > div.app-container > div.article-show-container > div.article-show-wrapper > div > div.article-present-wrapper > div.article-main');
                
                if (articleContent && articleContent.textContent.trim()) {
                    console.log('找到腾讯文档文章内容');
                    startDetection();
                    return;
                }
                
                console.log('腾讯文档内容还未找到，等待后重试...');
                setTimeout(checkContent, 1000);
                return;
            }
            
            const content = getMainContent();
            if (content.text.length < 100) {
                console.log('内容似乎还没加载完成，等待后重试...');
                setTimeout(checkContent, 1000);
                return;
            }
            
            // 内容加载完成，开始检测
            startDetection();
        };
        
        checkContent();
    }, 1000);
}

// 检测逻辑
function startDetection() {
    console.log('开始检测页面内容...');
    
    // 检查是否启用了阅读模式
    chrome.storage.local.get('settings', (data) => {
        const settings = data.settings || {};
        
        if (settings.readingModeEnabled !== false) { // 默认启用
            // 直接启动元素选择器
            createElementSelector();
        } else {
            console.log('阅读模式已被禁用');
        }
    });
}

// 创建元素选择器
function createElementSelector() {
    let hoveredElement = null;
    let highlightElement = null;
    let isSelecting = true;

    // 创建高亮元素
    function createHighlight() {
        const highlight = document.createElement('div');
        highlight.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 999998;
            background: rgba(0, 122, 255, 0.1);
            border: 2px solid #007AFF;
            border-radius: 4px;
            display: none;
            transition: all 0.2s ease;
        `;
        document.body.appendChild(highlight);
        return highlight;
    }

    // 创建提示框
    function createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 999999;
            background: #333;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            display: none;
            transition: all 0.2s ease;
        `;
        document.body.appendChild(tooltip);
        return tooltip;
    }

    // 更新高亮位置
    function updateHighlight(element) {
        if (!element || !highlightElement) return;
        const rect = element.getBoundingClientRect();
        highlightElement.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 999998;
            background: rgba(0, 122, 255, 0.1);
            border: 2px solid #007AFF;
            border-radius: 4px;
            top: ${rect.top}px;
            left: ${rect.left}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            display: block;
            transition: all 0.2s ease;
        `;
    }

    // 更新提示框位置
    function updateTooltip(element, tooltip, event) {
        if (!element || !tooltip) return;
        const text = element.innerText.trim();
        const wordCount = text.length;
        const estimatedMinutes = Math.ceil(wordCount / 500); // 粗略估计阅读时间
        tooltip.textContent = `${element.tagName.toLowerCase()} - ${wordCount}字 (约${estimatedMinutes}分钟) - 点击进入阅读模式`;
        tooltip.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 999999;
            background: #333;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            top: ${event.clientY + 20}px;
            left: ${event.clientX + 10}px;
            display: block;
            transition: all 0.2s ease;
            white-space: nowrap;
        `;
    }

    // 创建取消按钮
    function createCancelButton() {
        const button = document.createElement('button');
        button.textContent = '退出选择';
        button.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 999999;
            background: #f1f1f1;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            color: #333;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: all 0.2s ease;
        `;
        button.addEventListener('mouseover', () => {
            button.style.background = '#ddd';
        });
        button.addEventListener('mouseout', () => {
            button.style.background = '#f1f1f1';
        });
        document.body.appendChild(button);
        return button;
    }

    highlightElement = createHighlight();
    const tooltip = createTooltip();
    const cancelButton = createCancelButton();

    // 鼠标移动事件处理
    function handleMouseMove(e) {
        if (!isSelecting) return;

        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (!element) return;

        // 忽略工具栏元素
        if (element === cancelButton || 
            element === highlightElement || 
            element === tooltip ||
            element.closest('.smartreader-content-selector')) {
            if (highlightElement) highlightElement.style.display = 'none';
            if (tooltip) tooltip.style.display = 'none';
            return;
        }

        // 查找最近的内容容器
        let container = element;
        while (container && 
               container !== document.body && 
               container.innerText && 
               container.innerText.length < 100) {
            container = container.parentElement;
        }

        if (container && container !== document.body && container.innerText) {
            hoveredElement = container;
            if (highlightElement) updateHighlight(container);
            if (tooltip) updateTooltip(container, tooltip, e);
        } else {
            if (highlightElement) highlightElement.style.display = 'none';
            if (tooltip) tooltip.style.display = 'none';
        }
    }

    // 点击事件处理
    function handleClick(e) {
        if (!isSelecting || !hoveredElement) return;
        e.preventDefault();
        e.stopPropagation();

        // 清理选择器
        cleanup();
        
        // 启用阅读模式
        enableReadingMode(hoveredElement);
    }

    // 清理函数
    function cleanup() {
        isSelecting = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('click', handleClick);
        highlightElement.remove();
        tooltip.remove();
        cancelButton.remove();
        document.body.style.cursor = 'default';
    }

    // 绑定事件
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);
    cancelButton.addEventListener('click', cleanup);

    // 修改鼠标样式
    document.body.style.cursor = 'crosshair';
}

// 启动初始化
initialize(); 