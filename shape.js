"use strict";
// "What I shape". The reel is the design; the sentence is parked behind
// ?shape=sentence and is what narrow screens get.
//   reel      — a film: the section pins and scrolling (or dragging) travels
//               sideways from a title card through the three chapters to a
//               closing card, a little faster than the page scrolls. Frames
//               wipe in as they arrive and drift gently at different depths
//               with their images panning inside; the colour changes with
//               each chapter. Click a frame to see it full screen. A strip at
//               the foot counts the frames and jumps between chapters.
//   sentence  — a manifesto: each chapter is one sentence set huge, its words
//               inking in as you read down, with image pills set in the type
//               that flick through the chapter's frames. Hover a pill for a
//               large preview that follows the cursor; click it to open it.
const shapeLayouts = ["reel", "sentence"];
const shapeRoot = document.querySelector("[data-shape]");
const shapeDesktop = window.matchMedia("(min-width: 761px)");
const shapeStill = window.matchMedia("(prefers-reduced-motion: reduce)");
const shapeClamp = (value, min, max) => Math.min(Math.max(value, min), max);
const isShapeLayout = (value) => shapeLayouts.some((layout) => layout === value);
// Wrap each word of a line in its own span so it can ink in on its own;
// the pills count as words.
const shapeSplitWords = (line) => {
    [...line.childNodes].forEach((node) => {
        if (node.nodeType !== Node.TEXT_NODE)
            return;
        const fragment = document.createDocumentFragment();
        (node.textContent ?? "").split(/(\s+)/).forEach((part) => {
            if (part === "")
                return;
            if (/^\s+$/.test(part)) {
                fragment.append(document.createTextNode(part));
                return;
            }
            const word = document.createElement("span");
            word.className = "shape-word";
            word.textContent = part;
            fragment.append(word);
        });
        node.replaceWith(fragment);
    });
    line.querySelectorAll(".shape-pill").forEach((pill) => pill.classList.add("shape-word"));
    return [...line.querySelectorAll(".shape-word")];
};
if (shapeRoot) {
    const stage = shapeRoot.querySelector(".shape__stage");
    const track = shapeRoot.querySelector(".shape__track");
    // The reel's window onto the track, and its chapter strip.
    const viewport = document.createElement("div");
    viewport.className = "shape__viewport";
    if (stage && track) {
        stage.append(viewport);
        viewport.append(track);
    }
    const hud = document.createElement("nav");
    hud.className = "shape-hud";
    hud.setAttribute("aria-label", "What I shape chapters");
    viewport.append(hud);
    // The reel's opening and closing cards.
    const opening = document.createElement("div");
    opening.className = "shape-reel-card shape-reel-card--opening";
    // Its contents are filled in once the chapters are read (below).
    opening.innerHTML =
        `<p class="shape-reel-card__label">/ What I shape</p>` +
            `<p class="shape-reel-card__title">Three ways<br />an idea takes<br />shape.</p>` +
            `<ol class="shape-reel-card__contents"></ol>` +
            `<p class="shape-reel-card__hint">Scroll or drag <span aria-hidden="true">→</span></p>`;
    const closing = document.createElement("div");
    closing.className = "shape-reel-card shape-reel-card--closing";
    closing.innerHTML =
        `<p class="shape-reel-card__label">That’s the shape of it</p>` +
            `<p class="shape-reel-card__title">Got an idea<br />worth shaping?</p>` +
            `<p class="shape-reel-card__links">` +
            `<a class="shape-reel-card__link" href="mailto:animashaunraheem05@gmail.com">Start a project <span aria-hidden="true">↗</span></a>` +
            `<a class="shape-reel-card__link shape-reel-card__link--quiet" href="work.html">See all work <span aria-hidden="true">→</span></a>` +
            `</p>`;
    track?.prepend(opening);
    track?.append(closing);
    const chapters = [...shapeRoot.querySelectorAll(".shape-chapter")].map((article) => {
        const frames = [...article.querySelectorAll(".shape-frame")];
        const sources = frames.map((frame) => {
            const image = frame.querySelector("img");
            return {
                src: image?.getAttribute("src") ?? "",
                caption: frame.querySelector("figcaption")?.innerHTML ?? "",
            };
        });
        const pills = [...article.querySelectorAll(".shape-pill")].map((pill) => {
            const indices = (pill.dataset.frames ?? "").split(" ").map(Number).filter((index) => sources[index]);
            pill.innerHTML = indices.map((index) => `<img src="${sources[index].src}" alt="" draggable="false" />`).join("");
            const images = [...pill.querySelectorAll("img")];
            images[0]?.classList.add("is-current");
            return { pill, indices, images, current: 0, last: 0 };
        });
        const line = article.querySelector(".shape-chapter__line");
        const number = article.querySelector(".shape-chapter__number")?.textContent ?? "";
        const kind = article.querySelector(".shape-chapter__kind")?.firstChild?.textContent ?? "";
        frames.forEach((figure) => {
            // A window for each image, so it can wipe in and pan inside it.
            const image = figure.querySelector("img");
            if (image) {
                const frameWindow = document.createElement("span");
                frameWindow.className = "shape-frame__window";
                image.before(frameWindow);
                frameWindow.append(image);
            }
            // Frames open full screen from the keyboard too.
            figure.tabIndex = 0;
            figure.setAttribute("role", "button");
        });
        return {
            article,
            tone: article.dataset.tone ?? "dark",
            frames,
            sources,
            pills,
            words: line ? shapeSplitWords(line) : [],
            // How far each frame drifts against the travel, for depth.
            depths: frames.map((_, index) => [0.03, -0.04, 0.05, -0.02][index % 4]),
            number,
            kind,
        };
    });
    const allFrames = chapters.flatMap((chapter) => chapter.frames);
    const contents = opening.querySelector(".shape-reel-card__contents");
    if (contents) {
        contents.innerHTML = chapters
            .map((chapter) => `<li><span>${chapter.number}</span>${chapter.kind}</li>`)
            .join("");
    }
    hud.innerHTML =
        `<span class="shape-hud__bar" aria-hidden="true"><i></i></span>` +
            `<span class="shape-hud__count" aria-hidden="true"><b>00</b> / ${String(allFrames.length).padStart(2, "0")}</span>` +
            chapters.map((chapter) => `<button type="button"><span>${chapter.number}</span> ${chapter.kind}</button>`).join("");
    const hudBar = hud.querySelector(".shape-hud__bar i");
    const hudCount = hud.querySelector(".shape-hud__count b");
    const hudButtons = [...hud.querySelectorAll("button")];
    let layout = "reel";
    let frame = null;
    let travel = 0;
    // How much further across the reel travels than the page scrolls.
    const reelSpeed = 1.7;
    const reelLive = () => layout === "reel" && shapeDesktop.matches;
    // The reel is as tall as its track is wide (over reelSpeed), so scrolling
    // down travels across.
    const measure = () => {
        if (!stage || !track)
            return;
        if (!reelLive()) {
            stage.style.removeProperty("height");
            track.style.removeProperty("transform");
            travel = 0;
            return;
        }
        travel = Math.max(track.scrollWidth - window.innerWidth, 0);
        stage.style.height = `${travel / reelSpeed + window.innerHeight}px`;
    };
    const reelProgress = () => {
        if (!stage)
            return 0;
        const range = stage.offsetHeight - window.innerHeight;
        return range > 0 ? shapeClamp(-stage.getBoundingClientRect().top / range, 0, 1) : 0;
    };
    const render = () => {
        frame = null;
        const height = window.innerHeight || 1;
        // Words ink in from the foot of the screen as they rise.
        chapters.forEach(({ words }) => {
            words.forEach((word) => {
                const top = word.getBoundingClientRect().top;
                const ink = shapeStill.matches || reelLive() ? 1 : shapeClamp((height * 0.86 - top) / (height * 0.32), 0, 1);
                word.style.setProperty("--ink", ink.toFixed(3));
            });
        });
        if (!reelLive() || !track) {
            chapters.forEach(({ frames }) => {
                frames.forEach((figure) => ["--drift", "--reveal", "--pan", "--focus"].forEach((name) => figure.style.removeProperty(name)));
            });
            shapeRoot.dataset.toneNow = chapters[0]?.tone ?? "dark";
            return;
        }
        const progress = reelProgress();
        const shift = -progress * travel;
        track.style.transform = `translate3d(${shift.toFixed(1)}px, 0, 0)`;
        const width = window.innerWidth;
        const centre = width / 2;
        let current = 0;
        let passed = 0;
        chapters.forEach((chapter, index) => {
            const chapterLeft = chapter.article.offsetLeft + shift;
            if (chapterLeft < centre)
                current = index;
            const strip = chapter.frames[0]?.parentElement;
            const stripLeft = chapterLeft + (strip?.offsetLeft ?? 0);
            chapter.frames.forEach((figure, figureIndex) => {
                // Frames are placed within their strip, which sits inside the chapter.
                const left = figure.offsetLeft + stripLeft;
                const onScreen = left + figure.offsetWidth / 2;
                if (onScreen < centre)
                    passed += 1;
                const drift = (onScreen - centre) * chapter.depths[figureIndex];
                // Wiped in from the left as it comes on from the right.
                const reveal = shapeStill.matches ? 1 : shapeClamp((width * 0.96 - left) / (figure.offsetWidth * 0.85), 0, 1);
                figure.style.setProperty("--drift", `${drift.toFixed(1)}px`);
                figure.style.setProperty("--pan", `${((onScreen - centre) * -0.06).toFixed(1)}px`);
                figure.style.setProperty("--reveal", reveal.toFixed(3));
                // Its caption comes up as it nears the middle of the screen.
                figure.style.setProperty("--focus", shapeClamp(1 - Math.abs(onScreen - centre) / (width * 0.38), 0, 1).toFixed(3));
            });
        });
        shapeRoot.dataset.toneNow = chapters[current]?.tone ?? "dark";
        if (hudBar)
            hudBar.style.transform = `scaleX(${progress.toFixed(4)})`;
        if (hudCount)
            hudCount.textContent = String(passed).padStart(2, "0");
        hudButtons.forEach((button, index) => button.setAttribute("aria-current", String(index === current)));
    };
    const request = () => {
        if (frame === null)
            frame = requestAnimationFrame(render);
    };
    // A HUD button travels to its chapter.
    hudButtons.forEach((button, index) => {
        button.addEventListener("click", () => {
            const chapter = chapters[index];
            if (!stage || !chapter || travel <= 0)
                return;
            const progress = shapeClamp(chapter.article.offsetLeft / travel, 0, 1);
            const top = stage.getBoundingClientRect().top + window.scrollY + progress * (stage.offsetHeight - window.innerHeight);
            window.scrollTo({ top, behavior: shapeStill.matches ? "auto" : "smooth" });
        });
    });
    /* Full screen ------------------------------------------------------------------ */
    const lightbox = document.createElement("div");
    lightbox.className = "shape-lightbox";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Frame");
    lightbox.hidden = true;
    lightbox.innerHTML =
        `<figure class="shape-lightbox__frame"><img alt="" /><figcaption></figcaption></figure>` +
            `<p class="shape-lightbox__count"></p>` +
            `<button type="button" class="shape-lightbox__close" aria-label="Close">Close</button>` +
            `<button type="button" class="shape-lightbox__step" data-step="-1" aria-label="Previous frame">←</button>` +
            `<button type="button" class="shape-lightbox__step" data-step="1" aria-label="Next frame">→</button>`;
    document.body.append(lightbox);
    const lightboxImage = lightbox.querySelector("img");
    const lightboxCaption = lightbox.querySelector("figcaption");
    const lightboxCount = lightbox.querySelector(".shape-lightbox__count");
    let shownFrame = -1;
    let returnFocus = null;
    const showFrame = (index) => {
        shownFrame = (index + allFrames.length) % allFrames.length;
        const figure = allFrames[shownFrame];
        const image = figure.querySelector("img");
        if (lightboxImage && image) {
            lightboxImage.src = image.currentSrc || image.src;
            lightboxImage.alt = image.alt;
        }
        if (lightboxCaption)
            lightboxCaption.innerHTML = figure.querySelector("figcaption")?.innerHTML ?? "";
        if (lightboxCount)
            lightboxCount.textContent = `${String(shownFrame + 1).padStart(2, "0")} / ${String(allFrames.length).padStart(2, "0")}`;
    };
    const openFrame = (index) => {
        returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        showFrame(index);
        lightbox.hidden = false;
        requestAnimationFrame(() => lightbox.classList.add("is-open"));
        lightbox.querySelector(".shape-lightbox__close")?.focus();
    };
    const closeFrame = () => {
        lightbox.classList.remove("is-open");
        window.setTimeout(() => {
            lightbox.hidden = true;
        }, 320);
        returnFocus?.focus();
    };
    lightbox.addEventListener("click", (event) => {
        const target = event.target instanceof Element ? event.target : null;
        const step = target?.closest("[data-step]")?.dataset.step;
        if (step) {
            showFrame(shownFrame + Number(step));
            return;
        }
        if (!target?.closest(".shape-lightbox__frame img"))
            closeFrame();
    });
    document.addEventListener("keydown", (event) => {
        if (lightbox.hidden)
            return;
        if (event.key === "Escape")
            closeFrame();
        if (event.key === "ArrowRight")
            showFrame(shownFrame + 1);
        if (event.key === "ArrowLeft")
            showFrame(shownFrame - 1);
    });
    allFrames.forEach((figure, index) => {
        figure.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openFrame(index);
            }
        });
    });
    /* Dragging the reel -------------------------------------------------------------- */
    // Dragging sideways scrolls the page (a pixel across is reelSpeed times
    // less down, since the reel travels faster), and a flick carries on and slows. A
    // press that doesn't move opens the frame under it. Steps are instant: the
    // page's smooth scrolling would otherwise restart on every one.
    let dragging = null;
    let coast = null;
    viewport.addEventListener("pointerdown", (event) => {
        if (!reelLive() || event.button !== 0)
            return;
        const target = event.target instanceof Element ? event.target : null;
        if (target?.closest("a, button, .shape-pill"))
            return;
        if (coast !== null)
            cancelAnimationFrame(coast);
        coast = null;
        dragging = { x: event.clientX, lastX: event.clientX, lastTime: performance.now(), velocity: 0, moved: false, frame: target?.closest(".shape-frame") ?? null };
        viewport.setPointerCapture(event.pointerId);
    });
    viewport.addEventListener("pointermove", (event) => {
        if (!dragging)
            return;
        const now = performance.now();
        const step = event.clientX - dragging.lastX;
        if (Math.abs(event.clientX - dragging.x) > 6) {
            dragging.moved = true;
            viewport.classList.add("is-dragging");
        }
        if (!dragging.moved)
            return;
        window.scrollBy({ top: -step / reelSpeed, behavior: "instant" });
        dragging.velocity = step / (Math.max(now - dragging.lastTime, 1) / 16.7);
        dragging.lastX = event.clientX;
        dragging.lastTime = now;
    });
    const endDrag = () => {
        if (!dragging)
            return;
        const { moved, frame: pressed } = dragging;
        let velocity = dragging.velocity;
        dragging = null;
        viewport.classList.remove("is-dragging");
        if (!moved) {
            if (pressed)
                openFrame(allFrames.indexOf(pressed));
            return;
        }
        const carry = () => {
            velocity *= 0.92;
            window.scrollBy({ top: -velocity / reelSpeed, behavior: "instant" });
            coast = Math.abs(velocity) > 0.4 ? requestAnimationFrame(carry) : null;
        };
        if (!shapeStill.matches)
            coast = requestAnimationFrame(carry);
    };
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    window.addEventListener("wheel", () => {
        if (coast !== null)
            cancelAnimationFrame(coast);
        coast = null;
    }, { passive: true });
    /* Pills and the preview ---------------------------------------------------- */
    const preview = document.createElement("div");
    preview.className = "shape-preview";
    preview.setAttribute("aria-hidden", "true");
    preview.innerHTML = `<img alt="" /><p></p>`;
    document.body.append(preview);
    const previewImage = preview.querySelector("img");
    const previewCaption = preview.querySelector("p");
    const pointer = { x: 0, y: 0, shownX: 0, shownY: 0 };
    let hovered = null;
    let hoveredChapter = null;
    let previewFrame = null;
    const showInPreview = () => {
        if (!hovered || !hoveredChapter || !previewImage || !previewCaption)
            return;
        const source = hoveredChapter.sources[hovered.indices[hovered.current]];
        if (!source)
            return;
        if (previewImage.getAttribute("src") !== source.src)
            previewImage.src = source.src;
        previewCaption.innerHTML = source.caption;
    };
    // The preview trails the cursor a little, as if on a string.
    const followPointer = () => {
        previewFrame = null;
        pointer.shownX += (pointer.x - pointer.shownX) * 0.18;
        pointer.shownY += (pointer.y - pointer.shownY) * 0.18;
        preview.style.transform = `translate3d(${pointer.shownX.toFixed(1)}px, ${pointer.shownY.toFixed(1)}px, 0)`;
        if (hovered || Math.hypot(pointer.x - pointer.shownX, pointer.y - pointer.shownY) > 0.5) {
            previewFrame = requestAnimationFrame(followPointer);
        }
    };
    // Each pill flicks to its next frame now and then — quicker under the cursor.
    const advancePills = (now) => {
        chapters.forEach((chapter) => {
            chapter.pills.forEach((entry) => {
                const pace = entry === hovered ? 700 : 1700;
                if (now - entry.last < pace || entry.images.length < 2)
                    return;
                const bounds = entry.pill.getBoundingClientRect();
                if (bounds.bottom < 0 || bounds.top > window.innerHeight)
                    return;
                entry.last = now;
                entry.images[entry.current]?.classList.remove("is-current");
                entry.current = (entry.current + 1) % entry.images.length;
                entry.images[entry.current]?.classList.add("is-current");
                if (entry === hovered)
                    showInPreview();
            });
        });
        if (!shapeStill.matches)
            requestAnimationFrame(advancePills);
    };
    // Stagger them so they don't all flick together.
    chapters.forEach((chapter, chapterIndex) => chapter.pills.forEach((entry, pillIndex) => {
        entry.last = performance.now() + (chapterIndex * 2 + pillIndex) * 330;
    }));
    if (!shapeStill.matches)
        requestAnimationFrame(advancePills);
    chapters.forEach((chapter) => {
        chapter.pills.forEach((entry) => {
            entry.pill.addEventListener("pointerenter", (event) => {
                if (event.pointerType === "touch")
                    return;
                hovered = entry;
                hoveredChapter = chapter;
                entry.pill.classList.add("is-open");
                pointer.x = pointer.shownX = event.clientX;
                pointer.y = pointer.shownY = event.clientY;
                showInPreview();
                preview.classList.add("is-shown");
                if (previewFrame === null)
                    previewFrame = requestAnimationFrame(followPointer);
            });
            entry.pill.addEventListener("pointermove", (event) => {
                pointer.x = event.clientX;
                pointer.y = event.clientY;
            });
            entry.pill.addEventListener("click", () => {
                const figure = chapter.frames[entry.indices[entry.current]];
                if (figure)
                    openFrame(allFrames.indexOf(figure));
            });
            entry.pill.addEventListener("pointerleave", () => {
                entry.pill.classList.remove("is-open");
                if (hovered === entry)
                    hovered = null;
                preview.classList.remove("is-shown");
            });
        });
    });
    /* Choosing a layout --------------------------------------------------------- */
    const setShapeLayout = (next) => {
        layout = next;
        shapeRoot.dataset.layout = next;
        measure();
        request();
    };
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", () => {
        measure();
        request();
    });
    shapeDesktop.addEventListener("change", () => {
        measure();
        request();
    });
    // Images arriving change the track's width.
    window.addEventListener("load", () => {
        measure();
        request();
    });
    const requested = new URLSearchParams(window.location.search).get("shape");
    setShapeLayout(isShapeLayout(requested) ? requested : "reel");
}
