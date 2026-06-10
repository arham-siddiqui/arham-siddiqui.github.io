const themeToggle = document.querySelector(".theme-toggle");
const root = document.documentElement;

function setTheme(isDark) {
  root.classList.toggle("dark", isDark);
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
  themeToggle.setAttribute("title", `Switch to ${isDark ? "light" : "dark"} mode`);
}

setTheme(root.classList.contains("dark"));

themeToggle.addEventListener("click", () => {
  setTheme(!root.classList.contains("dark"));
});

const navLinks = [...document.querySelectorAll(".topline a[href^='#']")];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

function setActiveSection(sectionId) {
  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${sectionId}`);
  });
}

if ("IntersectionObserver" in window && sections.length) {
  const visibleSections = new Map();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleSections.set(entry.target.id, entry.intersectionRatio);
        } else {
          visibleSections.delete(entry.target.id);
        }
      });

      const active = [...visibleSections.entries()].sort((a, b) => b[1] - a[1])[0];
      if (active) setActiveSection(active[0]);
    },
    {
      rootMargin: "-18% 0px -58% 0px",
      threshold: [0.08, 0.2, 0.4, 0.6]
    }
  );

  sections.forEach((section) => observer.observe(section));
} else {
  window.addEventListener("scroll", () => {
    const active = sections
      .map((section) => ({
        id: section.id,
        distance: Math.abs(section.getBoundingClientRect().top - 120)
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    if (active) setActiveSection(active.id);
  });
}

setActiveSection(sections[0]?.id || "experience");

const brainCanvas = document.getElementById("brain-canvas");

if (brainCanvas) {
  const context = brainCanvas.getContext("2d");
  const pointer = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    screenX: 0,
    screenY: 0,
    inside: false
  };
  const rawPoints = Array.isArray(window.BRAIN_POINTS) ? window.BRAIN_POINTS : [];
  const points = [];
  let width = 1;
  let height = 1;
  let pixelRatio = 1;
  let time = 0;
  let idleYaw = 0;
  let idleBlend = 1;
  let currentYaw = 0;
  let currentPitch = 0;
  let animationFrame = null;
  const neuronTargets = [
    { x: -0.42, y: -0.16, z: 0.08 },
    { x: -0.18, y: 0.28, z: -0.2 },
    { x: 0.1, y: -0.04, z: 0.24 },
    { x: 0.32, y: 0.2, z: -0.08 },
    { x: 0.48, y: -0.22, z: 0.14 }
  ];

  for (let index = 0; index < rawPoints.length; index += 3) {
    points.push({
      x: rawPoints[index],
      y: rawPoints[index + 1],
      z: rawPoints[index + 2],
      dx: 0,
      dy: 0,
      vx: 0,
      vy: 0,
      glowPhase: 0,
      glowSpeed: 0,
      glowStrength: 0,
      isNeuron: false,
      burstSeed: 0,
      burstSize: 1,
      burstDuration: 1
    });
  }

  for (const [targetIndex, target] of neuronTargets.entries()) {
    let closestPoint = null;
    let closestDistance = Infinity;

    for (const point of points) {
      if (point.glowStrength) continue;

      const distance =
        (point.x - target.x) ** 2 +
        (point.y - target.y) ** 2 +
        (point.z - target.z) ** 2;

      if (distance < closestDistance) {
        closestDistance = distance;
        closestPoint = point;
      }
    }

    if (closestPoint) {
      closestPoint.glowPhase = targetIndex * 1.28;
      closestPoint.glowSpeed = 5.8 + targetIndex * 0.95;
      closestPoint.glowStrength = 1.85 + (targetIndex % 3) * 0.18;
      closestPoint.isNeuron = true;
      closestPoint.burstSeed = targetIndex * 17.31;
      closestPoint.burstSize = 0.72 + (targetIndex % 4) * 0.12;
      closestPoint.burstDuration = 5 + (targetIndex % 3) * 1.15;
    }
  }

  function resizeBrain() {
    const rect = brainCanvas.getBoundingClientRect();
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    brainCanvas.width = Math.round(width * pixelRatio);
    brainCanvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function drawFallbackBrain(color) {
    const scale = Math.min(width, height) * 0.52;
    const centerX = width / 2;
    const centerY = height / 2;

    context.save();
    context.translate(centerX, centerY);
    context.scale(scale, scale);
    context.strokeStyle = `${color} 0.55)`;
    context.lineWidth = 1.8 / scale;
    context.beginPath();
    context.moveTo(-0.08, -0.76);
    context.bezierCurveTo(-0.36, -0.88, -0.78, -0.66, -0.78, -0.24);
    context.bezierCurveTo(-0.96, -0.02, -0.9, 0.38, -0.54, 0.48);
    context.bezierCurveTo(-0.36, 0.74, -0.06, 0.72, 0, 0.48);
    context.bezierCurveTo(0.08, 0.72, 0.38, 0.74, 0.56, 0.48);
    context.bezierCurveTo(0.9, 0.38, 0.96, -0.02, 0.78, -0.24);
    context.bezierCurveTo(0.78, -0.66, 0.36, -0.88, 0.08, -0.76);
    context.bezierCurveTo(0.03, -0.58, -0.03, -0.58, -0.08, -0.76);
    context.stroke();
    context.restore();
  }

  function drawJaggedBurst(x, y, radius, seed, pulse, fillColor, strokeColor) {
    const spikes = 13;
    const wobble = time * 9 + seed;

    context.beginPath();
    for (let index = 0; index < spikes; index += 1) {
      const angle = (Math.PI * 2 * index) / spikes + Math.sin(seed) * 0.18;
      const jag =
        0.72 +
        Math.sin(wobble + index * 1.9) * 0.16 +
        Math.sin(seed + index * 4.7) * 0.18;
      const pointRadius = radius * (index % 2 ? 0.48 + pulse * 0.12 : jag);
      const pointX = x + Math.cos(angle) * pointRadius;
      const pointY = y + Math.sin(angle) * pointRadius;

      if (index === 0) {
        context.moveTo(pointX, pointY);
      } else {
        context.lineTo(pointX, pointY);
      }
    }
    context.closePath();
    context.fillStyle = fillColor;
    context.fill();
    context.strokeStyle = strokeColor;
    context.lineWidth = 0.9;
    context.stroke();

    for (let index = 0; index < 5; index += 1) {
      const angle = seed + time * 3 + index * 1.26;
      const start = radius * 0.28;
      const end = radius * (0.75 + Math.sin(wobble + index) * 0.16);

      context.beginPath();
      context.moveTo(x + Math.cos(angle) * start, y + Math.sin(angle) * start);
      context.lineTo(x + Math.cos(angle) * end, y + Math.sin(angle) * end);
      context.stroke();
    }
  }

  function drawBrain() {
    time += 0.01;
    const pointerFollow = pointer.inside ? 1 : 0.075;
    const rotationFollow = pointer.inside ? 0.8 : 0.13;

    pointer.x += (pointer.targetX - pointer.x) * pointerFollow;
    pointer.y += (pointer.targetY - pointer.y) * pointerFollow;
    idleBlend += ((pointer.inside ? 0 : 1) - idleBlend) * 0.04;

    if (pointer.inside) {
      idleYaw = currentYaw;
    } else {
      idleYaw += 0.0035;
    }

    context.clearRect(0, 0, width, height);

    const isDark = root.classList.contains("dark");
    const color = isDark ? "rgba(234, 243, 255," : "rgba(6, 59, 122,";
    const neuronGlowColor = isDark ? "rgba(35, 94, 165," : "rgba(42, 112, 226,";
    const neuronCoreColor = isDark ? "rgba(128, 184, 255," : "rgba(245, 250, 255,";

    if (!points.length) {
      drawFallbackBrain(color);
      animationFrame = window.requestAnimationFrame(drawBrain);
      return;
    }

    const scale = Math.min(width, height) * 0.56;
    const driftYaw = Math.sin(time * 0.22) * 0.16;
    const cursorYaw = driftYaw + pointer.x * 0.76;
    const spinYaw = driftYaw + idleYaw;
    const targetYaw = cursorYaw * (1 - idleBlend) + spinYaw * idleBlend;
    const targetPitch = -pointer.y * 0.46;
    currentYaw += (targetYaw - currentYaw) * rotationFollow;
    currentPitch += (targetPitch - currentPitch) * rotationFollow;
    const yaw = currentYaw;
    const pitch = currentPitch;
    const sinYaw = Math.sin(yaw);
    const cosYaw = Math.cos(yaw);
    const sinPitch = Math.sin(pitch);
    const cosPitch = Math.cos(pitch);
    const projected = [];

    for (const point of points) {
      const x1 = point.x * cosYaw - point.z * sinYaw;
      const z1 = point.x * sinYaw + point.z * cosYaw;
      const y1 = point.y * cosPitch - z1 * sinPitch;
      const z2 = point.y * sinPitch + z1 * cosPitch;
      const depth = 1 / (1 + (z2 + 1.7) * 0.13);

      const baseX = width / 2 + x1 * scale * depth;
      const baseY = height / 2 + y1 * scale * depth;

      if (pointer.inside) {
        const cursorDx = baseX + point.dx - pointer.screenX;
        const cursorDy = baseY + point.dy - pointer.screenY;
        const distance = Math.hypot(cursorDx, cursorDy);
        const radius = Math.min(width, height) * 0.12;

        if (distance < radius && distance > 0.001) {
          const force = ((radius - distance) / radius) ** 2;
          point.vx += (cursorDx / distance) * force * 0.95;
          point.vy += (cursorDy / distance) * force * 0.95;
        }
      }

      point.vx += -point.dx * 0.035;
      point.vy += -point.dy * 0.035;
      point.vx *= 0.84;
      point.vy *= 0.84;
      point.dx += point.vx;
      point.dy += point.vy;

      const pulse = point.glowStrength
        ? ((Math.sin(time * point.glowSpeed + point.glowPhase) + 1) / 2) ** point.burstDuration *
          point.glowStrength
        : 0;

      projected.push({
        x: baseX + point.dx,
        y: baseY + point.dy,
        depth,
        pulse,
        isNeuron: point.isNeuron,
        burstSeed: point.burstSeed,
        burstSize: point.burstSize,
        alpha: Math.max(0.24, Math.min(1, 0.4 + depth * 0.38 + pulse * 0.55))
      });
    }

    projected.sort((a, b) => a.depth - b.depth);

    context.save();
    context.globalCompositeOperation = "lighter";
    for (const point of projected) {
      if (!point.isNeuron || point.pulse < 0.1) continue;

      const halo = (5.2 + point.depth * 3 + point.pulse * 4.8) * point.burstSize;
      const gradient = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, halo);
      gradient.addColorStop(0, `${neuronCoreColor} ${Math.min(0.95, point.pulse * 0.52)})`);
      gradient.addColorStop(0.26, `${neuronGlowColor} ${Math.min(0.42, point.pulse * 0.24)})`);
      gradient.addColorStop(1, `${neuronGlowColor} 0)`);
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(point.x, point.y, halo, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();

    for (const point of projected) {
      context.fillStyle = `${color} ${point.alpha})`;
      context.beginPath();
      context.arc(point.x, point.y, 0.45 + point.depth * 0.62 + point.pulse * 0.65, 0, Math.PI * 2);
      context.fill();
    }

    context.save();
    context.globalCompositeOperation = "lighter";
    for (const point of projected) {
      if (!point.isNeuron || point.pulse < 0.16) continue;

      context.fillStyle = `${neuronCoreColor} ${Math.min(1, 0.46 + point.pulse * 0.32)})`;
      context.beginPath();
      context.arc(point.x, point.y, (1.2 + point.pulse * 1.35) * point.burstSize, 0, Math.PI * 2);
      context.fill();

      drawJaggedBurst(
        point.x,
        point.y,
        (3.2 + point.pulse * 2) * point.burstSize,
        point.burstSeed,
        point.pulse,
        `${neuronCoreColor} ${Math.min(0.62, point.pulse * 0.26)})`,
        `${neuronGlowColor} ${Math.min(0.9, point.pulse * 0.34)})`
      );
    }
    context.restore();

    animationFrame = window.requestAnimationFrame(drawBrain);
  }

  brainCanvas.addEventListener("pointermove", (event) => {
    const rect = brainCanvas.getBoundingClientRect();
    pointer.targetX = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    pointer.targetY = -(((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1);
    pointer.screenX = event.clientX - rect.left;
    pointer.screenY = event.clientY - rect.top;
    pointer.inside = true;
  });

  brainCanvas.addEventListener("pointerleave", () => {
    pointer.targetX = 0;
    pointer.targetY = 0;
    pointer.inside = false;
  });

  window.addEventListener("resize", resizeBrain);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    } else if (!animationFrame) {
      drawBrain();
    }
  });

  resizeBrain();
  drawBrain();
}
