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
// How RAHEEM answers the cursor lives in footer-wordmark.ts.

const sharedReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let sharedScrollFrame: number | null = null;
const renderSharedScrollEffects = () => {
  sharedScrollFrame = null;
  const viewportHeight = Math.max(window.innerHeight, 1);

  document.querySelectorAll<HTMLElement>(".section-label, .about-personal__eyebrow, .about-record__intro > p, .case-brief__label").forEach((accent) => {
    const bounds = accent.getBoundingClientRect();
    const parentBounds = (accent.closest("section, article") as HTMLElement | null)?.getBoundingClientRect();
    if (!parentBounds || bounds.bottom < -100 || bounds.top > viewportHeight + 100) return;
    const sectionCenter = parentBounds.top + parentBounds.height / 2;
    const offset = Math.min(Math.max((viewportHeight / 2 - sectionCenter) / viewportHeight, -1), 1) * 14;
    accent.style.setProperty("--section-parallax-y", `${offset.toFixed(2)}px`);
    accent.classList.add("section-parallax-accent");
  });
};
const requestSharedScrollEffects = () => {
  if (sharedReducedMotion.matches || sharedScrollFrame !== null) return;
  sharedScrollFrame = requestAnimationFrame(renderSharedScrollEffects);
};
if (!sharedReducedMotion.matches) {
  window.addEventListener("scroll", requestSharedScrollEffects, { passive: true });
  window.addEventListener("resize", requestSharedScrollEffects);
  requestSharedScrollEffects();
}

// Progressive biography text used by the homepage and expanded About manifesto.
const scrollWordTargets = [
  ...document.querySelectorAll<HTMLElement>("[data-scroll-words], [data-about-scroll-words]"),
];

scrollWordTargets.forEach((target) => {
  const originalText = (target.textContent ?? "").replace(/\s+/g, " ").trim();
  const scrollContainer = target.closest<HTMLElement>(
    ".home-about-reveal__scroll, .about-story-hero__scroll, .about-manifesto__scroll, .about-practice__scroll",
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

// Footer details: the wordmark rises into place as the footer arrives, and
// the base keeps Lagos time.

footerWordmarks.forEach((wordmark) => {
  const letters = [...wordmark.querySelectorAll<HTMLElement>("span")];
  letters.forEach((letter, index) => {
    letter.style.setProperty("--letter", String(index));
  });

  if (!sharedReducedMotion.matches && "IntersectionObserver" in window) {
    wordmark.classList.add("is-waiting");
    const riseObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      wordmark.classList.remove("is-waiting");
      riseObserver.disconnect();
    }, { threshold: 0.25 });
    riseObserver.observe(wordmark);
  }
});

const footerClocks = [...document.querySelectorAll<HTMLElement>(".portfolio-footer__base")].map((base) => {
  const clock = document.createElement("span");
  clock.className = "portfolio-footer__clock";
  base.append(clock);
  return clock;
});

if (footerClocks.length > 0) {
  const tellFooterTime = () => {
    const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" }).format(new Date());
    footerClocks.forEach((clock) => {
      clock.innerHTML = `<i aria-hidden="true"></i>Lagos ${time}`;
    });
  };
  tellFooterTime();
  window.setInterval(tellFooterTime, 20000);
}
