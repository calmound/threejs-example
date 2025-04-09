/**
 * 通用案例加载器
 * 用于加载和运行Three.js案例
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// 案例加载器类
class DemoLoader {
  constructor() {
    // 当前案例路径
    this.demoPath = this.getDemoPath();

    // Three.js 变量
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // 初始化
    this.init();
  }

  /**
   * 获取当前案例路径
   * @returns {string} 当前案例路径
   */222222222222222222222222222222
  getDemoPath() {
    // 获取当前URL路径
    const path = window.location.pathname;

    // 提取案例名称
    const pathParts = path.split("/");
    const demoName = pathParts[pathParts.length - 2] || "";

    return demoName;
  }

  /**
   * 初始化函数
   */
  async init() {
    // 初始化Three.js场景
    this.initThreeJS();
  }

  /**
   * 初始化Three.js场景
   */
  initThreeJS() {
    const canvasContainer = document.getElementById("canvas-container");

    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      75,
      canvasContainer.clientWidth / canvasContainer.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(
      canvasContainer.clientWidth,
      canvasContainer.clientHeight
    );
    this.renderer.setPixelRatio(window.devicePixelRatio);
    canvasContainer.appendChild(this.renderer.domElement);

    // 添加轨道控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // 创建示例立方体
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00aaff,
      shininess: 100,
    });
    const cube = new THREE.Mesh(geometry, material);
    this.scene.add(cube);

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // 窗口大小调整事件
    window.addEventListener("resize", () => {
      this.camera.aspect =
        canvasContainer.clientWidth / canvasContainer.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(
        canvasContainer.clientWidth,
        canvasContainer.clientHeight
      );
    });

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);

      // 旋转立方体
      if (cube) {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
      }

      // 更新控制器
      this.controls.update();

      // 渲染场景
      this.renderer.render(this.scene, this.camera);
    };

    // 开始动画
    animate();
  }
}

// 创建案例加载器实例
document.addEventListener("DOMContentLoaded", () => {
  new DemoLoader();
});
