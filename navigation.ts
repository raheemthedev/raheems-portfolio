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
  const scrollContainer = target.closest<HTMLElement>(
    ".home-about-reveal__scroll, .about-manifesto__scroll, .about-practice__scroll",
  );

  if (!scrollContainer || originalText.length === 0) return;

  target.setAttribute("aria-label", originalText);

  // Split text nodes into identical .scroll-word spans while preserving
  // phrase lines and [data-img-anchor] wrappers (with their image cards)
  // in place, so the rendered text is unchanged.
  const makeWord = (word: string) => {
    const span = document.createElement("span");
    span.className = "scroll-word";
    span.setAttribute("aria-hidden", "true");
    span.textContent = word;
    return span;
  };
  const splitChildren = (parent: Element) => {
    const nodes = [...parent.childNodes];
    if (parent instanceof HTMLElement) parent.innerHTML = "";
    nodes.forEach((node) => {
      if (node instanceof HTMLElement && node.hasAttribute("data-img-anchor")) {
        const card = node.querySelector(".img-card");
        const anchorWord = (node.textContent ?? "").replace(/\s+/g, " ").trim();
        node.innerHTML = "";
        node.append(makeWord(anchorWord));
        if (card) node.append(card);
        parent.append(node, document.createTextNode(" "));
        return;
      }

      if (node instanceof HTMLElement) {
        splitChildren(node);
        parent.append(node, document.createTextNode(" "));
        return;
      }

      const words = (node.textContent ?? "").replace(/\s+/g, " ").split(" ").filter(Boolean);
      words.forEach((word) => {
        parent.append(makeWord(word), document.createTextNode(" "));
      });
    });
  };

  splitChildren(target);

  const wordElements = [...target.querySelectorAll<HTMLElement>(".scroll-word")];
  if (wordElements.length === 0) return;

  // Anchor words that own image cards, in reading order. Cards open as the
  // scrub reaches their word and vanish once scroll moves past the text.
  const anchorCards = [...target.querySelectorAll<HTMLElement>("[data-img-anchor]")]
    .map((anchor) => ({
      anchor,
      wordIndex: wordElements.indexOf(
        anchor.querySelector<HTMLElement>(".scroll-word") as HTMLElement,
      ),
    }))
    .filter((entry) => entry.wordIndex >= 0);
  // Phrase steps for the discrete snap: each step owns the words around
  // one anchor, split at midpoints between consecutive anchors.
  const stepBounds = anchorCards.map((entry, step) => {
    const start = step === 0
      ? 0
      : Math.round((anchorCards[step - 1].wordIndex + entry.wordIndex) / 2);
    const end = step === anchorCards.length - 1
      ? wordElements.length
      : Math.round((entry.wordIndex + anchorCards[step + 1].wordIndex) / 2);
    return { start, end };
  });
  const hasSnapSteps = anchorCards.length > 0;
  if (hasSnapSteps) target.classList.add("has-spotlight");
  let openCard = -1;
  let frame: number | null = null;

  const renderWords = () => {
    frame = null;

    if (footerReducedMotion.matches) {
      wordElements.forEach((word) => { word.style.opacity = "1"; });
      anchorCards.forEach(({ anchor }) => anchor.classList.remove("is-open"));
      openCard = -1;
      return;
    }

    const bounds = scrollContainer.getBoundingClientRect();
    const scrollDistance = Math.max(scrollContainer.offsetHeight - window.innerHeight, 1);
    const progress = Math.min(Math.max(-bounds.top / scrollDistance, 0), 1);
    const leadingEdge = progress * (wordElements.length + 7);
    const pastManifesto = bounds.bottom <= window.innerHeight / 2;

    if (!hasSnapSteps) {
      wordElements.forEach((word, index) => {
        const reveal = Math.min(Math.max((leadingEdge - index) / 6, 0), 1);
        word.style.opacity = (0.16 + reveal * 0.84).toFixed(3);
      });
      return;
    }

    // Discrete phrase snap: one step lit with its card, the rest dim.
    let step = -1;
    if (!pastManifesto && progress > 0) {
      step = Math.min(anchorCards.length - 1, Math.floor(progress * anchorCards.length));
    }

    wordElements.forEach((word, index) => {
      const lit = step >= 0 &&
        index >= stepBounds[step].start &&
        index < stepBounds[step].end;
      word.style.opacity = lit ? "1" : "0.16";
    });

    if (step !== openCard) {
      openCard = step;
      anchorCards.forEach((entry, index) => {
        entry.anchor.classList.toggle("is-open", index === openCard);
      });
    }
  };

  const requestRender = () => {
    if (frame === null) frame = requestAnimationFrame(renderWords);
  };

  window.addEventListener("scroll", requestRender, { passive: true });
  window.addEventListener("resize", requestRender);
  footerReducedMotion.addEventListener("change", requestRender);
  requestRender();
});
