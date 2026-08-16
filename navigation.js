"use strict";
// Shared keyboard navigation for the persistent portfolio menu.
const keyboardNavigationTargets = {
    w: '.site-nav a[href*="work.html"]',
    a: '.site-nav a[href*="about.html"]',
    c: '.site-nav a[href*="#contact"]',
};
const isTypingTarget = (target) => {
    if (!(target instanceof HTMLElement))
        return false;
    return target.isContentEditable ||
        target.matches("input, textarea, select, option");
};
document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented ||
        event.repeat ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isTypingTarget(event.target)) {
        return;
    }
    const selector = keyboardNavigationTargets[event.key.toLowerCase()];
    if (!selector)
        return;
    const link = document.querySelector(selector);
    if (!link)
        return;
    event.preventDefault();
    link.click();
});
const footerReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const footerWordmarks = [...document.querySelectorAll(".portfolio-footer__wordmark")];
footerWordmarks.forEach((wordmark) => {
    const letters = [...wordmark.querySelectorAll("span")];
    if (letters.length === 0)
        return;
    letters.forEach((letter) => {
        letter.addEventListener("pointerenter", () => {
            if (footerReducedMotion.matches)
                return;
            letter.getAnimations().forEach((animation) => animation.cancel());
            const animation = letter.animate([
                { transform: "scaleY(1)" },
                { transform: "scaleY(0.24)" },
            ], {
                duration: 420,
                easing: "cubic-bezier(0.76, 0, 0.24, 1)",
                fill: "forwards",
            });
            void animation.finished.then(() => {
                letter.style.transform = "scaleY(0.24)";
                animation.cancel();
            }).catch(() => undefined);
        });
        letter.addEventListener("pointerleave", () => {
            if (footerReducedMotion.matches)
                return;
            letter.getAnimations().forEach((animation) => animation.cancel());
            const animation = letter.animate([
                { transform: "scaleY(0.24)" },
                { transform: "scaleY(1)" },
            ], {
                duration: 720,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                fill: "forwards",
            });
            void animation.finished.then(() => {
                letter.style.transform = "scaleY(1)";
                animation.cancel();
            }).catch(() => undefined);
        });
    });
});
