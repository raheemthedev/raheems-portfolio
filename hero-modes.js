"use strict";
// Homepage hero variants, rendered into .hero-alt. Horizon is the default and
// Field the alternative; Index, Orbit and the original project wheel in
// script.ts ("classic") are parked but intact. Pick one with
// ?hero=horizon|field|index|orbit|classic — the last offered choice is
// remembered. Shares `projects`, `clamp`, `modulo` and `reducedMotion` with
// script.ts, and `createIndexList` / `transitionToPage` with index-list.ts.
// The switcher offers these; Index, Orbit and the original wheel ("classic")
// are parked — still built, reachable only by ?hero=index|orbit|classic.
const heroVariants = [
    { id: "horizon", label: "Horizon" },
    { id: "field", label: "Field" },
];
const heroParkedVariants = ["index", "orbit", "classic"];
const heroStorageKey = "raheem-hero-variant";
const heroSurface = document.querySelector(".hero-alt");
const heroLanding = document.querySelector(".landing");
if (!heroSurface || !heroLanding) {
    throw new Error("Hero variant markup is incomplete.");
}
const heroLerp = (from, to, amount) => from + (to - from) * amount;
const heroEaseOut = (progress) => 1 - Math.pow(1 - clamp(progress, 0, 1), 4);
const heroApproach = (delta, duration) => 1 - Math.exp(-delta / duration);
const heroSmoothstep = (edge0, edge1, value) => {
    const progress = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return progress * progress * (3 - 2 * progress);
};
// Deterministic scatter so every visit sees the same composition.
const heroRandom = (seed) => () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
};
const heroTitle = (project) => project.title.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const heroTags = (project) => project.tags
    .filter((tag) => tag !== "PLACEHOLDER")
    .map((tag) => tag.charAt(0) + tag.slice(1).toLowerCase())
    .join(" · ");
const heroHref = (project) => `case-study.html?project=${encodeURIComponent(project.number)}`;
// Projects without artwork yet still name themselves on the tile, so every
// tile reads as work at a glance.
const heroTileMarkup = (project) => `
  <span class="hero-tile hero-tile--${project.style}">
    ${project.image
    ? `<img src="${project.image}" alt="" draggable="false" />`
    : `
        <span class="hero-tile__copy">
          <span class="hero-tile__title">${heroTitle(project)}</span>
          <span class="hero-tile__meta">${heroTags(project)}</span>
        </span>
        <span class="hero-tile__number">${project.number}</span>
      `}
  </span>
`;
const openHeroProject = (project, from) => {
    transitionToPage(heroHref(project), heroTileMarkup(project), from, heroTitle(project));
};
const heroWait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));
const heroEntries = [
    { id: "edge", label: "Edge" },
    { id: "dark", label: "Dark" },
];
const heroEntryKey = "raheem-hero-entry";
const isHeroEntry = (value) => heroEntries.some((entry) => entry.id === value);
const heroEaseInOut = (progress) => progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
// Hover caption shared by the Field and Orbit variants.
const heroCaption = document.createElement("div");
heroCaption.className = "hero-caption";
heroCaption.setAttribute("aria-hidden", "true");
heroCaption.innerHTML = "<small></small><strong></strong><span></span>";
const heroCaptionNumber = heroCaption.querySelector("small");
const heroCaptionTitle = heroCaption.querySelector("strong");
const heroCaptionTags = heroCaption.querySelector("span");
let heroCaptionProject = null;
const showHeroCaption = (project) => {
    if (project === heroCaptionProject)
        return;
    heroCaptionProject = project;
    heroCaption.classList.toggle("is-visible", project !== null);
    if (!project)
        return;
    heroCaptionNumber.textContent = `${project.number} / ${String(projects.length).padStart(2, "0")}`;
    heroCaptionTitle.textContent = heroTitle(project);
    heroCaptionTags.textContent = heroTags(project);
    // Restart the swap animation so each new project announces itself.
    heroCaption.classList.remove("is-swapping");
    void heroCaption.offsetWidth;
    heroCaption.classList.add("is-swapping");
};
const heroControls = document.createElement("div");
heroControls.className = "hero-controls";
const heroSwitch = document.createElement("div");
heroSwitch.className = "hero-switch";
heroSwitch.setAttribute("role", "group");
heroSwitch.setAttribute("aria-label", "Homepage hero variant");
heroSwitch.innerHTML = heroVariants
    .map((variant) => `<button type="button" data-hero-variant="${variant.id}" aria-pressed="false">${variant.label}</button>`)
    .join("");
