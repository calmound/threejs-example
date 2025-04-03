/**
 * 案例数据索引
 *
 * 每个案例需要包含以下信息：
 * - id: 案例目录名称
 * - title: 案例标题
 * - description: 案例描述
 * - thumbnail: 缩略图路径
 * - tags: 标签数组
 */

export const examples = [
  {
    id: "rotating-cube",
    title: "旋转立方体",
    description: "一个基础的 Three.js 示例，展示一个在场景中旋转的彩色立方体。",
    thumbnail: "/src/demos/rotating-cube/thumbnail.jpg",
    tags: ["basic", "animation"],
  },
  {
    id: "animated-line",
    title: "动画线条",
    description: "一个使用Three.js创建的动画线条效果",
    thumbnail: "/src/demos/animated-line/thumbnail.jpg",
    tags: ["animation", "line"],
  },
];

/**
 * 获取案例详细信息
 * @param {string} id - 案例ID
 * @returns {Object|null} - 案例信息或null
 */
export function getExampleById(id) {
  return examples.find((example) => example.id === id) || null;
}
