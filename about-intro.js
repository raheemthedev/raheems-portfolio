"use strict";
// The About page's "A little more about me" section. The desk is the design;
// the other takes are parked behind ?intro=lens|transcript|margins|slot. Each
// is built from the section's own copy
// — its eyebrow, headline and three notes — so the HTML stays the source.
//   lens        — "I tend to look twice": the notes sit faint, and a lens
//                 roams them (or follows the cursor), sharpening and enlarging
//                 whatever it passes over.
//   transcript  — "honest conversation": the section is an interview
//                 transcript with timecodes, the answers typing themselves in.
//   desk        — "the things I make, notice, save": the notes are index cards
//                 and prints dropped over the headline, to be picked up,
//                 thrown and rearranged.
//   margins     — the headline as an annotated proof: words are circled by
//                 hand as you scroll, with leader lines out to the notes.
//   slot        — "what makes ___ feel human": the section holds while the
//                 blank rolls through the things noticed, landing on
//                 "something" before the notes arrive.
const aboutIntros = [
    { id: "lens", label: "Lens" },
    { id: "transcript", label: "Transcript" },
    { id: "desk", label: "Desk" },
    { id: "margins", label: "Margins" },
    { id: "slot", label: "Slot" },
];
// Where notes left on the desk go. With a Formspree form's endpoint here
// (https://formspree.io/f/…) they're sent quietly from the page; left empty,
// Send opens the visitor's mail app addressed to Raheem instead.
const aboutNoteEndpoint = "https://formspree.io/f/moeejevw";
const aboutIntroMail = "animashaunraheem05@gmail.com";
const aboutIntroSection = document.querySelector(".about-personal");
const aboutIntroStill = window.matchMedia("(prefers-reduced-motion: reduce)");
const aboutIntroWide = window.matchMedia("(min-width: 761px)");
const aboutIntroClamp = (value, min, max) => Math.min(Math.max(value, min), max);
const aboutIntroSmooth = (value) => value * value * (3 - 2 * value);
const isAboutIntro = (value) => aboutIntros.some((intro) => intro.id === value);
const aboutIntroEscape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// Words as spans, each knowing its place in the line.
const aboutIntroWords = (text) => aboutIntroEscape(text)
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => `<span class="intro-word" style="--i:${index}">${word}</span>`)
    .join(" ");
