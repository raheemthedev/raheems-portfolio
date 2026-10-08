const aboutRail = document.querySelector<HTMLElement>(".about-media-rail");
const aboutRailTrack = aboutRail?.querySelector<HTMLElement>(".about-media-rail__track") ?? null;
const aboutReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Kayak text-split: chars start blurred/invisible, settle on reveal.
const aboutCharTargets = [
  ...document.querySelectorAll<HTMLElement>("[data-char-reveal]"),
];

aboutCharTargets.forEach((target) => {
  const originalText = target.textContent ?? "";
  target.setAttribute("aria-label", originalText.trim().replace(/\s+/g, " "));
  [...target.childNodes].forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE) return;
    const fragment = document.createDocumentFragment();
    [...(node.textContent ?? "")].forEach((ch, i) => {
      if (ch === " " || ch === "\n") {
        fragment.append(document.createTextNode(" "));
        return;
      }
      const span = document.createElement("span");
      span.className = "char";
      span.setAttribute("aria-hidden", "true");
      span.textContent = ch;
      span.style.transitionDelay = `${Math.min(i * 12, 400)}ms`;
      fragment.append(span);
    });
    node.replaceWith(fragment);
  });
});

if (aboutCharTargets.length > 0) {
  if (aboutReducedMotion.matches || !("IntersectionObserver" in window)) {
    aboutCharTargets.forEach((target) => target.classList.add("is-visible"));
  } else {
    const aboutCharObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          aboutCharObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -7%", threshold: 0.2 },
    );
    aboutCharTargets.forEach((target) => aboutCharObserver.observe(target));
  }
}

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
const worldSticky = worldSection?.querySelector<HTMLElement>(".about-world__sticky") ?? null;
const worldCards = worldCollage
  ? [...worldCollage.querySelectorAll<HTMLElement>("[data-world-card]")]
  : [];
const worldCaptions = worldCollage
  ? [...worldCollage.querySelectorAll<HTMLElement>("[data-world-caption]")]
  : [];
const worldProgressItems = [
  ...document.querySelectorAll<HTMLElement>("[data-world-progress]"),
];

