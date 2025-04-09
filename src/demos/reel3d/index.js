import * as THREE from "three";
import { vec3 } from "gl-matrix";
import "./style.css";

class Core {
  constructor(instances) {
    this.uniforms = {
      time: {
        type: "f",
        value: 0,
      },
      rotate: {
        type: "f",
        value: 0,
      },
      pickedId: {
        type: "f",
        value: -1,
      },
    };
    this.instances = instances;
    this.obj = this.createObj();
  }
  createObj() {
    const geometry = new THREE.InstancedBufferGeometry();

    // Setting BufferAttribute
    const baseGeometry = new THREE.OctahedronGeometry(30, 4);
    geometry.setAttribute("position", baseGeometry.attributes.position);
    geometry.setAttribute("normal", baseGeometry.attributes.normal);
    geometry.setIndex(baseGeometry.index);

    // Setting InstancedBufferAttribute
    const radian = new THREE.InstancedBufferAttribute(
      new Float32Array(this.instances),
      1,
      1
    );
    const hsv = new THREE.InstancedBufferAttribute(
      new Float32Array(this.instances * 3),
      3,
      1
    );
    const noiseDiff = new THREE.InstancedBufferAttribute(
      new Float32Array(this.instances),
      1,
      1
    );
    const speed = new THREE.InstancedBufferAttribute(
      new Float32Array(this.instances),
      1,
      1
    );
    for (var i = 0; i < this.instances; i++) {
      radian.setXYZ(i, MathEx.radians((i / this.instances) * 360));
      hsv.setXYZ(i, i / this.instances - 0.25, 0.2, 0.9);
      noiseDiff.setXYZ(i, Math.random());
      speed.setXYZ(i, (Math.random() + 1.0) * 0.5);
    }
    geometry.setAttribute("radian", radian);
    geometry.setAttribute("hsv", hsv);
    geometry.setAttribute("noiseDiff", noiseDiff);
    geometry.setAttribute("speed", speed);

    return new THREE.Mesh(
      geometry,
      new THREE.RawShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: `attribute vec3 position;
        attribute vec3 normal;
        attribute float radian;
        attribute vec3 hsv;
        attribute float noiseDiff;
        attribute float speed;

        uniform mat4 projectionMatrix;
        uniform mat4 modelViewMatrix;
        uniform float time;
        uniform float rotate;

        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vColor;

        mat4 computeTranslateMat(vec3 v) {
          return mat4(
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            v.x, v.y, v.z, 1.0
          );
        }
        mat4 computeRotateMatX(float radian) {
          return mat4(
            1.0, 0.0, 0.0, 0.0,
            0.0, cos(radian), -sin(radian), 0.0,
            0.0, sin(radian), cos(radian), 0.0,
            0.0, 0.0, 0.0, 1.0
          );
        }
        mat4 computeRotateMatY(float radian) {
          return mat4(
            cos(radian), 0.0, sin(radian), 0.0,
            0.0, 1.0, 0.0, 0.0,
            -sin(radian), 0.0, cos(radian), 0.0,
            0.0, 0.0, 0.0, 1.0
          );
        }
        mat4 computeRotateMatZ(float radian) {
          return mat4(
            cos(radian), -sin(radian), 0.0, 0.0,
            sin(radian), cos(radian), 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0
          );
        }
        mat4 computeRotateMat(float radX, float radY, float radZ) {
          return computeRotateMatX(radX) * computeRotateMatY(radY) * computeRotateMatZ(radZ);
        }
        vec3 convertHsvToRgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }
        //
        // Description : Array and textureless GLSL 2D/3D/4D simplex
        //               noise functions.
        //      Author : Ian McEwan, Ashima Arts.
        //  Maintainer : ijm
        //     Lastmod : 20110822 (ijm)
        //     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
        //               Distributed under the MIT License. See LICENSE file.
        //               https://github.com/ashima/webgl-noise
        //

        vec3 mod289(vec3 x) {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec4 mod289(vec4 x) {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec4 permute(vec4 x) {
          return mod289(((x*34.0)+1.0)*x);
        }

        vec4 taylorInvSqrt(vec4 r) {
          return 1.79284291400159 - 0.85373472095314 * r;
        }

        float snoise3(vec3 v) {
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

          // First corner
          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 =   v - i + dot(i, C.xxx) ;

          // Other corners
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );

          //   x0 = x0 - 0.0 + 0.0 * C.xxx;
          //   x1 = x0 - i1  + 1.0 * C.xxx;
          //   x2 = x0 - i2  + 2.0 * C.xxx;
          //   x3 = x0 - 1.0 + 3.0 * C.xxx;
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
          vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

          // Permutations
          i = mod289(i);
          vec4 p = permute( permute( permute(
                     i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

          // Gradients: 7x7 points over a square, mapped onto an octahedron.
          // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
          float n_ = 0.142857142857; // 1.0/7.0
          vec3  ns = n_ * D.wyz - D.xzx;

          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);

          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );

          //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
          //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));

          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);

          //Normalise gradients
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;

          // Mix final noise value
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
        }

        void main(void) {
          float noise = snoise3(position * 0.02 + time * speed + noiseDiff);
          mat4 rotateMatWorld = computeRotateMat(0.0, radian + radians(rotate), 0.0);
          mat4 translateMat = computeTranslateMat(vec3(1000.0, 0.0, 0.0));
          vec4 updatePosition = rotateMatWorld * translateMat * vec4(
            position + normalize(position) * noise * 5.0,
            1.0
            );
          vPosition = updatePosition.xyz;
          vNormal = normal;
          vColor = convertHsvToRgb(hsv);
          gl_Position = projectionMatrix * modelViewMatrix * updatePosition;
        }`,
        fragmentShader: `precision highp float;

        uniform float time;
        uniform vec3 cameraPosition;

        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vColor;

        const vec3 light = vec3(0.7);

        void main() {
          float diff = (dot(vNormal, light) + 1.0) / 2.0 * 0.25 + 0.75;
          float opacity = (1.0 - (vPosition.z / 1000.0)) * 0.8 + 0.2;
          gl_FragColor = vec4(vColor * diff, opacity);
        }`,
        transparent: true,
      })
    );
  }
}

