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
  let renderer = null;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
  } catch (error) {
    brainCanvasFallback();
    return;
  }
  const brain = new THREE.Group();
  const pointer = new THREE.Vector2(0, 0);
  const targetRotation = new THREE.Vector2(0, 0);
  const currentRotation = new THREE.Vector2(0, 0);
  const sectionRotationTarget = new THREE.Vector2(0, 0);
  const sectionRotationCurrent = new THREE.Vector2(0, 0);
  const clock = new THREE.Clock();
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const springK = 0.075;
  const damping = 0.9;
  const repulsionRadiusPx = 78;
  const repulsionStrength = 0.26;
  const maxDisplace = 0.11;
  const frontThreshold = 0.08;
  const firingParticleCount = 180;
  const firingPulseMinDelay = 0.45;
  const firingPulseMaxDelay = 4.2;
  const firingPulseMinDuration = 0.42;
  const firingPulseMaxDuration = 0.95;
  const clickRippleDuration = 1.15;
  const clickRippleRadius = 2.85;
  const clickRippleBand = 0.22;
  const clickRippleMaxCount = 4;
  const resumeRegionTransitionMs = 180;
  const sectionPulseRadius = 0.62;
  const tempWorld = new THREE.Vector3();
  const tempCamera = new THREE.Vector3();
  const tempProjected = new THREE.Vector3();
  const clickOrigin = new THREE.Vector3();
  const cameraForward = new THREE.Vector3();
  const cameraRight = new THREE.Vector3();
  const cameraUp = new THREE.Vector3();
  const groupQuaternionWorld = new THREE.Quaternion();
  const inverseGroupQuaternion = new THREE.Quaternion();
  const localRight = new THREE.Vector3();
  const localUp = new THREE.Vector3();
  const localForward = new THREE.Vector3();
  const mvpMatrix = new THREE.Matrix4();
  const targetScale = new THREE.Vector3(1, 1, 1);
  let points = null;
  let firingPoints = null;
  let firingPositions = null;
  let firingColors = null;
  let basePositions = null;
  let baseColors = null;
  let firingParticles = [];
  let clickRipples = [];
  let activeSectionPatch = null;
  let pendingSectionPatch = null;
  let resumeRegionTimeout = null;
  let velocities = null;
  let animationFrame = null;
  let hoverAmount = 0;
  let hoverTarget = 0;
  let pointerInside = false;
  let isVisible = true;
  let fitScale = 1;
  const isResumeBrain = !!container.closest(".resume-visual");
  const resumeVisual = isResumeBrain ? container.closest(".resume-visual") : null;
  const resumeCallout = resumeVisual?.querySelector(".resume-brain-callout");
  const resumeBrainStates = {
    industry: {
      rotation: [-0.16, -0.48],
      origin: [-0.72, 0.48, 0.72],
      color: [0, 1.75, 3.25],
      labelOffset: [-148, -74]
    },
    projects: {
      rotation: [0.08, 0.42],
      origin: [0.64, 0.18, 0.92],
      color: [0, 3.1, 0.75],
      lightColor: [0.02, 0.28, 0.08],
      labelOffset: [76, -82]
    },
    leadership: {
      rotation: [-0.24, 0.16],
      origin: [0.08, -0.5, 1.06],
      color: [3.35, 0.82, 0],
      lightColor: [0.44, 0.12, 0.02],
      labelOffset: [70, 82]
    },
    skills: {
      rotation: [0.22, -0.2],
      origin: [-0.12, 0.02, 1.18],
      color: [2.95, 0, 3.35],
      labelOffset: [-112, 72]
    }
  };

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
      positions[index + 1] = (positions[index + 1] - centerY) * scale;
      positions[index + 2] = (positions[index + 2] - centerZ) * scale;
    }
  }

  function buildPointCloud() {
    const positions = new Float32Array(window.BRAIN_POINTS);
    normalizePositions(positions);
    basePositions = new Float32Array(positions);
    velocities = new Float32Array(positions.length);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    baseColors = Array.isArray(window.BRAIN_COLORS) && window.BRAIN_COLORS.length === positions.length
      ? new Float32Array(window.BRAIN_COLORS)
      : createFallbackColors(positions.length);
    geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(baseColors), 3));
    seedFiringParticles(positions.length / 3);

    const material = new THREE.PointsMaterial({
      color: getThemeColor(),
      size: 0.022,
      map: createSprite(),
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      blending: THREE.NormalBlending,
      vertexColors: true
    });

    points = new THREE.Points(geometry, material);
    points.rotation.set(-0.08, -0.28, 0.02);
    brain.add(points);
    buildFiringOverlay();
    renderOnce();
    updateAnimationState();
  }

  function buildFiringOverlay() {
    if (!firingParticles.length || !basePositions) return;

    firingPositions = new Float32Array(firingParticles.length * 3);
    firingColors = new Float32Array(firingParticles.length * 3);

    for (let index = 0; index < firingParticles.length; index += 1) {
      const sourceIndex = firingParticles[index].index;
      const targetIndex = index * 3;
      firingPositions[targetIndex] = basePositions[sourceIndex];
      firingPositions[targetIndex + 1] = basePositions[sourceIndex + 1];
      firingPositions[targetIndex + 2] = basePositions[sourceIndex + 2];
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(firingPositions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(firingColors, 3));

    const material = new THREE.PointsMaterial({
      color: "#ffffff",
      size: 0.044,
      map: createSprite(),
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });

    firingPoints = new THREE.Points(geometry, material);
    firingPoints.rotation.copy(points.rotation);
    brain.add(firingPoints);
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
    fitScale = Math.min(0.82, Math.max(0.66, camera.aspect / 1.28));
    brain.scale.set(fitScale, fitScale, fitScale);
    renderOnce();
  }

  function updateBrainTransform() {
    const elapsed = clock.getElapsedTime();
    const pointerRotationX = isResumeBrain ? 0 : -pointer.y * 0.18;
    const pointerRotationY = isResumeBrain ? 0 : pointer.x * 0.28;
    const idleRotationY = isResumeBrain ? 0 : elapsed * 0.052;
    const idleRotationZ = isResumeBrain ? 0 : Math.sin(elapsed * 0.6) * 0.018;

    sectionRotationCurrent.lerp(sectionRotationTarget, isResumeBrain ? 0.16 : 0.045);
    targetRotation.x = sectionRotationCurrent.x + pointerRotationX;
    targetRotation.y = sectionRotationCurrent.y + pointerRotationY;
    currentRotation.lerp(targetRotation, isResumeBrain ? 0.22 : 0.055);
    const zoom = fitScale * (1 + hoverAmount * 0.028);
    targetScale.set(zoom, zoom, zoom);

    brain.rotation.x = currentRotation.x - 0.02;
    brain.rotation.y = currentRotation.y + idleRotationY;
    brain.rotation.z = idleRotationZ;
    brain.scale.lerp(targetScale, 0.08);

    if (points) {
      const isDark = document.documentElement.classList.contains("dark");
      points.material.color.lerp(getThemeColor(), 0.08);
      points.material.opacity = isDark ? 0.82 : 0.74;
    }

    if (firingPoints) {
      const isDark = document.documentElement.classList.contains("dark");
      firingPoints.material.size = isDark ? 0.044 : 0.068;
      firingPoints.material.opacity = isDark ? 0.9 : 1;
    }
  }

  function smoothstep01(value) {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  }

  function createFallbackColors(length) {
    const colors = new Float32Array(length);
    colors.fill(1);
    return colors;
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function seedFiringParticles(pointCount) {
    const selected = new Set();
    const count = Math.min(firingParticleCount, pointCount);

    while (selected.size < count) {
      selected.add(Math.floor(Math.random() * pointCount));
    }

    firingParticles = Array.from(selected, (particleIndex) => ({
      index: particleIndex * 3,
      start: randomBetween(0, firingPulseMaxDelay),
      duration: randomBetween(firingPulseMinDuration, firingPulseMaxDuration),
      nextDelay: randomBetween(firingPulseMinDelay, firingPulseMaxDelay)
    }));
  }

  function updateFiringParticles(elapsed) {
    if (!points || !baseColors || !firingParticles.length) return;

    const colorAttribute = points.geometry.getAttribute("color");
    if (!colorAttribute) return;

    const colors = colorAttribute.array;
    const positionAttribute = points.geometry.getAttribute("position");
    const positions = positionAttribute.array;
    const firingPositionAttribute = firingPoints?.geometry.getAttribute("position");
    const firingColorAttribute = firingPoints?.geometry.getAttribute("color");
    const isDark = document.documentElement.classList.contains("dark");
    clickRipples = clickRipples.filter((ripple) => elapsed - ripple.start < clickRippleDuration);

    for (let index = 0; index < colors.length; index += 3) {
      const restX = basePositions[index];
      const restY = basePositions[index + 1];
      const restZ = basePositions[index + 2];
      let rippleGlow = 0;
      let sectionRed = 0;
      let sectionGreen = 0;
      let sectionBlue = 0;

      for (let rippleIndex = 0; rippleIndex < clickRipples.length; rippleIndex += 1) {
        const ripple = clickRipples[rippleIndex];
        const progress = (elapsed - ripple.start) / clickRippleDuration;
        if (progress < 0 || progress > 1) continue;

        const dx = restX - ripple.x;
        const dy = restY - ripple.y;
        const dz = restZ - ripple.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const waveRadius = progress * clickRippleRadius;
        const bandDistance = Math.abs(distance - waveRadius) / clickRippleBand;
        const band = Math.max(0, 1 - bandDistance);
        const fade = Math.pow(1 - progress, 1.6);
        const glow = band * band * fade * (ripple.color ? 2.35 : 1.65);

        if (ripple.color) {
          sectionRed += glow * ripple.color[0];
          sectionGreen += glow * ripple.color[1];
          sectionBlue += glow * ripple.color[2];
        } else {
          rippleGlow += glow;
        }
      }

      if (activeSectionPatch) {
        const dx = restX - activeSectionPatch.x;
        const dy = restY - activeSectionPatch.y;
        const dz = restZ - activeSectionPatch.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const patchRadius = !isDark && activeSectionPatch.lightColor
          ? sectionPulseRadius * 1.18
          : sectionPulseRadius;
        const patch = Math.max(0, 1 - distance / patchRadius);
        const age = elapsed - activeSectionPatch.start;
        const entrance = smoothstep01(Math.min(1, age / (isResumeBrain ? 0.24 : 0.45)));
        const breathe = 0.62 + Math.sin(elapsed * 3.25) * 0.28 + Math.sin(elapsed * 6.1) * 0.1;
        const glowColor = !isDark && activeSectionPatch.lightColor
          ? activeSectionPatch.lightColor
          : activeSectionPatch.color;
        const glow = patch * patch * entrance * breathe * (isDark ? 3.45 : 1.65);

        if (!isDark && activeSectionPatch.lightColor) {
          const tint = Math.min(0.86, patch * patch * entrance * (0.62 + breathe * 0.2));
          sectionRed += (glowColor[0] - baseColors[index]) * tint + glow * glowColor[0] * 0.22;
          sectionGreen += (glowColor[1] - baseColors[index + 1]) * tint + glow * glowColor[1] * 0.22;
          sectionBlue += (glowColor[2] - baseColors[index + 2]) * tint + glow * glowColor[2] * 0.22;
        } else {
          sectionRed += glow * glowColor[0];
          sectionGreen += glow * glowColor[1];
          sectionBlue += glow * glowColor[2];
        }
      }

      const visibleRippleGlow = rippleGlow * (isDark ? 1 : 2.7);
      colors[index] = baseColors[index] + visibleRippleGlow * (isDark ? 0.78 : 1.22) + sectionRed;
      colors[index + 1] = baseColors[index + 1] + visibleRippleGlow * (isDark ? 1.05 : 1.22) + sectionGreen;
      colors[index + 2] = baseColors[index + 2] + visibleRippleGlow * (isDark ? 1.6 : 1.22) + sectionBlue;
    }

    let changed = true;
    let firingOverlayChanged = false;

    for (let pulseIndex = 0; pulseIndex < firingParticles.length; pulseIndex += 1) {
      const pulse = firingParticles[pulseIndex];
      const index = pulse.index;
      let intensity = 0;

      if (elapsed >= pulse.start) {
        const progress = (elapsed - pulse.start) / pulse.duration;

        if (progress >= 1) {
          pulse.start = elapsed + pulse.nextDelay;
          pulse.duration = randomBetween(firingPulseMinDuration, firingPulseMaxDuration);
          pulse.nextDelay = randomBetween(firingPulseMinDelay, firingPulseMaxDelay);
        } else {
          intensity = Math.sin(progress * Math.PI);
        }
      }

      const glow = intensity * intensity;
      const visibleGlow = glow * (isDark ? 1 : 1.85);
      colors[index] += visibleGlow * 1.1;
      colors[index + 1] += visibleGlow * (isDark ? 1.1125 : 1.1);
      colors[index + 2] += visibleGlow * (isDark ? 2 : 1.1);

      if (firingPositions && firingColors) {
        const targetIndex = pulseIndex * 3;
        firingPositions[targetIndex] = positions[index];
        firingPositions[targetIndex + 1] = positions[index + 1];
        firingPositions[targetIndex + 2] = positions[index + 2];
        firingColors[targetIndex] = visibleGlow * (isDark ? 0.72 : 1);
        firingColors[targetIndex + 1] = visibleGlow * (isDark ? 0.95 : 1);
        firingColors[targetIndex + 2] = visibleGlow * (isDark ? 1.45 : 1);
        firingOverlayChanged = true;
      }
    }

    if (changed) {
      colorAttribute.needsUpdate = true;
    }

    if (firingOverlayChanged) {
      firingPositionAttribute.needsUpdate = true;
      firingColorAttribute.needsUpdate = true;
    }
  }

  function updateParticlePositions(dt) {
    if (!points || !basePositions || !velocities) return;

    hoverAmount += (hoverTarget - hoverAmount) * 0.09;
    if (Math.abs(hoverTarget - hoverAmount) < 0.001) {
      hoverAmount = hoverTarget;
    }

    const positionAttribute = points.geometry.getAttribute("position");
    const positions = positionAttribute.array;
    const frameScale = Math.min(dt || 1 / 60, 1 / 30) * 60;
    const dampingFactor = Math.pow(damping, frameScale);
    const maxDisplaceSquared = maxDisplace * maxDisplace;
    const radiusSquared = repulsionRadiusPx * repulsionRadiusPx;
    const rect = canvas.getBoundingClientRect();
    const cursorPx = {
      x: (pointer.x * 0.5 + 0.5) * Math.max(1, rect.width),
      y: (1 - (pointer.y * 0.5 + 0.5)) * Math.max(1, rect.height)
    };
    const physicsActive = pointerInside && hoverAmount > 0.01 && !reducedMotionQuery.matches;

    points.updateMatrixWorld(true);
    brain.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    mvpMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    mvpMatrix.multiply(points.matrixWorld);

    camera.getWorldDirection(cameraForward).normalize();
    cameraRight.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    cameraUp.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
    points.getWorldQuaternion(groupQuaternionWorld);
    inverseGroupQuaternion.copy(groupQuaternionWorld).invert();
    localRight.copy(cameraRight).applyQuaternion(inverseGroupQuaternion).normalize();
    localUp.copy(cameraUp).applyQuaternion(inverseGroupQuaternion).normalize();
    localForward.copy(cameraForward).applyQuaternion(inverseGroupQuaternion).normalize().multiplyScalar(-1);

    for (let index = 0; index < positions.length; index += 3) {
      const restX = basePositions[index];
      const restY = basePositions[index + 1];
      const restZ = basePositions[index + 2];
      const x = positions[index];
      const y = positions[index + 1];
      const z = positions[index + 2];

      velocities[index] += (restX - x) * springK * frameScale;
      velocities[index + 1] += (restY - y) * springK * frameScale;
      velocities[index + 2] += (restZ - z) * springK * frameScale;

      if (physicsActive) {
        tempWorld.set(x, y, z).applyMatrix4(points.matrixWorld);
        tempCamera.copy(tempWorld).applyMatrix4(camera.matrixWorldInverse);
        if (tempCamera.z < -camera.near && tempCamera.z > -camera.far) {
          tempProjected.copy(tempWorld).project(camera);

          if (Math.abs(tempProjected.x) <= 1.15 && Math.abs(tempProjected.y) <= 1.15) {
            const outLength = Math.hypot(x, y, z) || 1;
            const frontness =
              (x / outLength) * localForward.x +
              (y / outLength) * localForward.y +
              (z / outLength) * localForward.z;

            if (frontness >= frontThreshold) {
              const screenX = (tempProjected.x * 0.5 + 0.5) * Math.max(1, rect.width);
              const screenY = (1 - (tempProjected.y * 0.5 + 0.5)) * Math.max(1, rect.height);
              const dx = screenX - cursorPx.x;
              const dy = screenY - cursorPx.y;
              const distanceSquared = dx * dx + dy * dy;

              if (distanceSquared < radiusSquared) {
                const distance = Math.sqrt(distanceSquared) || 0.001;
                const directionX = dx / distance;
                const directionY = dy / distance;
                const falloff = smoothstep01(1 - distance / repulsionRadiusPx);
                const push = repulsionStrength * falloff * frameScale * hoverAmount;

                velocities[index] += (localRight.x * directionX + localUp.x * -directionY) * push;
                velocities[index + 1] += (localRight.y * directionX + localUp.y * -directionY) * push;
                velocities[index + 2] += (localRight.z * directionX + localUp.z * -directionY) * push;
              }
            }
          }
        }
      }

      let velocityX = velocities[index] * dampingFactor;
      let velocityY = velocities[index + 1] * dampingFactor;
      let velocityZ = velocities[index + 2] * dampingFactor;

      let nextX = x + velocityX * Math.min(dt || 1 / 60, 1 / 30);
      let nextY = y + velocityY * Math.min(dt || 1 / 60, 1 / 30);
      let nextZ = z + velocityZ * Math.min(dt || 1 / 60, 1 / 30);

      const displaceX = nextX - restX;
      const displaceY = nextY - restY;
      const displaceZ = nextZ - restZ;
      const displaceSquared = displaceX * displaceX + displaceY * displaceY + displaceZ * displaceZ;

      if (displaceSquared > maxDisplaceSquared) {
        const scale = maxDisplace / Math.sqrt(displaceSquared);
        nextX = restX + displaceX * scale;
        nextY = restY + displaceY * scale;
        nextZ = restZ + displaceZ * scale;
        velocityX *= 0.72;
        velocityY *= 0.72;
        velocityZ *= 0.72;
      }

      positions[index] = nextX;
      positions[index + 1] = nextY;
      positions[index + 2] = nextZ;
      velocities[index] = velocityX;
      velocities[index + 1] = velocityY;
      velocities[index + 2] = velocityZ;
    }

    positionAttribute.needsUpdate = true;
  }

  function updateResumeCalloutPosition() {
    if (!isResumeBrain || !resumeCallout || !activeSectionPatch || !points) return;

    const visualRect = resumeVisual.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    points.updateMatrixWorld(true);
    brain.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);

    tempWorld
      .set(activeSectionPatch.x, activeSectionPatch.y, activeSectionPatch.z)
      .applyMatrix4(points.matrixWorld);
    tempProjected.copy(tempWorld).project(camera);

    const screenX = (tempProjected.x * 0.5 + 0.5) * Math.max(1, canvasRect.width) + canvasRect.left;
    const screenY = (1 - (tempProjected.y * 0.5 + 0.5)) * Math.max(1, canvasRect.height) + canvasRect.top;
    const localX = screenX - visualRect.left;
    const localY = screenY - visualRect.top;
    const offset = activeSectionPatch.labelOffset || [80, -70];
    const labelX = Math.max(18, Math.min(visualRect.width - 190, localX + offset[0]));
    const labelY = Math.max(90, Math.min(visualRect.height - 84, localY + offset[1]));
    const lineX = localX - labelX;
    const lineY = localY - labelY;
    const lineLength = Math.hypot(lineX, lineY);
    const lineAngle = Math.atan2(lineY, lineX);

    resumeCallout.style.setProperty("--callout-x", `${labelX}px`);
    resumeCallout.style.setProperty("--callout-y", `${labelY}px`);
    resumeCallout.style.setProperty("--anchor-x", `${lineX}px`);
    resumeCallout.style.setProperty("--anchor-y", `${lineY}px`);
    resumeCallout.style.setProperty("--line-length", `${lineLength}px`);
    resumeCallout.style.setProperty("--line-angle", `${lineAngle}rad`);
  }

  function renderOnce() {
    const dt = Math.min(clock.getDelta() || 1 / 60, 1 / 30);
    updateBrainTransform();
    updateParticlePositions(dt);
    updateFiringParticles(clock.getElapsedTime());
    updateResumeCalloutPosition();
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

  function getActiveRippleColor() {
    if (!isResumeBrain || !activeSectionPatch) return null;

    const isDark = document.documentElement.classList.contains("dark");
    return isDark ? activeSectionPatch.color : null;
  }

  function triggerClickRipple(event) {
    if (!points || !basePositions || reducedMotionQuery.matches) return;

    updatePointer(event);

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    const positions = points.geometry.getAttribute("position").array;
    let nearestIndex = -1;
    let nearestDistanceSquared = Infinity;
    const hitRadiusSquared = 90 * 90;

    points.updateMatrixWorld(true);
    brain.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    mvpMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    mvpMatrix.multiply(points.matrixWorld);

    camera.getWorldDirection(cameraForward).normalize();
    points.getWorldQuaternion(groupQuaternionWorld);
    inverseGroupQuaternion.copy(groupQuaternionWorld).invert();
    localForward.copy(cameraForward).applyQuaternion(inverseGroupQuaternion).normalize().multiplyScalar(-1);

    for (let index = 0; index < positions.length; index += 3) {
      const x = positions[index];
      const y = positions[index + 1];
      const z = positions[index + 2];
      const outLength = Math.hypot(x, y, z) || 1;
      const frontness =
        (x / outLength) * localForward.x +
        (y / outLength) * localForward.y +
        (z / outLength) * localForward.z;

      if (frontness < -0.18) continue;

      tempWorld.set(x, y, z).applyMatrix4(points.matrixWorld);
      tempCamera.copy(tempWorld).applyMatrix4(camera.matrixWorldInverse);
      if (tempCamera.z >= -camera.near || tempCamera.z <= -camera.far) continue;

      tempProjected.copy(tempWorld).project(camera);
      if (Math.abs(tempProjected.x) > 1.15 || Math.abs(tempProjected.y) > 1.15) continue;

      const screenX = (tempProjected.x * 0.5 + 0.5) * Math.max(1, rect.width);
      const screenY = (1 - (tempProjected.y * 0.5 + 0.5)) * Math.max(1, rect.height);
      const dx = screenX - clickX;
      const dy = screenY - clickY;
      const distanceSquared = dx * dx + dy * dy;

      if (distanceSquared < nearestDistanceSquared) {
        nearestDistanceSquared = distanceSquared;
        nearestIndex = index;
      }
    }

    if (nearestIndex < 0 || nearestDistanceSquared > hitRadiusSquared) return;

    clickOrigin.set(
      basePositions[nearestIndex],
      basePositions[nearestIndex + 1],
      basePositions[nearestIndex + 2]
    );

    clickRipples.push({
      x: clickOrigin.x,
      y: clickOrigin.y,
      z: clickOrigin.z,
      color: getActiveRippleColor(),
      start: clock.getElapsedTime()
    });

    if (clickRipples.length > clickRippleMaxCount) {
      clickRipples = clickRipples.slice(-clickRippleMaxCount);
    }

    pointerInside = true;
    hoverTarget = 1;
    startAnimation();
  }

  function triggerResumeBrainSection(sectionName) {
    if (!isResumeBrain || !resumeBrainStates[sectionName]) return;

    const state = resumeBrainStates[sectionName];
    sectionRotationTarget.set(state.rotation[0], state.rotation[1]);
    if (reducedMotionQuery.matches) {
      activeSectionPatch = {
        section: sectionName,
        x: state.origin[0],
        y: state.origin[1],
        z: state.origin[2],
        color: state.color,
        lightColor: state.lightColor,
        labelOffset: state.labelOffset,
        start: clock.getElapsedTime()
      };
      renderOnce();
      window.dispatchEvent(
        new CustomEvent("resume-brain-section-ready", {
          detail: { section: sectionName }
        })
      );
      return;
    }

    activeSectionPatch = null;
    pendingSectionPatch = {
      section: sectionName,
      x: state.origin[0],
      y: state.origin[1],
      z: state.origin[2],
      color: state.color,
      lightColor: state.lightColor,
      labelOffset: state.labelOffset,
      start: clock.getElapsedTime()
    };

    if (resumeRegionTimeout) {
      window.clearTimeout(resumeRegionTimeout);
    }

    resumeRegionTimeout = window.setTimeout(() => {
      if (!pendingSectionPatch || pendingSectionPatch.section !== sectionName) return;

      activeSectionPatch = {
        ...pendingSectionPatch,
        start: clock.getElapsedTime()
      };
      pendingSectionPatch = null;
      resumeRegionTimeout = null;
      renderOnce();
      window.dispatchEvent(
        new CustomEvent("resume-brain-section-ready", {
          detail: { section: sectionName }
        })
      );
    }, resumeRegionTransitionMs);

    startAnimation();
  }

  container.addEventListener("pointerenter", (event) => {
    updatePointer(event);
    pointerInside = true;
    hoverTarget = 1;
    startAnimation();
  });

  container.addEventListener("pointermove", (event) => {
    updatePointer(event);
    pointerInside = true;
    hoverTarget = 1;
    startAnimation();
  });

  container.addEventListener("pointerleave", () => {
    pointer.set(0, 0);
    pointerInside = false;
    hoverTarget = 0;
    startAnimation();
  });

  container.addEventListener("pointerdown", triggerClickRipple);

  if (isResumeBrain) {
    window.addEventListener("resume-brain-section", (event) => {
      triggerResumeBrainSection(event.detail?.section);
    });

    window.setTimeout(() => {
      const activeSection = document.querySelector(".resume-scroll-map a.is-active[data-resume-target]");
      triggerResumeBrainSection(activeSection?.dataset.resumeTarget || "industry");
    }, 80);
  }

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
