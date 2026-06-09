import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const container = document.querySelector(".brain-strip");
const canvas = document.getElementById("brain-canvas");

if (container && canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  const loader = new GLTFLoader();
  const brain = new THREE.Group();
  const pointer = new THREE.Vector2(0, 0);
  const targetRotation = new THREE.Vector2(0, 0);
  const currentRotation = new THREE.Vector2(0, 0);
  const clock = new THREE.Clock();
  let points = null;
  let resizeObserver = null;
  let animationFrame = null;

  scene.add(brain);
  camera.position.set(0, 0, 6.2);

  function getThemeColors() {
    const isDark = document.documentElement.classList.contains("dark");
    return {
      point: new THREE.Color(isDark ? "#eaf3ff" : "#063b7a"),
      line: new THREE.Color(isDark ? "#8bc6ff" : "#0b5cad")
    };
  }

  function createSprite() {
    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = 96;
    spriteCanvas.height = 96;
    const context = spriteCanvas.getContext("2d");
    const gradient = context.createRadialGradient(48, 48, 2, 48, 48, 44);

    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.55, "rgba(255,255,255,0.9)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 96, 96);

    const texture = new THREE.CanvasTexture(spriteCanvas);
    texture.needsUpdate = true;
    return texture;
  }

  function samplePositions(geometries) {
    const all = [];
    const maxPoints = 18000;

    for (const geometry of geometries) {
      const position = geometry.getAttribute("position");
      if (!position) continue;

      for (let index = 0; index < position.count; index += 1) {
        all.push(position.getX(index), position.getY(index), position.getZ(index));
      }
    }

    const sourceCount = all.length / 3;
    const stride = Math.max(1, Math.ceil(sourceCount / maxPoints));
    const sampled = [];

    for (let index = 0; index < sourceCount; index += stride) {
      sampled.push(all[index * 3], all[index * 3 + 1], all[index * 3 + 2]);
    }

    return new Float32Array(sampled);
  }

  function normalizePositions(positions) {
    const box = new THREE.Box3();

    for (let index = 0; index < positions.length; index += 3) {
      box.expandByPoint(new THREE.Vector3(positions[index], positions[index + 1], positions[index + 2]));
    }

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const scale = 2.7 / Math.max(size.x, size.y, size.z);

    for (let index = 0; index < positions.length; index += 3) {
      positions[index] = (positions[index] - center.x) * scale;
      positions[index + 1] = (positions[index + 1] - center.y) * scale;
      positions[index + 2] = (positions[index + 2] - center.z) * scale;
    }
  }

  function buildPointCloud(gltf) {
    const geometries = [];

    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;

      const geometry = child.geometry.clone();
      geometry.applyMatrix4(child.matrixWorld);
      geometries.push(geometry);
    });

    const positions = samplePositions(geometries);
    normalizePositions(positions);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const colors = getThemeColors();
    const material = new THREE.PointsMaterial({
      color: colors.point,
      size: 0.018,
      map: createSprite(),
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    points = new THREE.Points(geometry, material);
    points.rotation.set(-0.08, -0.28, 0.02);
    brain.add(points);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function animate() {
    const elapsed = clock.getElapsedTime();
    targetRotation.x = pointer.y * 0.18;
    targetRotation.y = pointer.x * 0.28;
    currentRotation.lerp(targetRotation, 0.055);

    brain.rotation.x = currentRotation.x - 0.02;
    brain.rotation.y = currentRotation.y + elapsed * 0.035;
    brain.rotation.z = Math.sin(elapsed * 0.6) * 0.018;

    if (points) {
      const colors = getThemeColors();
      points.material.color.lerp(colors.point, 0.08);
      points.material.opacity = document.documentElement.classList.contains("dark") ? 0.72 : 0.78;
    }

    renderer.render(scene, camera);
    animationFrame = window.requestAnimationFrame(animate);
  }

  container.addEventListener("pointermove", (event) => {
    const rect = container.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    pointer.y = -(((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1);
  });

  container.addEventListener("pointerleave", () => {
    pointer.set(0, 0);
  });

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  loader.load(
    "assets/brain/cortex.glb",
    (gltf) => buildPointCloud(gltf),
    undefined,
    () => {
      brainCanvasFallback();
    }
  );

  function brainCanvasFallback() {
    const context = canvas.getContext("2d");
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    context.strokeStyle = document.documentElement.classList.contains("dark")
      ? "rgba(234,243,255,0.55)"
      : "rgba(6,59,122,0.55)";
    context.lineWidth = 1.4;
    context.beginPath();
    context.ellipse(rect.width / 2, rect.height / 2, rect.width * 0.23, rect.height * 0.32, 0, 0, Math.PI * 2);
    context.stroke();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    } else if (!animationFrame) {
      animate();
    }
  });

  animate();
}
