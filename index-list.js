"use strict";
// Shared hover index for ruled lists — the homepage Index hero, the About
// record and the works archive. Titles roll on hover, sibling rows dim, and a
// preview lens trails the cursor, sliding between previews like a reel.
//
// Markup: a root with [data-index-list] containing rows with [data-index-row];
// any [data-index-roll] text inside a row rolls on hover. The lens is inserted
// as the root's first child so rows paint above it.
const indexListReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const indexListClamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);
const splitIndexRoll = (element) => {
    if (element.dataset.indexRollReady)
        return;
    element.dataset.indexRollReady = "true";
    const text = (element.textContent ?? "").trim().replace(/\s+/g, " ");
    const label = document.createElement("span");
    label.className = "visually-hidden";
    label.textContent = text;
    // Each word clips its own characters, so long titles can still wrap.
    const roll = document.createElement("span");
    roll.className = "index-roll";
    roll.setAttribute("aria-hidden", "true");
    let characterIndex = 0;
    text.split(" ").forEach((word, wordIndex) => {
        if (wordIndex > 0)
            roll.append(" ");
        const wordSpan = document.createElement("span");
        wordSpan.className = "index-roll__word";
        Array.from(word).forEach((character) => {
            const span = document.createElement("span");
            span.className = "index-roll__char";
            span.style.setProperty("--i", String(characterIndex));
            span.dataset.char = character;
            span.textContent = character;
            wordSpan.append(span);
            characterIndex += 1;
        });
        characterIndex += 1;
        roll.append(wordSpan);
    });
    element.replaceChildren(label, roll);
};
const createIndexList = (root, options) => {
    const controller = new AbortController();
    const { signal } = controller;
    const rows = [...root.querySelectorAll("[data-index-row]")];
    rows.forEach((row) => row.querySelectorAll("[data-index-roll]").forEach(splitIndexRoll));
    const lens = document.createElement("div");
    lens.className = "index-lens";
    lens.setAttribute("aria-hidden", "true");
    lens.innerHTML = `
    <div class="index-lens__window">
      <div class="index-lens__reel">
        ${options.previews
        .map((preview, index) => `
              <div class="index-lens__slide">
                <div class="index-lens__media">${preview}</div>
                ${options.labels?.[index] ? `<span class="index-lens__label">${options.labels[index]}</span>` : ""}
              </div>
            `)
        .join("")}
      </div>
    </div>
  `;
    root.prepend(lens);
    const reel = lens.querySelector(".index-lens__reel");
    const slides = [...reel.querySelectorAll(".index-lens__slide")];
    let active = -1;
    let lensX = 0;
    let lensY = 0;
    let targetX = 0;
    let targetY = 0;
    let tilt = 0;
    let stretch = 0;
    let reelPosition = 0;
    let lensWidth = 0;
    let lensHeight = 0;
    let frame = null;
    let lastFrame = 0;
    const measureLens = () => {
        lensWidth = lens.offsetWidth;
        lensHeight = lens.offsetHeight;
    };
    const render = (now) => {
        frame = null;
        const delta = indexListClamp(now - lastFrame, 4, 40);
        lastFrame = now;
        const still = indexListReducedMotion.matches;
        const follow = still ? 1 : 1 - Math.exp(-delta / 105);
        const previousX = lensX;
        const previousY = lensY;
        lensX += (targetX - lensX) * follow;
        lensY += (targetY - lensY) * follow;
        const velocityX = (lensX - previousX) / delta;
        const velocityY = (lensY - previousY) / delta;
        const settle = 1 - Math.exp(-delta / 120);
        tilt += (indexListClamp(velocityX * 8, -11, 11) - tilt) * settle;
        stretch += (indexListClamp(Math.hypot(velocityX, velocityY) * 0.045, 0, 0.09) - stretch) * settle;
        const reelTarget = Math.max(active, 0);
        reelPosition += (reelTarget - reelPosition) * (still ? 1 : 1 - Math.exp(-delta / 150));
        if (Math.abs(reelTarget - reelPosition) < 0.001)
            reelPosition = reelTarget;
        lens.style.transform =
            `translate3d(${(lensX - lensWidth / 2).toFixed(1)}px, ${(lensY - lensHeight / 2).toFixed(1)}px, 0) ` +
                `rotate(${tilt.toFixed(2)}deg) scale(${(1 + stretch).toFixed(3)}, ${(1 - stretch * 0.5).toFixed(3)})`;
        reel.style.transform = `translate3d(0, ${(-reelPosition * 100).toFixed(3)}%, 0)`;
        // Each slide drifts against the reel, so swaps read as a parallax curtain.
        // The shift stays inside the media's overscale, so no edge ever shows.
        slides.forEach((slide, index) => {
            slide.style.setProperty("--index-shift", `${(indexListClamp(index - reelPosition, -1, 1) * 11).toFixed(2)}%`);
        });
        const moving = Math.abs(targetX - lensX) + Math.abs(targetY - lensY) > 0.2 ||
            Math.abs(tilt) > 0.02 ||
            stretch > 0.001 ||
            reelPosition !== reelTarget;
        if (moving)
            frame = requestAnimationFrame(render);
    };
    const requestRender = () => {
        if (frame !== null)
            return;
        lastFrame = performance.now();
        frame = requestAnimationFrame(render);
    };
    const setActive = (index) => {
        if (index === active)
            return;
        // The first preview opens where the cursor is instead of flying in.
        if (active < 0 && index >= 0) {
            measureLens();
            lensX = targetX;
            lensY = targetY;
            reelPosition = index;
        }
        active = index;
        root.classList.toggle("has-active", index >= 0);
        rows.forEach((row, rowIndex) => row.classList.toggle("is-active", rowIndex === index));
        lens.classList.toggle("is-visible", index >= 0);
        requestRender();
    };
    const pointToRow = (row) => {
        const bounds = row.getBoundingClientRect();
        const rootBounds = root.getBoundingClientRect();
        targetX = bounds.left - rootBounds.left + bounds.width * 0.66;
        targetY = bounds.top - rootBounds.top + bounds.height / 2;
    };
    rows.forEach((row, index) => {
        row.addEventListener("pointerenter", (event) => {
            if (event.pointerType === "touch")
                return;
            setActive(index);
        }, { signal });
        row.addEventListener("focusin", () => {
            pointToRow(row);
            setActive(index);
        }, { signal });
        row.addEventListener("focusout", () => setActive(-1), { signal });
        if (options.onOpen && row instanceof HTMLAnchorElement) {
            row.addEventListener("click", (event) => {
                if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
                    return;
                event.preventDefault();
                const from = active === index ? lens.getBoundingClientRect() : row.getBoundingClientRect();
                options.onOpen?.(index, from);
            }, { signal });
        }
    });
    root.addEventListener("pointermove", (event) => {
        const bounds = root.getBoundingClientRect();
        targetX = event.clientX - bounds.left;
        targetY = event.clientY - bounds.top;
        requestRender();
    }, { signal });
    root.addEventListener("pointerleave", () => setActive(-1), { signal });
    window.addEventListener("resize", measureLens, { signal });
    measureLens();
    return {
        destroy: () => {
            controller.abort();
            if (frame !== null)
                cancelAnimationFrame(frame);
            lens.remove();
            root.classList.remove("has-active");
        },
    };
};
// Opening a project: its preview grows from where it sits on the page to fill
// the screen, then the case study loads underneath the same image.
const transitionToPage = (href, previewHtml, from, title = "") => {
    if (indexListReducedMotion.matches || !("animate" in document.body)) {
        window.location.assign(href);
        return;
    }
    const overlay = document.createElement("div");
    overlay.className = "page-transition";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
    <div class="page-transition__media">${previewHtml}</div>
    ${title ? `<span class="page-transition__title">${title}</span>` : ""}
  `;
    document.body.append(overlay);
    const go = () => window.location.assign(href);
    overlay
        .animate([
        { top: `${from.top}px`, left: `${from.left}px`, width: `${from.width}px`, height: `${from.height}px` },
        { top: "0px", left: "0px", width: `${window.innerWidth}px`, height: `${window.innerHeight}px` },
    ], { duration: 880, easing: "cubic-bezier(0.76, 0, 0.24, 1)", fill: "forwards" })
        .finished.then(go, go);
};
// Coming back through the history cache should not land on a frozen overlay.
window.addEventListener("pageshow", (event) => {
    if (!event.persisted)
        return;
    document.querySelectorAll(".page-transition").forEach((overlay) => overlay.remove());
});
