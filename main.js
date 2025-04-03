// 导入案例数据
import { examples } from "./src/demos/index.js";

// DOM 元素
const examplesGrid = document.getElementById("examples-grid");
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

  // 过滤案例
  const filteredExamples = examples.filter((example) => {
    // 标签过滤
    return activeTag === "all" || example.tags.includes(activeTag);
  });

  // 如果没有匹配的案例
  if (filteredExamples.length === 0) {
    examplesGrid.innerHTML = `
      <div class="no-results">
        <p>没有找到匹配的案例。请尝试其他标签。</p>
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
  const card = document.createElement("a");
  card.className = "example-card";
  card.href = `./src/demos/${example.id}/`;
  card.target = "_blank";
  card.style.cursor = "pointer";
  card.style.textDecoration = "none";

  // 卡片内容
  card.innerHTML = `
    <div class="card-image" style="background-image: url('${example.thumbnail}')">
    </div>
    <div class="card-content">
      <h3 class="card-title">${example.title}</h3>
    </div>
  `;

  return card;
}

// 设置事件监听器
function setupEventListeners() {
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