heroControls.append(heroSwitch);
heroLanding.append(heroCaption, heroControls);
// Pointer position normalised to -1…1 across the landing.
const heroPointer = { x: 0, y: 0, active: false };
// One animation loop for whichever variant is mounted. It sleeps while the
// landing is off screen or the tab is hidden, unless a variant keeps it awake.
let activeHeroMode = null;
let heroFrame = null;
let heroLastFrame = 0;
let heroLandingVisible = true;
let heroKeepAwake = false;
const heroTick = (now) => {
    heroFrame = null;
    const delta = clamp(now - heroLastFrame, 4, 40);
    heroLastFrame = now;
    if (!activeHeroMode || (!heroLandingVisible && !heroKeepAwake) || document.hidden)
        return;
    // A mode may already have asked for the next frame from inside its own.
    if (activeHeroMode.frame(now, delta) && heroFrame === null)
        heroFrame = requestAnimationFrame(heroTick);
};
const requestHeroFrame = () => {
    if (heroFrame !== null || !activeHeroMode)
        return;
    heroLastFrame = performance.now();
    heroFrame = requestAnimationFrame(heroTick);
};
const createHeroDrag = () => ({
    active: false,
    distance: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    velocityX: 0,
    velocityY: 0,
    target: null,
});
const bindHeroDrag = (element, drag, signal, handlers) => {
    element.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 || (event.target instanceof Element && event.target.closest("button")))
            return;
        drag.active = true;
        drag.distance = 0;
        drag.lastX = event.clientX;
        drag.lastY = event.clientY;
        drag.lastTime = performance.now();
        drag.velocityX = 0;
        drag.velocityY = 0;
        drag.target = event.target instanceof Element ? event.target : null;
        element.setPointerCapture(event.pointerId);
        requestHeroFrame();
    }, { signal });
    element.addEventListener("pointermove", (event) => {
        if (!drag.active)
            return;
        const now = performance.now();
        const elapsed = Math.max(1, now - drag.lastTime);
        const deltaX = event.clientX - drag.lastX;
        const deltaY = event.clientY - drag.lastY;
        drag.distance += Math.abs(deltaX) + Math.abs(deltaY);
        drag.velocityX = deltaX / elapsed;
        drag.velocityY = deltaY / elapsed;
        drag.lastX = event.clientX;
        drag.lastY = event.clientY;
        drag.lastTime = now;
        element.classList.toggle("is-dragging", drag.distance > 6);
        handlers.onMove(deltaX, deltaY);
        requestHeroFrame();
    }, { signal });
    const finish = (event) => {
        if (!drag.active)
            return;
        drag.active = false;
        element.classList.remove("is-dragging");
        if (element.hasPointerCapture(event.pointerId))
            element.releasePointerCapture(event.pointerId);
        // A stale release should not fling the scene.
        const freshness = clamp(1 - (performance.now() - drag.lastTime) / 110, 0, 1);
        drag.velocityX *= freshness;
        drag.velocityY *= freshness;
        if (event.type === "pointerup" && drag.distance <= 6 && drag.target) {
            handlers.onTap(drag.target);
        }
        else {
            handlers.onRelease?.();
        }
        requestHeroFrame();
    };
    element.addEventListener("pointerup", finish, { signal });
    element.addEventListener("pointercancel", finish, { signal });
    element.addEventListener("dragstart", (event) => event.preventDefault(), { signal });
    element.addEventListener("click", (event) => {
        const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
        if (!link)
            return;
        event.preventDefault();
        // Keyboard activation arrives as a click without a pointer press.
        if (event.detail === 0)
            handlers.onTap(link);
    }, { signal });
};
const createHeroField = () => {
    const PERSPECTIVE = 900;
    const DEPTH = 2400;
    const NEAR = 260;
    const DRIFT = 0.045;
    const SCROLL_PUSH = 0.024;
    const REPEL_RADIUS = 320;
    const REPEL_STRENGTH = 70;
    const COLUMNS = 5;
    const ROWS = 4;
    const LAYERS = 3;
    // Where each project sits when the field first settles: a fraction of the
    // half-screen from centre, and how far away it is.
    const OPENING = [
        { x: -0.6, y: 0.44, z: -330 },
        { x: 0.6, y: 0.4, z: -420 },
        { x: -0.68, y: -0.34, z: -700 },
        { x: 0.66, y: -0.4, z: -780 },
        { x: -0.2, y: 0.74, z: -980 },
        { x: 0.3, y: 0.76, z: -1100 },
    ];
    let field = null;
    let world = null;
    let cursor = null;
    let cursorLabel = null;
    let hint = null;
    let spaceButton = null;
    let cards = [];
    let width = 1;
    let height = 1;
    let wrapX = 1;
    let wrapY = 1;
    let cameraZ = 0;
    let drift = DRIFT;
    let push = 0;
    let flight = 0;
    let zoom = 1;
    let zoomTarget = 1;
    let zoomTime = 300;
    let panX = 0;
    let panY = 0;
    let lookX = 0;
    let lookY = 0;
    let pointerX = 0;
    let pointerY = 0;
    let pointerInside = false;
    let presence = 0;
    let cursorX = 0;
    let cursorY = 0;
    let cursorText = "";
    let introStart = -1;
    let immersive = false;
    let travelling = false;
    let hintTimer = 0;
    let hovered = null;
    let opening = false;
    let lastScrollY = window.scrollY;
    let dive = 0;
    let glow = 1;
    let night = false;
    let entry = "edge";
    let entryPicker = null;
    let tipAnimations = [];
    const tweens = new Set();
    const drag = createHeroDrag();
    const depthScale = (z) => PERSPECTIVE / Math.max(PERSPECTIVE - z, 1);
    const layout = () => {
        if (!field)
            return;
        width = field.clientWidth || window.innerWidth;
        height = field.clientHeight || window.innerHeight;
        // The field spans exactly what is visible at the far edge, so wrapping
        // tiles never leave an empty band on screen.
        const farScale = depthScale(-DEPTH + NEAR + 300);
        wrapX = width / 2 / farScale + 200;
        wrapY = height / 2 / farScale + 200;
        cards.forEach((card) => {
            if (card.slot < 0)
                return;
            const opening = OPENING[card.slot % OPENING.length];
            const scale = depthScale(opening.z);
            card.nx = (opening.x * (width / 2)) / scale / wrapX;
            card.ny = (opening.y * (height / 2)) / scale / wrapY;
        });
    };
    const showHint = () => {
        window.clearTimeout(hintTimer);
        hint?.classList.add("is-visible");
        hintTimer = window.setTimeout(() => hint?.classList.remove("is-visible"), 4200);
    };
    const setImmersive = (enabled) => {
        if (enabled === immersive || !field)
            return;
        immersive = enabled;
        heroKeepAwake = enabled;
        document.documentElement.classList.toggle("is-hero-immersive", enabled);
        field.classList.toggle("is-immersive", enabled);
        spaceButton?.setAttribute("aria-pressed", String(enabled));
        labelSpaceButton();
        if (enabled) {
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
            field.focus({ preventScroll: true });
        }
        else {
            window.clearTimeout(hintTimer);
            hint?.classList.remove("is-visible");
        }
        layout();
        requestHeroFrame();
    };
    // The entry choreography animates these numbers; the frame loop steps them
    // so they stay in sync with the field.
    const tween = (set, from, to, duration, easing = heroEaseInOut) => new Promise((resolve) => {
        tweens.add({ set, from, to, start: performance.now(), duration, easing, done: resolve });
        requestHeroFrame();
    });
    const setZoom = (value) => {
        zoom = value;
        zoomTarget = value;
    };
    const setDive = (value) => {
        dive = value;
    };
    const easeIn = (progress) => progress ** 3;
    const easeOut = (progress) => 1 - (1 - progress) ** 3;
    // The space button reads as an instruction for the chosen entry.
    const labelSpaceButton = () => {
        const label = spaceButton?.querySelector("span:last-child");
        if (label)
            label.textContent = immersive ? "Leave space" : "Enter space";
    };
    const setGlow = (value) => {
        glow = value;
    };
    const fadeField = (to, duration) => {
        if (!field)
            return Promise.resolve();
        const from = getComputedStyle(field).opacity;
        return field
            .animate([{ opacity: from }, { opacity: String(to) }], { duration, easing: "ease-out", fill: "forwards" })
            .finished.then(() => undefined, () => undefined);
    };
    // After a trip, the landing's tiles fly back in as they do on first load.
    const returnToLanding = async () => {
        await fadeField(0, 0);
        reveal();
        void fadeField(1, 600);
    };
    // The project closest to the middle of the screen, weighted to nearer ones.
    const frontCard = () => {
        let best = null;
        let bestScore = Infinity;
        for (const card of cards) {
            if (!card.project || !card.shown)
                continue;
            const score = Math.hypot(card.screenX, card.screenY) / Math.max(card.screenScale, 0.1);
            if (score < bestScore) {
                bestScore = score;
                best = card;
            }
        }
        return best;
    };
    const buttonCentre = () => {
        const bounds = spaceButton?.getBoundingClientRect();
        return bounds
            ? { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 }
            : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    };
    // The landing's type, tipped up and away around a hinge at the top of the
    // screen ("edge"), or swung back down into place.
    const tipPage = (away, duration, easing) => {
        const previous = tipAnimations;
        tipAnimations = [".statement", ".hero-cta", ".scroll-cue"].flatMap((selector) => {
            const element = document.querySelector(selector);
            if (!element)
                return [];
            const bounds = element.getBoundingClientRect();
            const base = getComputedStyle(element).transform;
            const prefix = base === "none" ? "" : `${base} `;
            const upright = { transform: `${prefix}perspective(1100px) rotateX(0deg)`, opacity: 1, transformOrigin: `50% ${-bounds.top}px` };
            const tipped = { transform: `${prefix}perspective(1100px) rotateX(84deg)`, opacity: 0, transformOrigin: `50% ${-bounds.top}px` };
            return [element.animate(away ? [upright, tipped] : [tipped, upright], { duration, easing, fill: "forwards" })];
        });
        previous.forEach((animation) => animation.cancel());
        return Promise.all(tipAnimations.map((animation) => animation.finished)).then(() => undefined, () => undefined);
    };
    const setNight = (enabled) => {
        night = enabled;
        field?.classList.toggle("is-night", enabled);
        document.documentElement.classList.toggle("is-hero-night", enabled);
    };
    const entryMoves = {
        // Edge: the page tips up and away as the work starts rushing at you, and
        // you dive straight into the field.
        edge: {
            enter: async () => {
                await Promise.all([
                    tipPage(true, 900, "cubic-bezier(0.6, 0, 0.8, 0.4)"),
                    tween(setDive, 0, 9, 900, easeIn),
                ]);
                setImmersive(true);
                setZoom(1.12);
                await Promise.all([tween(setDive, 9, 0, 1600, easeOut), tween(setZoom, 1.12, 1, 1600, easeOut)]);
            },
            leave: async () => {
                await tween(setDive, 0, -8, 700, easeIn);
                setImmersive(false);
                await Promise.all([
                    tipPage(false, 1000, "cubic-bezier(0.2, 0.6, 0.35, 1)"),
                    tween(setDive, -8, 0, 1000, easeOut),
                ]);
                tipAnimations.forEach((animation) => animation.cancel());
                tipAnimations = [];
            },
        },
        // Lights out: darkness spreads from the button, then the tiles glow up
        // one by one in a black, cinematic space.
        dark: {
            enter: async () => {
                if (!field)
                    return;
                const { x, y } = buttonCentre();
                const reach = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
                glow = 0;
                setNight(true);
                setImmersive(true);
                push = 1.5;
                const spread = field.animate([{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${reach}px at ${x}px ${y}px)` }], { duration: 1050, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "forwards" });
                await heroWait(420);
                await Promise.all([spread.finished, tween(setGlow, 0, 1, 2000, (progress) => 1 - (1 - progress) ** 2)]);
                spread.cancel();
            },
            leave: async () => {
                if (!field)
                    return;
                const { x, y } = buttonCentre();
                const reach = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
                push = -1.5;
                await tween(setGlow, 1, 0, 900);
                const gather = field.animate([{ clipPath: `circle(${reach}px at ${x}px ${y}px)` }, { clipPath: `circle(0px at ${x}px ${y}px)` }], { duration: 900, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "forwards" });
                await gather.finished.then(() => undefined, () => undefined);
                setImmersive(false);
                setNight(false);
                glow = 1;
                await fadeField(0, 0);
                gather.cancel();
                void returnToLanding();
            },
        },
    };
    const enterSpace = async () => {
        if (immersive || travelling || !field)
            return;
        if (reducedMotion.matches) {
            setImmersive(true);
            return;
        }
        travelling = true;
        document.documentElement.classList.add("is-hero-travelling");
        await entryMoves[entry].enter();
        if (!field)
            return;
        document.documentElement.classList.remove("is-hero-travelling");
        travelling = false;
        showHint();
    };
    const leaveSpace = async () => {
        if (!immersive || travelling || !field)
            return;
        if (reducedMotion.matches) {
            setImmersive(false);
            return;
        }
        travelling = true;
        window.clearTimeout(hintTimer);
        hint?.classList.remove("is-visible");
        document.documentElement.classList.add("is-hero-travelling");
        await entryMoves[entry].leave();
        document.documentElement.classList.remove("is-hero-travelling");
        travelling = false;
        spaceButton?.focus({ preventScroll: true });
    };
    const openCard = (card) => {
        if (!card.project || opening || travelling)
            return;
        opening = true;
        hovered = card;
        // The field rushes past as the project grows to fill the screen.
        if (!reducedMotion.matches)
            push = 4;
        openHeroProject(card.project, card.tile.getBoundingClientRect());
    };
    const mount = (surface, signal) => {
        const random = heroRandom(20261024);
        const aspects = [0.8, 1, 1.25, 1.33, 1.5];
        const cells = COLUMNS * ROWS;
        field = document.createElement("div");
        field.className = "hero-field";
        field.tabIndex = -1;
        field.setAttribute("aria-label", "Selected projects in space");
        field.style.perspective = `${PERSPECTIVE}px`;
        field.innerHTML = `
      <div class="hero-field__world"></div>
      <div class="hero-field__cursor" aria-hidden="true"><span></span></div>
      <p class="hero-field__hint" aria-hidden="true">
        <span>Scroll to fly</span><span>Drag to look around</span><span>Esc to leave</span>
      </p>
    `;
        surface.append(field);
        world = field.querySelector(".hero-field__world");
        cursor = field.querySelector(".hero-field__cursor");
        cursorLabel = cursor?.querySelector("span") ?? null;
        hint = field.querySelector(".hero-field__hint");
        const makeCard = (project, slot, nx, ny, z, cardWidth, aspect) => {
            const element = document.createElement(project ? "a" : "span");
            element.className = `hero-field__card${project ? "" : " hero-field__card--blank"}`;
            if (project) {
                const link = element;
                link.href = heroHref(project);
                link.draggable = false;
                link.setAttribute("aria-label", `View project ${project.number} case study`);
                // Only the opening copy of each project is reachable by keyboard.
                if (slot < 0) {
                    link.tabIndex = -1;
                    link.setAttribute("aria-hidden", "true");
                }
                link.innerHTML = `
          ${heroTileMarkup(project)}
          <span class="hero-field__label" aria-hidden="true"><b>${project.number}</b>${heroTitle(project)}</span>
        `;
            }
            else {
                element.setAttribute("aria-hidden", "true");
                element.innerHTML = '<span class="hero-tile hero-tile--blank"></span>';
            }
            world.append(element);
            return {
                element,
                tile: element.querySelector(".hero-tile"),
                project,
                nx,
                ny,
                z,
                width: cardWidth,
                height: cardWidth / aspect,
                slot,
                size: "",
                pushX: 0,
                pushY: 0,
                lift: 0,
                seed: random(),
                screenX: 0,
                screenY: 0,
                screenScale: 0,
                shown: false,
            };
        };
        // The six projects first, placed by OPENING (positions are set in layout).
        cards = projects.map((project, index) => makeCard(project, index, 0, 0, OPENING[index % OPENING.length].z - NEAR, 380 + random() * 80, 4 / 3));
        // Then the strata: each layer visits every cell once, offset from the
        // layer before, at depths spread evenly through the layer.
        let projectTurn = 0;
        for (let layer = 0; layer < LAYERS; layer += 1) {
            for (let cell = 0; cell < cells; cell += 1) {
                const column = cell % COLUMNS;
                const row = Math.floor(cell / COLUMNS);
                const nx = (((column + 0.5 + layer * 0.37 + (random() - 0.5) * 0.5) / COLUMNS) % 1) * 2 - 1;
                const ny = (((row + 0.5 + layer * 0.43 + (random() - 0.5) * 0.5) / ROWS) % 1) * 2 - 1;
                const order = (cell * 7) % cells;
                const z = -((layer + (order + random() * 0.6) / cells) / LAYERS) * DEPTH;
                const isProject = (cell + layer) % 2 === 0;
                const project = isProject ? projects[projectTurn++ % projects.length] : null;
                const cardWidth = project ? 300 + random() * 170 : 150 + random() * 140;
                cards.push(makeCard(project, -1, nx, ny, z, cardWidth, aspects[Math.floor(random() * aspects.length)]));
            }
        }
        cards.forEach((card) => {
            if (!card.project)
                return;
            card.element.addEventListener("pointerenter", () => {
                if (drag.active || opening || travelling)
                    return;
                hovered = card;
                card.element.classList.add("is-hovered");
                showHeroCaption(card.project);
                requestHeroFrame();
            }, { signal });
            card.element.addEventListener("pointerleave", () => {
                card.element.classList.remove("is-hovered");
                if (hovered !== card || opening)
                    return;
                hovered = null;
                showHeroCaption(null);
                requestHeroFrame();
            }, { signal });
            card.element.addEventListener("focus", () => {
                // A keyboard focus holds the project up like a hover.
                if (!card.element.matches(":focus-visible"))
                    return;
                hovered = card;
                showHeroCaption(card.project);
                requestHeroFrame();
            }, { signal });
            card.element.addEventListener("blur", () => {
                if (hovered === card)
                    hovered = null;
                showHeroCaption(null);
            }, { signal });
        });
        bindHeroDrag(field, drag, signal, {
            onMove: (deltaX, deltaY) => {
                if (travelling)
                    return;
                // World units travel further than screen pixels at average depth.
                panX += deltaX * 1.8;
                panY += deltaY * 1.8;
            },
            onTap: (target) => {
                const card = cards.find((item) => item.element.contains(target));
                if (card)
                    openCard(card);
            },
        });
        field.addEventListener("pointermove", (event) => {
            const bounds = field.getBoundingClientRect();
            pointerX = event.clientX - bounds.left - bounds.width / 2;
            pointerY = event.clientY - bounds.top - bounds.height / 2;
            if (!pointerInside) {
                cursorX = pointerX;
                cursorY = pointerY;
            }
            pointerInside = event.pointerType !== "touch";
            requestHeroFrame();
        }, { signal });
        field.addEventListener("pointerleave", () => {
            pointerInside = false;
            requestHeroFrame();
        }, { signal });
        // Full screen, the wheel flies through depth and sideways scroll pans.
        field.addEventListener("wheel", (event) => {
            if (!immersive)
                return;
            event.preventDefault();
            if (travelling)
                return;
            const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? height : 1;
            const zoomGesture = event.ctrlKey ? 3 : 1;
            flight = clamp(flight + event.deltaY * unit * 0.0032 * zoomGesture, -7, 7);
            panX -= event.deltaX * unit * 1.1;
            requestHeroFrame();
        }, { passive: false, signal });
        document.addEventListener("keydown", (event) => {
            if (!immersive || travelling)
                return;
            if (event.key === "Escape") {
                void leaveSpace();
                return;
            }
            const moves = {
                ArrowUp: () => { flight = clamp(flight + 1.4, -7, 7); },
                ArrowDown: () => { flight = clamp(flight - 1.4, -7, 7); },
                ArrowLeft: () => { drag.velocityX += 0.6; },
                ArrowRight: () => { drag.velocityX -= 0.6; },
            };
            const move = moves[event.key];
            if (!move)
                return;
            event.preventDefault();
            move();
            requestHeroFrame();
        }, { signal });
        spaceButton = document.createElement("button");
        spaceButton.type = "button";
        spaceButton.className = "hero-toggle hero-space-toggle";
        spaceButton.setAttribute("aria-pressed", "false");
        spaceButton.innerHTML = '<span class="hero-space-toggle__icon" aria-hidden="true"></span><span>Enter space</span>';
        spaceButton.addEventListener("click", () => {
            void (immersive ? leaveSpace() : enterSpace());
        }, { signal });
        // Temporary: compare the ways in.
        let storedEntry = null;
        try {
            storedEntry = window.localStorage.getItem(heroEntryKey);
        }
        catch {
            storedEntry = null;
        }
        const requestedEntry = new URLSearchParams(window.location.search).get("entry");
        entry = isHeroEntry(requestedEntry) ? requestedEntry : isHeroEntry(storedEntry) ? storedEntry : "edge";
        entryPicker = document.createElement("div");
        entryPicker.className = "hero-switch hero-entry";
        entryPicker.setAttribute("role", "group");
        entryPicker.setAttribute("aria-label", "Way into the space");
        entryPicker.innerHTML = heroEntries
            .map((option) => `<button type="button" data-entry="${option.id}" aria-pressed="${option.id === entry}">${option.label}</button>`)
            .join("");
        entryPicker.addEventListener("click", (event) => {
            const button = event.target instanceof Element ? event.target.closest("button[data-entry]") : null;
            const chosen = button?.dataset.entry ?? null;
            if (!isHeroEntry(chosen))
                return;
            entry = chosen;
            labelSpaceButton();
            entryPicker?.querySelectorAll("button").forEach((item) => {
                item.setAttribute("aria-pressed", String(item.dataset.entry === chosen));
            });
            try {
                window.localStorage.setItem(heroEntryKey, chosen);
            }
            catch {
                // The choice still holds for this visit.
            }
        }, { signal });
        heroControls.prepend(entryPicker, spaceButton);
        labelSpaceButton();
        window.addEventListener("resize", layout, { signal });
        lastScrollY = window.scrollY;
        layout();
    };
    const reveal = () => {
        introStart = reducedMotion.matches ? -1 : performance.now();
        requestHeroFrame();
    };
    const frame = (now, delta) => {
        if (!field || !world)
            return false;
        const still = reducedMotion.matches;
        const ease = (duration) => heroApproach(delta, duration);
        // Page scroll pushes the camera through the field.
        const scrollDelta = clamp(window.scrollY - lastScrollY, -160, 160);
        lastScrollY = window.scrollY;
        if (!still && !immersive)
            push = clamp(push + scrollDelta * SCROLL_PUSH, -4, 4);
        push *= Math.exp(-delta / 380);
        flight *= Math.exp(-delta / 460);
        drift += ((still ? 0 : hovered ? DRIFT * 0.06 : DRIFT) - drift) * ease(520);
        let intro = 0;
        if (introStart >= 0) {
            const progress = (now - introStart) / 2200;
            intro = (1 - heroEaseOut(progress)) * -2100;
            if (progress >= 1)
                introStart = -1;
        }
        cameraZ += (drift + push + flight + dive) * delta;
        zoom += (zoomTarget - zoom) * (still ? 1 : ease(zoomTime));
        for (const active of tweens) {
            const progress = clamp((now - active.start) / active.duration, 0, 1);
            active.set(heroLerp(active.from, active.to, active.easing(progress)));
            if (progress >= 1) {
                tweens.delete(active);
                active.done();
            }
        }
        if (!drag.active) {
            panX += drag.velocityX * 1.8 * delta;
            panY += drag.velocityY * 1.8 * delta;
            drag.velocityX *= Math.pow(0.9, delta / 16.7);
            drag.velocityY *= Math.pow(0.9, delta / 16.7);
        }
        const lookEase = ease(420);
        lookX += ((heroPointer.active && !still ? heroPointer.x : 0) - lookX) * lookEase;
        lookY += ((heroPointer.active && !still ? heroPointer.y : 0) - lookY) * lookEase;
        presence += ((pointerInside && !still && !drag.active && !travelling ? 1 : 0) - presence) * ease(260);
        // Cards lean into the direction you throw the field.
        const leanY = clamp(drag.velocityX * 9, -14, 14);
        const leanX = clamp(-drag.velocityY * 7, -10, 10);
        const repelEase = ease(170);
        const liftEase = ease(220);
        world.style.transform =
            `scale(${zoom.toFixed(4)}) rotateX(${(-lookY * 4).toFixed(3)}deg) rotateY(${(lookX * 6).toFixed(3)}deg)`;
        for (const card of cards) {
            const relative = modulo(card.z + cameraZ + intro, DEPTH) - DEPTH + NEAR;
            const baseX = modulo(card.nx * wrapX + panX + wrapX, wrapX * 2) - wrapX;
            const baseY = modulo(card.ny * wrapY + panY + wrapY, wrapY * 2) - wrapY;
            card.lift += ((hovered === card ? 1 : 0) - card.lift) * liftEase;
            let z = relative + card.lift * 110;
            // Where the card lands on screen, for cursor interactions.
            const scale = depthScale(z);
            const screenX = baseX * scale;
            const screenY = baseY * scale;
            // The cursor parts the field: nearby cards slide out of its way.
            let targetPushX = 0;
            let targetPushY = 0;
            if (presence > 0.001 && card !== hovered) {
                const offsetX = screenX - pointerX;
                const offsetY = screenY - pointerY;
                const distance = Math.hypot(offsetX, offsetY) || 1;
                const force = (1 - heroSmoothstep(0, REPEL_RADIUS, distance)) * presence;
                targetPushX = (offsetX / distance) * force * REPEL_STRENGTH / scale;
                targetPushY = (offsetY / distance) * force * REPEL_STRENGTH / scale;
            }
            card.pushX += (targetPushX - card.pushX) * repelEase;
            card.pushY += (targetPushY - card.pushY) * repelEase;
            let x = baseX + card.pushX;
            let y = baseY + card.pushY;
            let cardWidth = card.width;
            let cardHeight = card.height;
            // Every card turns slightly to face the cursor.
            let rotateY = clamp((pointerX - screenX) / width, -1, 1) * 16 * presence + leanY;
            let rotateX = clamp((screenY - pointerY) / height, -1, 1) * 12 * presence + leanX;
            let opacity = heroSmoothstep(-DEPTH + NEAR, -DEPTH + NEAR + 700, relative) *
                (1 - heroSmoothstep(NEAR - 240, NEAR, relative)) *
                (1 - heroSmoothstep(wrapX * 0.88, wrapX, Math.abs(baseX))) *
                (1 - heroSmoothstep(wrapY * 0.88, wrapY, Math.abs(baseY)));
            // The hovered card stays solid even as it rises past the near fade.
            opacity = heroLerp(opacity, 1, card.lift);
            if (hovered && hovered !== card)
                opacity *= 0.5;
            // In the dark the tiles light up one after another.
            if (night)
                opacity *= clamp(glow * 1.8 - card.seed * 0.8, 0, 1);
            card.screenX = screenX;
            card.screenY = screenY;
            card.screenScale = scale;
            card.shown = opacity > 0.5 && Math.abs(screenX) < width / 2 && Math.abs(screenY) < height / 2;
            const style = card.element.style;
            if (opacity < 0.004) {
                if (style.visibility !== "hidden")
                    style.visibility = "hidden";
                continue;
            }
            if (style.visibility !== "visible")
                style.visibility = "visible";
            const size = `${cardWidth.toFixed(1)}|${cardHeight.toFixed(1)}`;
            if (size !== card.size) {
                card.size = size;
                style.width = `${cardWidth.toFixed(1)}px`;
                style.height = `${cardHeight.toFixed(1)}px`;
            }
            style.opacity = opacity.toFixed(3);
            style.transform =
                `translate3d(${(x - cardWidth / 2).toFixed(1)}px, ${(y - cardHeight / 2).toFixed(1)}px, ${z.toFixed(1)}px) ` +
                    `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
        }
        // A small label trails the cursor and says what a press will do.
        if (cursor && cursorLabel) {
            const showCursor = pointerInside && !still && !travelling;
            const text = hovered?.project
                ? `Open ${heroTitle(hovered.project)}`
                : immersive ? "Scroll · Drag" : "Drag to explore";
            if (text !== cursorText) {
                cursorText = text;
                cursorLabel.textContent = text;
            }
            cursorX += (pointerX - cursorX) * ease(70);
            cursorY += (pointerY - cursorY) * ease(70);
            cursor.classList.toggle("is-visible", showCursor);
            cursor.classList.toggle("is-open", hovered !== null);
            cursor.style.transform = `translate3d(${(cursorX + width / 2).toFixed(1)}px, ${(cursorY + height / 2).toFixed(1)}px, 0)`;
        }
        return !still ||
            drag.active ||
            travelling ||
            tweens.size > 0 ||
            Math.abs(drag.velocityX) + Math.abs(drag.velocityY) > 0.001;
    };
    const unmount = () => {
        tweens.forEach((active) => active.done());
        tweens.clear();
        tipAnimations.forEach((animation) => animation.cancel());
        tipAnimations = [];
        setNight(false);
        dive = 0;
        glow = 1;
        entryPicker?.remove();
        entryPicker = null;
        travelling = false;
        document.documentElement.classList.remove("is-hero-travelling");
        setImmersive(false);
        window.clearTimeout(hintTimer);
        spaceButton?.remove();
        field?.remove();
        field = null;
        world = null;
        cursor = null;
        cursorLabel = null;
        hint = null;
        spaceButton = null;
        cards = [];
        hovered = null;
        opening = false;
        zoom = 1;
        zoomTarget = 1;
        showHeroCaption(null);
    };
    return { mount, reveal, frame, unmount };
};
/* ---------------------------------------------------------------------------
 * Index — an editorial list of the work built on index-list.ts. Titles roll,
 * a preview lens trails the cursor with a parallax reel, the type inverts
 * where it crosses the lens, and opening a project grows the lens to full
 * screen.
 * ------------------------------------------------------------------------- */
const createHeroIndex = () => {
    let root = null;
    let list = null;
    const mount = (surface) => {
        root = document.createElement("div");
        root.className = "hero-index";
        root.dataset.indexList = "";
        root.innerHTML = `
      <div class="hero-index__head" aria-hidden="true">
        <span>Index</span>
        <span>Selected work (${String(projects.length).padStart(2, "0")})</span>
      </div>
      <ol class="hero-index__list" aria-label="Selected projects">
        ${projects
            .map((project, index) => `
              <li style="--row: ${index};">
                <a class="hero-index__row" href="${heroHref(project)}" data-index-row>
                  <span class="hero-index__number">${project.number}</span>
                  <span class="hero-index__title" data-index-roll>${heroTitle(project)}</span>
                  <span class="hero-index__tags">${heroTags(project)}</span>
                  <span class="hero-index__arrow" aria-hidden="true"><span>↗</span></span>
                </a>
              </li>
            `)
            .join("")}
      </ol>
    `;
        surface.append(root);
        list = createIndexList(root, {
            previews: projects.map(heroTileMarkup),
            labels: projects.map((project) => `<span>${heroTitle(project)}</span><em>${project.number}</em>`),
            onOpen: (index, from) => openHeroProject(projects[index], from),
        });
    };
    const reveal = () => {
        // Wait a frame so a freshly mounted list starts from its hidden state.
        requestAnimationFrame(() => requestAnimationFrame(() => root?.classList.add("is-in")));
    };
    const unmount = () => {
        list?.destroy();
        root?.remove();
        list = null;
        root = null;
    };
    return { mount, reveal, frame: () => false, unmount };
};
const createHeroHalo = () => {
    // Each ring: its radius as a share of the largest, how many tiles it
    // carries, their size, and how fast and which way it turns.
    const RINGS = [
        { radius: 1, count: 22, size: 0.27, speed: 1 },
        { radius: 0.76, count: 16, size: 0.22, speed: -0.7 },
        { radius: 0.53, count: 11, size: 0.18, speed: 0.55 },
        { radius: 0.31, count: 6, size: 0.15, speed: -0.4 },
    ];
    const TILT = 68;
    const AUTO_SPIN = 0.008;
    let root = null;
    let halo = null;
    let rings = [];
    let tiles = [];
    let spin = 0;
    let spinVelocity = 0;
    let face = 0;
    let faceTarget = 0;
    let introStart = -1;
    let hovered = null;
    let opening = false;
    let lastInput = 0;
    const drag = createHeroDrag();
    const layout = () => {
        if (!root || !halo)
            return;
        const width = root.clientWidth || window.innerWidth;
        const height = root.clientHeight || window.innerHeight;
        const radius = clamp(Math.min(width * 0.31, height * 0.44), 150, 500);
        halo.style.setProperty("--halo-r", `${radius.toFixed(1)}px`);
    };
    const mount = (surface, signal) => {
        let projectTurn = 0;
        root = document.createElement("div");
        root.className = "hero-orbit hero-halo";
        root.innerHTML = `
      <div class="hero-halo__scene">
        <div class="hero-halo__halo">
          ${RINGS.map((ring, ringIndex) => `
            <div class="hero-halo__ring" data-ring="${ringIndex}">
              ${Array.from({ length: ring.count }, (_, index) => {
            const project = projects[projectTurn++ % projects.length];
            const angle = (index / ring.count) * 360 + ringIndex * 9;
            const hidden = projectTurn > projects.length;
            return `
                  <a
                    class="hero-halo__tile"
                    href="${heroHref(project)}"
                    data-project="${projects.indexOf(project)}"
                    draggable="false"
                    style="--angle: ${angle.toFixed(2)}deg; --ring-r: ${ring.radius}; --tile: ${ring.size};"
                    ${hidden ? 'tabindex="-1" aria-hidden="true"' : `aria-label="View project ${project.number} case study"`}
                  >
                    <span class="hero-halo__face">${heroTileMarkup(project)}</span>
                    <span class="hero-halo__face hero-halo__face--back">${heroTileMarkup(project)}</span>
                  </a>
                `;
        }).join("")}
            </div>
          `).join("")}
        </div>
      </div>
    `;
        surface.append(root);
        halo = root.querySelector(".hero-halo__halo");
        rings = [...root.querySelectorAll(".hero-halo__ring")];
        tiles = [...root.querySelectorAll(".hero-halo__tile")].map((element) => ({
            element,
            face: element.querySelector(".hero-halo__face"),
            project: projects[Number(element.dataset.project)],
        }));
        tiles.forEach((tile) => {
            tile.element.addEventListener("pointerenter", () => {
                if (drag.active || opening)
                    return;
                hovered = tile;
                tile.element.classList.add("is-hovered");
                root?.classList.add("has-hover");
                showHeroCaption(tile.project);
            }, { signal });
            tile.element.addEventListener("pointerleave", () => {
                tile.element.classList.remove("is-hovered");
                if (hovered !== tile)
                    return;
                hovered = null;
                root?.classList.remove("has-hover");
                showHeroCaption(null);
            }, { signal });
            tile.element.addEventListener("focus", () => showHeroCaption(tile.project), { signal });
            tile.element.addEventListener("blur", () => showHeroCaption(null), { signal });
        });
        bindHeroDrag(root, drag, signal, {
            onMove: (deltaX, deltaY) => {
                spin += deltaX * 0.25;
                faceTarget = clamp(faceTarget - deltaY / 320, 0, 1);
                lastInput = performance.now();
            },
            onTap: (target) => {
                const tile = tiles.find((item) => item.element.contains(target));
                if (!tile || opening)
                    return;
                opening = true;
                openHeroProject(tile.project, tile.face.getBoundingClientRect());
            },
            onRelease: () => {
                spinVelocity = clamp(drag.velocityX * 0.25, -1.2, 1.2);
                drag.velocityX = 0;
                lastInput = performance.now();
            },
        });
        window.addEventListener("resize", layout, { signal });
        layout();
    };
    const reveal = () => {
        introStart = reducedMotion.matches ? -1 : performance.now();
        requestHeroFrame();
    };
    const frame = (now, delta) => {
        if (!halo || !root)
            return false;
        const still = reducedMotion.matches;
        const ease = (duration) => heroApproach(delta, duration);
        if (!drag.active) {
            spin += ((still || hovered ? 0 : AUTO_SPIN) + spinVelocity) * delta;
            spinVelocity *= Math.pow(0.95, delta / 16.7);
            // Left alone, a halo swung face-on drifts back to its tilt.
            if (now - lastInput > 3200)
                faceTarget *= Math.pow(0.992, delta / 16.7);
        }
        // Scrolling away swings the halo face-on and then flies you through it.
        const leave = clamp(window.scrollY / Math.max(heroLanding.offsetHeight * 0.85, 1), 0, 1);
        const scrolledFace = heroSmoothstep(0, 0.45, leave);
        const dive = heroSmoothstep(0.35, 1, leave);
        face += (Math.max(faceTarget, scrolledFace) - face) * (still ? 1 : ease(220));
        let scale = 1;
        let introSpin = 0;
        if (introStart >= 0) {
            const progress = (now - introStart) / 2200;
            const eased = heroEaseOut(progress);
            scale = heroLerp(0.4, 1, eased);
            introSpin = (1 - eased) * -180;
            if (progress >= 1)
                introStart = -1;
        }
        const tilt = TILT * (1 - face) + (heroPointer.active && !still ? -heroPointer.y * 5 : 0) * (1 - face);
        // Standing, the tiles read upright around the band; face-on, each one
        // turns back against its ring so the work stays upright as it circles.
        halo.style.setProperty("--halo-stand", `${(-90 * (1 - face)).toFixed(2)}deg`);
        halo.style.setProperty("--halo-face", face.toFixed(4));
        halo.style.transform =
            `translateZ(${(dive * 1500).toFixed(1)}px) scale(${scale.toFixed(4)}) rotateX(${tilt.toFixed(3)}deg) ` +
                `rotateY(${(heroPointer.active && !still ? heroPointer.x * 6 : 0).toFixed(3)}deg)`;
        rings.forEach((ring, index) => {
            const turn = (spin + introSpin) * RINGS[index].speed;
            ring.style.transform =
                `translateZ(${(-index * 240 * face).toFixed(1)}px) rotateZ(${turn.toFixed(3)}deg)`;
            ring.style.setProperty("--ring-turn", `${turn.toFixed(3)}deg`);
        });
        root.style.opacity = (1 - heroSmoothstep(0.8, 1, leave)).toFixed(3);
        return !still || drag.active || Math.abs(spinVelocity) > 0.001 || Math.abs(faceTarget - face) > 0.001;
    };
    const unmount = () => {
        root?.remove();
        root = null;
        halo = null;
        rings = [];
        tiles = [];
        hovered = null;
        opening = false;
        showHeroCaption(null);
    };
    return { mount, reveal, frame, unmount };
};
const createHeroHorizon = () => {
    const SPACING = 22;
    const FLOW = 0.07;
    let root = null;
    let line = null;
    let stream = null;
    let items = [];
    let width = 1;
    let height = 1;
    let lensHalf = 1;
    let ramp = 1;
    let stretch = 1;
    let restScale = 0.08;
    let length = 1;
    let offset = 0;
    let velocity = 0;
    let flow = FLOW;
    let gain = 0;
    let hovered = null;
    let opening = false;
    const drag = createHeroDrag();
    // Every image in the work, alternating between projects so the collage
    // mixes them; projects without artwork yet appear as titled tiles.
    const frames = () => {
        const pools = projects.map((project) => (project.gallery ?? (project.image ? [project.image] : [])).map((image) => ({ project, image })));
        const longest = Math.max(...pools.map((pool) => pool.length));
        const mixed = [];
        for (let index = 0; index < longest; index += 1) {
            pools.forEach((pool) => {
                if (pool[index])
                    mixed.push(pool[index]);
            });
            // A titled tile for a project still to come, every few images.
            if (index % 4 === 1) {
                const pending = projects.filter((project) => !project.image);
                const project = pending[Math.floor(index / 4) % Math.max(pending.length, 1)];
                if (project)
                    mixed.push({ project, image: null });
            }
        }
        return mixed;
    };
    const build = (count) => {
        if (!stream)
            return;
        const random = heroRandom(1086);
        const source = frames();
        stream.innerHTML = Array.from({ length: count }, (_, index) => {
            const frame = source[index % source.length];
            const hidden = index >= projects.length;
            return `
        <a class="hero-horizon__item" href="${heroHref(frame.project)}" draggable="false" tabindex="-1"
          ${hidden ? 'aria-hidden="true"' : `aria-label="View project ${frame.project.number} case study"`}>
          ${frame.image
                ? `<img src="${frame.image}" alt="" draggable="false" loading="lazy" decoding="async" />`
                : heroTileMarkup(frame.project)}
        </a>
      `;
        }).join("");
        items = [...stream.querySelectorAll(".hero-horizon__item")].map((element, index) => {
            const frame = source[index % source.length];
            // Overlap order is shuffled, as in a pile of prints, and each print has
            // its own proportions.
            element.style.zIndex = String(Math.floor(random() * 100));
            element.style.setProperty("--aspect", String([0.78, 0.9, 1, 1.18, 1.3][Math.floor(random() * 5)]));
            const item = {
                element,
                project: frame.project,
                base: index * SPACING,
                scatter: random() * 2 - 1,
                size: 0.72 + random() * 0.28,
            };
            element.addEventListener("pointerenter", () => {
                if (drag.active)
                    return;
                hovered = item;
                element.classList.add("is-hovered");
                showHeroCaption(item.project);
            });
            element.addEventListener("pointerleave", () => {
                element.classList.remove("is-hovered");
                if (hovered !== item)
                    return;
                hovered = null;
                showHeroCaption(null);
            });
            return item;
        });
    };
    const layout = () => {
        if (!root)
            return;
        width = root.clientWidth || window.innerWidth;
        height = root.clientHeight || window.innerHeight;
        const lineY = height * 0.69;
        // The window: about a third of the page, opening and closing quickly at
        // its edges; spread out, its collage spans roughly two thirds.
        lensHalf = width * 0.17;
        ramp = width * 0.045;
        // Images in the window are spread a little wider than on the line.
        stretch = 1.9;
        const imageHeight = clamp(height * 0.15, 90, 160);
        restScale = 14 / imageHeight;
        root.style.setProperty("--horizon-line", `${lineY.toFixed(1)}px`);
        root.style.setProperty("--horizon-image", `${imageHeight.toFixed(1)}px`);
        const count = Math.ceil((width + lensHalf * stretch * 2 + 400) / SPACING);
        if (count !== items.length)
            build(count);
        length = items.length * SPACING;
    };
    const mount = (surface, signal) => {
        root = document.createElement("div");
        root.className = "hero-horizon";
        root.innerHTML = `
      <span class="hero-horizon__line" aria-hidden="true"></span>
      <div class="hero-horizon__stream"></div>
    `;
        surface.append(root);
        line = root.querySelector(".hero-horizon__line");
        stream = root.querySelector(".hero-horizon__stream");
        layout();
        bindHeroDrag(root, drag, signal, {
            onMove: (deltaX) => {
                offset -= deltaX;
            },
            onTap: (target) => {
                const item = items.find((candidate) => candidate.element.contains(target));
                if (!item || opening)
                    return;
                opening = true;
                openHeroProject(item.project, item.element.getBoundingClientRect());
            },
            onRelease: () => {
                velocity = clamp(-drag.velocityX, -3, 3);
                drag.velocityX = 0;
            },
        });
        root.addEventListener("wheel", (event) => {
            const bounds = root.getBoundingClientRect();
            if (event.clientY - bounds.top < height * 0.45)
                return;
            const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
            if (delta === 0)
                return;
            event.preventDefault();
            velocity = clamp(velocity + delta * 0.006, -3, 3);
            requestHeroFrame();
        }, { passive: false, signal });
        window.addEventListener("resize", layout, { signal });
    };
    const reveal = () => {
        gain = 0;
        line?.classList.add("is-drawn");
        requestHeroFrame();
    };
    // How far across the window an image has travelled, folded so the window
    // spreads its images out while the line outside keeps its spacing.
    const spread = (along) => {
        const inside = Math.min(Math.abs(along), lensHalf);
        return along + Math.sign(along) * inside * (stretch - 1) * gain;
    };
    const frame = (_, delta) => {
        if (!stream)
            return false;
        const still = reducedMotion.matches;
        const ease = (duration) => heroApproach(delta, duration);
        flow += ((still ? 0 : hovered ? FLOW * 0.08 : FLOW) - flow) * ease(400);
        if (!drag.active) {
            offset += (flow + velocity) * delta;
            velocity *= Math.pow(0.93, delta / 16.7);
            if (Math.abs(velocity) < 0.001)
                velocity = 0;
        }
        gain += (1 - gain) * (still ? 1 : ease(600));
        const lift = height * 0.17;
        for (const item of items) {
            const along = modulo(item.base - offset + length / 2, length) - length / 2;
            const open = (1 - heroSmoothstep(lensHalf - ramp, lensHalf + ramp * 0.4, Math.abs(along))) * gain;
            const x = spread(along);
            const style = item.element.style;
            if (Math.abs(x) > width / 2 + 200) {
                if (style.visibility !== "hidden")
                    style.visibility = "hidden";
                continue;
            }
            if (style.visibility !== "visible")
                style.visibility = "visible";
            const scale = restScale + (item.size - restScale) * open;
            const y = item.scatter * lift * open;
            style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(4)})`;
            style.opacity = hovered && hovered !== item ? (1 - open * 0.45).toFixed(3) : "1";
        }
        return !still || drag.active || velocity !== 0;
    };
    const unmount = () => {
        root?.remove();
        root = null;
        line = null;
        stream = null;
        items = [];
        hovered = null;
        opening = false;
        showHeroCaption(null);
    };
    return { mount, reveal, frame, unmount };
};
/* ---------------------------------------------------------------------------
 * Variant switching.
 * ------------------------------------------------------------------------- */
const heroModes = {
    field: createHeroField,
    horizon: createHeroHorizon,
    index: createHeroIndex,
    orbit: createHeroHalo,
};
let activeHeroAbort = null;
let heroRevealed = false;
const isHeroVariant = (value) => heroVariants.some((variant) => variant.id === value) || heroParkedVariants.some((variant) => variant === value);
const isOfferedVariant = (value) => heroVariants.some((variant) => variant.id === value);
const setHeroVariant = (variant) => {
    activeHeroAbort?.abort();
    activeHeroMode?.unmount();
    activeHeroMode = null;
    activeHeroAbort = null;
    document.body.dataset.hero = variant;
    heroSurface.className = `hero-alt hero-alt--${variant}`;
    heroSwitch.querySelectorAll("button").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.heroVariant === variant));
    });
    if (variant !== "classic") {
        activeHeroAbort = new AbortController();
        activeHeroMode = heroModes[variant]();
        activeHeroMode.mount(heroSurface, activeHeroAbort.signal);
        if (heroRevealed)
            activeHeroMode.reveal();
        requestHeroFrame();
    }
    try {
        window.localStorage.setItem(heroStorageKey, variant);
    }
    catch {
        // Storage can be unavailable in private windows; the URL still carries the choice.
    }
    const url = new URL(window.location.href);
    url.searchParams.set("hero", variant);
    window.history.replaceState(window.history.state, "", url);
    document.dispatchEvent(new CustomEvent("hero:change", { detail: variant }));
};
heroSwitch.addEventListener("click", (event) => {
    const button = event.target instanceof Element
        ? event.target.closest("button[data-hero-variant]")
        : null;
    const variant = button?.dataset.heroVariant ?? null;
    if (isHeroVariant(variant) && variant !== document.body.dataset.hero)
        setHeroVariant(variant);
});
document.addEventListener("hero:reveal", () => {
    if (heroRevealed)
        return;
    heroRevealed = true;
    activeHeroMode?.reveal();
});
window.addEventListener("pointermove", (event) => {
    const bounds = heroLanding.getBoundingClientRect();
    heroPointer.x = clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1);
    heroPointer.y = clamp(((event.clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1);
    heroPointer.active = event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    requestHeroFrame();
}, { passive: true });
window.addEventListener("blur", () => {
    heroPointer.active = false;
});
// Returning from a case study through the history cache remounts the hero, so
// an opened project or full-screen space does not linger.
window.addEventListener("pageshow", (event) => {
    const variant = document.body.dataset.hero ?? null;
    if (event.persisted && isHeroVariant(variant))
        setHeroVariant(variant);
});
// Scrolling past the landing still needs a frame so Orbit can burst and
// Field can take the push.
window.addEventListener("scroll", requestHeroFrame, { passive: true });
document.addEventListener("visibilitychange", requestHeroFrame);
if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
        heroLandingVisible = entries.some((entry) => entry.isIntersecting);
        requestHeroFrame();
    }).observe(heroLanding);
}
let storedHeroVariant = null;
try {
    storedHeroVariant = window.localStorage.getItem(heroStorageKey);
}
catch {
    storedHeroVariant = null;
}
// "wheel" is the original rail's old name.
const requestedHero = new URLSearchParams(window.location.search).get("hero");
const requestedHeroVariant = requestedHero === "wheel" ? "classic" : requestedHero;
// The work-first homepages (home-layouts.ts) leave the hero unmounted.
if ((document.documentElement.dataset.home ?? "hero") === "hero") {
    setHeroVariant(isHeroVariant(requestedHeroVariant)
        ? requestedHeroVariant
        : isOfferedVariant(storedHeroVariant)
            ? storedHeroVariant
            : "horizon");
}
else {
    document.body.dataset.hero = "off";
}