// Run `tick` every frame while `element` is on screen.
const aboutIntroLoop = (element, tick) => {
    let frame = null;
    let visible = false;
    const run = (now) => {
        frame = null;
        const keepGoing = tick(now);
        if (visible && keepGoing !== false)
            frame = requestAnimationFrame(run);
    };
    const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && frame === null)
            frame = requestAnimationFrame(run);
    });
    observer.observe(element);
    return {
        wake: () => {
            if (visible && frame === null)
                frame = requestAnimationFrame(run);
        },
        stop: () => {
            observer.disconnect();
            if (frame !== null)
                cancelAnimationFrame(frame);
        },
    };
};
/* Crumpling a sent note ------------------------------------------------------ */
// Paint a note card onto a canvas as it looks — paper, tape, its words — so
// the canvas can be bent like the sheet itself. Positions come from layout
// (offsets), not the screen, since the card is turned on the desk.
const aboutIntroPaintNote = (card, scale) => {
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(width * scale);
    canvas.height = Math.ceil(height * scale);
    const context = canvas.getContext("2d");
    if (!context)
        return canvas;
    context.scale(scale, scale);
    const cardStyle = getComputedStyle(card);
    context.fillStyle = cardStyle.backgroundColor;
    context.fillRect(0, 0, width, height);
    const tape = card.querySelector(".intro-card__tape");
    if (tape) {
        context.save();
        context.translate(tape.offsetLeft, tape.offsetTop + tape.offsetHeight / 2);
        context.rotate((-3 * Math.PI) / 180);
        context.fillStyle = getComputedStyle(tape).backgroundColor;
        context.fillRect(-tape.offsetWidth / 2, -tape.offsetHeight / 2, tape.offsetWidth, tape.offsetHeight);
        context.restore();
    }
    // Wrapped lines of text set the way the element sets them.
    const write = (element, text, color) => {
        if (!element || !text)
            return;
        const style = getComputedStyle(element);
        context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        context.fillStyle = color ?? style.color;
        context.textBaseline = "top";
        const lineHeight = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.3;
        const left = element.offsetLeft + (Number.parseFloat(style.paddingLeft) || 0);
        const room = element.clientWidth - (Number.parseFloat(style.paddingLeft) || 0) - (Number.parseFloat(style.paddingRight) || 0);
        let top = element.offsetTop + (Number.parseFloat(style.paddingTop) || 0) + (lineHeight - Number.parseFloat(style.fontSize)) / 2;
        text.split("\n").forEach((paragraph) => {
            let line = "";
            paragraph.split(" ").forEach((word) => {
                const attempt = line ? `${line} ${word}` : word;
                if (context.measureText(attempt).width > room && line) {
                    context.fillText(line, left, top);
                    top += lineHeight;
                    line = word;
                }
                else {
                    line = attempt;
                }
            });
            context.fillText(line, left, top);
            top += lineHeight;
        });
    };
    const heading = card.querySelector(".intro-card__no");
    write(heading, heading?.textContent ?? "");
    const field = card.querySelector("textarea");
    write(field, field?.value ?? "");
    const from = card.querySelector(".intro-card__from");
    write(from, from?.value || from?.placeholder || "", from?.value ? undefined : "rgba(11, 11, 11, 0.4)");
    const actions = card.querySelector(".intro-card__actions");
    if (actions) {
        context.strokeStyle = "rgba(11, 11, 11, 0.25)";
        context.setLineDash([3, 3]);
        context.beginPath();
        context.moveTo(actions.offsetLeft, actions.offsetTop + 0.5);
        context.lineTo(actions.offsetLeft + actions.offsetWidth, actions.offsetTop + 0.5);
        context.stroke();
        context.setLineDash([]);
        const send = actions.querySelector(".intro-card__send");
        if (send) {
            const left = actions.offsetLeft + send.offsetLeft;
            const top = actions.offsetTop + send.offsetTop;
            context.fillStyle = getComputedStyle(send).backgroundColor;
            context.beginPath();
            context.roundRect(left, top, send.offsetWidth, send.offsetHeight, send.offsetHeight / 2);
            context.fill();
            const style = getComputedStyle(send);
            context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
            context.fillStyle = style.color;
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText((send.textContent ?? "").trim().toUpperCase(), left + send.offsetWidth / 2, top + send.offsetHeight / 2);
            context.textAlign = "start";
        }
    }
    return canvas;
};
// The same note, crumpled: a wrinkle map laid over it — two scales of paper
// facets (cells around scattered points, each tilted its own way), lit from
// the top left, with a dark crease where neighbouring facets meet. It's mapped
// onto the bending sheet like the note itself, so the wrinkles fold with it.
const aboutIntroWrinkle = (texture) => {
    const scale = 0.5;
    const width = Math.max(1, Math.round(texture.width * scale));
    const height = Math.max(1, Math.round(texture.height * scale));
    const light = { x: -0.5, y: -0.62, z: 0.6 };
    const flat = light.z;
    const layers = [
        { cell: Math.max(width, height) / 6, tilt: 0.7, crease: 0.035 },
        { cell: Math.max(width, height) / 16, tilt: 0.38, crease: 0.05 },
    ].map((layer) => {
        const columns = Math.ceil(width / layer.cell) + 1;
        const rows = Math.ceil(height / layer.cell) + 1;
        const seeds = Array.from({ length: columns * rows }, (_, index) => ({
            x: ((index % columns) + 0.1 + Math.random() * 0.8) * layer.cell,
            y: (Math.floor(index / columns) + 0.1 + Math.random() * 0.8) * layer.cell,
            tiltX: (Math.random() - 0.5) * 2 * layer.tilt,
            tiltY: (Math.random() - 0.5) * 2 * layer.tilt,
        }));
        return { ...layer, columns, rows, seeds };
    });
    const shade = document.createElement("canvas");
    shade.width = width;
    shade.height = height;
    const shadeContext = shade.getContext("2d");
    const shine = document.createElement("canvas");
    shine.width = width;
    shine.height = height;
    const shineContext = shine.getContext("2d");
    if (!shadeContext || !shineContext)
        return texture;
    const shadePixels = shadeContext.createImageData(width, height);
    const shinePixels = shineContext.createImageData(width, height);
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            let tiltX = 0;
            let tiltY = 0;
            let creased = 1;
            layers.forEach((layer) => {
                const cellX = Math.floor(x / layer.cell);
                const cellY = Math.floor(y / layer.cell);
                let nearest = Infinity;
                let second = Infinity;
                let chosen = layer.seeds[0];
                for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
                    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
                        const column = cellX + offsetX;
                        const row = cellY + offsetY;
                        if (column < 0 || row < 0 || column >= layer.columns || row >= layer.rows)
                            continue;
                        const seed = layer.seeds[row * layer.columns + column];
                        const distance = Math.hypot(x - seed.x, y - seed.y);
                        if (distance < nearest) {
                            second = nearest;
                            nearest = distance;
                            chosen = seed;
                        }
                        else if (distance < second) {
                            second = distance;
                        }
                    }
                }
                // Each facet bows a little, so its light shifts across it.
                const bowX = (x - chosen.x) / layer.cell;
                const bowY = (y - chosen.y) / layer.cell;
                tiltX += chosen.tiltX + bowX * layer.tilt * 0.5;
                tiltY += chosen.tiltY + bowY * layer.tilt * 0.5;
                // Near the boundary between two facets: the crease itself, a thin line.
                const edge = Math.min((second - nearest) / (layer.cell * layer.crease), 1);
                creased = Math.min(creased, 0.62 + 0.38 * Math.sqrt(edge));
            });
            const length = Math.hypot(tiltX, tiltY, 1);
            const lit = ((-tiltX * light.x - tiltY * light.y + light.z) / length) / flat;
            const index = (y * width + x) * 4;
            // Mostly bright paper; warm shadow only where a facet turns away.
            const light01 = Math.max(0, Math.min(1, lit)) * creased;
            const value = 0.6 + 0.4 * Math.pow(light01, 0.8);
            shadePixels.data[index] = Math.round(255 * value);
            shadePixels.data[index + 1] = Math.round(255 * Math.pow(value, 1.12));
            shadePixels.data[index + 2] = Math.round(255 * Math.pow(value, 1.4));
            shadePixels.data[index + 3] = 255;
            shinePixels.data[index] = 255;
            shinePixels.data[index + 1] = 255;
            shinePixels.data[index + 2] = 255;
            shinePixels.data[index + 3] = Math.round(Math.max(0, Math.min(1, (lit - 1) * 1.6)) * 200);
        }
    }
    shadeContext.putImageData(shadePixels, 0, 0);
    shineContext.putImageData(shinePixels, 0, 0);
    const crumpled = document.createElement("canvas");
    crumpled.width = texture.width;
    crumpled.height = texture.height;
    const context = crumpled.getContext("2d");
    if (!context)
        return texture;
    context.drawImage(texture, 0, 0);
    context.imageSmoothingQuality = "high";
    context.globalCompositeOperation = "multiply";
    context.drawImage(shade, 0, 0, texture.width, texture.height);
    context.globalCompositeOperation = "source-over";
    context.drawImage(shine, 0, 0, texture.width, texture.height);
    return crumpled;
};
// Crumple a note in place: the sheet is a mesh, and creases switch on across
// it one after another — each a fold line the paper bends sharply along, so
// it breaks into flat facets — while the edges are drawn in harder than the
// middle until it's a lumpy ball. Every facet is lit by the angle it's turned
// to. `onBall` hears when it's done, with the canvas to throw.
const aboutIntroCrumple = (card, host, duration, onBall) => {
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const margin = 40;
    const texture = aboutIntroPaintNote(card, ratio);
    const wrinkled = aboutIntroWrinkle(texture);
    const canvas = document.createElement("canvas");
    canvas.className = "intro-crumple";
    canvas.setAttribute("aria-hidden", "true");
    canvas.width = Math.ceil((width + margin * 2) * ratio);
    canvas.height = Math.ceil((height + margin * 2) * ratio);
    canvas.style.width = `${width + margin * 2}px`;
    canvas.style.height = `${height + margin * 2}px`;
    canvas.style.left = `${-margin}px`;
    canvas.style.top = `${-margin}px`;
    canvas.style.transform = card.style.transform;
    canvas.style.zIndex = card.style.zIndex;
    host.append(canvas);
    card.style.visibility = "hidden";
    const context = canvas.getContext("2d");
    if (!context) {
        onBall(canvas);
        return;
    }
    // The fold lines, in the sheet's own units (its longer side is 1).
    const longest = Math.max(width, height);
    const sheetX = width / longest;
    const sheetY = height / longest;
    const creases = Array.from({ length: 48 }, () => {
        const angle = Math.random() * Math.PI;
        return {
            x: (0.15 + Math.random() * 0.7) * sheetX,
            y: (0.15 + Math.random() * 0.7) * sheetY,
            normalX: Math.cos(angle),
            normalY: Math.sin(angle),
            sign: Math.random() < 0.5 ? -1 : 1,
            weight: 0.25 + Math.random() * 0.35,
            // Folds arrive in waves, scattered over the first half of the squeeze.
            start: Math.random() * 0.5,
        };
    });
    // The ball it ends as, with a little irregularity to its outline.
    const ball = longest * 0.24;
    const seed = Math.random() * 10;
    const columns = 26;
    const rows = Math.max(14, Math.round(columns * (height / width)));
    const light = { x: -0.45, y: -0.6, z: 0.66 };
    const flatLight = light.z;
    const started = performance.now();
    const frame = (now) => {
        const progress = Math.min((now - started) / duration, 1);
        // Quick to start, slow to finish, like a hand squeezing.
        const squeeze = 1 - Math.pow(1 - progress, 2.4);
        // The fine wrinkles come up early, as the first squeeze crushes the sheet.
        const wrinkling = Math.min(squeeze * 2.2, 1);
        // Where every point of the mesh has got to, with its height.
        const points = [];
        for (let row = 0; row <= rows; row += 1) {
            for (let column = 0; column <= columns; column += 1) {
                const u = column / columns;
                const v = row / rows;
                const sx = u * sheetX;
                const sy = v * sheetY;
                let z = 0;
                let pushX = 0;
                let pushY = 0;
                creases.forEach((crease) => {
                    const on = Math.min(Math.max((squeeze - crease.start) / 0.45, 0), 1);
                    if (!on)
                        return;
                    const distance = (sx - crease.x) * crease.normalX + (sy - crease.y) * crease.normalY;
                    z += crease.sign * crease.weight * Math.abs(distance) * on;
                    // The paper buckles sideways along each fold, too.
                    const side = Math.sign(distance) * crease.weight * on;
                    pushX += crease.normalX * side;
                    pushY += crease.normalY * side;
                });
                // Gathered onto a rough ball: every point heads for a spot inside a
                // circle, the edges to its rim, so the sheet rounds up as it shrinks.
                const fromX = (u - 0.5) * 2;
                const fromY = (v - 0.5) * 2;
                const edge = Math.min(Math.hypot(fromX, fromY) / Math.SQRT2, 1);
                const offsetX = (u - 0.5) * width;
                const offsetY = (v - 0.5) * height;
                const offset = Math.hypot(offsetX, offsetY) || 1;
                const rim = ball * (0.82 + 0.18 * Math.sin(u * 13.1 + v * 7.7 + seed));
                // How far out toward the sheet's edge along its own direction, so the
                // whole edge — corners and sides alike — lands on the rim.
                const outward = Math.max(Math.abs(fromX), Math.abs(fromY));
                const ballX = (offsetX / offset) * rim * Math.pow(outward, 0.75);
                const ballY = (offsetY / offset) * rim * Math.pow(outward, 0.75);
                const x = width / 2 + offsetX + (ballX - offsetX) * squeeze - pushX * squeeze * longest * 0.01;
                const y = height / 2 + offsetY + (ballY - offsetY) * squeeze - pushY * squeeze * longest * 0.01;
                // Edges curl up off the desk as it balls up.
                const lift = (z * 0.38 + edge * edge * 0.16) * squeeze * longest;
                points.push({ x, y, z: lift, u: u * texture.width, v: v * texture.height });
            }
        }
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.setTransform(ratio, 0, 0, ratio, margin * ratio, margin * ratio);
        // A soft shadow under it on the desk, gathering in as it balls up.
        const spread = 1 - squeeze * 0.6;
        const shadow = context.createRadialGradient(width / 2, height / 2 + 6, 0, width / 2, height / 2 + 6, Math.max(width, height) * 0.62 * spread);
        shadow.addColorStop(0, `rgba(0, 0, 0, ${(0.12 + squeeze * 0.12).toFixed(3)})`);
        shadow.addColorStop(1, "rgba(0, 0, 0, 0)");
        context.fillStyle = shadow;
        context.fillRect(-margin, -margin, width + margin * 2, height + margin * 2);
        // Facets furthest from the eye first, so nearer ones cover them.
        const triangles = [];
        for (let row = 0; row < rows; row += 1) {
            for (let column = 0; column < columns; column += 1) {
                const a = row * (columns + 1) + column;
                const b = a + 1;
                const c = a + columns + 1;
                const d = c + 1;
                triangles.push([a, b, c], [b, d, c]);
            }
        }
        triangles.sort((first, second) => (points[first[0]].z + points[first[1]].z + points[first[2]].z) - (points[second[0]].z + points[second[1]].z + points[second[2]].z));
        triangles.forEach(([first, second, third]) => {
            const p0 = points[first];
            const p1 = points[second];
            const p2 = points[third];
            // Grown a hair from its middle so neighbouring facets meet without seams.
            const midX = (p0.x + p1.x + p2.x) / 3;
            const midY = (p0.y + p1.y + p2.y) / 3;
            const grow = (point) => {
                const dx = point.x - midX;
                const dy = point.y - midY;
                const length = Math.hypot(dx, dy) || 1;
                return { x: point.x + (dx / length) * 0.6, y: point.y + (dy / length) * 0.6 };
            };
            const g0 = grow(p0);
            const g1 = grow(p1);
            const g2 = grow(p2);
            context.save();
            context.beginPath();
            context.moveTo(g0.x, g0.y);
            context.lineTo(g1.x, g1.y);
            context.lineTo(g2.x, g2.y);
            context.closePath();
            context.clip();
            // Map the note's picture onto the facet.
            const det = p0.u * (p1.v - p2.v) + p1.u * (p2.v - p0.v) + p2.u * (p0.v - p1.v);
            if (det) {
                const a = (p0.x * (p1.v - p2.v) + p1.x * (p2.v - p0.v) + p2.x * (p0.v - p1.v)) / det;
                const b = (p0.y * (p1.v - p2.v) + p1.y * (p2.v - p0.v) + p2.y * (p0.v - p1.v)) / det;
                const c = (p0.x * (p2.u - p1.u) + p1.x * (p0.u - p2.u) + p2.x * (p1.u - p0.u)) / det;
                const d = (p0.y * (p2.u - p1.u) + p1.y * (p0.u - p2.u) + p2.y * (p1.u - p0.u)) / det;
                const e = (p0.x * (p1.u * p2.v - p2.u * p1.v) + p1.x * (p2.u * p0.v - p0.u * p2.v) + p2.x * (p0.u * p1.v - p1.u * p0.v)) / det;
                const f = (p0.y * (p1.u * p2.v - p2.u * p1.v) + p1.y * (p2.u * p0.v - p0.u * p2.v) + p2.y * (p0.u * p1.v - p1.u * p0.v)) / det;
                context.transform(a, b, c, d, e, f);
                if (wrinkling < 1)
                    context.drawImage(texture, 0, 0);
                if (wrinkling > 0) {
                    context.globalAlpha = wrinkling;
                    context.drawImage(wrinkled, 0, 0);
                    context.globalAlpha = 1;
                }
            }
            context.restore();
            // Lit by the way it faces: creases catch the light or fall into shade.
            const ax = p1.x - p0.x;
            const ay = p1.y - p0.y;
            const az = p1.z - p0.z;
            const bx = p2.x - p0.x;
            const by = p2.y - p0.y;
            const bz = p2.z - p0.z;
            let nx = ay * bz - az * by;
            let ny = az * bx - ax * bz;
            let nz = ax * by - ay * bx;
            const length = Math.hypot(nx, ny, nz) || 1;
            nx /= length;
            ny /= length;
            nz /= length;
            if (nz < 0) {
                nx = -nx;
                ny = -ny;
                nz = -nz;
            }
            const lit = nx * light.x + ny * light.y + nz * light.z - flatLight;
            context.beginPath();
            context.moveTo(g0.x, g0.y);
            context.lineTo(g1.x, g1.y);
            context.lineTo(g2.x, g2.y);
            context.closePath();
            context.fillStyle = lit < 0
                ? `rgba(40, 30, 0, ${Math.min(-lit * 1.1, 0.38).toFixed(3)})`
                : `rgba(255, 255, 255, ${Math.min(lit * 1.4, 0.42).toFixed(3)})`;
            context.fill();
        });
        if (progress < 1)
            requestAnimationFrame(frame);
        else
            onBall(canvas);
    };
    requestAnimationFrame(frame);
};
if (aboutIntroSection) {
    const clean = (text) => (text ?? "").replace(/\s+/g, " ").trim();
    const eyebrow = clean(aboutIntroSection.querySelector(".about-personal__eyebrow")?.textContent);
    const title = clean(aboutIntroSection.querySelector("h2")?.textContent);
    const notes = [...aboutIntroSection.querySelectorAll(".about-personal__notes p")].map((note) => clean(note.textContent));
    const titleId = aboutIntroSection.querySelector("h2")?.id ?? "about-personal-title";
    /* Lens -------------------------------------------------------------------- */
    const buildLens = (root) => {
        const notesHtml = notes
            .map((note, index) => `<p><span class="intro-lens__no">0${index + 1}</span>${aboutIntroEscape(note)}</p>`)
            .join("");
        root.innerHTML = `
      <p class="intro-eyebrow">${aboutIntroEscape(eyebrow)}</p>
      <h2 class="intro-title" id="${titleId}">${aboutIntroEscape(title)}</h2>
      <div class="intro-lens">
        <div class="intro-lens__text">${notesHtml}</div>
        <div class="intro-lens__glass" aria-hidden="true"><div class="intro-lens__text">${notesHtml}</div></div>
        <span class="intro-lens__ring" aria-hidden="true"><span>×1.45</span></span>
      </div>
      <p class="intro-hint">I tend to look twice — move over the words</p>`;
        const lens = root.querySelector(".intro-lens");
        const glass = root.querySelector(".intro-lens__glass");
        const magnified = glass?.querySelector(".intro-lens__text");
        const ring = root.querySelector(".intro-lens__ring");
        if (!lens || !glass || !magnified || !ring)
            return () => { };
        const abort = new AbortController();
        const point = { x: 0, y: 0, targetX: 0, targetY: 0, placed: false };
        let hovering = false;
        lens.addEventListener("pointermove", (event) => {
            if (event.pointerType === "touch")
                return;
            const bounds = lens.getBoundingClientRect();
            hovering = true;
            point.targetX = event.clientX - bounds.left;
            point.targetY = event.clientY - bounds.top;
            loop.wake();
        }, { signal: abort.signal });
        lens.addEventListener("pointerleave", () => {
            hovering = false;
        }, { signal: abort.signal });
        const loop = aboutIntroLoop(lens, (now) => {
            const width = lens.clientWidth;
            const height = lens.clientHeight;
            // Left alone, the lens reads along the lines by itself.
            if (!hovering) {
                point.targetX = width * (0.5 + 0.42 * Math.sin(now / 2900));
                point.targetY = height * (0.5 + 0.38 * Math.sin(now / 1100));
            }
            if (!point.placed) {
                point.x = point.targetX;
                point.y = point.targetY;
                point.placed = true;
            }
            const ease = aboutIntroStill.matches ? 1 : hovering ? 0.22 : 0.06;
            point.x += (point.targetX - point.x) * ease;
            point.y += (point.targetY - point.y) * ease;
            const radius = aboutIntroClamp(width * 0.1, 80, 150);
            glass.style.clipPath = `circle(${radius}px at ${point.x.toFixed(1)}px ${point.y.toFixed(1)}px)`;
            magnified.style.transformOrigin = `${point.x.toFixed(1)}px ${point.y.toFixed(1)}px`;
            ring.style.width = ring.style.height = `${radius * 2}px`;
            ring.style.transform = `translate3d(${(point.x - radius).toFixed(1)}px, ${(point.y - radius).toFixed(1)}px, 0)`;
            return !aboutIntroStill.matches || hovering;
        });
        return () => {
            abort.abort();
            loop.stop();
        };
    };
    /* Transcript ---------------------------------------------------------------- */
    const buildTranscript = (root) => {
        const exchanges = [
            { question: "What pulls your attention?", answer: title, lead: true },
            { question: "Where do you find it?", answer: notes[0] ?? "" },
            { question: "How do you like to work?", answer: notes[1] ?? "" },
            { question: "And this page?", answer: notes[2] ?? "" },
        ];
        const time = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
        let clock = 3;
        const lines = exchanges.map(({ question, answer, lead }) => {
            const asked = clock;
            clock += 4;
            const answered = clock;
            clock += Math.round(answer.split(" ").length / 2.6) + 3;
            const answerTag = lead ? "h2" : "p";
            const answerId = lead ? ` id="${titleId}"` : "";
            return `
        <li class="intro-line intro-line--q"><span class="intro-line__time">${time(asked)}</span><span class="intro-line__who">Q.</span><p class="intro-line__text">${aboutIntroEscape(question)}</p></li>
        <li class="intro-line intro-line--a${lead ? " is-lead" : ""}"><span class="intro-line__time">${time(answered)}</span><span class="intro-line__who">R.</span><${answerTag} class="intro-line__text"${answerId}>${aboutIntroWords(answer)}</${answerTag}></li>`;
        }).join("");
        root.innerHTML = `
      <header class="intro-transcript__head">
        <p>${aboutIntroEscape(eyebrow)} — in conversation</p>
        <p>Transcript / Lagos</p>
        <p class="intro-transcript__rec"><i></i> Rec</p>
      </header>
      <ol class="intro-transcript">${lines}</ol>`;
        // Each line types itself in as it arrives; the caret sits on the one in progress.
        const timers = [];
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting)
                    return;
                const line = entry.target;
                observer.unobserve(line);
                line.classList.add("is-typing");
                const words = line.querySelectorAll(".intro-word").length;
                timers.push(window.setTimeout(() => line.classList.add("is-typed"), aboutIntroStill.matches ? 0 : 260 + words * 55));
            });
        }, { rootMargin: "0px 0px -12%" });
        root.querySelectorAll(".intro-line").forEach((line) => observer.observe(line));
        return () => {
            observer.disconnect();
            timers.forEach((timer) => window.clearTimeout(timer));
        };
    };
    /* Desk ---------------------------------------------------------------------- */
    const buildDesk = (root) => {
        const prints = [
            { src: "assets/projects/electronic-botanica/l8.jpg", caption: "Kept / Electronic Botanica" },
            { src: "assets/projects/flip/L3.jpg", caption: "Kept / Flip" },
        ];
        const cards = [
            ...notes.map((note, index) => `
        <article class="intro-card">
          <span class="intro-card__tape" aria-hidden="true"></span>
          <p class="intro-card__no">No. 0${index + 1}</p>
          <p class="intro-card__text">${aboutIntroEscape(note)}</p>
        </article>`),
            ...prints.map((print) => `
        <figure class="intro-card intro-card--print">
          <img src="${print.src}" alt="" draggable="false" loading="lazy" />
          <figcaption>${print.caption}</figcaption>
        </figure>`),
        ].join("");
        root.innerHTML = `
      <p class="intro-eyebrow">${aboutIntroEscape(eyebrow)}</p>
      <div class="intro-desk">
        <div class="intro-desk__centre">
          <h2 class="intro-title intro-desk__title" id="${titleId}">${aboutIntroEscape(title)}</h2>
          <button type="button" class="intro-desk__add" aria-label="Add a note: ask Raheem something">
            <span class="intro-desk__plus" aria-hidden="true">+</span>
            <span class="intro-desk__add-label" aria-hidden="true">Want to ask Raheem something?</span>
          </button>
          <p class="intro-desk__thanks" aria-live="polite"></p>
        </div>
        ${cards}
        <p class="intro-hint intro-desk__hint">Pick them up — move things around, or leave a note</p>
      </div>`;
        const desk = root.querySelector(".intro-desk");
        const add = root.querySelector(".intro-desk__add");
        if (!desk || !add)
            return () => { };
        const abort = new AbortController();
        // Where each lands on the desk, as a share of it, and how it's turned.
        const spots = [
            { x: 0.16, y: 0.74, turn: -5 },
            { x: 0.7, y: 0.86, turn: 3 },
            { x: 0.89, y: 0.58, turn: -2 },
            { x: 0.76, y: 0.2, turn: 7 },
            { x: 0.12, y: 0.24, turn: -9 },
        ];
        let stack = 10;
        const bodyFor = (card, spot) => ({
            card,
            spot,
            x: 0,
            y: 0,
            turn: 0,
            velocityX: 0,
            velocityY: 0,
            spin: 0,
            dropAt: 0,
            settled: false,
            held: false,
        });
        const bodies = [...desk.querySelectorAll(".intro-card")].map((card, index) => bodyFor(card, spots[index % spots.length]));
        let started = 0;
        let hinted = false;
        const place = (body) => {
            body.card.style.transform =
                `translate3d(${(body.x - body.card.offsetWidth / 2).toFixed(1)}px, ${(body.y - body.card.offsetHeight / 2).toFixed(1)}px, 0) rotate(${body.turn.toFixed(2)}deg)`;
        };
        const loop = aboutIntroLoop(desk, (now) => {
            if (!aboutIntroWide.matches)
                return false;
            const width = desk.clientWidth;
            const height = desk.clientHeight;
            if (!started) {
                started = now;
                // Once everything has landed, the plus says what it's for, briefly.
                if (!hinted) {
                    hinted = true;
                    window.setTimeout(() => {
                        add.classList.add("is-hinting");
                        window.setTimeout(() => add.classList.remove("is-hinting"), 2800);
                    }, 1600);
                }
                // Dropped onto the desk one after another, from above.
                bodies.forEach((body, index) => {
                    body.dropAt = now + (aboutIntroStill.matches ? 0 : 160 + index * 140);
                    body.x = body.spot.x * width;
                    body.y = aboutIntroStill.matches ? body.spot.y * height : -body.card.offsetHeight;
                    body.turn = body.spot.turn * (aboutIntroStill.matches ? 1 : 4);
                });
            }
            let moving = false;
            bodies.forEach((body) => {
                if (body.held) {
                    moving = true;
                    place(body);
                    return;
                }
                if (!body.settled) {
                    if (now < body.dropAt) {
                        moving = true;
                        place(body);
                        return;
                    }
                    // Falling into place.
                    body.velocityY += (body.spot.y * height - body.y) * 0.06;
                    body.velocityY *= 0.72;
                    body.spin += (body.spot.turn - body.turn) * 0.06;
                    body.spin *= 0.72;
                    body.y += body.velocityY;
                    body.turn += body.spin;
                    if (Math.abs(body.spot.y * height - body.y) < 0.4 && Math.abs(body.velocityY) < 0.2)
                        body.settled = true;
                    moving = true;
                    place(body);
                    return;
                }
                // Sliding across the desk after a throw.
                if (Math.abs(body.velocityX) + Math.abs(body.velocityY) + Math.abs(body.spin) > 0.05) {
                    body.x += body.velocityX;
                    body.y += body.velocityY;
                    body.turn += body.spin;
                    body.velocityX *= 0.9;
                    body.velocityY *= 0.9;
                    body.spin *= 0.88;
                    const halfWidth = body.card.offsetWidth / 2;
                    const halfHeight = body.card.offsetHeight / 2;
                    if (body.x < halfWidth * 0.4 || body.x > width - halfWidth * 0.4) {
                        body.x = aboutIntroClamp(body.x, halfWidth * 0.4, width - halfWidth * 0.4);
                        body.velocityX *= -0.5;
                    }
                    if (body.y < halfHeight * 0.4 || body.y > height - halfHeight * 0.4) {
                        body.y = aboutIntroClamp(body.y, halfHeight * 0.4, height - halfHeight * 0.4);
                        body.velocityY *= -0.5;
                    }
                    moving = true;
                    place(body);
                }
            });
            return moving;
        });
        const makeMovable = (body) => {
            let lastX = 0;
            let lastY = 0;
            let lastTime = 0;
            body.card.addEventListener("pointerdown", (event) => {
                if (!aboutIntroWide.matches)
                    return;
                // Writing in a note or pressing its button doesn't pick it up.
                if (event.target instanceof Element && event.target.closest("textarea, button"))
                    return;
                event.preventDefault();
                body.held = true;
                body.settled = true;
                body.velocityX = body.velocityY = body.spin = 0;
                stack += 1;
                body.card.style.zIndex = String(stack);
                body.card.classList.add("is-held");
                body.card.setPointerCapture(event.pointerId);
                lastX = event.clientX;
                lastY = event.clientY;
                lastTime = performance.now();
                loop.wake();
            }, { signal: abort.signal });
            body.card.addEventListener("pointermove", (event) => {
                if (!body.held)
                    return;
                const now = performance.now();
                const elapsed = Math.max(now - lastTime, 1) / 16.7;
                const moveX = event.clientX - lastX;
                const moveY = event.clientY - lastY;
                body.x += moveX;
                body.y += moveY;
                body.velocityX = moveX / elapsed;
                body.velocityY = moveY / elapsed;
                // It swings a little with the drag.
                body.turn += (aboutIntroClamp(moveX * 0.6, -14, 14) - (body.turn - body.spot.turn) * 0.1) * 0.08;
                lastX = event.clientX;
                lastY = event.clientY;
                lastTime = now;
            }, { signal: abort.signal });
            const release = () => {
                if (!body.held)
                    return;
                body.held = false;
                body.card.classList.remove("is-held");
                body.spin = body.velocityX * 0.25;
                loop.wake();
            };
            body.card.addEventListener("pointerup", release, { signal: abort.signal });
            body.card.addEventListener("pointercancel", release, { signal: abort.signal });
        };
        bodies.forEach(makeMovable);
        // The plus drops a blank note onto the desk; what's written on it goes
        // to Raheem (see aboutNoteEndpoint), and a sent note is crumpled up and
        // tossed away.
        const thanks = root.querySelector(".intro-desk__thanks");
        let written = 0;
        // Crumple a sent note into a ball (aboutIntroCrumple), then squeeze it
        // once and toss it up off the desk.
        const crumple = (body) => {
            const index = bodies.indexOf(body);
            if (index >= 0)
                bodies.splice(index, 1);
            const { card } = body;
            const finish = (ball) => {
                ball?.remove();
                card.remove();
            };
            if (aboutIntroStill.matches) {
                finish();
                return;
            }
            aboutIntroCrumple(card, desk, 950, (ball) => {
                const toss = (Math.random() < 0.5 ? -1 : 1) * window.innerWidth * 0.45;
                const flight = ball.animate([
                    { scale: "1", rotate: "0deg", translate: "0 0", opacity: 1 },
                    { scale: "0.9", rotate: "-6deg", translate: "0 4px", opacity: 1, offset: 0.14 },
                    { scale: "0.96", rotate: "50deg", translate: `${(toss * 0.25).toFixed(0)}px -24vh`, opacity: 1, offset: 0.45 },
                    { scale: "0.7", rotate: "540deg", translate: `${toss.toFixed(0)}px -100vh`, opacity: 0 },
                ], { duration: 1000, delay: 140, easing: "cubic-bezier(0.33, 0, 0.25, 1)", fill: "forwards" });
                flight.finished.then(() => finish(ball)).catch(() => finish(ball));
            });
        };
        const sendNote = async (message, from) => {
            if (!aboutNoteEndpoint) {
                const subject = encodeURIComponent("A note from your About page");
                const text = from ? `${message}\n\n— ${from}` : message;
                window.location.href = `mailto:${aboutIntroMail}?subject=${subject}&body=${encodeURIComponent(text)}`;
                return true;
            }
            const response = await fetch(aboutNoteEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ message, email: from || undefined, _subject: "A note from your About page" }),
            });
            return response.ok;
        };
        add.addEventListener("click", () => {
            if (desk.querySelectorAll(".intro-card--note").length >= 4)
                return;
            written += 1;
            const card = document.createElement("article");
            card.className = "intro-card intro-card--note";
            card.innerHTML = `
        <span class="intro-card__tape" aria-hidden="true"></span>
        <p class="intro-card__no">For Raheem</p>
        <label class="visually-hidden" for="intro-note-${written}">Your note to Raheem</label>
        <textarea id="intro-note-${written}" class="intro-card__field" rows="5" placeholder="Want to know more about Raheem?"></textarea>
        <label class="visually-hidden" for="intro-from-${written}">Your email, for a reply</label>
        <input id="intro-from-${written}" class="intro-card__from" type="email" placeholder="Your email, for a reply (optional)" autocomplete="email" />
        <div class="intro-card__actions">
          <span class="intro-card__status" aria-live="polite"></span>
          <button type="button" class="intro-card__send">Send <span aria-hidden="true">↗</span></button>
        </div>`;
            desk.append(card);
            stack += 1;
            card.style.zIndex = String(stack);
            const field = card.querySelector("textarea");
            const from = card.querySelector(".intro-card__from");
            const send = card.querySelector(".intro-card__send");
            const status = card.querySelector(".intro-card__status");
            send?.addEventListener("click", async () => {
                const message = field?.value.trim() ?? "";
                if (!message) {
                    card.classList.remove("is-empty");
                    void card.offsetWidth;
                    card.classList.add("is-empty");
                    field?.focus();
                    return;
                }
                if (send)
                    send.disabled = true;
                if (status)
                    status.textContent = aboutNoteEndpoint ? "Sending…" : "";
                let sent = false;
                try {
                    sent = await sendNote(message, from?.value.trim() ?? "");
                }
                catch {
                    sent = false;
                }
                if (!sent) {
                    if (send)
                        send.disabled = false;
                    if (status)
                        status.textContent = "Didn't send — try again";
                    return;
                }
                const body = bodies.find((candidate) => candidate.card === card);
                if (body)
                    crumple(body);
                if (thanks) {
                    thanks.textContent = aboutNoteEndpoint ? "Sent — thanks for the note." : "Over to your mail app — thanks for the note.";
                    thanks.classList.add("is-shown");
                    window.setTimeout(() => thanks.classList.remove("is-shown"), 3600);
                }
            }, { signal: abort.signal });
            const body = bodyFor(card, { x: 0.5 + ((written % 3) - 1) * 0.16, y: 0.46, turn: (written % 2 ? -1 : 1) * (2 + written) });
            bodies.push(body);
            if (aboutIntroWide.matches && started) {
                body.x = body.spot.x * desk.clientWidth;
                body.y = -card.offsetHeight;
                body.turn = body.spot.turn * 4;
                body.dropAt = performance.now();
            }
            makeMovable(body);
            loop.wake();
            // Focus once it has landed, so the page doesn't jump to it mid-fall.
            window.setTimeout(() => field?.focus({ preventScroll: true }), aboutIntroStill.matches ? 0 : 500);
        }, { signal: abort.signal });
        window.addEventListener("resize", () => {
            started = 0;
            bodies.forEach((body) => {
                body.settled = false;
            });
            loop.wake();
        }, { signal: abort.signal });
        return () => {
            abort.abort();
            loop.stop();
        };
    };
    /* Margins ------------------------------------------------------------------- */
    const buildMargins = (root) => {
        // Which word each note answers to.
        const annotated = [
            { word: "something", note: 0 },
            { word: "feel", note: 1 },
            { word: "human.", note: 2 },
        ];
        const keys = ["a", "b", "c"];
        const titleHtml = aboutIntroEscape(title)
            .split(" ")
            .map((word) => {
            const mark = annotated.find((entry) => entry.word === word);
            return mark ? `<mark class="intro-mark" data-key="${keys[mark.note]}">${word}</mark>` : word;
        })
            .join(" ");
        root.innerHTML = `
      <p class="intro-eyebrow">${aboutIntroEscape(eyebrow)}</p>
      <div class="intro-margins">
        <h2 class="intro-title intro-margins__title" id="${titleId}">${titleHtml}</h2>
        <svg class="intro-margins__ink" aria-hidden="true"></svg>
        <div class="intro-margins__notes">
          ${notes.map((note, index) => `<aside class="intro-note" data-key="${keys[index]}"><span class="intro-note__key">${keys[index]}</span><p>${aboutIntroEscape(note)}</p></aside>`).join("")}
        </div>
      </div>`;
        const sheet = root.querySelector(".intro-margins");
        const ink = root.querySelector(".intro-margins__ink");
        if (!sheet || !ink)
            return () => { };
        const abort = new AbortController();
        let strokes = [];
        // A loose, hand-drawn loop around a word: an ellipse that overshoots
        // where it started, with a little wobble.
        const loopAround = (box, seed) => {
            const centreX = box.left + box.width / 2;
            const centreY = box.top + box.height * 0.55;
            const radiusX = box.width / 2 + 18;
            const radiusY = box.height / 2 + 6;
            const points = [];
            for (let step = 0; step <= 44; step += 1) {
                const angle = -2.6 + (step / 40) * Math.PI * 2;
                const wobble = 1 + Math.sin(step * 0.33 + seed) * 0.045 + step * 0.0014;
                points.push(`${(centreX + Math.cos(angle) * radiusX * wobble).toFixed(1)} ${(centreY + Math.sin(angle) * radiusY * wobble).toFixed(1)}`);
            }
            return `M ${points.join(" L ")}`;
        };
        const draw = () => {
            const sheetBox = sheet.getBoundingClientRect();
            ink.setAttribute("viewBox", `0 0 ${sheet.clientWidth} ${sheet.clientHeight}`);
            ink.innerHTML = "";
            strokes = [];
            if (!aboutIntroWide.matches)
                return;
            // Notes line up in the same order as their words across the page, so
            // the leaders don't cross.
            const marks = [...sheet.querySelectorAll(".intro-mark")];
            [...marks]
                .sort((first, second) => first.getBoundingClientRect().left - second.getBoundingClientRect().left)
                .forEach((mark, rank) => {
                sheet.querySelector(`.intro-note[data-key="${mark.dataset.key}"]`)?.style.setProperty("order", String(rank));
            });
            marks.forEach((mark, index) => {
                const note = sheet.querySelector(`.intro-note[data-key="${mark.dataset.key}"]`);
                if (!note)
                    return;
                const raw = mark.getBoundingClientRect();
                const box = new DOMRect(raw.left - sheetBox.left, raw.top - sheetBox.top, raw.width, raw.height);
                const noteBox = note.getBoundingClientRect();
                const circle = document.createElementNS("http://www.w3.org/2000/svg", "path");
                circle.setAttribute("d", loopAround(box, index * 2.3));
                circle.setAttribute("class", "intro-margins__loop");
                // The leader leaves the loop's foot and lands on the note's key.
                const fromX = box.left + box.width / 2;
                const fromY = box.bottom + 10;
                const toX = noteBox.left - sheetBox.left + 8;
                const toY = noteBox.top - sheetBox.top - 10;
                const leader = document.createElementNS("http://www.w3.org/2000/svg", "path");
                leader.setAttribute("d", `M ${fromX.toFixed(1)} ${fromY.toFixed(1)} C ${fromX.toFixed(1)} ${(fromY + (toY - fromY) * 0.6).toFixed(1)}, ${toX.toFixed(1)} ${(toY - (toY - fromY) * 0.5).toFixed(1)}, ${toX.toFixed(1)} ${toY.toFixed(1)}`);
                leader.setAttribute("class", "intro-margins__leader");
                ink.append(circle, leader);
                const lengths = [circle.getTotalLength(), leader.getTotalLength()];
                circle.style.strokeDasharray = `${lengths[0]}`;
                leader.style.strokeDasharray = `${lengths[1]}`;
                strokes.push({ circle, leader, note, lengths });
            });
        };
        // Scrolling down the sheet draws each annotation in turn.
        const loop = aboutIntroLoop(sheet, () => {
            const box = sheet.getBoundingClientRect();
            const height = window.innerHeight;
            const progress = aboutIntroStill.matches ? 1 : aboutIntroClamp((height * 0.85 - box.top) / (box.height * 0.9), 0, 1);
            strokes.forEach((stroke, index) => {
                const own = aboutIntroClamp((progress - index * 0.18) / 0.5, 0, 1);
                const ring = aboutIntroSmooth(aboutIntroClamp(own / 0.45, 0, 1));
                const line = aboutIntroSmooth(aboutIntroClamp((own - 0.4) / 0.45, 0, 1));
                stroke.circle.style.strokeDashoffset = `${(stroke.lengths[0] * (1 - ring)).toFixed(1)}`;
                stroke.leader.style.strokeDashoffset = `${(stroke.lengths[1] * (1 - line)).toFixed(1)}`;
                stroke.note.style.setProperty("--shown", aboutIntroClamp((own - 0.75) / 0.25, 0, 1).toFixed(3));
            });
            return false;
        });
        const redraw = () => {
            draw();
            loop.wake();
        };
        window.addEventListener("scroll", loop.wake, { passive: true, signal: abort.signal });
        window.addEventListener("resize", redraw, { signal: abort.signal });
        document.fonts?.ready.then(redraw);
        requestAnimationFrame(redraw);
        return () => {
            abort.abort();
            loop.stop();
        };
    };
    /* Slot ------------------------------------------------------------------------ */
    const buildSlot = (root) => {
        const phrases = ["a street sign", "the pacing of a film", "the shape of a sentence", "one tiny interaction", "a quiet conversation", "something"];
        root.innerHTML = `
      <div class="intro-slot">
        <div class="intro-slot__pin">
          <p class="intro-eyebrow">${aboutIntroEscape(eyebrow)}</p>
          <h2 class="intro-title intro-slot__title" id="${titleId}">
            I’m interested in what makes
            <span class="intro-slot__reel" aria-hidden="true"><span class="intro-slot__track">${phrases.map((phrase) => `<span>${phrase}</span>`).join("")}</span></span><span class="visually-hidden">something</span>
            feel human.
          </h2>
          <p class="intro-slot__count" aria-hidden="true"><span>01</span> / ${String(phrases.length).padStart(2, "0")}</p>
          <div class="intro-slot__notes">
            ${notes.map((note, index) => `<p><span>0${index + 1}</span>${aboutIntroEscape(note)}</p>`).join("")}
          </div>
        </div>
      </div>`;
        const slot = root.querySelector(".intro-slot");
        const reel = root.querySelector(".intro-slot__reel");
        const track = root.querySelector(".intro-slot__track");
        const count = root.querySelector(".intro-slot__count span");
        if (!slot || !reel || !track)
            return () => { };
        const abort = new AbortController();
        const spans = [...track.querySelectorAll("span")];
        let widths = [];
        const measure = () => {
            widths = spans.map((span) => span.scrollWidth);
        };
        const loop = aboutIntroLoop(slot, () => {
            if (!widths.length)
                measure();
            const range = slot.offsetHeight - window.innerHeight;
            const progress = range > 0 ? aboutIntroClamp(-slot.getBoundingClientRect().top / range, 0, 1) : 1;
            // Rolls through the phrases with a short hold on each, landing on the
            // last with time to spare.
            const position = aboutIntroClamp(progress / 0.78, 0, 1) * (phrases.length - 1);
            const index = Math.floor(position);
            const fraction = position - index;
            const eased = index + aboutIntroSmooth(aboutIntroClamp((fraction - 0.3) / 0.4, 0, 1));
            const next = Math.min(index + 1, phrases.length - 1);
            const width = widths[index] + (widths[next] - widths[index]) * (eased - index);
            track.style.transform = `translate3d(0, ${(-eased * 1.04).toFixed(4)}em, 0)`;
            reel.style.width = `${width.toFixed(1)}px`;
            if (count)
                count.textContent = String(Math.round(eased) + 1).padStart(2, "0");
            slot.classList.toggle("is-landed", progress > 0.8);
            return false;
        });
        window.addEventListener("scroll", loop.wake, { passive: true, signal: abort.signal });
        window.addEventListener("resize", () => {
            measure();
            loop.wake();
        }, { signal: abort.signal });
        document.fonts?.ready.then(() => {
            measure();
            loop.wake();
        });
        return () => {
            abort.abort();
            loop.stop();
        };
    };
    /* Choosing ------------------------------------------------------------------------ */
    const builders = {
        lens: buildLens,
        transcript: buildTranscript,
        desk: buildDesk,
        margins: buildMargins,
        slot: buildSlot,
    };
    const stage = document.createElement("div");
    stage.className = "intro-stage";
    aboutIntroSection.replaceChildren(stage);
    const requested = new URLSearchParams(window.location.search).get("intro");
    const chosen = isAboutIntro(requested) ? requested : "desk";
    aboutIntroSection.dataset.intro = chosen;
    builders[chosen](stage);
}