class Wire {
  constructor(instances) {
    this.size = 120;
    this.baseGeometry = new THREE.BoxGeometry(
      this.size,
      this.size,
      this.size
    );
    this.uniforms = {
      time: {
        type: "f",
        value: 0,
      },
      rotate: {
        type: "f",
        value: 0,
      },
      pickedId: {
        type: "f",
        value: -1,
      },
    };
    this.instances = instances;
    this.obj = this.createObj();
    this.objPicked = this.createObjPicked();
  }
  createObj() {
    const geometry = new THREE.InstancedBufferGeometry();

    // Setting BufferAttribute
    geometry.setAttribute("position", this.baseGeometry.attributes.position);
    geometry.setIndex(this.baseGeometry.index);

    // Setting InstancedBufferAttribute
    const radian = new THREE.InstancedBufferAttribute(
      new Float32Array(this.instances),
      1,
      1
    );
    const hsv = new THREE.InstancedBufferAttribute(
      new Float32Array(this.instances * 3),
      3,
      1
    );
    const timeHover = new THREE.InstancedBufferAttribute(
      new Float32Array(this.instances),
      1,
      1
    );
    for (var i = 0; i < this.instances; i++) {
      radian.setXYZ(i, MathEx.radians((i / this.instances) * 360));
      hsv.setXYZ(i, i / this.instances - 0.25, 0.2, 1.0);
      timeHover.setXYZ(i, 0);
    }
    geometry.setAttribute("radian", radian);
    geometry.setAttribute("hsv", hsv);
    geometry.setAttribute("timeHover", timeHover);

    return new THREE.Mesh(
      geometry,
      new THREE.RawShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: `attribute vec3 position;
        attribute vec3 normal;
        attribute float radian;
        attribute vec3 hsv;
        attribute float timeHover;

        uniform mat4 projectionMatrix;
        uniform mat4 modelViewMatrix;
        uniform float time;
        uniform float rotate;

        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vColor;
        varying mat4 vInvertMatrix;

        mat4 inverse(mat4 m) {
          float
              a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
              a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
              a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
              a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3],

              b00 = a00 * a11 - a01 * a10,
              b01 = a00 * a12 - a02 * a10,
              b02 = a00 * a13 - a03 * a10,
              b03 = a01 * a12 - a02 * a11,
              b04 = a01 * a13 - a03 * a11,
              b05 = a02 * a13 - a03 * a12,
              b06 = a20 * a31 - a21 * a30,
              b07 = a20 * a32 - a22 * a30,
              b08 = a20 * a33 - a23 * a30,
              b09 = a21 * a32 - a22 * a31,
              b10 = a21 * a33 - a23 * a31,
              b11 = a22 * a33 - a23 * a32,

              det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

          return mat4(
              a11 * b11 - a12 * b10 + a13 * b09,
              a02 * b10 - a01 * b11 - a03 * b09,
              a31 * b05 - a32 * b04 + a33 * b03,
              a22 * b04 - a21 * b05 - a23 * b03,
              a12 * b08 - a10 * b11 - a13 * b07,
              a00 * b11 - a02 * b08 + a03 * b07,
              a32 * b02 - a30 * b05 - a33 * b01,
              a20 * b05 - a22 * b02 + a23 * b01,
              a10 * b10 - a11 * b08 + a13 * b06,
              a01 * b08 - a00 * b10 - a03 * b06,
              a30 * b04 - a31 * b02 + a33 * b00,
              a21 * b02 - a20 * b04 - a23 * b00,
              a11 * b07 - a10 * b09 - a12 * b06,
              a00 * b09 - a01 * b07 + a02 * b06,
              a31 * b01 - a30 * b03 - a32 * b00,
              a20 * b03 - a21 * b01 + a22 * b00) / det;
        }
        float ease(float t) {
          return sqrt((2.0 - t) * t);
        }
        mat4 computeTranslateMat(vec3 v) {
          return mat4(
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            v.x, v.y, v.z, 1.0
          );
        }
        mat4 computeRotateMatX(float radian) {
          return mat4(
            1.0, 0.0, 0.0, 0.0,
            0.0, cos(radian), -sin(radian), 0.0,
            0.0, sin(radian), cos(radian), 0.0,
            0.0, 0.0, 0.0, 1.0
          );
        }
        mat4 computeRotateMatY(float radian) {
          return mat4(
            cos(radian), 0.0, sin(radian), 0.0,
            0.0, 1.0, 0.0, 0.0,
            -sin(radian), 0.0, cos(radian), 0.0,
            0.0, 0.0, 0.0, 1.0
          );
        }
        mat4 computeRotateMatZ(float radian) {
          return mat4(
            cos(radian), -sin(radian), 0.0, 0.0,
            sin(radian), cos(radian), 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0
          );
        }
        mat4 computeRotateMat(float radX, float radY, float radZ) {
          return computeRotateMatX(radX) * computeRotateMatY(radY) * computeRotateMatZ(radZ);
        }
        mat4 computeScaleMat(vec3 scale) {
          return mat4(
            scale.x, 0.0, 0.0, 0.0,
            0.0, scale.y, 0.0, 0.0,
            0.0, 0.0, scale.z, 0.0,
            0.0, 0.0, 0.0, 1.0
          );
        }
        vec3 convertHsvToRgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        void main(void) {
          float easeStep = ease(timeHover / 0.3);
          mat4 rotateMatWorld = computeRotateMat(0.0, radian + radians(rotate), 0.0);
          mat4 scaleMat = computeScaleMat(vec3(1.0 + easeStep * 0.2));
          mat4 translateMat = computeTranslateMat(vec3(1000.0, 0.0, 0.0));
          vec4 updatePosition = rotateMatWorld * translateMat * scaleMat * vec4(position, 1.0);
          vPosition = updatePosition.xyz;
          vInvertMatrix = inverse(rotateMatWorld * translateMat);
          vColor = convertHsvToRgb(hsv * vec3(1.0, 1.0 - easeStep, 1.0));
          gl_Position = projectionMatrix * modelViewMatrix * updatePosition;
        }`,
        fragmentShader: `precision highp float;

        uniform float time;
        uniform vec3 cameraPosition;

        varying vec3 vPosition;
        varying vec3 vColor;
        varying mat4 vInvertMatrix;

        const vec3 color = vec3(0.9);

        void main() {
          vec3 normal = normalize(cross(dFdx(vPosition), dFdy(vPosition)));
          if(!gl_FrontFacing) {
              normal = -normal;
          }
          vec3 light = normalize(vInvertMatrix * vec4(vec3(-1000.0, 1000.0, -1000.0), 1.0)).xyz;
          float diff = (dot(normal, light) + 1.0) / 2.0 * 0.2 + 0.8;
          float opacity = (1.0 - (vPosition.z / 1000.0)) * 0.1 + 0.1;
          gl_FragColor = vec4(color * diff * vColor, opacity);
        }`,
        depthWrite: false,
        transparent: true,
        side: THREE.DoubleSide,
        flatShading: true,
      })
    );
  }
  createObjPicked() {
    const geometry = new THREE.InstancedBufferGeometry();

    // Setting BufferAttribute
    geometry.setAttribute("position", this.baseGeometry.attributes.position);
    geometry.setIndex(this.baseGeometry.index);

    // Setting InstancedBufferAttribute
    const radian = new THREE.InstancedBufferAttribute(
      new Float32Array(this.instances),
      1,
      1
    );
    const pickedColor = new THREE.InstancedBufferAttribute(
      new Float32Array(this.instances * 3),
      3,
      1
    );
    const color = new THREE.Color();
    const timeHover = new THREE.InstancedBufferAttribute(
      new Float32Array(this.instances),
      1,
      1
    );
    for (var i = 0; i < this.instances; i++) {
      radian.setXYZ(i, MathEx.radians((i / this.instances) * 360));
      color.setHex(i);
      pickedColor.setXYZ(i, color.r, color.g, color.b);
      timeHover.setXYZ(i, 0);
    }
    geometry.setAttribute("radian", radian);
    geometry.setAttribute("pickedColor", pickedColor);
    geometry.setAttribute("timeHover", timeHover);

    return new THREE.Mesh(
      geometry,
      new THREE.RawShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: `attribute vec3 position;
        attribute float radian;
        attribute vec3 pickedColor;
        attribute float timeHover;

        uniform mat4 projectionMatrix;
        uniform mat4 modelViewMatrix;
        uniform float time;
        uniform float rotate;

        varying vec3 vColor;

        float ease(float t) {
          return sqrt((2.0 - t) * t);
        }
        mat4 computeTranslateMat(vec3 v) {
          return mat4(
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            v.x, v.y, v.z, 1.0
          );
        }
        mat4 computeRotateMatX(float radian) {
          return mat4(
            1.0, 0.0, 0.0, 0.0,
            0.0, cos(radian), -sin(radian), 0.0,
            0.0, sin(radian), cos(radian), 0.0,
            0.0, 0.0, 0.0, 1.0
          );
        }
        mat4 computeRotateMatY(float radian) {
          return mat4(
            cos(radian), 0.0, sin(radian), 0.0,
            0.0, 1.0, 0.0, 0.0,
            -sin(radian), 0.0, cos(radian), 0.0,
            0.0, 0.0, 0.0, 1.0
          );
        }
        mat4 computeRotateMatZ(float radian) {
          return mat4(
            cos(radian), -sin(radian), 0.0, 0.0,
            sin(radian), cos(radian), 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0
          );
        }
        mat4 computeRotateMat(float radX, float radY, float radZ) {
          return computeRotateMatX(radX) * computeRotateMatY(radY) * computeRotateMatZ(radZ);
        }
        mat4 computeScaleMat(vec3 scale) {
          return mat4(
            scale.x, 0.0, 0.0, 0.0,
            0.0, scale.y, 0.0, 0.0,
            0.0, 0.0, scale.z, 0.0,
            0.0, 0.0, 0.0, 1.0
          );
        }

        void main(void) {
          float easeStep = ease(timeHover / 0.3);
          mat4 rotateMatWorld = computeRotateMat(0.0, radian + radians(rotate), 0.0);
          mat4 scaleMat = computeScaleMat(vec3(1.0 + easeStep * 0.2));
          mat4 translateMat = computeTranslateMat(vec3(1000.0, 0.0, 0.0));
          vec4 updatePosition = rotateMatWorld * translateMat * scaleMat * vec4(position, 1.0);
          vColor = pickedColor;
          gl_Position = projectionMatrix * modelViewMatrix * updatePosition;
        }`,
        fragmentShader: `precision highp float;

        uniform float time;

        varying vec3 vColor;

        void main() {
          gl_FragColor = vec4(vColor, 1.0);
        }`,
      })
    );
  }
  render(time) {
    const timeHoverAttribute = this.obj.geometry.attributes.timeHover;
    const timeHoverAttributePicked =
      this.objPicked.geometry.attributes.timeHover;
    this.uniforms.time.value += time;
    for (var i = 0; i < timeHoverAttribute.array.length; i++) {
      if (this.uniforms.pickedId.value == i) {
        timeHoverAttribute.array[i] = Math.min(
          timeHoverAttribute.array[i] + time,
          0.3
        );
        timeHoverAttributePicked.array[i] = Math.min(
          timeHoverAttributePicked.array[i] + time,
          0.3
        );
      } else {
        timeHoverAttribute.array[i] = Math.max(
          timeHoverAttribute.array[i] - time,
          0
        );
        timeHoverAttributePicked.array[i] = Math.max(
          timeHoverAttributePicked.array[i] - time,
          0
        );
      }
    }
    timeHoverAttribute.needsUpdate = true;
    timeHoverAttributePicked.needsUpdate = true;
  }
}

