const aboutRail = document.querySelector<HTMLElement>(".about-media-rail");
const aboutRailTrack = aboutRail?.querySelector<HTMLElement>(".about-media-rail__track") ?? null;
const aboutReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (aboutRail && aboutRailTrack) {
  const sourceFrames = [...aboutRailTrack.children];
  sourceFrames.forEach((frame) => {
    const clone = frame.cloneNode(true) as HTMLElement;
    clone.setAttribute("aria-hidden", "true");
    clone.removeAttribute("aria-label");
    aboutRailTrack.append(clone);
  });

  const aboutFrames = [...aboutRailTrack.querySelectorAll<HTMLElement>(".about-media-frame")];

  let offset = 0;
  let velocity = 0;
  let loopWidth = 1;
  let railWidth = 1;
  let frameCenters: number[] = [];
  let previousTime = performance.now();
  let isDragging = false;
  let previousPointerX = 0;
  let previousPointerTime = 0;
  let pointerVelocity = 0;

  const wrap = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;
  const clampValue = (value: number, minimum: number, maximum: number) =>
    Math.min(Math.max(value, minimum), maximum);

  const measure = () => {
    const firstFrame = aboutFrames[0];
    const repeatedFrame = aboutFrames[sourceFrames.length];
    loopWidth = firstFrame && repeatedFrame
      ? Math.max(repeatedFrame.offsetLeft - firstFrame.offsetLeft, 1)
      : Math.max(aboutRailTrack.scrollWidth / 2, 1);
    railWidth = Math.max(aboutRail.clientWidth, 1);
    frameCenters = aboutFrames.map((frame) => frame.offsetLeft + frame.offsetWidth / 2);
  };

  const render = (timestamp: number) => {
    const deltaTime = clampValue(timestamp - previousTime || 16.67, 4, 34);
    previousTime = timestamp;

    if (!isDragging && !aboutReducedMotion.matches) {
      offset += (velocity + 0.025) * deltaTime;
      velocity *= Math.pow(0.94, deltaTime / 16.67);
      if (Math.abs(velocity) < 0.002) velocity = 0;
    }

    offset = wrap(offset, loopWidth);
    aboutRailTrack.style.transform = `translate3d(${-offset}px, 0, 0)`;

    const focalCenter = railWidth / 2;
    const influenceRadius = Math.max(railWidth * 0.62, 1);

    aboutFrames.forEach((frame, index) => {
      const visibleCenter = frameCenters[index] - offset;
      const distance = clampValue(Math.abs(visibleCenter - focalCenter) / influenceRadius, 0, 1);
      const proximity = Math.pow(1 - distance, 1.4);
      const targetHeight = 0.86 + proximity * 0.12;
      const inset = (1 - targetHeight) * 50;
      frame.style.setProperty("--about-frame-inset", `${inset.toFixed(3)}%`);
    });

    requestAnimationFrame(render);
  };

  aboutRail.addEventListener("wheel", (event) => {
    if (aboutReducedMotion.matches) return;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    velocity = clampValue(velocity + delta * 0.0028, -1.5, 1.5);
  }, { passive: true });

  aboutRailTrack.addEventListener("pointerdown", (event) => {
    isDragging = true;
    previousPointerX = event.clientX;
    previousPointerTime = performance.now();
    pointerVelocity = 0;
    aboutRailTrack.setPointerCapture(event.pointerId);
  });

  aboutRailTrack.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    const now = performance.now();
    const elapsed = Math.max(now - previousPointerTime, 1);
    const delta = previousPointerX - event.clientX;
    offset += delta;
    pointerVelocity = delta / elapsed;
    previousPointerX = event.clientX;
    previousPointerTime = now;
  });

  const finishDrag = (event: PointerEvent) => {
    if (!isDragging) return;
    isDragging = false;
    velocity = aboutReducedMotion.matches
      ? 0
      : clampValue(pointerVelocity * 0.94, -2.4, 2.4);
    if (aboutRailTrack.hasPointerCapture(event.pointerId)) {
      aboutRailTrack.releasePointerCapture(event.pointerId);
    }
  };

  aboutRailTrack.addEventListener("pointerup", finishDrag);
  aboutRailTrack.addEventListener("pointercancel", finishDrag);
  aboutRailTrack.addEventListener("dragstart", (event) => event.preventDefault());
  window.addEventListener("resize", measure);

  aboutReducedMotion.addEventListener("change", () => {
    velocity = 0;
  });

  measure();
  requestAnimationFrame(render);
}

const worldSection = document.querySelector<HTMLElement>("[data-world-section]");
const worldCollage = document.querySelector<HTMLElement>("[data-world-collage]");
const worldTitle = document.querySelector<HTMLElement>("[data-world-title]");
const worldCards = worldCollage
  ? [...worldCollage.querySelectorAll<HTMLElement>("[data-world-card]")]
  : [];

