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
