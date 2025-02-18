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
    },
    group: function(category) {
        console.group(`[SmartReader+][${category}]`);
    },
    groupEnd: function() {
        console.groupEnd();
    }
};

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
        debug.log('检测', '检测到腾讯文档系统页面');
        
        // 针对腾讯文档系统的特殊处理
        const articleContent = document.querySelector('div[data-v-6ebdecf7][class="reader-container"]');
        
        if (articleContent) {
            debug.log('检测', '找到文章内容容器');
            
            // 等待图片加载完成
            const images = articleContent.querySelectorAll('img');
            debug.log('图片处理', `找到 ${images.length} 张图片`);
            
            images.forEach(img => {
                const dataSrc = img.getAttribute('data-src');
                if (dataSrc && !img.src) {
                    debug.log('图片处理', '加载图片:', {
                        'data-src': dataSrc,
                        当前src: img.src || '无'
                    });
                    img.src = dataSrc;
                }
            });
            
            // 过滤掉不需要的内容
            const filteredContent = Array.from(articleContent.children).filter(child => {
                // 排除特定的元素
                if (child.classList.contains('watermark')) return false;
                if (child.classList.contains('custom-user-info')) return false;
                
                // 保留主要内容
                if (child.classList.contains('km-view-content')) return true;
                
                return false;
            });

            // 创建一个新的容器来存放过滤后的内容
            const container = document.createElement('div');
            filteredContent.forEach(element => {
                try {
                    const clone = element.cloneNode(true);
                    
                    // 移除水印相关元素
                    const watermarks = clone.querySelectorAll('.watermark');
                    watermarks.forEach(wm => wm.remove());
                    
                    // 处理图片元素
                    const imgElements = clone.querySelectorAll('img');
                    debug.log('图片处理', `处理克隆节点中的 ${imgElements.length} 张图片`);
                    
                    imgElements.forEach(img => {
                        try {
                            // 复制原始图片的所有属性
                            const dataSrc = img.getAttribute('data-src');
                            const originalImg = element.querySelector(`img[data-src="${dataSrc}"]`);
                            
                            if (originalImg) {
                                debug.log('图片处理', '复制图片属性:', {
                                    'data-src': dataSrc,
                                    '原始src': originalImg.src || '无',
                                    '是否已加载': !!originalImg.src
                                });
                                
                                // 复制已加载图片的src
                                if (originalImg.src) {
                                    img.src = originalImg.src;
                                }
                                
                                // 复制计算后的样式
                                const computedStyle = window.getComputedStyle(originalImg);
                                img.style.cssText = computedStyle.cssText;
                                
                                // 确保图片可见
                                img.style.display = 'block';
                                img.style.opacity = '1';
                            } else {
                                debug.warn('图片处理', '未找到原始图片:', dataSrc);
                            }
                        } catch (error) {
                            debug.error('图片处理', '处理单个图片时出错:', error);
                        }
                    });
                    
                    container.appendChild(clone);
                } catch (error) {
                    debug.error('内容处理', '处理内容元素时出错:', error);
                }
            });

            debug.log('检测', '内容处理完成', {
                原始内容长度: articleContent.innerText.length,
                过滤后内容长度: container.innerText.length,
                过滤后内容预览: container.innerText.substring(0, 200) + '...',
                图片数量: container.querySelectorAll('img').length
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
            <div class="button-container">
                <button id="enable-reading-mode" class="primary-button">开启阅读模式</button>
                <div class="secondary-buttons">
                    <button id="select-content">选择内容</button>
                    <button id="dismiss-prompt">暂不需要</button>
                </div>
            </div>
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

// 处理图片
async function processImage(node) {
    if (node.closest('.watermark')) return '';
    
    // 收集所有图片属性
    const attributes = Array.from(node.attributes).reduce((attrs, attr) => {
        if (attr.name === 'src' || attr.name === 'data-src') {
            const url = attr.value;
            // 处理腾讯文档系统的图片URL
            if (url && url.includes('km.woa.com/asset')) {
                attrs['data-original-src'] = url; // 保存原始URL
                attrs['data-km-url'] = url; // 标记为腾讯文档图片
            } else if (url && !url.startsWith('http')) {
                attrs['src'] = new URL(url, window.location.href).href;
            } else {
                attrs['src'] = url;
            }
        } else if (attr.name === 'style') {
            attrs['style'] = attr.value;
        } else if (attr.name === 'class') {
            attrs['class'] = attr.value;
        } else if (attr.name.startsWith('data-')) {
            // 保留所有 data- 属性
            attrs[attr.name] = attr.value;
        } else if (attr.name === 'width' || attr.name === 'height') {
            // 保留宽高属性
            attrs[attr.name] = attr.value;
        }
        return attrs;
    }, {});
    
    // 构建属性字符串，移除 data-no-src 属性
    const attrString = Object.entries(attributes)
        .filter(([key]) => key !== 'data-no-src')
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
    
    // 创建图片容器，保持原始样式
    const containerStyle = node.parentElement?.getAttribute('style') || 'text-align: center; margin: 1em 0;';
    return `<div style="${containerStyle}"><img ${attrString} loading="lazy" /></div>\n`;
}

// 获取重定向后的图片URL
async function getRedirectedImageUrl(url) {
    try {
        const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        return response.url;
    } catch (error) {
        debug.error('图片处理', '获取重定向URL失败:', error);
        return url;
    }
}

// 启用阅读模式
async function enableReadingMode(contentElement) {
    if (!contentElement) return;

    // 提取文章标题
    const title = document.title || '';
    
    // 提取文章内容
    const content = await extractContent(contentElement);
    
    // 打印调试信息
    debug.log('启用阅读模式', {
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
    
    // 处理图片加载
    const images = readingContainer.querySelectorAll('img[data-km-url]');
    for (const img of images) {
        const kmUrl = img.getAttribute('data-km-url');
        if (kmUrl) {
            try {
                // 获取重定向后的URL
                const redirectedUrl = await getRedirectedImageUrl(kmUrl);
                debug.log('图片处理', '获取到重定向URL:', {
                    原始URL: kmUrl,
                    重定向URL: redirectedUrl
                });
                
                // 创建一个新的图片元素来预加载
                const preloadImg = new Image();
                preloadImg.onload = () => {
                    img.src = redirectedUrl;
                    img.style.opacity = '1';
                    debug.log('图片处理', '图片加载成功:', redirectedUrl);
                };
                preloadImg.onerror = () => {
                    debug.error('图片处理', '图片加载失败:', redirectedUrl);
                    img.style.display = 'none';
                };
                preloadImg.src = redirectedUrl;
                
                // 添加加载动画
                img.style.opacity = '0';
                img.style.transition = 'opacity 0.3s ease';
            } catch (error) {
                debug.error('图片处理', '处理图片失败:', error);
            }
        }
    }
    
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
async function extractContent(element) {
    let content = '';
    let debugContent = ''; // 用于调试的纯文本内容
    
    // 递归处理节点
    async function processNode(node) {
        // 跳过不需要的元素
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            if (['script', 'style', 'iframe', 'nav', 'header', 'footer'].includes(tagName)) {
                return;
            }
            
            // 跳过水印和用户信息
            const className = (node.className || '').toString();
            if (className && (
                className.includes('watermark') || 
                className.includes('custom-user-info')
            )) {
                return;
            }
        }
        
        // 处理文本节点
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text) {
                debugContent += text + '\n';
                const parentElement = node.parentElement;
                
                // 如果父元素是 p 标签，直接返回，让父元素处理
                if (parentElement && parentElement.tagName.toLowerCase() === 'p') {
                    return;
                }
                
                // 处理独立文本节点
                if (!['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'pre', 'code'].includes(parentElement?.tagName.toLowerCase())) {
                    content += `<p>${text}</p>\n`;
                }
            }
            return;
        }
        
        // 处理元素节点
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            const className = (node.className || '').toString();
            
            // 处理段落
            if (tagName === 'p' || className.includes('km-view-content')) {
                // 保留原始样式
                const style = node.getAttribute('style') || '';
                const classNames = node.getAttribute('class') || '';
                content += `<p${style ? ` style="${style}"` : ''}${classNames ? ` class="${classNames}"` : ''}>${node.innerHTML}</p>\n`;
                return;
            }
            
            // 处理标题
            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
                const style = node.getAttribute('style') || '';
                const classNames = node.getAttribute('class') || '';
                const headingText = node.innerHTML; // 使用 innerHTML 保留格式
                content += `<${tagName}${style ? ` style="${style}"` : ''}${classNames ? ` class="${classNames}"` : ''}>${headingText}</${tagName}>\n`;
                return;
            }
            
            // 处理图片
            if (tagName === 'img') {
                // 直接使用已加载的图片
                const computedStyle = window.getComputedStyle(node);
                const containerStyle = node.parentElement?.getAttribute('style') || 'text-align: center; margin: 1em 0;';
                content += `<div style="${containerStyle}"><img src="${node.src}" style="${computedStyle.cssText}" /></div>\n`;
                return;
            }
            
            // 处理列表
            if (tagName === 'ul' || tagName === 'ol') {
                const style = node.getAttribute('style') || '';
                const classNames = node.getAttribute('class') || '';
                const listItems = await Promise.all(Array.from(node.children)
                    .filter(child => child.tagName.toLowerCase() === 'li')
                    .map(async li => {
                        const liStyle = li.getAttribute('style') || '';
                        const liClassNames = li.getAttribute('class') || '';
                        return `<li${liStyle ? ` style="${liStyle}"` : ''}${liClassNames ? ` class="${liClassNames}"` : ''}>${li.innerHTML}</li>`;
                    }));
                if (listItems.length > 0) {
                    content += `<${tagName}${style ? ` style="${style}"` : ''}${classNames ? ` class="${classNames}"` : ''}>\n${listItems.join('\n')}\n</${tagName}>\n`;
                }
                return;
            }
            
            // 处理引用
            if (tagName === 'blockquote') {
                const style = node.getAttribute('style') || '';
                const classNames = node.getAttribute('class') || '';
                content += `<blockquote${style ? ` style="${style}"` : ''}${classNames ? ` class="${classNames}"` : ''}>${node.innerHTML}</blockquote>\n`;
                return;
            }
            
            // 处理代码块
            if (tagName === 'pre' || tagName === 'code') {
                const style = node.getAttribute('style') || '';
                const classNames = node.getAttribute('class') || '';
                content += `<${tagName}${style ? ` style="${style}"` : ''}${classNames ? ` class="${classNames}"` : ''}>${node.innerHTML}</${tagName}>\n`;
                return;
            }
            
            // 处理 span 和其他内联元素
            if (['span', 'strong', 'em', 'b', 'i', 'u', 'a'].includes(tagName)) {
                const style = node.getAttribute('style') || '';
                const classNames = node.getAttribute('class') || '';
                const href = tagName === 'a' ? ` href="${node.getAttribute('href')}"` : '';
                content += `<${tagName}${style ? ` style="${style}"` : ''}${classNames ? ` class="${classNames}"` : ''}${href}>${node.innerHTML}</${tagName}>`;
                return;
            }
            
            // 递归处理子节点
            for (const childNode of node.childNodes) {
                await processNode(childNode);
            }
        }
    }
    
    // 处理根元素
    await processNode(element);
    
    // 打印提取的内容摘要
    debug.log('内容提取', {
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
    debug.log('初始化', 'SmartReader+ 初始化中...');
    
    // 等待页面加载完成
    if (document.readyState === 'complete') {
        waitForContent();
    } else {
        window.addEventListener('load', waitForContent);
    }
}

// 等待内容加载
function waitForContent() {
    debug.log('初始化', '等待内容加载...');
    
    // 初始延迟，等待可能的动态内容加载
    setTimeout(() => {
        // 检查内容是否已加载
        const content = getMainContent();
        
        // 只有当内容长度超过2000字时才自动显示提示
        if (content && content.text.length > 2000) {
            debug.log('初始化', '检测到长文本，显示提示');
            createReadingModePrompt(content.element);
        } else {
            debug.log('初始化', '内容长度不足或未找到内容，不显示提示');
        }
    }, 1500);
}

// 检测逻辑
function startDetection() {
    debug.group('检测');
    debug.log('检测', '开始检查页面内容...');
    
    // 获取主要内容
    const content = getMainContent();
    
    if (content && content.text.length > 100) {
        debug.log('检测', '找到有效内容:', {
            文本长度: content.text.length,
            元素类型: content.element.tagName,
            元素类名: content.element.className,
            预览: content.text.substring(0, 100) + '...'
        });
        // 显示提示弹窗
        createReadingModePrompt(content.element);
    } else {
        debug.warn('检测', '未找到足够长的内容');
    }
    debug.groupEnd();
}

// 监听来自插件的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    debug.group('消息');
    debug.log('消息', '收到消息:', request);
    
    if (request.action === 'checkContent') {
        debug.log('消息', '收到检查内容请求');
        startDetection();
        sendResponse({success: true});
    }
    
    debug.groupEnd();
    return true;
});

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
            border-radius: 6px;
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
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            display: none;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(tooltip);
        return tooltip;
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
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            color: #333;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: all 0.2s ease;
        `;
        button.addEventListener('mouseover', () => {
            button.style.background = '#e4e4e4';
            button.style.transform = 'translateY(-1px)';
        });
        button.addEventListener('mouseout', () => {
            button.style.background = '#f1f1f1';
            button.style.transform = 'translateY(0)';
        });
        document.body.appendChild(button);
        return button;
    }

    // 更新高亮位置
    function updateHighlight(element) {
        if (!element || !highlightElement) return;
        const rect = element.getBoundingClientRect();
        highlightElement.style.display = 'block';
        highlightElement.style.top = `${rect.top}px`;
        highlightElement.style.left = `${rect.left}px`;
        highlightElement.style.width = `${rect.width}px`;
        highlightElement.style.height = `${rect.height}px`;
    }

    // 更新提示框位置
    function updateTooltip(element, tooltip, event) {
        if (!element || !tooltip) return;
        const text = element.innerText.trim();
        const wordCount = text.length;
        const readingTime = estimateReadingTime(text);
        tooltip.textContent = `${element.tagName.toLowerCase()} - ${wordCount}字 (约${readingTime}分钟) - 点击进入阅读模式`;
        tooltip.style.display = 'block';
        
        // 计算提示框位置，确保不会超出屏幕
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        let left = event.clientX + 10;
        let top = event.clientY + 20;
        
        // 确保提示框不会超出右边界
        if (left + tooltipRect.width > window.innerWidth) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        
        // 确保提示框不会超出下边界
        if (top + tooltipRect.height > window.innerHeight) {
            top = event.clientY - tooltipRect.height - 10;
        }
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
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
            element.closest('.smartreader-prompt') ||
            element.closest('.smartreader-save-prompt')) {
            highlightElement.style.display = 'none';
            tooltip.style.display = 'none';
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
            updateHighlight(container);
            updateTooltip(container, tooltip, e);
        } else {
            highlightElement.style.display = 'none';
            tooltip.style.display = 'none';
        }
    }

    // 点击事件处理
    function handleClick(e) {
        if (!isSelecting || !hoveredElement) return;
        e.preventDefault();
        e.stopPropagation();

        cleanup();
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