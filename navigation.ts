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

const footerWordmarks = [...document.querySelectorAll<HTMLElement>(".portfolio-footer__wordmark")];
const footerReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

footerWordmarks.forEach((wordmark) => {
  const letters = [...wordmark.querySelectorAll<HTMLElement>("span")];
  if (letters.length === 0) return;

  const reveal = () => {
    letters.forEach((letter, index) => {
      const animation = letter.animate(
        [
          { transform: "translateY(120%)" },
          { transform: "translateY(0)" },
        ],
        {
          duration: 1050,
          delay: 120 + index * 42,
          easing: "cubic-bezier(0.76, 0, 0.24, 1)",
          fill: "forwards",
        },
      );

      void animation.finished.then(() => {
        letter.style.transform = "translateY(0)";
        animation.cancel();
      }).catch(() => undefined);
    });
  };

  if (!footerReducedMotion.matches && "IntersectionObserver" in window) {
    letters.forEach((letter) => {
      letter.style.transform = "translateY(120%)";
    });
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        reveal();
      },
      { threshold: 0.18 },
    );
    observer.observe(wordmark);
  }

  letters.forEach((letter) => {
    letter.addEventListener("pointerenter", () => {
      if (footerReducedMotion.matches) return;
      letter.getAnimations().forEach((animation) => animation.cancel());
      letter.animate(
        [
          { transform: "scale(1)", offset: 0 },
          { transform: "scale(0.05)", offset: 0.3 },
          { transform: "scale(1.16)", offset: 0.58 },
          { transform: "scale(0.92)", offset: 0.74 },
          { transform: "scale(1.05)", offset: 0.88 },
          { transform: "scale(1)", offset: 1 },
        ],
        {
          duration: 1900,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        },
      );
    });
  });
});
