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
//              in it, over a large title naming that project. The lens follows
//              the cursor; the row can be dragged and thrown.
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
// A title in the site's two voices: the last word set in Marcellus (a single
// word stays in the grotesk).
const homeMixed = (text) => {
    const words = text.split(" ");
    if (words.length < 2)
        return text;
    const last = words.pop();
    return `${words.join(" ")} <em>${last}</em>`;
};
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
      <div class="home-row__strip">
        ${homeProjects.map((project, index) => homeFrames(project).map((src, n) => `
          <a class="home-row__item" href="${homeHref(project)}" draggable="false" data-project="${index}">
            <span class="home-row__label">${project.number}.${n + 1}<br />${project.title}<br /><em>[${project.services[n % project.services.length]}]</em></span>
            <span class="home-row__media">
              <img src="${src}" alt="${n ? "" : project.imageAlt ?? project.title}" draggable="false" loading="${index ? "lazy" : "eager"}" decoding="async" />
              ${!n && project.hoverImage ? `<img class="home-row__motion" data-src="${project.hoverImage}" alt="" draggable="false" />` : ""}
            </span>
          </a>`).join("")).join("")}
      </div>
      <p class="home-row__title" aria-hidden="true">${homeMixed("Selected work")}</p>
      <p class="home-row__meta" aria-live="polite"></p>
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
// Row: every frame sits in one row that drifts slowly left on a loop. A lens
// opens whichever frames are near it (taller and wider, falling off smoothly
// like a dock); it rests at the centre, and follows the cursor while it's over
// the row, when the drift eases almost to a stop. The row can be dragged and
// thrown. The large title below names the project in the lens.
function mountRow(section) {
    const root = section.querySelector("[data-row]");
    const strip = root?.querySelector(".home-row__strip");
    const title = root?.querySelector(".home-row__title");
    const meta = root?.querySelector(".home-row__meta");
    if (!root || !strip || !title || !meta)
        return;
    // Three copies, so the loop never shows a gap.
    const originals = [...strip.querySelectorAll(".home-row__item")];
    const count = originals.length;
    [1, 2].forEach(() => originals.forEach((item) => {
        const copy = item.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        copy.tabIndex = -1;
        strip.append(copy);
    }));
    const items = [...strip.querySelectorAll(".home-row__item")];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let size = { base: 0, gap: 0, short: 0, tall: 0, open: 0, spread: 0 };
    const measure = () => {
        const width = root.clientWidth;
        const narrow = width < 761;
        size = {
            base: narrow ? width * 0.15 : Math.min(150, Math.max(90, width * 0.075)),
            gap: narrow ? 6 : 8,
            short: narrow ? width * 0.2 : Math.min(190, Math.max(110, width * 0.1)),
            tall: narrow ? width * 0.62 : Math.min(560, Math.max(260, width * 0.3)),
            open: narrow ? 3.6 : 3.6,
            spread: narrow ? width * 0.14 : Math.min(260, Math.max(140, width * 0.11)),
        };
        root.style.setProperty("--row-tall", `${size.tall}px`);
    };
    measure();
    let offset = 0;
    let velocity = 0;
    let lensX = root.clientWidth / 2;
    let lensTarget = lensX;
    let hovering = false;
    let held = false;
    let dragged = false;
    let lastX = 0;
    let lastTime = 0;
    let visible = true;
    let frame = 0;
    let previous = 0;
    let shown = -1;
    const drift = reduced ? 0 : 0.35;
    const describe = (index) => {
        if (index === shown)
            return;
        shown = index;
        const item = originals[index % count];
        const project = homeProjects[Number(item.dataset.project)];
        const n = index % count - originals.findIndex((other) => other.dataset.project === item.dataset.project) + 1;
        title.innerHTML = homeMixed(project.title);
        meta.innerHTML = `<span>${project.number}.${n}</span><span>${project.discipline}, ${project.year}</span><a href="${homeHref(project)}">View case study <span aria-hidden="true">→</span></a>`;
        title.animate([{ opacity: 0, transform: "translateY(0.08em)" }, { opacity: 1, transform: "none" }], { duration: 500, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
        const motion = originals[index % count].querySelector(".home-row__motion[data-src]");
        if (motion) {
            motion.src = motion.dataset.src;
            motion.removeAttribute("data-src");
        }
    };
    const layout = () => {
        const pitch = size.base + size.gap;
        const period = count * pitch;
        offset = ((offset % period) + period) % period;
        // Where each frame would sit with no lens, and how far it opens.
        const starts = items.map((_, index) => index * pitch - offset - period + size.gap);
        const grow = starts.map((start) => {
            const distance = (start + size.base / 2 - lensX) / size.spread;
            return Math.exp(-distance * distance);
        });
        const widths = grow.map((amount) => size.base * (1 + (size.open - 1) * amount));
        // Lay the opened frames out in turn, then shift the row so the point under
        // the lens stays under it.
        let x = 0;
        const lefts = widths.map((width) => {
            const left = x;
            x += width + size.gap;
            return left;
        });
        const under = Math.max(0, Math.min(items.length - 1, Math.floor((lensX - starts[0]) / pitch)));
        const fraction = (lensX - starts[under]) / pitch;
        const shift = lensX - (lefts[under] + fraction * (widths[under] + size.gap));
        let biggest = 0;
        items.forEach((item, index) => {
            item.style.transform = `translate3d(${lefts[index] + shift}px, 0, 0)`;
            item.style.width = `${widths[index]}px`;
            item.style.setProperty("--open", grow[index].toFixed(3));
            item.querySelector(".home-row__media").style.height = `${size.short + (size.tall - size.short) * grow[index]}px`;
            if (grow[index] > grow[biggest])
                biggest = index;
        });
        items.forEach((item, index) => item.classList.toggle("is-open", index === biggest));
        describe(biggest);
    };
    const tick = (now) => {
        const delta = previous ? Math.min(48, now - previous) / 16.67 : 1;
        previous = now;
        if (!held) {
            // Glide back toward the drift once let go.
            const rest = hovering ? drift * 0.08 : drift;
            velocity += (rest - velocity) * (Math.abs(velocity) > Math.abs(rest) ? 0.05 : 0.08) * delta;
            offset += velocity * delta;
        }
        lensX += (lensTarget - lensX) * 0.14 * delta;
        layout();
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
    const canHover = window.matchMedia("(hover: hover)").matches;
    strip.addEventListener("pointerenter", () => {
        if (canHover)
            hovering = true;
    });
    strip.addEventListener("pointerleave", () => {
        hovering = false;
        lensTarget = root.clientWidth / 2;
    });
    strip.addEventListener("pointermove", (event) => {
        if (canHover && !held)
            lensTarget = event.clientX - root.getBoundingClientRect().left;
    });
    window.addEventListener("pointermove", (event) => {
        if (!held)
            return;
        const dx = event.clientX - lastX;
        if (Math.abs(dx) > 2)
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
        lastX = event.clientX;
        lastTime = event.timeStamp;
        velocity = 0;
    });
    const release = () => {
        held = false;
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    strip.addEventListener("dragstart", (event) => event.preventDefault());
    items.forEach((item) => {
        item.addEventListener("click", (event) => {
            if (dragged)
                event.preventDefault();
        });
    });
    // Trackpads can push the row sideways too.
    strip.addEventListener("wheel", (event) => {
        if (Math.abs(event.deltaX) <= Math.abs(event.deltaY))
            return;
        event.preventDefault();
        offset += event.deltaX;
    }, { passive: false });
    // Tabbing to a frame brings it into the lens.
    originals.forEach((item, index) => {
        item.addEventListener("focus", () => {
            const pitch = size.base + size.gap;
            offset = index * pitch + size.gap + size.base / 2 - lensTarget + count * pitch;
        });
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
    start();
}
// Temporary: the picker for comparing homepages, at the foot of the landing.
if (homeLanding && homeLayout) {
    const picker = document.createElement("div");
    picker.className = "home-picker";
    picker.setAttribute("role", "group");
    picker.setAttribute("aria-label", "Homepage layout");
    picker.innerHTML = homeLayouts
        .map((layout) => `<button type="button" data-home-layout="${layout.id}" aria-pressed="${layout.id === homeLayout}">${layout.label}</button>`)
        .join("");
    picker.addEventListener("click", (event) => {
        const button = event.target instanceof Element ? event.target.closest("button[data-home-layout]") : null;
        const choice = button?.dataset.homeLayout;
        if (!choice || choice === homeLayout)
            return;
        try {
            window.localStorage.setItem(homeLayoutKey, choice);
        }
        catch {
            // The reload below still carries the choice in the address.
        }
        const url = new URL(window.location.href);
        url.searchParams.set("home", choice);
        window.location.href = url.toString();
    });
    document.body.append(picker);
}
