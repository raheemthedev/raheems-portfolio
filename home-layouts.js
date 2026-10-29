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
// The rest adapt standout portfolios (see PROJECT_CONTEXT.md for the links):
//   clusters — each project as a loose cluster of its images either side of a
//              pinned list of names (after Grégory Lallé).
//   column   — one centre column of every image, the names either side, the
//              current one lit as its images pass (after Cathy Dolle).
//   tiles    — ruled tiles, each project's images beside one plain sentence of
//              what was made (after Studio Herrström).
//   desktop  — the work as files on a desktop behind a dock (after bychudy).
//   row      — a row of frames that opens up the one you're on, over a large
//              mixed-type title (after Ross Mason).
//   curve    — the frames on a curved wall you drag around (after Jesper
//              Landberg).
// "hero" is the original homepage.
const homeLayouts = [
    { id: "work", label: "Work" },
    { id: "feature", label: "Feature" },
    { id: "clusters", label: "Clusters" },
    { id: "column", label: "Column" },
    { id: "tiles", label: "Tiles" },
    { id: "desktop", label: "Desktop" },
    { id: "row", label: "Row" },
    { id: "curve", label: "Curve" },
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
    "01": ["LCover", "L1", "L3", "P7-1", "L4", "P9-1", "L7", "L2", "L5", "P13-2", "L10", "L12"].map((name) => `assets/projects/flip/${name}.webp`),
    "02": ["l4-cover", "l5", "p7-1", "p9-1", "l6", "p9-2", "p7-2", "l8", "p10-1", "l11"].map((name) => `assets/projects/electronic-botanica/${name}.webp`),
};
const homeFrames = (project, count = 12) => (homeGallery[project.number] ?? [project.image]).slice(0, count);
// One plain sentence of what was made.
const homeMade = {
    "01": "A brand identity and illustration system for Flip, a crypto exchange as simple as flipping a coin.",
    "02": "Identity and generative visuals for Electronic Botanica, an exhibition where organic forms meet digital systems.",
};
const homeImg = (src, alt = "") => `<img src="${src}" alt="${alt}" draggable="false" loading="lazy" decoding="async" />`;
const homeCount = String(homeProjects.length).padStart(2, "0");
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
    clusters: () => `
    <h2 class="home-big">Work,</h2>
    <div class="home-clusters" data-clusters>
      <ol class="home-clusters__names" style="grid-row: 1 / span ${homeProjects.length};">
        ${homeProjects.map((project, index) => `<li><a href="${homeHref(project)}" data-name="${index}">${project.title}</a></li>`).join("")}
        <li><a class="home-clusters__more" href="work.html">Archive ↗</a></li>
      </ol>
      ${homeProjects.map((project, index) => {
        const frames = homeFrames(project, 9);
        const shot = (src, n) => `<a class="home-cluster__shot${n % 4 === 1 ? " home-cluster__shot--bleed" : ""}" href="${homeHref(project)}" tabindex="-1">${homeImg(src)}</a>`;
        return `
        <article class="home-cluster" style="grid-row: ${index + 1};" data-cluster="${index}">
          <div class="home-cluster__left">
            ${frames.slice(0, 2).map(shot).join("")}
            <a class="home-cluster__number" href="${homeHref(project)}">${project.number}<span>${project.title} — ${project.discipline}, ${project.year}</span></a>
          </div>
          <div class="home-cluster__right">${frames.slice(2).map((src, n) => shot(src, n + 2)).join("")}</div>
        </article>`;
    }).join("")}
    </div>`,
    column: () => {
        const half = Math.ceil(homeProjects.length / 2);
        const names = (list, offset) => list.map((project, index) => `
      <li><a href="${homeHref(project)}" data-name="${index + offset}"><span>${project.number}/</span><strong>${project.title}</strong><em>${project.discipline}, ${project.year}</em></a></li>`).join("");
        return `
    <div class="home-column" data-column>
      <ol class="home-column__names">${names(homeProjects.slice(0, half), 0)}</ol>
      <div class="home-column__strip">
        ${homeProjects.map((project, index) => homeFrames(project, 6).map((src, n) => `
          <a class="home-column__frame${n % 2 ? " home-column__frame--wide" : ""}" href="${homeHref(project)}" data-project="${index}">${homeImg(src, n ? "" : project.imageAlt ?? project.title)}</a>`).join("")).join("")}
      </div>
      <ol class="home-column__names home-column__names--right">${names(homeProjects.slice(half), half)}</ol>
      <p class="home-column__now" aria-hidden="true"></p>
    </div>`;
    },
    tiles: () => `
    <div class="home-tiles">
      ${homeProjects.map((project, index) => {
        const frames = homeFrames(project);
        const text = `
          <a class="home-tile home-tile--text" href="${homeHref(project)}">
            <span class="home-tile__top"><span>${project.discipline}</span><span class="home-tile__number">${project.number}</span></span>
            <span class="home-tile__sentence">${homeMade[project.number] ?? project.summary} <span aria-hidden="true">→</span></span>
          </a>`;
        const image = (src, extra = "") => `<a class="home-tile home-tile--image${extra}" href="${homeHref(project)}" tabindex="-1">${homeImg(src)}</a>`;
        return index % 2 === 0
            ? `<div class="home-tiles__row home-tiles__row--half">${image(frames[0], " home-tile--hover")}${text}</div>`
            : `<div class="home-tiles__row home-tiles__row--quarters">${image(frames[0], " home-tile--hover")}${text}${image(frames[2])}${image(frames[4])}</div>`;
    }).join("")}
    </div>`,
    desktop: () => `
    <div class="home-desktop" data-desktop>
      <span class="home-desktop__backdrop" aria-hidden="true">Ra</span>
      ${homeProjects.map((project, index) => homeFrames(project, 7).map((src, n) => `
        <a class="home-desktop__file" href="${homeHref(project)}" data-side="${index % 2}" data-n="${n}">
          <span class="home-desktop__icon">${homeImg(src, n ? "" : project.title)}</span>
          <span class="home-desktop__name">${n ? `${project.title.split(" ").pop()?.toLowerCase()}-${String(n).padStart(2, "0")}` : project.title}</span>
        </a>`).join("")).join("")}
      <nav class="home-desktop__dock" aria-label="Shortcuts">
        <a href="work.html"><span>/</span>Work</a>
        <a href="about.html"><span>/</span>About</a>
        <a href="archive.html"><span>/</span>Archive</a>
        <i aria-hidden="true"></i>
        <a href="#contact"><span>@</span>Contact</a>
      </nav>
    </div>`,
    row: () => `
    <div class="home-row" data-row>
      <div class="home-row__strip">
        ${homeProjects.map((project) => homeFrames(project, 5).map((src, n) => `
          <a class="home-row__item" href="${homeHref(project)}">
            <span class="home-row__label">${project.number}.${n + 1}<br />${project.title}<br /><em>[${project.services[n % project.services.length]}]</em></span>
            <span class="home-row__media">${homeImg(src, n ? "" : project.imageAlt ?? project.title)}</span>
          </a>`).join("")).join("")}
      </div>
      <p class="home-row__title" aria-hidden="true">Selected <em>work</em></p>
    </div>`,
    curve: () => {
        const frames = homeProjects.flatMap((project, index) => homeFrames(project, 6).map((src, n) => ({ project, index, src, n })));
        return `
    <div class="home-curve" data-curve style="--count: ${frames.length};">
      <div class="home-curve__floor" aria-hidden="true"></div>
      <div class="home-curve__ring">
        ${frames.map(({ project, index, src, n }, i) => `
          <a class="home-curve__panel" href="${homeHref(project)}" style="--i: ${i};" data-project="${index}" draggable="false">
            ${homeImg(src, n ? "" : project.imageAlt ?? project.title)}
            <span>${project.title} — ${project.number}.${n + 1}</span>
          </a>`).join("")}
      </div>
      <div class="home-curve__caption">
        <p class="home-curve__now"></p>
        <p class="home-curve__hint"><button type="button" data-curve-step="-1" aria-label="Previous">←</button> Drag to turn <button type="button" data-curve-step="1" aria-label="Next">→</button></p>
      </div>
    </div>`;
    },
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
    if (homeLayout === "clusters")
        mountNames(section, "[data-cluster]", (element) => Number(element.dataset.cluster));
    if (homeLayout === "column")
        mountNames(section, ".home-column__frame", (element) => Number(element.dataset.project));
    if (homeLayout === "desktop")
        mountDesktop(section);
    if (homeLayout === "row")
        mountRow(section);
    if (homeLayout === "curve")
        mountCurve(section);
}
// Clusters and Column: the name of whichever project sits at the middle of
// the screen is lit.
function mountNames(section, selector, projectOf) {
    const names = [...section.querySelectorAll("[data-name]")];
    const now = section.querySelector(".home-column__now");
    const light = (index) => {
        names.forEach((name) => name.classList.toggle("is-on", Number(name.dataset.name) === index));
        if (now)
            now.textContent = `${homeProjects[index].number}/ ${homeProjects[index].title}`;
    };
    light(0);
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting)
                light(projectOf(entry.target));
        });
    }, { rootMargin: "-50% 0px -50% 0px" });
    section.querySelectorAll(selector).forEach((element) => observer.observe(element));
}
// Desktop: the files settle around the middle in two loose groups, one per
// project, the way a working desktop fills up.
function mountDesktop(section) {
    const files = [...section.querySelectorAll(".home-desktop__file")];
    const spots = [
        [0.27, 0.1], [0.37, 0.24], [0.22, 0.32], [0.33, 0.46], [0.17, 0.53], [0.39, 0.62], [0.26, 0.68],
    ];
    files.forEach((file) => {
        const [x, y] = spots[Number(file.dataset.n) % spots.length];
        const left = file.dataset.side === "1" ? 1 - x : x;
        file.style.left = `${left * 100}%`;
        file.style.top = `${y * 100}%`;
    });
}
// Row: the frame you're on opens up; the first one starts open.
function mountRow(section) {
    const items = [...section.querySelectorAll(".home-row__item")];
    const open = (item) => items.forEach((other) => other.classList.toggle("is-open", other === item));
    items.forEach((item) => {
        item.addEventListener("pointerenter", () => open(item));
        item.addEventListener("focus", () => open(item));
    });
    if (items[0])
        open(items[0]);
}
// Curve: the frames stand on the inside of a ring. Drag to turn it (it
// carries on a little and settles on the nearest frame), or use the arrows.
function mountCurve(section) {
    const root = section.querySelector("[data-curve]");
    const ring = root?.querySelector(".home-curve__ring");
    const now = root?.querySelector(".home-curve__now");
    if (!root || !ring || !now)
        return;
    const panels = [...ring.querySelectorAll(".home-curve__panel")];
    const step = 360 / panels.length;
    let angle = 0;
    let target = 0;
    let frame = 0;
    let dragged = false;
    const front = () => ((Math.round(-angle / step) % panels.length) + panels.length) % panels.length;
    const draw = () => {
        ring.style.setProperty("--turn", `${angle}deg`);
        const current = front();
        // Only the frame in front and its neighbours show; the rest of the ring
        // would swing past the viewer.
        panels.forEach((panel, index) => {
            const away = Math.abs(((index - current + panels.length + panels.length / 2) % panels.length) - panels.length / 2);
            panel.classList.toggle("is-front", away === 0);
            panel.classList.toggle("is-away", away > 2);
        });
        const project = homeProjects[Number(panels[current].dataset.project)];
        const text = `<a href="${homeHref(project)}">${project.number}/ ${project.title}</a><span>${project.discipline}, ${project.year}</span>`;
        if (now.innerHTML !== text)
            now.innerHTML = text;
    };
    const settle = () => {
        angle += (target - angle) * 0.12;
        if (Math.abs(target - angle) < 0.02)
            angle = target;
        draw();
        frame = angle === target ? 0 : requestAnimationFrame(settle);
    };
    const go = (to) => {
        target = to;
        if (!frame)
            frame = requestAnimationFrame(settle);
    };
    const snap = (value) => Math.round(value / step) * step;
    let startX = 0;
    let startAngle = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let held = false;
    root.addEventListener("dragstart", (event) => event.preventDefault());
    root.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 || event.target.closest("button"))
            return;
        held = true;
        dragged = false;
        startX = lastX = event.clientX;
        lastTime = event.timeStamp;
        startAngle = angle;
        velocity = 0;
        cancelAnimationFrame(frame);
        frame = 0;
    });
    window.addEventListener("pointermove", (event) => {
        if (!held)
            return;
        const dx = event.clientX - startX;
        if (Math.abs(dx) > 5)
            dragged = true;
        const perPixel = step / (panels[0].offsetWidth || 300);
        angle = target = startAngle + dx * perPixel;
        velocity = ((event.clientX - lastX) / Math.max(8, event.timeStamp - lastTime)) * 16 * perPixel;
        lastX = event.clientX;
        lastTime = event.timeStamp;
        draw();
    });
    window.addEventListener("pointerup", () => {
        if (!held)
            return;
        held = false;
        go(snap(angle + velocity * 12));
    });
    panels.forEach((panel, index) => {
        panel.addEventListener("click", (event) => {
            if (dragged || index !== front()) {
                event.preventDefault();
                if (!dragged)
                    go(snap(angle) - (((index - front() + panels.length + panels.length / 2) % panels.length) - panels.length / 2) * step);
            }
        });
    });
    root.querySelectorAll("[data-curve-step]").forEach((button) => {
        button.addEventListener("click", () => go(snap(target) - Number(button.dataset.curveStep) * step));
    });
    draw();
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
