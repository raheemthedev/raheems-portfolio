// Shared keyboard navigation for the persistent portfolio menu.
const keyboardNavigationTargets: Record<string, string> = {
  w: '.site-nav a[href*="work.html"]',
  a: '.site-nav a[href*="about.html"]',
  c: '.site-nav a[href*="#contact"]',
};

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  return target.isContentEditable ||
    target.matches("input, textarea, select, option");
};

document.addEventListener("keydown", (event) => {
  if (
    event.defaultPrevented ||
    event.repeat ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    isTypingTarget(event.target)
  ) {
    return;
  }

  const selector = keyboardNavigationTargets[event.key.toLowerCase()];
  if (!selector) return;

  const link = document.querySelector<HTMLAnchorElement>(selector);
  if (!link) return;

  event.preventDefault();
  link.click();
});

const footerReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const footerWordmarks = [...document.querySelectorAll<HTMLElement>(".portfolio-footer__wordmark")];
const footerMeasureCanvas = document.createElement("canvas");
const footerMeasureContext = footerMeasureCanvas.getContext("2d");

footerWordmarks.forEach((wordmark) => {
  const letters = [...wordmark.querySelectorAll<HTMLElement>("span")];
  if (letters.length === 0) return;

  const measureGlyphFloors = () => {
    if (!footerMeasureContext) return;

    letters.forEach((letter) => {
      const styles = getComputedStyle(letter);
      const lineHeight = Number.parseFloat(styles.lineHeight);
      footerMeasureContext.font = `${styles.fontStyle} ${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
      const metrics = footerMeasureContext.measureText(letter.textContent ?? "");
      const ascent = metrics.fontBoundingBoxAscent || metrics.actualBoundingBoxAscent;
      const descent = metrics.fontBoundingBoxDescent || metrics.actualBoundingBoxDescent;
      const leading = lineHeight - ascent - descent;
      const glyphFloor = leading / 2 + ascent + metrics.actualBoundingBoxDescent;
      letter.style.setProperty("--footer-glyph-floor", `${glyphFloor.toFixed(2)}px`);
    });
  };

  measureGlyphFloors();
  document.fonts.ready.then(measureGlyphFloors).catch(() => undefined);
  window.addEventListener("resize", measureGlyphFloors);

  const currentScales = letters.map(() => 1);
  const targetScales = letters.map(() => 1);
  let animationFrame: number | null = null;

  const renderWave = () => {
    animationFrame = null;
    let isSettled = true;

    letters.forEach((letter, index) => {
      const difference = targetScales[index] - currentScales[index];
      currentScales[index] += difference * 0.2;
      if (Math.abs(difference) > 0.002) isSettled = false;
      letter.style.setProperty("--footer-letter-scale", currentScales[index].toFixed(4));
    });

    if (!isSettled) animationFrame = requestAnimationFrame(renderWave);
  };

  const requestWaveRender = () => {
    if (animationFrame === null) animationFrame = requestAnimationFrame(renderWave);
  };

  const resetWave = () => {
    targetScales.fill(1);
    requestWaveRender();
  };

  wordmark.addEventListener("pointermove", (event) => {
    if (footerReducedMotion.matches) return;

    const letterCenters = letters.map((letter) => {
      const bounds = letter.getBoundingClientRect();
      return bounds.left + bounds.width / 2;
    });
    const influenceWidth = letterCenters.length > 1
      ? (letterCenters[letterCenters.length - 1] - letterCenters[0]) / (letterCenters.length - 1)
      : wordmark.getBoundingClientRect().width;

    letters.forEach((_letter, index) => {
      const distance = Math.abs(event.clientX - letterCenters[index]);
      const normalizedDistance = distance / Math.max(influenceWidth, 1);
      const influence = Math.exp(-0.5 * Math.pow(normalizedDistance / 0.58, 2));
      targetScales[index] = 1 - influence * 0.58;
    });

    requestWaveRender();
  });

  wordmark.addEventListener("pointerleave", resetWave);
  footerReducedMotion.addEventListener("change", resetWave);
});

// Progressive biography text used by the homepage and expanded About manifesto.
const scrollWordTargets = [
  ...document.querySelectorAll<HTMLElement>("[data-scroll-words], [data-about-scroll-words]"),
];

scrollWordTargets.forEach((target) => {
  const originalText = (target.textContent ?? "").replace(/\s+/g, " ").trim();
  const words = originalText.split(" ").filter(Boolean);
  const scrollContainer = target.closest<HTMLElement>(
    ".home-about-reveal__scroll, .about-manifesto__scroll, .about-practice__scroll",
  );

  if (!scrollContainer || words.length === 0) return;

  target.setAttribute("aria-label", originalText);
  target.innerHTML = words
    .map((word) => `<span class="scroll-word" aria-hidden="true">${word}</span>`)
    .join(" ");

  const wordElements = [...target.querySelectorAll<HTMLElement>(".scroll-word")];
  let frame: number | null = null;

  const renderWords = () => {
    frame = null;

    if (footerReducedMotion.matches) {
      wordElements.forEach((word) => { word.style.opacity = "1"; });
      return;
    }

    const bounds = scrollContainer.getBoundingClientRect();
    const scrollDistance = Math.max(scrollContainer.offsetHeight - window.innerHeight, 1);
    const progress = Math.min(Math.max(-bounds.top / scrollDistance, 0), 1);
    const leadingEdge = progress * (wordElements.length + 7);

    wordElements.forEach((word, index) => {
      const reveal = Math.min(Math.max((leadingEdge - index) / 6, 0), 1);
      word.style.opacity = (0.16 + reveal * 0.84).toFixed(3);
    });
  };

  const requestRender = () => {
    if (frame === null) frame = requestAnimationFrame(renderWords);
  };

  window.addEventListener("scroll", requestRender, { passive: true });
  window.addEventListener("resize", requestRender);
  footerReducedMotion.addEventListener("change", requestRender);
  requestRender();
});