class Boxes {
  constructor() {
    this.velocity = [0, 0, 0];
    this.acceleration = [0, 0, 0];
    this.anchor = [0, 0, 0];
    this.instances = 36;
    this.core = new Core(this.instances);
    this.wire = new Wire(this.instances);
  }
  updateRotation() {
    force3.applyHook(this.velocity, this.acceleration, this.anchor, 0, 0.02);
    force3.applyDrag(this.acceleration, 0.3);
    force3.updateVelocity(this.velocity, this.acceleration, 1);
    this.core.uniforms.rotate.value = this.velocity[0];
    this.wire.uniforms.rotate.value = this.velocity[0];
  }
  rotate(delta) {
    if (!delta) return;
    this.anchor[0] -= delta * 0.05;
  }
  picked(id) {
    this.core.uniforms.pickedId.value = id;
    this.wire.uniforms.pickedId.value = id;
    if (id < this.instances && id > -1) {
      document.body.classList.add("is-picked");
    } else {
      document.body.classList.remove("is-picked");
    }
  }
  render(time) {
    this.core.uniforms.time.value += time;
    this.wire.render(time);
    this.updateRotation();
  }
}

class Floor {
  constructor() {
    this.mirrorCamera = new THREE.PerspectiveCamera(
      24,
      window.innerWidth / window.innerHeight,
      1,
      15000
    );
    this.mirrorRender = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight
    );
    this.textureMatrix = new THREE.Matrix4();
    this.uniforms = {
      time: {
        type: "f",
        value: 0,
      },
      texture: {
        type: "t",
        value: this.mirrorRender.texture,
      },
      textureMatrix: {
        type: "m4",
        value: this.textureMatrix,
      },
      mirrorPosition: {
        type: "v3",
        value: this.mirrorCamera.position,
      },
    };
    this.mirrorCamera.up.set(0, -1, 0);
    this.obj = this.createObj();
  }
  createObj() {
    return new THREE.Mesh(
      new THREE.PlaneGeometry(4000, 4000),
      new THREE.RawShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: `attribute vec3 position;
        attribute vec3 normal;

        uniform mat4 projectionMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 modelMatrix;
        uniform mat3 normalMatrix;
        uniform mat4 textureMatrix;

        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec4 vUv;
        varying mat4 vInvertMatrix;

        mat4 inverse(mat4 m) {
          float
              a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
              a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
              a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
              a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3],

              b00 = a00 * a11 - a01 * a10,
              b01 = a00 * a12 - a02 * a10,
              b02 = a00 * a13 - a03 * a10,
              b03 = a01 * a12 - a02 * a11,
              b04 = a01 * a13 - a03 * a11,
              b05 = a02 * a13 - a03 * a12,
              b06 = a20 * a31 - a21 * a30,
              b07 = a20 * a32 - a22 * a30,
              b08 = a20 * a33 - a23 * a30,
              b09 = a21 * a32 - a22 * a31,
              b10 = a21 * a33 - a23 * a31,
              b11 = a22 * a33 - a23 * a32,

              det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

          return mat4(
              a11 * b11 - a12 * b10 + a13 * b09,
              a02 * b10 - a01 * b11 - a03 * b09,
              a31 * b05 - a32 * b04 + a33 * b03,
              a22 * b04 - a21 * b05 - a23 * b03,
              a12 * b08 - a10 * b11 - a13 * b07,
              a00 * b11 - a02 * b08 + a03 * b07,
              a32 * b02 - a30 * b05 - a33 * b01,
              a20 * b05 - a22 * b02 + a23 * b01,
              a10 * b10 - a11 * b08 + a13 * b06,
              a01 * b08 - a00 * b10 - a03 * b06,
              a30 * b04 - a31 * b02 + a33 * b00,
              a21 * b02 - a20 * b04 - a23 * b00,
              a11 * b07 - a10 * b09 - a12 * b06,
              a00 * b09 - a01 * b07 + a02 * b06,
              a31 * b01 - a30 * b03 - a32 * b00,
              a20 * b03 - a21 * b01 + a22 * b00) / det;
        }

        void main(void) {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vPosition = worldPosition.xyz;
          vNormal = normal;
          vUv = textureMatrix * worldPosition;
          vInvertMatrix = inverse(modelMatrix);
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }`,
        fragmentShader: `precision highp float;

        uniform sampler2D texture;

        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec4 vUv;
        varying mat4 vInvertMatrix;

        void main() {
          vec4 projectorColor;
          if (all(bvec4(vUv.x >= 0.0, vUv.y >= 0.0, vUv.x <= vUv.z, vUv.y <= vUv.z))) {
            projectorColor = texture2DProj(texture, vUv);
          }
          gl_FragColor = vec4(1.0, 1.0, 1.0, 0.35) * projectorColor;
        }`,
        transparent: true,
      })
    );
  }
  updateTextureMatrix() {
    this.textureMatrix.set(
      0.5,
      0.0,
      0.0,
      0.5,
      0.0,
      0.5,
      0.0,
      0.5,
      0.0,
      0.0,
      1.0,
      0,
      0.0,
      0.0,
      0.0,
      1.0
    );
    this.textureMatrix.multiply(this.mirrorCamera.projectionMatrix);
    this.textureMatrix.multiply(this.mirrorCamera.matrixWorldInverse);
  }
  render(renderer, scene, time) {
    this.uniforms.time.value += time;
    this.updateTextureMatrix();
    this.obj.visible = false;
    renderer.setRenderTarget(this.mirrorRender);
    renderer.render(scene, this.mirrorCamera);
    renderer.setRenderTarget(null);
    this.obj.visible = true;
  }
  resize() {
    this.mirrorCamera.aspect = window.innerWidth / window.innerHeight;
    this.mirrorCamera.updateProjectionMatrix();
    this.mirrorRender.setSize(window.innerWidth, window.innerHeight);
  }
}

