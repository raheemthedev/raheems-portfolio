"use strict";
// Work-first homepages, for visitors who want proof of work straight away.
// Chosen before anything draws by a small script in index.html's head
// (?home=, remembered), which sets <html data-home>. In these layouts the
// interactive hero (Horizon/Field, hero-modes.ts) and the original wheel stay
// unmounted, and the work is built here from archiveProjects:
//   work     — the statement, then the case studies as two large cards, each
//              with its sector, year, summary and services.
//   feature  — the statement, then each case study as a full-width spread: a
//              big image beside its details, alternating sides.
//   row      — after Ross Mason (iamrossmason.com) and the original rail: a
//              row of frames drifting through a lens that opens whichever is
//              in it. The lens follows the cursor; the row can be dragged,
//              thrown, stepped with the arrow keys and nudged by page scroll.
// "hero" is the original homepage.
const homeLayouts = [
    { id: "work", label: "Work" },
    { id: "feature", label: "Feature" },
    { id: "row", label: "Row" },
    { id: "hero", label: "Original" },
];
const homeLayoutKey = "raheem-home-layout";
const homeLayout = document.documentElement.dataset.home;
const homeLanding = document.querySelector(".landing");
// Only finished work goes on the homepage.
const homeProjects = archiveProjects.filter((project) => project.image);
const homeHref = (project) => project.href ?? `case-study.html?project=${project.number}`;
const homeMedia = (project, className) => `
  <span class="${className}">
    <img class="home-media__still" src="${project.image}" alt="${project.imageAlt ?? project.title}" draggable="false" loading="lazy" decoding="async" />
    ${project.hoverImage ? `<img class="home-media__hover" src="${project.hoverImage}" alt="" aria-hidden="true" draggable="false" loading="lazy" decoding="async" />` : ""}
  </span>`;
const homeDetails = (project) => `
  <dl class="home-details">
    <div><dt>Sector</dt><dd>${project.discipline}</dd></div>
    <div><dt>Role</dt><dd>${project.services.join(", ")}</dd></div>
    <div><dt>Year</dt><dd>${project.year}</dd></div>
  </dl>`;