if (worldSection && worldCollage && worldTitle && worldSticky && worldCards.length) {
  type WorldMetric = { width: number; height: number; x: number; y: number };
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
    const desktopWidths = [.42, .36, .45, .39, .43, .37, .41, .35, .44, .38, .42, .36];
    const desktopHeights = [.54, .47, .58, .5, .55, .46, .52, .45, .57, .49, .54, .46];
    const mobileWidths = [.65, .58, .69, .61, .66, .57, .64, .56, .68, .6, .65, .57];
    const mobileHeights = [.46, .39, .5, .42, .47, .38, .45, .38, .49, .41, .46, .38];

    metrics = worldCards.map((card, index) => {
      const width = stageWidth * (isMobile ? mobileWidths[index] ?? .56 : desktopWidths[index] ?? .32);
      const height = stageHeight * (isMobile ? mobileHeights[index] ?? .36 : desktopHeights[index] ?? .4);
      const x = stageWidth * (isMobile ? .6 : .58);
      const y = 0;

      card.style.width = `${width.toFixed(2)}px`;
      card.style.height = `${height.toFixed(2)}px`;

      const caption = worldCaptions[index];
      if (caption && !isMobile) {
        const desiredCaptionWidth = Math.min(Math.max(stageWidth * .155, 180), 270);
        const imageLeft = x - width * .5;
        const imageRight = x + width * .5;
        const placeRight = index % 2 === 0;
        const leftClearance = stageWidth * .175;
        const captionWidth = placeRight
          ? Math.min(desiredCaptionWidth, stageWidth - imageRight - 38)
          : Math.min(desiredCaptionWidth, imageLeft - leftClearance - 18);
        caption.style.width = `${captionWidth.toFixed(2)}px`;
        caption.style.left = `${(placeRight ? imageRight + 18 : imageLeft - captionWidth - 18).toFixed(2)}px`;
        caption.style.right = "auto";
        caption.style.bottom = "auto";
        caption.style.top = "0px";
        caption.style.textAlign = placeRight ? "left" : "right";
      } else if (caption) {
        caption.style.width = `${Math.min(stageWidth * .34, 180).toFixed(2)}px`;
        caption.style.left = "auto";
        caption.style.right = "14px";
        caption.style.bottom = "auto";
        caption.style.top = "0px";
        caption.style.textAlign = "right";
      }
      return { width, height, x, y };
    });
  };

  const renderWorld = () => {
    const smoothing = aboutReducedMotion.matches ? 1 : .082;
    currentProgress += (targetProgress - currentProgress) * smoothing;
    if (Math.abs(targetProgress - currentProgress) < .00008) currentProgress = targetProgress;

    const rawProgress = aboutReducedMotion.matches ? 1 : currentProgress;
    worldSticky.style.backgroundColor = "#050505";
    worldSticky.style.backgroundImage = "none";
    const titleExit = ease((rawProgress - .05) / .13);
    const trackReveal = ease((rawProgress - .12) / .11);
    const trackProgress = clamp((rawProgress - .15) / .79);
    const cardGap = stageHeight * (stageWidth <= 800 ? .085 : .11);
    const startY = stageHeight * .55;
    const cardCenters = metrics.reduce<number[]>((centers, metric, index) => {
      if (index === 0) {
        centers.push(startY);
        return centers;
      }
      const previous = metrics[index - 1];
      centers.push(centers[index - 1] + previous.height * .5 + metric.height * .5 + cardGap);
      return centers;
    }, []);
    const lastCardCenter = cardCenters[cardCenters.length - 1] ?? startY;
    const sequenceTravel = lastCardCenter - startY + stageHeight * .12;
    const sequenceOffset = trackProgress * sequenceTravel;
    const activeIndex = Math.min(worldCards.length - 1, Math.round(trackProgress * (worldCards.length - 1)));

    worldCards.forEach((card, index) => {
      const metric = metrics[index];
      if (!metric) return;
      const centerY = cardCenters[index] - sequenceOffset;
      const translateX = metric.x - metric.width * .5;
      const translateY = centerY - metric.height * .5;
      const centerDistance = Math.min(Math.abs(centerY - stageHeight * .5) / (stageHeight * .72), 1);
      const scale = .94 + (1 - centerDistance) * .06;
      const opacity = trackReveal > .2 ? 1 : 0;

      card.style.transform = `translate3d(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`;
      card.style.opacity = opacity.toFixed(3);
      card.style.zIndex = `${4 + Math.round((1 - centerDistance) * 20)}`;
      card.style.pointerEvents = opacity > .7 && centerY > 0 && centerY < stageHeight ? "auto" : "none";
    });

    worldCaptions.forEach((caption, index) => {
      const metric = metrics[index];
      if (!metric) return;
      const centerY = cardCenters[index] - sequenceOffset;
      const captionOffset = [-metric.height * .37, -42, metric.height * .22][index % 3];
      const visible = trackReveal > .2 && centerY > -metric.height && centerY < stageHeight + metric.height;
      const focusDistance = clamp(Math.abs(centerY - stageHeight * .5) / (stageHeight * .58));
      const focus = ease(1 - focusDistance);
      const captionOpacity = visible ? .18 + focus * .82 : 0;
      const captionScale = .965 + focus * .035;
      caption.style.opacity = captionOpacity.toFixed(3);
      caption.style.transform = `translate3d(0, ${(centerY + captionOffset).toFixed(2)}px, 0) scale(${captionScale.toFixed(3)})`;
      caption.style.setProperty("--caption-focus", focus.toFixed(3));
      caption.classList.toggle("is-active", index === activeIndex);
    });

    const titleOpacity = 1 - titleExit;
    worldTitle.style.opacity = titleOpacity.toFixed(3);
    worldTitle.style.transform = `translate(-50%, -50%) scale(${(1 - titleExit * .06).toFixed(3)})`;
    worldSection.style.setProperty("--world-spread", titleExit.toFixed(4));
    worldSection.style.setProperty("--world-track-progress", trackProgress.toFixed(4));
    const lineReveal = ease((rawProgress - .13) / .16);
    worldSection.style.setProperty("--world-line-opacity", lineReveal.toFixed(3));
    worldSection.style.setProperty("--world-thread-dash", `${(-trackProgress * 46).toFixed(2)}px`);
    worldSection.style.setProperty("--world-nav-progress", trackProgress.toFixed(4));
    const activeProgress = Math.min(
      worldProgressItems.length - 1,
      Math.floor(activeIndex / 3),
    );
    worldProgressItems.forEach((item, index) => {
      item.classList.toggle("is-active", index === activeProgress && trackReveal > .2);
    });

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

const aboutRevealTargets = [
  ...document.querySelectorAll<HTMLElement>("[data-about-reveal]"),
];

if (aboutRevealTargets.length > 0) {
  if (aboutReducedMotion.matches || !("IntersectionObserver" in window)) {
    aboutRevealTargets.forEach((target) => target.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10%", threshold: .12 },
    );
    aboutRevealTargets.forEach((target) => revealObserver.observe(target));
  }
}

// Section parallax: independent layers move at restrained, opposing speeds so
// each About chapter gains depth without disturbing its existing reveals or
// the archive's card sequence.
type AboutParallaxLayer = {
  element: HTMLElement;
  range: number;
  current: number;
  target: number;
};

const aboutParallaxConfig: Array<[string, number]> = [
  [".about-story-hero__label", -16],
  [".about-story-hero__base", 14],
  [".about-personal__eyebrow", -18],
  [".about-personal h2", 34],
  [".about-personal__notes", -26],
  [".about-world__label", -12],
  [".about-world__note", 12],
  [".about-world__progress", -10],
  [".about-record__intro", 30],
  [".about-record__group:nth-of-type(2)", -24],
  [".about-record__group:nth-of-type(3)", 28],
];

const aboutParallaxLayers: AboutParallaxLayer[] = aboutParallaxConfig.flatMap(([selector, range]) =>
  [...document.querySelectorAll<HTMLElement>(selector)].map((element) => ({
    element,
    range,
    current: 0,
    target: 0,
  })),
);

if (aboutParallaxLayers.length > 0) {
  let parallaxFrame: number | null = null;
  let parallaxInitialized = false;

  aboutParallaxLayers.forEach(({ element }) => element.classList.add("about-parallax-layer"));

  const readAboutParallax = () => {
    const viewportHeight = Math.max(window.innerHeight, 1);
    const mobileFactor = window.innerWidth <= 800 ? .55 : 1;

    aboutParallaxLayers.forEach((layer) => {
      const section = layer.element.closest<HTMLElement>("section");
      if (!section) return;
      const bounds = section.getBoundingClientRect();
      const denominator = Math.max((viewportHeight + bounds.height) * .5, 1);
      const sectionCenter = bounds.top + bounds.height * .5;
      const progress = Math.min(Math.max((viewportHeight * .5 - sectionCenter) / denominator, -1), 1);
      layer.target = aboutReducedMotion.matches ? 0 : progress * layer.range * mobileFactor;
      if (!parallaxInitialized) layer.current = layer.target;
    });
    parallaxInitialized = true;
  };

  const renderAboutParallax = () => {
    parallaxFrame = null;
    let unsettled = false;

    aboutParallaxLayers.forEach((layer) => {
      layer.current += (layer.target - layer.current) * .14;
      if (Math.abs(layer.target - layer.current) > .04) unsettled = true;
      else layer.current = layer.target;
      layer.element.style.setProperty("--about-parallax-y", `${layer.current.toFixed(2)}px`);
    });

    if (unsettled) parallaxFrame = requestAnimationFrame(renderAboutParallax);
  };

  const requestAboutParallax = () => {
    readAboutParallax();
    if (parallaxFrame === null) parallaxFrame = requestAnimationFrame(renderAboutParallax);
  };

  window.addEventListener("scroll", requestAboutParallax, { passive: true });
  window.addEventListener("resize", requestAboutParallax);
  aboutReducedMotion.addEventListener("change", requestAboutParallax);
  requestAboutParallax();
}