class Hill {
  constructor() {
    this.cubeCamera = new THREE.CubeCamera(1, 15000, 1024);
    this.instances = 6;
    this.uniforms = {
      time: {
        type: "f",
        value: 0,
      },
    };
    this.obj = this.createObj();
    this.obj.rotation.set(0, 0.3 * Math.PI, 0);
  }
  createObj() {
    const geometry = new THREE.InstancedBufferGeometry();
    const baseGeometry = new THREE.BoxGeometry(40, 1, 10);
    geometry.setAttribute("position", baseGeometry.attributes.position);
    geometry.setAttribute("normal", baseGeometry.attributes.normal);
    geometry.setIndex(baseGeometry.index);
    const height = new THREE.InstancedBufferAttribute(
      new Float32Array(this.instances),
      1,
      1
    );
    const offsetX = new THREE.InstancedBufferAttribute(
      new Float32Array(this.instances),
      1,
      1
    );
    for (var i = 0, ul = this.instances; i < ul; i++) {
      height.setXYZ(i, (i + 1) * 150 + 200);
      offsetX.setXYZ(i, (i - (this.instances - 1) / 2) * 120);
    }
    geometry.setAttribute("height", height);
    geometry.setAttribute("offsetX", offsetX);
    return new THREE.Mesh(
      geometry,
      new THREE.RawShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: `attribute vec3 position;
        attribute vec3 normal;
        attribute float height;
        attribute float offsetX;

        uniform mat4 projectionMatrix;
        uniform mat4 modelViewMatrix;
        uniform mat4 modelMatrix;

        varying vec3 vPosition;
        varying mat4 vInvertMatrix;

        mat4 computeTranslateMat(vec3 v) {
          return mat4(
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            v.x, v.y, v.z, 1.0
          );
        }
        mat4 computeScaleMat(vec3 scale) {
          return mat4(
            scale.x, 0.0, 0.0, 0.0,
            0.0, scale.y, 0.0, 0.0,
            0.0, 0.0, scale.z, 0.0,
            0.0, 0.0, 0.0, 1.0
          );
        }
        mat4 inverse(mat4 m) {
          float
              a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
              a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
              a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
              a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3],

              b00 = a00 * a11 - a01 * a10,
              b01 = a00 * a12 - a02 * a10,
              b02 = a00 * a13 - a03 * a10,
              b03 = a01 * a12 - a02 * a11,
              b04 = a01 * a13 - a03 * a11,
              b05 = a02 * a13 - a03 * a12,
              b06 = a20 * a31 - a21 * a30,
              b07 = a20 * a32 - a22 * a30,
              b08 = a20 * a33 - a23 * a30,
              b09 = a21 * a32 - a22 * a31,
              b10 = a21 * a33 - a23 * a31,
              b11 = a22 * a33 - a23 * a32,

              det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

          return mat4(
              a11 * b11 - a12 * b10 + a13 * b09,
              a02 * b10 - a01 * b11 - a03 * b09,
              a31 * b05 - a32 * b04 + a33 * b03,
              a22 * b04 - a21 * b05 - a23 * b03,
              a12 * b08 - a10 * b11 - a13 * b07,
              a00 * b11 - a02 * b08 + a03 * b07,
              a32 * b02 - a30 * b05 - a33 * b01,
              a20 * b05 - a22 * b02 + a23 * b01,
              a10 * b10 - a11 * b08 + a13 * b06,
              a01 * b08 - a00 * b10 - a03 * b06,
              a30 * b04 - a31 * b02 + a33 * b00,
              a21 * b02 - a20 * b04 - a23 * b00,
              a11 * b07 - a10 * b09 - a12 * b06,
              a00 * b09 - a01 * b07 + a02 * b06,
              a31 * b01 - a30 * b03 - a32 * b00,
              a20 * b03 - a21 * b01 + a22 * b00) / det;
        }

        void main(void) {
          mat4 translateMat = computeTranslateMat(vec3(offsetX, 0.0, 0.0));
          mat4 scaleMat = computeScaleMat(vec3(1.0, (position.y + 0.5) * height, 1.0));
          vec4 updatePosition = scaleMat * translateMat * vec4(position, 1.0);
          vPosition = (modelMatrix * updatePosition).xyz;
          vInvertMatrix = inverse(modelMatrix);
          gl_Position = projectionMatrix * modelViewMatrix * updatePosition;
        }`,
        fragmentShader: `precision highp float;

        uniform vec3 cameraPosition;
        uniform float time;

        varying vec3 vPosition;
        varying mat4 vInvertMatrix;

        void main() {
          vec3 normal = normalize(cross(dFdx(vPosition), dFdy(vPosition)));
          vec3 light = vec3(-0.7, 0.7, -0.7);
          float diff = (dot(normal, light) + 1.0) / 2.0 * 0.2 + 0.8;
          gl_FragColor = vec4(vec3(0.98) * diff, 1.0);
        }`,
        flatShading: true,
      })
    );
  }
  render(renderer, scene, time) {
    this.uniforms.time.value += time;
    this.obj.visible = false;
    this.cubeCamera.updateCubeMap(renderer, scene);
    this.obj.visible = true;
  }
}