// The images each project shows on the homepage, cover first. Kept to the
// lighter files; the heaviest animated ones stay in the case studies.
const homeGallery = {
    "01": ["LCover", "L1", "L3", "P7-1", "L4", "P9-1", "L7"].map((name) => `assets/projects/flip/${name}.webp`),
    "02": ["l4-cover", "l5", "p7-1", "p9-1", "l6", "p9-2", "p7-2"].map((name) => `assets/projects/electronic-botanica/${name}.webp`),
};
const homeFrames = (project) => homeGallery[project.number] ?? [project.image];
const homeBuilders = {
    work: () => `
    <div class="home-work__grid">
      ${homeProjects.map((project) => `
        <a class="home-card" href="${homeHref(project)}">
          ${homeMedia(project, "home-card__media home-media")}
          <span class="home-card__head"><span class="home-card__number">${project.number}</span><strong>${project.title}</strong><span class="home-card__arrow" aria-hidden="true">→</span></span>
          <span class="home-card__meta">${project.discipline} · ${project.year}</span>
          <span class="home-card__summary">${project.summary}</span>
          <span class="home-card__services">${project.services.join(" · ")}</span>
        </a>`).join("")}
    </div>`,
    feature: () => homeProjects.map((project, index) => `
    <article class="home-spread${index % 2 ? " home-spread--flip" : ""}">
      <a class="home-spread__media-link" href="${homeHref(project)}" aria-label="${project.title} case study">
        ${homeMedia(project, "home-spread__media home-media")}
      </a>
      <div class="home-spread__info">
        <p class="home-spread__number">${project.number}</p>
        <h3 class="home-spread__title">${project.title}</h3>
        <p class="home-spread__summary">${project.summary}</p>
        ${homeDetails(project)}
        <a class="home-spread__cta" href="${homeHref(project)}">View case study <span aria-hidden="true">→</span></a>
      </div>
    </article>`).join(""),
    row: () => `
    <div class="home-row" data-row>
      <div class="home-row__strip" tabindex="0" aria-label="Selected work. Drag, or use the arrow keys, to move through it.">
        ${homeProjects.map((project, index) => homeFrames(project).map((src, n) => `
          <a class="home-row__item" href="${homeHref(project)}" draggable="false" data-project="${index}">
            <span class="home-row__label">${project.number}.${n + 1}<br />${project.title}<br /><em>[${project.services[n % project.services.length]}]</em></span>
            <span class="home-row__media">
              <img src="${src}" alt="${n ? "" : project.imageAlt ?? project.title}" draggable="false" loading="${index ? "lazy" : "eager"}" decoding="async" />
              ${!n && project.hoverImage ? `<img class="home-row__motion" data-src="${project.hoverImage}" alt="" draggable="false" />` : ""}
            </span>
          </a>`).join("")).join("")}
      </div>
      <span class="home-row__cursor" aria-hidden="true">Drag</span>
    </div>`,
};
if (homeLanding && homeLayout && homeLayout !== "hero") {
    const section = document.createElement("section");
    section.className = `home-work home-work--${homeLayout}`;
    section.setAttribute("aria-labelledby", "home-work-title");
    section.innerHTML = `
    <header class="home-work__header">
      <p id="home-work-title">/ Selected work</p>
      <p class="home-work__count">${String(homeProjects.length).padStart(2, "0")} case studies</p>
    </header>
    ${homeBuilders[homeLayout]()}
    <a class="home-work__all" href="work.html">See all work <span aria-hidden="true">↗</span></a>`;
    homeLanding.after(section);
    if (homeLayout === "row")
        mountRow(section);
}
// Row: every frame sits in one looping row that glides left a frame at a time,
// each one coming to rest centred in a lens. Every move eases in and out, and
// the lens trails the cursor rather than snapping to it, for a calm pace
// between the original rail and Ross Mason's. The lens opens whichever frames
// are near it (taller and wider, falling off smoothly like a dock, all hanging
// from the top) and each image shifts a little inside its frame as it passes.
// The open frame is sized so the statement and the row fit in one screen. The
// lens follows the cursor while it's over the row, which then holds still. The
// row can be dragged and thrown (it settles with a frame in the lens), stepped
// with the arrow keys, and is nudged along by page scroll.
// Clicking a side frame glides it into the lens; clicking the open one opens
// its case study with the site's page transition.
function mountRow(section) {
    const root = section.querySelector("[data-row]");
    const strip = root?.querySelector(".home-row__strip");
    const cursor = root?.querySelector(".home-row__cursor");
    if (!root || !strip || !cursor)
        return;
    // Three copies, so the loop never shows a gap.
    const originals = [...strip.querySelectorAll(".home-row__item")];
    const count = originals.length;
    [1, 2].forEach(() => originals.forEach((item) => {
        const copy = item.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        strip.append(copy);
    }));
    const items = [...strip.querySelectorAll(".home-row__item")];
    items.forEach((item) => { item.tabIndex = -1; });
    const media = items.map((item) => item.querySelector(".home-row__media"));
    const stills = items.map((item) => item.querySelector(".home-row__media img"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const firstLabel = strip.querySelector(".home-row__label");
    let size = { base: 0, gap: 0, short: 0, tall: 0, open: 0, spread: 0 };
    const measure = () => {
        const width = root.clientWidth;
        const narrow = width < 761;
        // The open frame takes whatever height is left under the statement.
        const top = strip.getBoundingClientRect().top + window.scrollY + firstLabel.offsetHeight;
        const room = window.innerHeight - top - (narrow ? 20 : 28);
        const tall = Math.max(narrow ? 200 : 170, Math.min(room, narrow ? width * 0.62 : Math.min(560, width * 0.3)));
        size = {
            base: narrow ? width * 0.15 : Math.min(150, Math.max(90, width * 0.075), tall * 0.3),
            gap: narrow ? 6 : 8,
            short: tall * 0.34,
            tall,
            open: 3.6,
            spread: narrow ? width * 0.12 : Math.min(230, Math.max(120, width * 0.095)),
        };
        root.style.setProperty("--row-tall", `${size.tall}px`);
    };
    measure();
    const pitch = () => size.base + size.gap;
    const period = () => count * pitch();
    let offset = 0;
    let velocity = 0;
    let glide = null;
    // Glides chase a smoothed target, so they start softly as well as land softly.
    let chase = 0;
    let restUntil = 0;
    let lensX = root.clientWidth / 2;
    let lensTarget = lensX;
    let lensChase = lensX;
    let hovering = false;
    let held = false;
    let dragged = false;
    let pressX = 0;
    let lastX = 0;
    let lastTime = 0;
    let visible = true;
    let frame = 0;
    let previous = 0;
    let open = -1;
    let pointer = { x: 0, y: 0 };
    let cursorAt = { x: 0, y: 0 };
    const pause = 2800;
    // The offset that puts frame k (counting across all three copies) in the lens.
    const offsetFor = (k) => k * pitch() - period() + size.gap + size.base / 2 - lensTarget;
    const frameAt = (value) => Math.round((lensTarget + value + period() - size.gap - size.base / 2) / pitch());
    const glideTo = (k) => {
        const target = offsetFor(k);
        if (glide === null)
            chase = offset;
        glide = target + period() * Math.round((offset - target) / period());
    };
    const layout = () => {
        const step = pitch();
        const loop = period();
        const wrapped = ((offset % loop) + loop) % loop;
        // Where each frame would sit with no lens, and how far it opens.
        const starts = items.map((_, index) => index * step - wrapped - loop + size.gap);
        const grow = starts.map((start) => {
            const distance = (start + size.base / 2 - lensX) / size.spread;
            return Math.exp(-distance * distance);
        });
        const widths = grow.map((amount) => size.base * (1 + (size.open - 1) * amount));
        // Lay the opened frames out in turn, then shift the row so the frames
        // around the lens stay centred where they'd sit closed, weighted by how
        // open each is. The weights change smoothly, so the row never surges or
        // jumps as the lens moves, and a frame resting in the lens stays centred.
        let x = 0;
        const lefts = widths.map((width) => {
            const left = x;
            x += width + size.gap;
            return left;
        });
        let pull = 0;
        let weight = 0;
        grow.forEach((amount, index) => {
            const share = amount * amount;
            pull += share * (starts[index] + size.base / 2 - lefts[index] - widths[index] / 2);
            weight += share;
        });
        const shift = pull / Math.max(weight, 1e-6);
        let biggest = 0;
        items.forEach((item, index) => {
            const height = size.short + (size.tall - size.short) * grow[index];
            const left = lefts[index] + shift;
            item.style.transform = `translate3d(${left}px, 0, 0)`;
            item.style.width = `${widths[index]}px`;
            item.style.setProperty("--open", grow[index].toFixed(3));
            media[index].style.height = `${height}px`;
            // A little depth: the image slides inside its frame as it crosses.
            const across = Math.max(-1, Math.min(1, (left + widths[index] / 2 - lensX) / (root.clientWidth / 2)));
            stills[index].style.transform = `translate3d(${(-across * 5).toFixed(2)}%, 0, 0) scale(1.12)`;
            if (grow[index] > grow[biggest])
                biggest = index;
        });
        if (biggest !== open) {
            items[open]?.classList.remove("is-open");
            items[biggest].classList.add("is-open");
            open = biggest;
            const motion = originals[biggest % count].querySelector(".home-row__motion[data-src]");
            if (motion) {
                motion.src = motion.dataset.src;
                motion.removeAttribute("data-src");
                items.forEach((item, index) => {
                    if (index % count !== biggest % count || item === originals[biggest % count])
                        return;
                    const copy = item.querySelector(".home-row__motion[data-src]");
                    if (copy) {
                        copy.src = motion.src;
                        copy.removeAttribute("data-src");
                    }
                });
            }
        }
    };
    const tick = (now) => {
        const delta = previous ? Math.min(48, now - previous) / 16.67 : 1;
        previous = now;
        if (glide !== null && !held) {
            const amount = Math.min(1, 0.075 * delta);
            chase += (glide - chase) * amount;
            offset += (chase - offset) * amount;
            velocity = 0;
            if (Math.abs(glide - offset) < 0.4 && Math.abs(glide - chase) < 0.4) {
                offset = glide;
                glide = null;
                restUntil = now + pause;
            }
        }
        else if (!held) {
            // Coast after a throw, then step on to the next frame after a pause.
            velocity *= Math.pow(0.93, delta);
            offset += velocity * delta;
            if (!hovering && !reduced && now > restUntil && Math.abs(velocity) < 0.5)
                glideTo(frameAt(offset) + 1);
        }
        lensChase += (lensTarget - lensChase) * Math.min(1, 0.07 * delta);
        lensX += (lensChase - lensX) * Math.min(1, 0.07 * delta);
        cursorAt.x += (pointer.x - cursorAt.x) * 0.2 * delta;
        cursorAt.y += (pointer.y - cursorAt.y) * 0.2 * delta;
        cursor.style.transform = `translate3d(${cursorAt.x}px, ${cursorAt.y}px, 0) translate(-50%, -50%)`;
        layout();
        if (hovering)
            label();
        frame = visible ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
        if (!frame && visible) {
            previous = 0;
            frame = requestAnimationFrame(tick);
        }
    };
    new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting && !document.hidden;
        start();
    }).observe(root);
    document.addEventListener("visibilitychange", () => {
        visible = !document.hidden;
        start();
    });
    // The pill that stands in for the cursor: "Drag" over the row, "View" over
    // the open frame.
    let client = { x: 0, y: 0 };
    const label = () => {
        const over = document.elementFromPoint(client.x, client.y)?.closest(".home-row__item");
        const text = !(held && dragged) && over && over === items[open] ? "View" : "Drag";
        if (cursor.textContent !== text)
            cursor.textContent = text;
    };
    strip.addEventListener("pointerenter", (event) => {
        if (!canHover)
            return;
        hovering = true;
        const box = root.getBoundingClientRect();
        pointer = cursorAt = { x: event.clientX - box.left, y: event.clientY - box.top };
        root.classList.add("is-hovering");
    });
    strip.addEventListener("pointerleave", () => {
        hovering = false;
        restUntil = performance.now() + pause / 2;
        lensTarget = root.clientWidth / 2;
        root.classList.remove("is-hovering");
    });
    strip.addEventListener("pointermove", (event) => {
        if (!canHover)
            return;
        const box = root.getBoundingClientRect();
        pointer = { x: event.clientX - box.left, y: event.clientY - box.top };
        if (!held)
            lensTarget = pointer.x;
        client = { x: event.clientX, y: event.clientY };
    });
    window.addEventListener("pointermove", (event) => {
        if (!held)
            return;
        const dx = event.clientX - lastX;
        if (Math.abs(event.clientX - pressX) > 4)
            dragged = true;
        offset -= dx;
        velocity = -(dx / Math.max(8, event.timeStamp - lastTime)) * 16;
        lastX = event.clientX;
        lastTime = event.timeStamp;
    });
    strip.addEventListener("pointerdown", (event) => {
        if (event.button !== 0)
            return;
        held = true;
        dragged = false;
        glide = null;
        pressX = lastX = event.clientX;
        lastTime = event.timeStamp;
        velocity = 0;
        root.classList.add("is-held");
    });
    const release = () => {
        if (!held)
            return;
        held = false;
        root.classList.remove("is-held");
        // A throw comes to rest with a frame in the lens.
        if (dragged)
            glideTo(frameAt(offset + velocity * 14));
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    strip.addEventListener("dragstart", (event) => event.preventDefault());
    items.forEach((item, index) => {
        item.addEventListener("click", (event) => {
            event.preventDefault();
            if (dragged)
                return;
            if (index !== open) {
                // A side frame glides into the lens first.
                if (canHover)
                    lensTarget = root.clientWidth / 2;
                glideTo(index);
                return;
            }
            const image = stills[index];
            transitionToPage(item.href, `<img src="${image.currentSrc || image.src}" alt="" />`, media[index].getBoundingClientRect(), homeProjects[Number(item.dataset.project)].title);
        });
    });
    // Trackpads can push the row sideways, and the page's own scroll nudges it.
    strip.addEventListener("wheel", (event) => {
        if (Math.abs(event.deltaX) <= Math.abs(event.deltaY))
            return;
        event.preventDefault();
        // Sideways scroll moves the row as far as it would scroll the page, and
        // carries on easing after the fingers stop.
        if (glide === null)
            chase = offset;
        glide = (glide ?? offset) + event.deltaX;
        velocity = 0;
    }, { passive: false });
    let scrolled = window.scrollY;
    window.addEventListener("scroll", () => {
        const change = window.scrollY - scrolled;
        scrolled = window.scrollY;
        if (visible && !held && glide === null && !reduced)
            offset += change * 0.35;
    }, { passive: true });
    // Arrow keys step a frame at a time; Enter opens the frame in the lens.
    strip.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            glideTo(frameAt(glide ?? offset) + (event.key === "ArrowRight" ? 1 : -1));
        }
        else if (event.key === "Enter" && open >= 0) {
            event.preventDefault();
            items[open].click();
        }
    });
    let resizeTimer = 0;
    window.addEventListener("resize", () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
            measure();
            if (!hovering)
                lensTarget = root.clientWidth / 2;
        }, 120);
    });
    document.fonts?.ready.then(measure);
    // Start with the first frame in the lens.
    offset = offsetFor(count);
    restUntil = performance.now() + pause;
    start();
}
