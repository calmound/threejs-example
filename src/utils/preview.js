/**
 * 代码预览工具类
 * 这个类用于管理代码的实时预览功能
 */
export class CodePreview {
  /**
   * 创建一个代码预览实例
   * @param {Object} options - 预览配置选项
   * @param {HTMLElement} options.container - 预览容器元素
   * @param {Function} options.getCode - 获取代码的函数
   * @param {Function} options.onError - 错误处理回调函数
   */
  constructor(options) {
    this.container = options.container;
    this.getCode = options.getCode || (() => '');
    this.onError = options.onError || (() => {});
    
    this.iframe = null;
    this.init();
  }
  
  /**
   * 初始化预览
   */
  init() {
    // 创建预览iframe
    this.iframe = document.createElement('iframe');
    this.iframe.style.width = '100%';
    this.iframe.style.height = '100%';
    this.iframe.style.border = 'none';
    this.iframe.style.backgroundColor = '#fff';
    
    // 添加到容器
    this.container.appendChild(this.iframe);
  }
  
  /**
   * 更新预览内容
   * @param {Object} options - 更新选项
   * @param {string} options.html - HTML代码
   * @param {string} options.css - CSS代码
   * @param {string} options.js - JavaScript代码
   */
  update({ html, css, js }) {
    try {
      // 获取iframe文档
      const doc = this.iframe.contentDocument || this.iframe.contentWindow.document;
      
      // 构建完整的HTML文档
      const content = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>预览</title>
          <style>${css || ''}</style>
          <!-- 使用普通脚本标签引入Three.js库 -->
          <script src="/node_modules/three/build/three.min.js"></script>
        </head>
        <body>
          <!-- 确保有一个canvas元素 -->
          <div id="canvas" style="width: 100%; height: 100%;"></div>
          ${html || ''}
          
          <script>
            // 捕获错误并显示
            window.onerror = function(message, source, lineno, colno, error) {
              const errorDiv = document.createElement('div');
              errorDiv.style.position = 'fixed';
              errorDiv.style.bottom = '0';
              errorDiv.style.left = '0';
              errorDiv.style.right = '0';
              errorDiv.style.padding = '10px';
              errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
              errorDiv.style.color = 'white';
              errorDiv.style.fontFamily = 'monospace';
              errorDiv.style.zIndex = '9999';
              errorDiv.textContent = \`Error: \${message} (line \${lineno}, column \${colno})\`;
              document.body.appendChild(errorDiv);
              
              // 5秒后自动隐藏
              setTimeout(() => {
                errorDiv.style.opacity = '0';
                errorDiv.style.transition = 'opacity 0.5s';
                setTimeout(() => errorDiv.remove(), 500);
              }, 5000);
              
              return true;
            };
            
            // 手动定义OrbitControls，避免模块导入问题
            // 这里我们假设THREE已经被加载为全局变量
            THREE.OrbitControls = function(object, domElement) {
              this.object = object;
              this.domElement = domElement;
              
              // 简化版的OrbitControls
              this.enableDamping = false;
              this.dampingFactor = 0.05;
              this.enabled = true;
              
              // 更新方法
              this.update = function() {
                // 简化版实现
                return true;
              };
            };
            
            // 执行用户代码
            try {
              ${js || ''}
            } catch (error) {
              console.error('预览代码执行错误:', error);
              window.onerror(error.message, null, error.lineNumber, error.columnNumber, error);
            }
          </script>
        </body>
        </html>
      `;
      
      // 写入内容
      doc.open();
      doc.write(content);
      doc.close();
    } catch (error) {
      console.error('预览更新错误:', error);
      this.onError(error);
    }
  }
  
  /**
   * 销毁预览实例
   */
  dispose() {
    if (this.iframe) {
      this.container.removeChild(this.iframe);
      this.iframe = null;
    }
  }
}