if (worldSection && worldCollage && worldTitle && worldCards.length) {
  type WorldRect = { x: number; y: number; w: number; h: number };

  const desktopOpen: WorldRect[] = [
    { x: .26, y: .25, w: .24, h: .27 },
    { x: .46, y: .19, w: .19, h: .25 },
    { x: .73, y: .27, w: .23, h: .28 },
    { x: .25, y: .73, w: .25, h: .32 },
    { x: .50, y: .80, w: .18, h: .23 },
    { x: .74, y: .72, w: .22, h: .30 },
  ];

  const mobileOpen: WorldRect[] = [
    { x: .29, y: .26, w: .46, h: .25 },
    { x: .68, y: .19, w: .34, h: .22 },
    { x: .73, y: .43, w: .42, h: .25 },
    { x: .28, y: .67, w: .45, h: .29 },
    { x: .65, y: .78, w: .34, h: .21 },
    { x: .28, y: .87, w: .38, h: .20 },
  ];

  type WorldMetric = WorldRect & { width: number; height: number; stackScale: number; offset: number };

  let frame: number | null = null;
  let targetProgress = 0;
  let currentProgress = 0;
  let initialized = false;
  let stageWidth = 1;
  let stageHeight = 1;
  let metrics: WorldMetric[] = [];
  const clamp = (value: number, minimum = 0, maximum = 1) =>
    Math.min(Math.max(value, minimum), maximum);
  const ease = (value: number) => {
    const t = clamp(value);
    return t * t * (3 - 2 * t);
  };

  const readProgress = () => {
    const bounds = worldSection.getBoundingClientRect();
    const travel = Math.max(worldSection.offsetHeight - window.innerHeight, 1);
    targetProgress = clamp(-bounds.top / travel);
    if (!initialized) {
      currentProgress = targetProgress;
      initialized = true;
    }
  };

  const measureWorld = () => {
    stageWidth = Math.max(worldCollage.clientWidth, 1);
    stageHeight = Math.max(worldCollage.clientHeight, 1);
    const isMobile = stageWidth <= 800;
    const targets = isMobile ? mobileOpen : desktopOpen;
    const stackWidth = Math.min(Math.max(stageWidth * (isMobile ? .62 : .31), 260), 500);
    const stackHeight = stackWidth * (isMobile ? .78 : .68);

    metrics = worldCards.map((card, index) => {
      const target = targets[index] ?? targets[targets.length - 1];
      const width = stageWidth * target.w;
      const height = stageHeight * target.h;
      const stackScale = Math.min(stackWidth / width, stackHeight / height) * (1 - index * .012);
      const offset = (index - (worldCards.length - 1) / 2) * (isMobile ? 2.2 : 3.2);

      card.style.width = `${width.toFixed(2)}px`;
      card.style.height = `${height.toFixed(2)}px`;
      return { ...target, width, height, stackScale, offset };
    });
  };

  const renderWorld = () => {
    const smoothing = aboutReducedMotion.matches ? 1 : .095;
    currentProgress += (targetProgress - currentProgress) * smoothing;
    if (Math.abs(targetProgress - currentProgress) < .00008) currentProgress = targetProgress;

    const rawProgress = currentProgress;
    const spread = aboutReducedMotion.matches ? 1 : ease((rawProgress - .07) / .63);
    const exit = aboutReducedMotion.matches ? 0 : ease((rawProgress - .84) / .16);

    worldCards.forEach((card, index) => {
      const metric = metrics[index];
      if (!metric) return;
      const startX = stageWidth * .5 + metric.offset;
      const startY = stageHeight * .5 + metric.offset * .6;
      const endX = stageWidth * metric.x;
      const endY = stageHeight * metric.y - exit * stageHeight * (.16 + index * .028);
      const x = startX + (endX - startX) * spread;
      const y = startY + (endY - startY) * spread;
      const scale = metric.stackScale + (1 - metric.stackScale) * spread;
      const translateX = x - metric.width * scale * .5;
      const translateY = y - metric.height * scale * .5;

      card.style.transform = `translate3d(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      card.style.opacity = `${(1 - exit * .35).toFixed(3)}`;
      card.style.zIndex = `${index === 0 ? 12 : 11 - index}`;
    });

    const titleOpacity = spread * (1 - exit);
    worldTitle.style.opacity = titleOpacity.toFixed(3);
    worldTitle.style.transform = `translate(-50%, -50%) scale(${(.9 + spread * .1).toFixed(3)})`;
    worldSection.style.setProperty("--world-spread", spread.toFixed(4));

    if (Math.abs(targetProgress - currentProgress) > .00008) {
      frame = requestAnimationFrame(renderWorld);
    } else {
      frame = null;
    }
  };

  const requestWorldRender = () => {
    readProgress();
    if (frame === null) frame = requestAnimationFrame(renderWorld);
  };

  window.addEventListener("scroll", requestWorldRender, { passive: true });
  window.addEventListener("resize", () => {
    measureWorld();
    requestWorldRender();
  });
  aboutReducedMotion.addEventListener("change", requestWorldRender);
  measureWorld();
  requestWorldRender();
}
