// 导入必要的模块和库
import * as THREE from "three";
import { Pane } from "tweakpane";

import { OrbitControls } from "three/examples/jsm/Addons.js";

import snoise from "./noise/snoise.glsl?raw";

import { EffectComposer, RenderPass, OutputPass, UnrealBloomPass, ShaderPass } from "three/examples/jsm/Addons.js";

let scale = 1.0;

// 设置场景、相机和渲染器
const canvasElement = document.getElementById("canvas"); // 原变量名: cnvs
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, canvasElement.clientWidth / canvasElement.clientHeight, 0.001, 100); // 原变量名: cam

// 根据设备类型设置相机位置
camera.position.set(0, 1, 14);
const blackColor = new THREE.Color(0x000000);
scene.background = blackColor;

// 初始化 WebGL 渲染器
const renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true }); // 原变量名: re
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(canvasElement.clientWidth * scale, canvasElement.clientHeight * scale, false);
renderer.toneMapping = THREE.CineonToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// 配置后处理效果
const bloomEffectComposer = new EffectComposer(renderer); // 重命名变量以更清晰地表示其用途
const baseRenderPass = new RenderPass(scene, camera);
let bloomRadius = 0.25; // 调整变量名称以更具描述性
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerHeight * scale, window.innerWidth * scale),
  0.5, // 强度
  bloomRadius, // 半径
  0.2 // 阈值
);
const finalOutputPass = new OutputPass();

const combinedEffectComposer = new EffectComposer(renderer); // 重命名变量以更清晰地表示其用途
const combineShaderPass = new ShaderPass(
  new THREE.ShaderMaterial({
    uniforms: {
      baseTexture: { value: null }, // 重命名以更清晰地表示用途
      bloomTexture: {
        value: bloomEffectComposer.renderTarget2.texture, // 使用更清晰的变量名称
      },
      bloomStrength: {
        value: 8.0, // 重命名以更清晰地表示用途
      },
    },
    // 用于组合效果的顶点和片段着色器
    vertexShader: `
        varying vec2 vUv;
        void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
    `,

    fragmentShader: `
        uniform sampler2D baseTexture;
        uniform sampler2D bloomTexture;
        uniform float bloomStrength;
        varying vec2 vUv;
        void main(){
            vec4 baseEffect = texture2D(baseTexture, vUv);
            vec4 bloomEffect = texture2D(bloomTexture, vUv);
            gl_FragColor = baseEffect + bloomEffect * bloomStrength;
        }
    `,
  })
);

bloomEffectComposer.addPass(baseRenderPass);
bloomEffectComposer.addPass(bloomPass);
bloomEffectComposer.renderToScreen = false;

combinedEffectComposer.addPass(baseRenderPass);
combinedEffectComposer.addPass(combineShaderPass);
combinedEffectComposer.addPass(finalOutputPass);

const orbitControls = new OrbitControls(camera, canvasElement); // 重命名变量以更清晰地表示其用途

const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
const cubeCamera = new THREE.CubeCamera(0.1, 500, cubeRenderTarget);
let cubeTexturePaths; // 重命名变量以更清晰地表示其用途
let cubeTexture;

// 生成立方体贴图 URL 的函数
function generateCubeUrls(prefix, postfix) {
  return [
    prefix + "posx" + postfix,
    prefix + "negx" + postfix,
    prefix + "posy" + postfix,
    prefix + "negy" + postfix,
    prefix + "posz" + postfix,
    prefix + "negz" + postfix,
  ];
}

cubeTexturePaths = generateCubeUrls("./assets/", ".png");

// 加载纹理和环境贴图
async function loadTextures() {
  const cubeTextureLoader = new THREE.CubeTextureLoader();
  cubeTexture = await cubeTextureLoader.loadAsync(cubeTexturePaths);

  scene.background = cubeTexture;
  scene.environment = cubeTexture;

  cubeCamera.update(renderer, scene);
  // scene.background = new THREE.Color(0x0000ff); // Set background to blue

  document.body.classList.remove("loading");
}

