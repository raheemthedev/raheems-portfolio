// How the footer's RAHEEM answers the cursor, compared with the picker in the
// footer or ?footer=classic|dock (the last choice is remembered):
//   dock     — the letters near the cursor widen while the rest narrow and
//              slide aside to make room, the word keeping its width so its
//              ends stay put. It glides there and back without overshooting.
//   classic  — the letters under the cursor squash down to the baseline in a
//              smooth wave.
// Uses footerWordmarks and footerReducedMotion from navigation.ts.

type FooterMode = "dock" | "classic";

const footerModes: { id: FooterMode; label: string }[] = [
  { id: "dock", label: "Dock" },
  { id: "classic", label: "Classic" },
];
const footerModeKey = "raheem-footer-mode-v2";
const isFooterMode = (value: string | null): value is FooterMode => footerModes.some((mode) => mode.id === value);

const footerModeRead = () => {
  try {
    return window.localStorage.getItem(footerModeKey);
  } catch {
    return null;
  }
};

const footerModeStore = (mode: FooterMode) => {
  try {
    window.localStorage.setItem(footerModeKey, mode);
  } catch {
    // Without storage the choice lasts for this page.
  }
};

const footerMeasureCanvas = document.createElement("canvas");
const footerMeasureContext = footerMeasureCanvas.getContext("2d");

const footerSetups = footerWordmarks.map((wordmark) => {
  const letters = [...wordmark.querySelectorAll<HTMLElement>("span")];

  // Each letter squashes from the floor of its glyph, not the bottom of its
  // line box.
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

  // Where each letter is and where it's heading.
  const state = letters.map(() => ({ scale: 1, scaleTarget: 1, widen: 1, widenTarget: 1, shift: 0, shiftTarget: 0 }));
  let mode: FooterMode = "dock";
  let frame: number | null = null;

  // How strongly each letter feels the cursor, falling off over about a letter.
  const influences = (pointX: number, reach: number) => {
    const centres = letters.map((letter) => {
      const bounds = letter.getBoundingClientRect();
      return bounds.left + bounds.width / 2;
    });
    const spacing = centres.length > 1 ? (centres[centres.length - 1] - centres[0]) / (centres.length - 1) : wordmark.offsetWidth;
    return centres.map((centre) => Math.exp(-0.5 * Math.pow(Math.abs(pointX - centre) / Math.max(spacing, 1) / reach, 2)));
  };

  const tick = () => {
    frame = null;
    let settled = true;
    // Eased straight to where they're going: no spring, no overshoot.
    const ease = mode === "dock" ? 0.14 : 0.2;
    letters.forEach((letter, index) => {
      const entry = state[index];
      entry.scale += (entry.scaleTarget - entry.scale) * ease;
      entry.widen += (entry.widenTarget - entry.widen) * ease;
      entry.shift += (entry.shiftTarget - entry.shift) * ease;
      if (Math.abs(entry.scaleTarget - entry.scale) + Math.abs(entry.widenTarget - entry.widen) + Math.abs(entry.shiftTarget - entry.shift) * 0.01 > 0.002) {
        settled = false;
      }
      letter.style.transform =
        `translate3d(${entry.shift.toFixed(2)}px, 0, 0) scale(${entry.widen.toFixed(4)}, ${entry.scale.toFixed(4)})`;
    });
    if (!settled) request();
  };

  const request = () => {
    if (frame === null) frame = requestAnimationFrame(tick);
  };

  wordmark.addEventListener("pointermove", (event) => {
    if (footerReducedMotion.matches) return;
    if (mode === "classic") {
      influences(event.clientX, 0.58).forEach((influence, index) => {
        state[index].scaleTarget = 1 - influence * 0.58;
      });
    } else {
      // Widen near the cursor and narrow the rest by just as much, so the
      // word keeps its overall width and its ends never pass the edges; then
      // shift every letter so none overlap.
      const reach = influences(event.clientX, 0.7);
      const widths = letters.map((letter) => letter.offsetWidth);
      const wanted = reach.map((influence) => 1 + influence * 1.1);
      const natural = widths.reduce((sum, width) => sum + width, 0);
      const grown = widths.reduce((sum, width, index) => sum + width * wanted[index], 0);
      const fit = natural / Math.max(grown, 1);
      let before = 0;
      state.forEach((entry, index) => {
        entry.widenTarget = wanted[index] * fit;
        entry.scaleTarget = 1 + reach[index] * 0.08;
        const extra = widths[index] * (entry.widenTarget - 1);
        entry.shiftTarget = before + extra / 2;
        before += extra;
      });
    }
    request();
  });

  const settle = () => {
    state.forEach((entry) => {
      entry.scaleTarget = 1;
      entry.widenTarget = 1;
      entry.shiftTarget = 0;
    });
    request();
  };
  wordmark.addEventListener("pointerleave", settle);
  footerReducedMotion.addEventListener("change", settle);

  const setMode = (next: FooterMode) => {
    mode = next;
    state.forEach((entry) => Object.assign(entry, { scale: 1, scaleTarget: 1, widen: 1, widenTarget: 1, shift: 0, shiftTarget: 0 }));
    letters.forEach((letter) => letter.style.removeProperty("transform"));
  };

  return { wordmark, setMode };
});

if (footerSetups.length > 0) {
  const footerSetMode = (mode: FooterMode) => {
    footerSetups.forEach((setup) => setup.setMode(mode));
    footerModeStore(mode);
    document.querySelectorAll<HTMLButtonElement>(".footer-modes button").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.footerMode === mode));
    });
  };

  // Temporary: the picker for comparing the two, in each footer.
  footerSetups.forEach(({ wordmark }) => {
    const picker = document.createElement("div");
    picker.className = "footer-modes";
    picker.setAttribute("role", "group");
    picker.setAttribute("aria-label", "Wordmark hover");
    picker.innerHTML = footerModes
      .map((mode) => `<button type="button" data-footer-mode="${mode.id}" aria-pressed="false">${mode.label}</button>`)
      .join("");
    picker.addEventListener("click", (event) => {
      const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("button[data-footer-mode]") : null;
      const choice = button?.dataset.footerMode ?? null;
      if (isFooterMode(choice)) footerSetMode(choice);
    });
    wordmark.parentElement?.append(picker);
  });

  const requested = new URLSearchParams(window.location.search).get("footer");
  const stored = footerModeRead();
  footerSetMode(isFooterMode(requested) ? requested : isFooterMode(stored) ? stored : "dock");
}