class ConsoleSignature {
  constructor() {
    this.message = `created by yoichi kobayashi`;
    this.url = `http://www.tplh.net`;
    this.show();
  }
  show() {
    if (navigator.userAgent.toLowerCase().indexOf("chrome") > -1) {
      const args = [
        `\n%c ${this.message} %c%c ${this.url} \n\n`,
        "color: #fff; background: #222; padding:3px 0;",
        "padding:3px 1px;",
        "color: #fff; background: #47c; padding:3px 0;",
      ];
      console.log.apply(console, args);
    } else if (window.console) {
      console.log(`${this.message} ${this.url}`);
    }
  }
}

const MathEx = {
  degrees: function (radian) {
    return (radian / Math.PI) * 180;
  },
  radians: function (degree) {
    return (degree * Math.PI) / 180;
  },
  clamp: function (value, min, max) {
    return Math.min(Math.max(value, min), max);
  },
  mix: function (x1, x2, a) {
    return x1 * (1 - a) + x2 * a;
  },
  polar: function (radian1, radian2, radius) {
    return [
      Math.cos(radian1) * Math.cos(radian2) * radius,
      Math.sin(radian1) * radius,
      Math.cos(radian1) * Math.sin(radian2) * radius,
    ];
  },
};

const force3 = {
  updateVelocity: (velocity, acceleration, mass) => {
    vec3.scale(acceleration, acceleration, 1 / mass);
    vec3.add(velocity, velocity, acceleration);
  },
  applyFriction: (acceleration, mu, n) => {
    const friction = [0, 0, 0];
    vec3.scale(friction, acceleration, -1);
    const normal = n ? n : 1;
    vec3.normalize(friction, friction);
    vec3.scale(friction, friction, mu);
    vec3.add(acceleration, acceleration, friction);
  },
  applyDrag: (acceleration, value) => {
    const drag = [0, 0, 0];
    vec3.scale(drag, acceleration, -1);
    vec3.normalize(drag, drag);
    vec3.scale(drag, drag, vec3.length(acceleration) * value);
    vec3.add(acceleration, acceleration, drag);
  },
  applyHook: (velocity, acceleration, anchor, rest_length, k) => {
    const hook = [0, 0, 0];
    vec3.sub(hook, velocity, anchor);
    const distance = vec3.length(hook) - rest_length;
    vec3.normalize(hook, hook);
    vec3.scale(hook, hook, -1 * k * distance);
    vec3.add(acceleration, acceleration, hook);
  },
};