loadTextures();

const sphere = new THREE.SphereGeometry(4.5, 140, 140);
let geometries = [sphere];

let mesh; // 移除类型注解
let meshGeo;

meshGeo = geometries[0];
// 定义材质和溶解效果的 Uniform 数据
const phyMat = new THREE.MeshPhysicalMaterial();
phyMat.color = new THREE.Color(0x636363); // 设置材质颜色为灰色
phyMat.metalness = 2.0;
phyMat.roughness = 0.0;
phyMat.side = THREE.DoubleSide;

const dissolveUniformData = {
  uEdgeColor: {
    value: new THREE.Color(0x4d9bff), // 边缘颜色
  },
  uFreq: {
    value: 0.25, // 噪声频率
  },
  uAmp: {
    value: 16.0, // 噪声振幅
  },
  uProgress: {
    value: -7.0, // 溶解进度
  },
  uEdge: {
    value: 0.8, // 边缘宽度
  },
};

function setupUniforms(shader, uniforms) {
  // 移除类型注解
  const keys = Object.keys(uniforms);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    shader.uniforms[key] = uniforms[key];
  }
}

// 设置溶解效果的 Shader
function setupDissolveShader(shader) {
  // 移除类型注解
  // 在顶点着色器中添加变量
  shader.vertexShader = shader.vertexShader.replace(
    "#include <common>",
    `#include <common>
        varying vec3 vPos;
    `
  );

  // 在顶点着色器主函数中计算顶点位置
  shader.vertexShader = shader.vertexShader.replace(
    "#include <begin_vertex>",
    `#include <begin_vertex>
        vPos = position;
    `
  );

  // 在片段着色器中添加变量和噪声函数
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <common>",
    `#include <common>
        varying vec3 vPos;

        uniform float uFreq;
        uniform float uAmp;
        uniform float uProgress;
        uniform float uEdge;
        uniform vec3 uEdgeColor;

        ${snoise}
    `
  );

  // 在片段着色器主函数中实现溶解效果
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <dithering_fragment>",
    `#include <dithering_fragment>

        float noise = snoise(vPos * uFreq) * uAmp; // 在片段着色器中计算噪声以获得平滑的溶解边缘

        if(noise < uProgress) discard; // 丢弃噪声低于进度的任何片段

        float edgeWidth = uProgress + uEdge;

        if(noise > uProgress && noise < edgeWidth){
            gl_FragColor = vec4(vec3(uEdgeColor),noise); // 着色边缘
        }else{
            gl_FragColor = vec4(gl_FragColor.xyz,1.0);
        }
    `
  );
}

// 应用溶解效果到材质
phyMat.onBeforeCompile = (shader) => {
  setupUniforms(shader, dissolveUniformData);
  setupDissolveShader(shader);
};

// 创建网格并添加到场景
mesh = new THREE.Mesh(meshGeo, phyMat);
scene.add(mesh);

// 定义控制面板参数
let tweaks = {
  dissolveProgress: dissolveUniformData.uProgress.value, // 溶解进度
};

// 创建控制面板
const pane = new Pane();

let progressBinding = pane
  .addBinding(tweaks, "dissolveProgress", { min: -20, max: 20, step: 0.0001, label: "Progress" })
  .on("change", (obj) => {
    dissolveUniformData.uProgress.value = obj.value;
  });

// 动画溶解效果
function animateDissolve() {
  if (!tweaks.autoDissolve) return;
  let progress = dissolveUniformData.uProgress;
  if (progress.value > 14) progress.value = -7.0;
  progress.value += 0.08;
  progressBinding.controller.value.setRawValue(progress.value);
}

// 修复背景图不显示的问题，调整渲染逻辑
function animate() {
  orbitControls.update();

  animateDissolve();

  // 渲染效果
  scene.background = cubeTexture; // 确保背景始终为立方体贴图
  bloomEffectComposer.render();

  combinedEffectComposer.render();
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
