import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

try {
  const container = document.getElementById("canvas");

  if (!container) {
    throw new Error("无法找到ID为'canvas'的元素");
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // 创建线条几何体
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2, 0, 0),
    new THREE.Vector3(0, 2, 0),
    new THREE.Vector3(2, 0, 0),
    new THREE.Vector3(0, -2, 0),
    new THREE.Vector3(-2, 0, 0),
  ]);

  const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(100));
  const material = new THREE.LineBasicMaterial({ color: 0x00ffff });
  const line = new THREE.Line(geometry, material);
  scene.add(line);

  window.addEventListener("resize", () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  let time = 0;
  function animate() {
    requestAnimationFrame(animate);

    // 添加动画效果
    time += 0.01;
    line.rotation.x = Math.sin(time) * 0.5;
    line.rotation.y = Math.cos(time) * 0.5;

    controls.update();
    renderer.render(scene, camera);
  }

  animate();
  console.log("动画线条示例加载成功");
} catch (error) {
  console.error("动画线条示例运行出错:", error);
  // 显示错误信息在页面上
  const errorEl = document.createElement("div");
  errorEl.style.color = "red";
  errorEl.style.padding = "20px";
  errorEl.textContent = `加载错误: ${error.message}`;
  document.body.appendChild(errorEl);
}
