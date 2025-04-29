# Three.js 旋转动画与 lil-gui 控制

这个示例展示了如何使用 Three.js 创建一个动态的 3D 场景，并利用 lil-gui 库添加交互式控件来调整动画参数。动画主体是一些旋转的球体，每个球体后面都跟着一条动态生成的“尾巴”。

## 核心技术

- **Three.js:** 用于创建和渲染 3D 图形。
- **lil-gui:** 一个轻量级的图形用户界面库，用于创建控制面板，方便实时调整参数。
- **GSAP (GreenSock Animation Platform):** 用于实现平滑的缓动动画效果（这里使用了 `Power4.easeInOut`）。

## 代码结构分析 (`index.js`)

1.  **导入库:**

    - 导入 `THREE` (Three.js 核心库)。
    - 导入 `GUI` (lil-gui 库)。
    - 导入 `Power4` (GSAP 的缓动函数)。

    ```javascript
    import * as THREE from "three";
    import GUI from "lil-gui";
    import { Power4 } from "gsap";
    ```

2.  **初始化:**

    - 获取 HTML 容器元素 (`#logo-anim`) 及其尺寸。
    - 声明 Three.js 核心变量：`scene` (场景), `camera` (透视相机), `renderer` (WebGL 渲染器)。
    - 定义 `uisettings` 对象，存储可通过 GUI 控制的参数 (`AtmosPressure`, `WindSpeed`) 及其初始值。
    - 创建 `GUI` 实例，并添加两个滑块控件，分别绑定到 `uisettings` 的 `AtmosPressure` 和 `WindSpeed` 属性。

    ```javascript
    // 获取动画容器
    const container = document.getElementById("logo-anim");
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;

    // three.js 场景变量
    let scene, camera, renderer;

    // 参数对象
    const uisettings = {
      AtmosPressure: 0.5,
      WindSpeed: 0.5,
    };

    // GUI 控制界面
    const gui = new GUI();
    gui.add(uisettings, "AtmosPressure", 0, 1, 0.01).name("大气压");
    gui.add(uisettings, "WindSpeed", 0, 1, 0.01).name("风速");
    ```

3.  **核心数据和对象:**

    - `vSpheres`: 存储球体 `Mesh` 对象的数组。
    - `vTails`: 存储尾巴 `Mesh` 对象的数组。
    - `initRotations`, `targetRotations`: 存储每个层初始和目标旋转状态的随机值（用于动画插值）。
    - `minVLayers`, `maxVLayers`: 定义可见层数的最小和最大值。
    - `tailSegments`: 定义尾巴几何体的分段数。
    - `vMaxRadius`: 定义动画的最大半径。
    - `yOffset`: 定义动画整体的垂直偏移量。

    ```javascript
    let vSpheres = [],
      vTails = [],
      initRotations = [],
      targetRotations = [];
    const minVLayers = 8;
    const maxVLayers = 24;
    const tailSegments = 45;
    const vMaxRadius = containerH / 1.4;
    const yOffset = -(containerH * 1.4) / 2 - 100;
    ```

4.  **计数器:**

    - `frameCount`: 动画帧计数器。
    - `rotation`: 相机旋转角度。
    - `animationProgress`: 动画整体进度计数器，用于缓动计算。

    ```javascript
    let frameCount = 0;
    let rotation = Math.PI / 2;
    let animationProgress = 0;
    ```

5.  **`DOMContentLoaded` 事件监听器:**

    - 当页面加载完成后执行初始化操作。
    - **场景设置:** 创建 `Scene`, `PerspectiveCamera`, `WebGLRenderer`，设置渲染器大小并添加到 HTML 容器中。
    - **对象创建:**
      - 循环创建 `maxVLayers` 数量的球体 (`SphereGeometry`, `MeshBasicMaterial`) 和尾巴 (`PlaneGeometry`, `MeshBasicMaterial`)。
      - 将创建的球体和尾巴添加到场景 (`scene.add`) 和对应的数组 (`vSpheres`, `vTails`) 中。
      - 为每个层生成随机的初始和目标旋转值。
    - **启动动画:** 调用 `animate()` 函数开始渲染循环。

    ```javascript
    window.addEventListener("DOMContentLoaded", () => {
      // 初始化场景
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, containerW / containerH, 1, 1000);
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(containerW, containerH);
      container.appendChild(renderer.domElement);

      // 创建对象
      for (let i = 0; i < maxVLayers; i++) {
        // 创建球体...
        const sphere = new THREE.Mesh(/* ... */);
        scene.add(sphere);
        vSpheres.push(sphere);

        // 创建尾巴...
        const tail = new THREE.Mesh(/* ... */);
        scene.add(tail);
        vTails.push(tail);

        // 设置随机旋转值
        initRotations[i] = Math.random();
        targetRotations[i] = Math.random();
      }

      animate(); // 启动动画
    });
    ```

