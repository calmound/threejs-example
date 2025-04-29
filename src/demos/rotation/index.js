// 用原生 JS + dat.GUI 控制 three.js 动画
import * as THREE from "three";
import GUI from "lil-gui";
import { Power4 } from "gsap";

// 获取动画容器
const container = document.getElementById("logo-anim");
const containerW = container.clientWidth;
const containerH = container.clientHeight;

// three.js 场景变量
let scene, camera, renderer;

// 参数对象（初始值设为 0.5，页面加载就有动画效果）
const uisettings = {
  AtmosPressure: 0.5, // 大气压 0~1
  WindSpeed: 0.5, // 风速 0~1
};

// GUI 控制界面
const gui = new GUI();
gui.add(uisettings, "AtmosPressure", 0, 1, 0.01).name("大气压");
gui.add(uisettings, "WindSpeed", 0, 1, 0.01).name("风速");

// 核心数据和对象
let vSpheres = [], vTails = [], initRotations = [], targetRotations = [];
const minVLayers = 8;
const maxVLayers = 24;
const tailSegments = 45; // Math.round(90 * 0.5)
const vMaxRadius = containerH / 1.4;
const yOffset = -(containerH * 1.4) / 2 - 100;

// 计数器
let frameCount = 0;
let rotation = Math.PI / 2;
let animationProgress = 0;

window.addEventListener("DOMContentLoaded", () => {
  // 初始化场景
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, containerW / containerH, 1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(containerW, containerH);
  container.appendChild(renderer.domElement);

  // 创建对象
  for (let i = 0; i < maxVLayers; i++) {
    // 创建球体
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(25, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xe1e1e1 })
    );
    scene.add(sphere);
    vSpheres.push(sphere);
    
    // 创建尾巴
    const tail = new THREE.Mesh(
      new THREE.PlaneGeometry(0, 0, tailSegments, 1),
      new THREE.MeshBasicMaterial({
        color: 0xe1e1e1,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.33,
      })
    );
    scene.add(tail);
    vTails.push(tail);
    
    // 设置随机旋转值
    initRotations[i] = Math.random();
    targetRotations[i] = Math.random();
  }

  animate();
});

function animate() {
  requestAnimationFrame(animate);

  // 基于大气压计算可见层数
  const vLayers = Math.round((maxVLayers - minVLayers) * uisettings.AtmosPressure + minVLayers);
  
  // 基于大气压计算点大小
  const plotRadius = 25 - Math.round((25 - 7) * uisettings.AtmosPressure);
  
  // 基于风速计算旋转增量
  const linearRotationPerFrame = 
    ((Math.PI * 2) / 150 - (Math.PI * 2) / 600) * uisettings.WindSpeed + (Math.PI * 2) / 600;

  // 更新所有层
  for (let i = 0; i < maxVLayers; i++) {
    if (i < vLayers) {
      // 显示这一层
      vSpheres[i].visible = true;
      vTails[i].visible = true;
      
      // 计算动画进度
      const layerAnimationProgress = Math.min(animationProgress / (5 * 30), 1);
      const eased = Power4.easeInOut(layerAnimationProgress);
      
      // 计算角度和位置
      const layerAngleStart = initRotations[i] * Math.PI * 2 + frameCount * (linearRotationPerFrame * eased);
      const layerAnimationNext = layerAngleStart + eased * (targetRotations[i] * Math.PI * 2);
      
      // 计算比例和半径
      const layerScale = Math.tan((Math.PI / 4 / vLayers) * (i + 1));
      const layerRadius = vMaxRadius * layerScale;
      const baseY = yOffset + (containerH * 1.4 / vLayers) * (i + 1);
      
      // 设置球体位置和缩放
      vSpheres[i].scale.set(layerScale, layerScale, layerScale);
      vSpheres[i].position.set(
        layerRadius * Math.cos(layerAnimationNext),
        baseY,
        layerRadius * Math.sin(layerAnimationNext)
      );

      // 更新尾巴几何体
      const tail = vTails[i];
      const positionAttr = tail.geometry.attributes.position;
      const tailVertexPairs = positionAttr.count / 2;
      const radianIncrement = (Math.PI * 2 * layerAnimationProgress) / 90;

      // 计算尾巴每个顶点
      for (let v = tailVertexPairs - 1; v >= 0; v--) {
        const pProximity = 1 - Math.max(1, v) / tailVertexPairs;
        const tailWeight = eased * (plotRadius * layerScale) * pProximity;
        const nextAngle = layerAnimationNext - v * radianIncrement;
        const tailX = layerRadius * Math.cos(nextAngle);
        const tailY = baseY + tailWeight / 2;
        const tailZ = layerRadius * Math.sin(nextAngle);

        // 设置顶点对的位置
        positionAttr.setXYZ(v, tailX, tailY, tailZ);
        positionAttr.setXYZ(v + tailVertexPairs, tailX, tailY - tailWeight, tailZ);
      }
      positionAttr.needsUpdate = true;
    } else {
      // 隐藏多余的层
      vSpheres[i].visible = false;
      vTails[i].visible = false;
    }
  }

  // 更新相机位置
  const camProgress = Math.min(animationProgress / (5 * 30), 1);
  const camEased = Power4.easeInOut(camProgress);
  rotation = 0.7 - (camEased * 0.2); // 从0.7到0.5的线性插值
  
  camera.position.x = 0;
  camera.position.y = Math.sin(rotation) * 550;
  camera.position.z = Math.cos(rotation) * 550;
  camera.lookAt(scene.position);

  // 更新计数器
  animationProgress++;
  frameCount++;
  
  // 渲染场景
  renderer.render(scene, camera);
}
