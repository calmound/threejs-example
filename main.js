// 导入案例数据
import { examples } from "./src/demos/index.js";

// DOM 元素
const examplesGrid = document.getElementById("examples-grid");
const searchInput = document.getElementById("search-input");
const tagButtons = document.querySelectorAll(".tag");

// 当前选中的标签
let activeTag = "all";

// 初始化页面
function init() {
  renderExamples();
  setupEventListeners();
}

// 渲染所有案例
function renderExamples() {
  // 清空网格
  examplesGrid.innerHTML = "";

  // 获取搜索关键词
  const searchTerm = searchInput.value.toLowerCase();

  // 过滤案例
  const filteredExamples = examples.filter((example) => {
    // 标签过滤
    const tagMatch = activeTag === "all" || example.tags.includes(activeTag);

    // 搜索过滤
    const searchMatch =
      example.title.toLowerCase().includes(searchTerm) || example.description.toLowerCase().includes(searchTerm);

    return tagMatch && searchMatch;
  });

  // 如果没有匹配的案例
  if (filteredExamples.length === 0) {
    examplesGrid.innerHTML = `
      <div class="no-results">
        <p>没有找到匹配的案例。请尝试其他搜索词或标签。</p>
      </div>
    `;
    return;
  }

  // 渲染匹配的案例
  filteredExamples.forEach((example) => {
    const card = createExampleCard(example);
    examplesGrid.appendChild(card);
  });
}

// 创建案例卡片
function createExampleCard(example) {
  const card = document.createElement("div");
  card.className = "example-card";

  // 卡片内容
  card.innerHTML = `
    <div class="card-image" style="background-image: url('${example.thumbnail}')">
      <div class="card-tags">
        ${example.tags.map((tag) => `<span class="card-tag">${tag}</span>`).join("")}
      </div>
    </div>
    <div class="card-content">
      <h3 class="card-title">${example.title}</h3>
      <p class="card-description">${example.description}</p>
      <a href="./src/demos/${example.id}/" class="card-link">查看案例 →</a>
    </div>
  `;

  return card;
}

// 设置事件监听器
function setupEventListeners() {
  // 搜索输入事件
  searchInput.addEventListener("input", renderExamples);

  // 标签点击事件
  tagButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // 更新激活状态
      tagButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // 更新当前标签
      activeTag = button.dataset.tag;

      // 重新渲染案例
      renderExamples();
    });
  });
}

// 页面加载完成后初始化
document.addEventListener("DOMContentLoaded", init);