6.  **`animate()` 函数 (核心动画逻辑):**
    - 使用 `requestAnimationFrame(animate)` 创建动画循环。
    ```javascript
    function animate() {
      requestAnimationFrame(animate);
      // ... 动画逻辑 ...
      renderer.render(scene, camera);
    }
    ```
    - **计算动态参数:**
      - `vLayers`: 根据 `uisettings.AtmosPressure` (大气压) 计算当前可见的层数。大气压越高，可见层数越多。
      - `plotRadius`: 根据 `uisettings.AtmosPressure` 计算球体的大小。大气压越高，球体越小。
      - `linearRotationPerFrame`: 根据 `uisettings.WindSpeed` (风速) 计算每帧的基础旋转增量。风速越大，旋转越快。
    ```javascript
    // 在 animate() 函数内部
    const vLayers = Math.round((maxVLayers - minVLayers) * uisettings.AtmosPressure + minVLayers);
    const plotRadius = 25 - Math.round((25 - 7) * uisettings.AtmosPressure);
    const linearRotationPerFrame =
      ((Math.PI * 2) / 150 - (Math.PI * 2) / 600) * uisettings.WindSpeed + (Math.PI * 2) / 600;
    ```
    - **更新所有层 (循环 `maxVLayers` 次):**
      - **可见性判断:** 如果当前层索引 `i` 小于计算出的 `vLayers`，则显示该层的球体和尾巴，否则隐藏。
    ```javascript
    // 在 animate() 函数内部的循环中
    for (let i = 0; i < maxVLayers; i++) {
      if (i < vLayers) {
        vSpheres[i].visible = true;
        vTails[i].visible = true;
        // ... 更新位置、缩放等 ...
      } else {
        vSpheres[i].visible = false;
        vTails[i].visible = false;
      }
    }
    ```
        *   **动画进度计算:**
            *   `layerAnimationProgress`: 计算当前层独立的动画进度（限制在 0 到 1）。
            *   `eased`: 使用 `Power4.easeInOut` 对进度进行缓动处理，使动画更自然。
    ```javascript
    // 在 animate() 函数内部的循环中 (i < vLayers 条件内)
    const layerAnimationProgress = Math.min(animationProgress / (5 * 30), 1);
    const eased = Power4.easeInOut(layerAnimationProgress);
    ```
        *   **角度和位置计算:**
            *   `layerAngleStart`: 基于初始旋转、帧计数、每帧旋转增量和缓动进度计算当前帧的基础旋转角度。
            *   `layerAnimationNext`: 在基础角度上叠加目标旋转角度（同样受缓动进度影响），得到最终的旋转角度。
            *   `layerScale`: 根据层级计算缩放比例（越外层越大）。
            *   `layerRadius`: 根据缩放比例计算旋转半径。
            *   `baseY`: 计算当前层的基础 Y 坐标。
    ```javascript
    // 在 animate() 函数内部的循环中 (i < vLayers 条件内)
    const layerAngleStart = initRotations[i] * Math.PI * 2 + frameCount * (linearRotationPerFrame * eased);
    const layerAnimationNext = layerAngleStart + eased * (targetRotations[i] * Math.PI * 2);
    const layerScale = Math.tan((Math.PI / 4 / vLayers) * (i + 1));
    const layerRadius = vMaxRadius * layerScale;
    const baseY = yOffset + ((containerH * 1.4) / vLayers) * (i + 1);
    ```
        *   **更新球体:** 设置球体的缩放 (`scale.set`) 和位置 (`position.set`)。
    ```javascript
    // 在 animate() 函数内部的循环中 (i < vLayers 条件内)
    vSpheres[i].scale.set(layerScale, layerScale, layerScale);
    vSpheres[i].position.set(
      layerRadius * Math.cos(layerAnimationNext),
      baseY,
      layerRadius * Math.sin(layerAnimationNext)
    );
    ```
        *   **更新尾巴:**
            *   获取尾巴的几何体顶点属性 (`positionAttr`)。
            *   计算尾巴每个顶点对的位置：
                *   `pProximity`: 计算顶点沿尾巴方向的接近度（越靠近球体越接近 1）。
                *   `tailWeight`: 根据缓动进度、球体缩放和接近度计算尾巴的“厚度”。
                *   `nextAngle`: 计算尾巴上每个顶点对应的旋转角度（形成拖尾效果）。
                *   计算顶点对的 X, Y, Z 坐标。
                *   使用 `positionAttr.setXYZ()` 更新顶点位置。
            *   设置 `positionAttr.needsUpdate = true` 通知 Three.js 更新几何体。
    ```javascript
    // 在 animate() 函数内部的循环中 (i < vLayers 条件内)
    const tail = vTails[i];
    const positionAttr = tail.geometry.attributes.position;
    const tailVertexPairs = positionAttr.count / 2;
    const radianIncrement = (Math.PI * 2 * layerAnimationProgress) / 90;
    ```
