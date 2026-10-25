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
            { src: "assets/projects/electronic-botanica/l8.webp", caption: "Kept / Electronic Botanica" },
            { src: "assets/projects/flip/L3.webp", caption: "Kept / Flip" },
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
            <span class="intro-desk__plus" aria-hidden="true"></span>
            <span class="intro-desk__trail" aria-hidden="true"></span>
            <svg class="intro-desk__plane" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.5 2.5 2.8 10.3l7.1 2.8 2.8 7.1 8.8-17.7Z" /><path class="intro-desk__plane-fold" d="m9.9 13.1 11.6-10.6" /></svg>
            <svg class="intro-desk__check" viewBox="0 0 24 24" aria-hidden="true"><path d="m5.5 12.5 4.2 4.2 8.8-9.4" pathLength="1" /></svg>
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
                // Writing in a note or pressing its buttons doesn't pick it up.
                if (event.target instanceof Element && event.target.closest("textarea, input, button"))
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
        // to Raheem (see aboutNoteEndpoint), and a sent note leaves the desk
        // (sendAway).
        const thanks = root.querySelector(".intro-desk__thanks");
        let written = 0;
        // A sent note shrinks back into the plus it came from, and the plus
        // turns into a paper plane that takes off (see below).
        const plus = add.querySelector(".intro-desk__plus");
        const plane = add.querySelector(".intro-desk__plane");
        const trail = add.querySelector(".intro-desk__trail");
        const check = add.querySelector(".intro-desk__check");
        const sendAway = (body) => {
            const index = bodies.indexOf(body);
            if (index >= 0)
                bodies.splice(index, 1);
            const { card } = body;
            card.classList.add("is-sent");
            if (aboutIntroStill.matches) {
                card.remove();
                return;
            }
            // Placed the way the desk places it, moved by (dx, dy), turned to
            // `turn` and scaled about its own middle.
            const placed = (dx, dy, turn, scale = 1) => `translate3d(${(body.x - card.offsetWidth / 2 + dx).toFixed(1)}px, ${(body.y - card.offsetHeight / 2 + dy).toFixed(1)}px, 0) rotate(${turn.toFixed(2)}deg) scale(${scale})`;
            const deskBox = desk.getBoundingClientRect();
            const plusBox = add.getBoundingClientRect();
            const toX = plusBox.left + plusBox.width / 2 - deskBox.left - body.x;
            const toY = plusBox.top + plusBox.height / 2 - deskBox.top - body.y;
            const away = card.animate([
                { transform: placed(0, 0, body.turn), opacity: 1 },
                { transform: placed(0, -8, body.turn, 1.02), opacity: 1, offset: 0.18 },
                { transform: placed(toX, toY, 0, 0.06), opacity: 0 },
            ], { duration: 760, easing: "cubic-bezier(0.6, 0, 0.25, 1)", fill: "forwards" });
            away.finished.then(() => card.remove()).catch(() => card.remove());
            // The plus takes it in: the circle floods with ink, the plus turns
            // into a paper plane that winds back and launches off with a streak,
            // a tick draws in, and the circle settles back to the plus.
            const arrive = 640;
            const total = 2300;
            // One shared timeline; each step eases on its own (keyframe easings).
            const timing = { duration: total, delay: arrive, easing: "linear" };
            // Air as the plane launches, a chime with the tick.
            window.setTimeout(() => siteSound.whoosh(), arrive + total * 0.25);
            window.setTimeout(() => {
                siteSound.chime();
                siteSound.buzz(12);
            }, arrive + total * 0.45);
            add.animate([
                { backgroundColor: "rgba(11, 11, 11, 0)", color: "#0b0b0b", scale: "1" },
                { backgroundColor: "#0b0b0b", color: "#f1f1ed", scale: "1.14", offset: 0.07 },
                { backgroundColor: "#0b0b0b", color: "#f1f1ed", scale: "1", offset: 0.16 },
                { backgroundColor: "#0b0b0b", color: "#f1f1ed", scale: "1", offset: 0.8 },
                { backgroundColor: "rgba(11, 11, 11, 0)", color: "#0b0b0b", scale: "1" },
            ], timing);
            plus?.animate([
                { opacity: 1, transform: "rotate(0deg) scale(1)" },
                { opacity: 0, transform: "rotate(90deg) scale(0.3)", offset: 0.08 },
                { opacity: 0, transform: "rotate(-90deg) scale(0.3)", offset: 0.84 },
                { opacity: 1, transform: "rotate(0deg) scale(1)" },
            ], timing);
            plane?.animate([
                { opacity: 0, transform: "translate(-6px, 6px) scale(0.3) rotate(-20deg)", easing: "cubic-bezier(0.2, 0.9, 0.3, 1.3)" },
                { opacity: 1, transform: "translate(0, 0) scale(1) rotate(0deg)", offset: 0.12 },
                // Wound back, like a throw being loaded.
                { opacity: 1, transform: "translate(-4px, 4px) scale(0.9) rotate(-8deg)", offset: 0.24, easing: "cubic-bezier(0.6, 0, 0.9, 0.4)" },
                { opacity: 1, transform: "translate(22px, -22px) scale(0.85) rotate(4deg)", offset: 0.33 },
                { opacity: 0, transform: "translate(46px, -46px) scale(0.6) rotate(6deg)", offset: 0.4 },
                { opacity: 0, transform: "translate(46px, -46px) scale(0.6)" },
            ], timing);
            trail?.animate([
                { opacity: 0, transform: "rotate(-45deg) scaleX(0)" },
                { opacity: 0, transform: "rotate(-45deg) scaleX(0)", offset: 0.25 },
                { opacity: 1, transform: "rotate(-45deg) scaleX(1)", offset: 0.33 },
                { opacity: 0, transform: "rotate(-45deg) scaleX(1) translateX(30%)", offset: 0.46 },
                { opacity: 0, transform: "rotate(-45deg) scaleX(0)" },
            ], timing);
            check?.animate([
                { opacity: 0, strokeDashoffset: 1 },
                { opacity: 0, strokeDashoffset: 1, offset: 0.4 },
                { opacity: 1, strokeDashoffset: 1, offset: 0.42 },
                { opacity: 1, strokeDashoffset: 0, offset: 0.54 },
                { opacity: 1, strokeDashoffset: 0, offset: 0.76 },
                { opacity: 0, strokeDashoffset: 0, offset: 0.82 },
                { opacity: 0, strokeDashoffset: 0 },
            ], timing);
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
            siteSound.pop();
            written += 1;
            const card = document.createElement("article");
            card.className = "intro-card intro-card--note";
            card.innerHTML = `
        <span class="intro-card__tape" aria-hidden="true"></span>
        <button type="button" class="intro-card__close" aria-label="Discard this note">×</button>
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
            // The × discards the note: it drops away and is gone.
            card.querySelector(".intro-card__close")?.addEventListener("click", () => {
                siteSound.tick(0.4);
                const body = bodies.find((candidate) => candidate.card === card);
                if (body)
                    bodies.splice(bodies.indexOf(body), 1);
                const away = card.animate([
                    { scale: "1", translate: "0 0", opacity: 1 },
                    { scale: "0.9", translate: "0 24px", opacity: 0 },
                ], { duration: aboutIntroStill.matches ? 1 : 260, easing: "cubic-bezier(0.5, 0, 0.75, 0)", fill: "forwards" });
                away.finished.then(() => card.remove()).catch(() => card.remove());
            }, { signal: abort.signal });
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
                    sendAway(body);
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
