import { defineConfig } from "vite";
import { resolve } from "path";
import fs from "fs";

// 获取所有demo目录
function getDemoDirs() {
  const demoPath = resolve(__dirname, "demos");
  if (!fs.existsSync(demoPath)) {
    return [];
  }
  return fs.readdirSync(demoPath).filter((file) => {
    return fs.statSync(resolve(demoPath, file)).isDirectory();
  });
}

// 生成所有demo的入口
function generateInput() {
  const input = {
    main: resolve(__dirname, "index.html"),
  };

  const demos = getDemoDirs();
  demos.forEach((demo) => {
    input[demo] = resolve(__dirname, `demos/${demo}/index.html`);
  });

  return input;
}

export default defineConfig({
  // 基础配置
  base: "./",

  // 构建配置
  build: {
    rollupOptions: {
      input: generateInput(),
      output: {
        // 确保资源文件放在正确的目录下
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
      },
    },
  },

  // 开发服务器配置
  server: {
    port: 3000,
    open: true,
    middlewareMode: false,
    transformIndexHtml: (html) => {
      // 注入消除滚动条的 CSS 样式
      return html.replace(
        "</head>",
        `<style>
          body { margin: 0; overflow: hidden; }
          canvas { display: block; }
        </style>
        </head>`
      );
    },
  },

  // 移除 Monaco Editor 工作器配置，简化处理
  resolve: {
    alias: {
      // 禁用 Monaco Editor 工作器
      "monaco-editor/esm/vs/editor/editor.worker": resolve(__dirname, "demos/utils/empty-worker.js"),
      "monaco-editor/esm/vs/language/json/json.worker": resolve(__dirname, "demos/utils/empty-worker.js"),
      "monaco-editor/esm/vs/language/css/css.worker": resolve(__dirname, "demos/utils/empty-worker.js"),
      "monaco-editor/esm/vs/language/html/html.worker": resolve(__dirname, "demos/utils/empty-worker.js"),
      "monaco-editor/esm/vs/language/typescript/ts.worker": resolve(__dirname, "demos/utils/empty-worker.js"),
    },
  },
});
