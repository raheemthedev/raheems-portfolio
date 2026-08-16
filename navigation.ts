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

footerWordmarks.forEach((wordmark) => {
  const letters = [...wordmark.querySelectorAll<HTMLElement>("span")];
  if (letters.length === 0) return;

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
