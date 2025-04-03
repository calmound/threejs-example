import demoConfig from "./config.js";

// 处理路径，移除多余的src目录
const processPath = (demo) => {
  if (demo.entry && demo.entry.includes("/src/")) {
    demo.entry = demo.entry.replace("/src/", "/");
  }
  return demo;
};

// 导出所有demos的配置
export const demos = Array.isArray(demoConfig) ? demoConfig.map(processPath) : [];
// 为了兼容性，将demos作为examples导出
export const examples = demos;

// 导出获取demo配置的方法
export const getDemoById = (id) => {
  return demos.find((demo) => demo.id === id) || null;
};

// 导出获取所有demos的方法
export const getAllDemos = () => {
  return [...demos].sort((a, b) => a.title.localeCompare(b.title));
};

export default {
  demos,
  examples,
  getDemoById,
  getAllDemos,
};