const debounce = (callback, duration) => {
  var timer;
  return function (event) {
    clearTimeout(timer);
    timer = setTimeout(function () {
      callback(event);
    }, duration);
  };
};

const canvas = document.getElementById("canvas");
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
const pixelBuffer = new Uint8Array(4);
const renderPicked = new THREE.WebGLRenderTarget(
  window.innerWidth,
  window.innerHeight
);
const scene = new THREE.Scene();
const scenePicked = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  24,
  window.innerWidth / window.innerHeight,
  1,
  15000
);
const clock = new THREE.Clock();

const vectorTouchStart = new THREE.Vector2();
const vectorTouchMove = new THREE.Vector2();
const vectorTouchMovePrev = new THREE.Vector2();
const vectorTouchEnd = new THREE.Vector2();

let isDrag = false;

const boxes = new Boxes();
const floor = new Floor();
const hill = new Hill();

const resizeWindow = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderPicked.setSize(window.innerWidth, window.innerHeight);
  floor.resize();
};
const render = () => {
  const time = clock.getDelta();
  renderer.setClearColor(0xf1f1f1, 1.0);
  boxes.render(time);
  floor.render(renderer, scene, time);
  hill.render(renderer, scene, time);
  renderer.render(scene, camera);
};
const renderLoop = () => {
  render();
  requestAnimationFrame(renderLoop);
};
const touchStart = (isTouched) => {
  isDrag = true;
};
const touchMove = (isTouched) => {
  if (isDrag) {
    if (isTouched) {
      boxes.rotate((vectorTouchMove.x - vectorTouchMovePrev.x) * 0.05);
      vectorTouchMovePrev.copy(vectorTouchMove);
    }
  } else {
    renderer.setClearColor(0xffffff, 1.0);
    renderer.setRenderTarget(renderPicked);
    renderer.render(scenePicked, camera);
    renderer.setRenderTarget(null);
    renderer.readRenderTargetPixels(
      renderPicked,
      Math.floor(vectorTouchMove.x),
      Math.floor(renderPicked.height - vectorTouchMove.y),
      1,
      1,
      pixelBuffer
    );
    boxes.picked(
      (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | pixelBuffer[2]
    );
  }
};
const touchEnd = (isTouched) => {
  isDrag = false;
};
const wheel = (event) => {
  boxes.rotate(event.deltaY);
};
const on = () => {
  window.addEventListener(
    "resize",
    debounce(() => {
      resizeWindow();
    }),
    1000
  );
  canvas.addEventListener("mousedown", function (event) {
    event.preventDefault();
    vectorTouchStart.set(event.clientX, event.clientY);
    touchStart(false);
  });
  document.addEventListener("mousemove", function (event) {
    event.preventDefault();
    vectorTouchMove.set(event.clientX, event.clientY);
    touchMove(false);
  });
  document.addEventListener("mouseup", function (event) {
    event.preventDefault();
    vectorTouchEnd.set(event.clientX, event.clientY);
    touchEnd(false);
  });
  canvas.addEventListener("wheel", function (event) {
    event.preventDefault();
    wheel(event);
  });
  canvas.addEventListener("touchstart", function (event) {
    event.preventDefault();
    vectorTouchStart.set(event.touches[0].clientX, event.touches[0].clientY);
    vectorTouchMove.set(event.touches[0].clientX, event.touches[0].clientY);
    vectorTouchMovePrev.set(event.touches[0].clientX, event.touches[0].clientY);
    touchStart(event.touches[0].clientX, event.touches[0].clientY, true);
  });
  canvas.addEventListener("touchmove", function (event) {
    event.preventDefault();
    vectorTouchMove.set(event.touches[0].clientX, event.touches[0].clientY);
    touchMove(true);
    vectorTouchMovePrev.set(event.touches[0].clientX, event.touches[0].clientY);
  });
  canvas.addEventListener("touchend", function (event) {
    event.preventDefault();
    vectorTouchEnd.set(
      event.changedTouches[0].clientX,
      event.changedTouches[0].clientY
    );
    touchEnd(true);
  });
};

const init = () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.position.set(0, 400, -3000);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  floor.mirrorCamera.position.set(0, -400, -3000);
  floor.mirrorCamera.lookAt(new THREE.Vector3(0, 0, 0));

  boxes.core.obj.position.set(0, 80, 0);
  boxes.wire.obj.position.set(0, 80, 0);
  boxes.wire.objPicked.position.set(0, 80, 0);
  floor.obj.rotation.set(-0.5 * Math.PI, 0, 0);

  scene.add(boxes.core.obj);
  scene.add(boxes.wire.obj);
  scene.add(floor.obj);
  scene.add(hill.obj);
  scene.add(hill.cubeCamera);
  scenePicked.add(boxes.wire.objPicked);

  on();
  resizeWindow();
  renderLoop();
};
init();
