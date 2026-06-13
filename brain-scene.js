(function () {
  const container = document.querySelector(".brain-strip");
  const canvas = document.getElementById("brain-canvas");
  const THREE = window.THREE;

  if (!container || !canvas) return;

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

  if (!THREE || !Array.isArray(window.BRAIN_POINTS) || !window.BRAIN_POINTS.length) {
    brainCanvasFallback();
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  const brain = new THREE.Group();
  const pointer = new THREE.Vector2(0, 0);
  const targetRotation = new THREE.Vector2(0, 0);
  const currentRotation = new THREE.Vector2(0, 0);
  const clock = new THREE.Clock();
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const screenRepulsionRadius = 0.13;
  const repulsionStrength = 0.078;
  const surfaceDepthBand = 0.18;
  const tempWorld = new THREE.Vector3();
  const tempCamera = new THREE.Vector3();
  const tempProjected = new THREE.Vector3();
  const targetScale = new THREE.Vector3(1, 1, 1);
  let points = null;
  let basePositions = null;
  let animationFrame = null;
  let hoverAmount = 0;
  let hoverTarget = 0;
  let isVisible = true;

  scene.add(brain);
  camera.position.set(0, 0, 6.2);

  function getThemeColor() {
    return new THREE.Color(document.documentElement.classList.contains("dark") ? "#eaf3ff" : "#063b7a");
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

  function normalizePositions(positions) {
    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    for (let index = 0; index < positions.length; index += 3) {
      minX = Math.min(minX, positions[index]);
      minY = Math.min(minY, positions[index + 1]);
      minZ = Math.min(minZ, positions[index + 2]);
      maxX = Math.max(maxX, positions[index]);
      maxY = Math.max(maxY, positions[index + 1]);
      maxZ = Math.max(maxZ, positions[index + 2]);
    }

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const scale = 3.55 / Math.max(maxX - minX, maxY - minY, maxZ - minZ);

    for (let index = 0; index < positions.length; index += 3) {
      positions[index] = (positions[index] - centerX) * scale;
      positions[index + 1] = -(positions[index + 1] - centerY) * scale;
      positions[index + 2] = (positions[index + 2] - centerZ) * scale;
    }
  }

  function buildPointCloud() {
    const positions = new Float32Array(window.BRAIN_POINTS);
    normalizePositions(positions);
    basePositions = new Float32Array(positions);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: getThemeColor(),
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
    renderOnce();
    updateAnimationState();
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
    renderOnce();
  }

  function updateBrainTransform() {
    const elapsed = clock.getElapsedTime();
    targetRotation.x = -pointer.y * 0.18;
    targetRotation.y = pointer.x * 0.28;
    currentRotation.lerp(targetRotation, 0.055);
    const zoom = 1 + hoverAmount * 0.045;
    targetScale.set(zoom, zoom, zoom);

    brain.rotation.x = currentRotation.x - 0.02;
    brain.rotation.y = currentRotation.y + elapsed * 0.035;
    brain.rotation.z = Math.sin(elapsed * 0.6) * 0.018;
    brain.scale.lerp(targetScale, 0.08);

    if (points) {
      points.material.color.lerp(getThemeColor(), 0.08);
      points.material.opacity = document.documentElement.classList.contains("dark") ? 0.72 : 0.78;
    }
  }

  function updateParticlePositions() {
    if (!points || !basePositions) return;
    if (hoverAmount === 0 && hoverTarget === 0) return;

    const surfaceHit = getSurfaceHit();
    if (!surfaceHit) {
      hoverTarget = 0;
    }

    hoverAmount += (hoverTarget - hoverAmount) * 0.09;
    if (Math.abs(hoverTarget - hoverAmount) < 0.001) {
      hoverAmount = hoverTarget;
    }

    const positionAttribute = points.geometry.getAttribute("position");
    const positions = positionAttribute.array;
    const radiusSquared = screenRepulsionRadius * screenRepulsionRadius;
    points.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);

    for (let index = 0; index < positions.length; index += 3) {
      const x = basePositions[index];
      const y = basePositions[index + 1];
      const z = basePositions[index + 2];
      let localInfluence = 0;
      let directionX = 0;
      let directionY = 0;

      if (surfaceHit) {
        tempWorld.set(x, y, z).applyMatrix4(points.matrixWorld);
        tempCamera.copy(tempWorld).applyMatrix4(camera.matrixWorldInverse);

        if (tempCamera.z >= surfaceHit.cameraZ - surfaceDepthBand) {
          tempProjected.copy(tempWorld).project(camera);
          const dx = tempProjected.x - pointer.x;
          const dy = tempProjected.y - pointer.y;
          const distanceSquared = dx * dx + dy * dy;

          if (distanceSquared < radiusSquared) {
            const distance = Math.sqrt(distanceSquared) || 0.001;
            localInfluence = (1 - distance / screenRepulsionRadius) ** 2;
            directionX = dx / distance;
            directionY = dy / distance;
          }
        }
      }

      positions[index] = x + directionX * repulsionStrength * localInfluence * hoverAmount;
      positions[index + 1] = y + directionY * repulsionStrength * localInfluence * hoverAmount;
      positions[index + 2] = z;
    }

    positionAttribute.needsUpdate = true;
  }

  function getSurfaceHit() {
    if (!points || !basePositions) return null;

    let cameraZ = -Infinity;
    const radiusSquared = screenRepulsionRadius * screenRepulsionRadius;
    points.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);

    for (let index = 0; index < basePositions.length; index += 3) {
      tempWorld.set(basePositions[index], basePositions[index + 1], basePositions[index + 2]).applyMatrix4(points.matrixWorld);
      tempCamera.copy(tempWorld).applyMatrix4(camera.matrixWorldInverse);

      if (tempCamera.z >= -camera.near || tempCamera.z <= -camera.far) continue;

      tempProjected.copy(tempWorld).project(camera);
      if (tempProjected.z < -1 || tempProjected.z > 1) continue;

      const dx = tempProjected.x - pointer.x;
      const dy = tempProjected.y - pointer.y;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < radiusSquared) {
        cameraZ = Math.max(cameraZ, tempCamera.z);
      }
    }

    return cameraZ > -Infinity ? { cameraZ } : null;
  }

  function renderOnce() {
    updateBrainTransform();
    updateParticlePositions();
    renderer.render(scene, camera);
  }

  function shouldAnimate() {
    return isVisible && !document.hidden && !reducedMotionQuery.matches;
  }

  function startAnimation() {
    if (!animationFrame && shouldAnimate()) {
      animationFrame = window.requestAnimationFrame(animate);
    }
  }

  function stopAnimation() {
    if (animationFrame) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }

  function updateAnimationState() {
    if (shouldAnimate()) {
      startAnimation();
      return;
    }

    stopAnimation();
    renderOnce();
  }

  function animate() {
    animationFrame = null;
    renderOnce();

    if (shouldAnimate()) {
      animationFrame = window.requestAnimationFrame(animate);
    }
  }

  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    pointer.y = -(((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1);
  }

  container.addEventListener("pointerenter", (event) => {
    updatePointer(event);
    hoverTarget = 1;
    startAnimation();
  });

  container.addEventListener("pointermove", (event) => {
    updatePointer(event);
    hoverTarget = 1;
    startAnimation();
  });

  container.addEventListener("pointerleave", () => {
    pointer.set(0, 0);
    hoverTarget = 0;
    startAnimation();
  });

  new ResizeObserver(resize).observe(container);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        updateAnimationState();
      },
      { threshold: 0.05 }
    ).observe(container);
  }

  document.addEventListener("visibilitychange", updateAnimationState);
  reducedMotionQuery.addEventListener?.("change", updateAnimationState);

  resize();
  buildPointCloud();
})();
