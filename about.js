"use strict";
const aboutRail = document.querySelector(".about-media-rail");
const aboutRailTrack = aboutRail?.querySelector(".about-media-rail__track") ?? null;
const aboutReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
if (aboutRail && aboutRailTrack) {
    const sourceFrames = [...aboutRailTrack.children];
    sourceFrames.forEach((frame) => {
        const clone = frame.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.removeAttribute("aria-label");
        aboutRailTrack.append(clone);
    });
    const aboutFrames = [...aboutRailTrack.querySelectorAll(".about-media-frame")];
    let offset = 0;
    let velocity = 0;
    let loopWidth = 1;
    let railWidth = 1;
    let frameCenters = [];
    let previousTime = performance.now();
    let isDragging = false;
    let previousPointerX = 0;
    let previousPointerTime = 0;
    let pointerVelocity = 0;
    const wrap = (value, divisor) => ((value % divisor) + divisor) % divisor;
    const clampValue = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);
    const measure = () => {
        const firstFrame = aboutFrames[0];
        const repeatedFrame = aboutFrames[sourceFrames.length];
        loopWidth = firstFrame && repeatedFrame
            ? Math.max(repeatedFrame.offsetLeft - firstFrame.offsetLeft, 1)
            : Math.max(aboutRailTrack.scrollWidth / 2, 1);
        railWidth = Math.max(aboutRail.clientWidth, 1);
        frameCenters = aboutFrames.map((frame) => frame.offsetLeft + frame.offsetWidth / 2);
    };
    const render = (timestamp) => {
        const deltaTime = clampValue(timestamp - previousTime || 16.67, 4, 34);
        previousTime = timestamp;
        if (!isDragging && !aboutReducedMotion.matches) {
            offset += (velocity + 0.025) * deltaTime;
            velocity *= Math.pow(0.94, deltaTime / 16.67);
            if (Math.abs(velocity) < 0.002)
                velocity = 0;
        }
        offset = wrap(offset, loopWidth);
        aboutRailTrack.style.transform = `translate3d(${-offset}px, 0, 0)`;
        const focalCenter = railWidth / 2;
        const influenceRadius = Math.max(railWidth * 0.62, 1);
        aboutFrames.forEach((frame, index) => {
            const visibleCenter = frameCenters[index] - offset;
            const distance = clampValue(Math.abs(visibleCenter - focalCenter) / influenceRadius, 0, 1);
            const proximity = Math.pow(1 - distance, 1.65);
            const targetHeight = 0.58 + proximity * 0.4;
            const inset = (1 - targetHeight) * 50;
            frame.style.setProperty("--about-frame-inset", `${inset.toFixed(3)}%`);
        });
        requestAnimationFrame(render);
    };
    aboutRail.addEventListener("wheel", (event) => {
        if (aboutReducedMotion.matches)
            return;
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
        if (!isDragging)
            return;
        const now = performance.now();
        const elapsed = Math.max(now - previousPointerTime, 1);
        const delta = previousPointerX - event.clientX;
        offset += delta;
        pointerVelocity = delta / elapsed;
        previousPointerX = event.clientX;
        previousPointerTime = now;
    });
    const finishDrag = (event) => {
        if (!isDragging)
            return;
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
