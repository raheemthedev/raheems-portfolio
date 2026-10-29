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
//   proofs   — the work as printer's proofs on a desk: crop marks, a colour bar
//              taken from the project's own image, a slug line, and a red "Ra"
//              approval stamp that lands when a sheet is picked up.
//   exhibition — the work hung like a show: each piece framed on a warm wall
//              under its own light, with a museum wall label beside it.
// "hero" is the original homepage.
const homeLayouts = [
    { id: "work", label: "Work" },
    { id: "feature", label: "Feature" },
    { id: "proofs", label: "Proofs" },
    { id: "exhibition", label: "Exhibition" },
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
// A printer's registration target.
const homeRegMark = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6.5" /><path d="M12 0v24M0 12h24" /></svg>`;
// The approval stamp: "Ra" in the middle, his name and the year around it.
const homeStamp = (project) => `
  <span class="proof__stamp" aria-hidden="true">
    <svg viewBox="0 0 120 120">
      <defs><path id="stamp-ring-${project.number}" d="M60 60m-43 0a43 43 0 1 1 86 0a43 43 0 1 1-86 0" /></defs>
      <circle cx="60" cy="60" r="56" /><circle cx="60" cy="60" r="33" />
      <text><textPath href="#stamp-ring-${project.number}">APPROVED · RAHEEM ANIMASHAUN · ${project.year} ·</textPath></text>
      <text class="proof__stamp-ra" x="60" y="70" text-anchor="middle">Ra</text>
    </svg>
  </span>`;
const homeHeaders = {
    work: ["/ Selected work", `${String(homeProjects.length).padStart(2, "0")} case studies`],
    feature: ["/ Selected work", `${String(homeProjects.length).padStart(2, "0")} case studies`],
    proofs: ["/ Proofs, for your approval", `${String(homeProjects.length).padStart(2, "0")} sheets on the desk`],
    exhibition: ["/ Now showing", `Selected works, ${homeYears()}`],
};
function homeYears() {
    const years = homeProjects.map((project) => Number(project.year)).filter(Boolean);
    const first = Math.min(...years);
    const last = Math.max(...years);
    return first === last ? String(first) : `${first}–${last}`;
}
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
    proofs: () => `
    <div class="home-proofs">
      ${homeProjects.map((project, index) => `
        <a class="proof" href="${homeHref(project)}" style="--tilt: ${index % 2 ? 1.6 : -1.3}deg;">
          <span class="proof__crop proof__crop--tl" aria-hidden="true"></span>
          <span class="proof__crop proof__crop--tr" aria-hidden="true"></span>
          <span class="proof__crop proof__crop--bl" aria-hidden="true"></span>
          <span class="proof__crop proof__crop--br" aria-hidden="true"></span>
          <span class="proof__slug" aria-hidden="true"><span>Proof ${project.number} of ${String(homeProjects.length).padStart(2, "0")}</span><span>${project.title}</span><span>${project.year}</span></span>
          <span class="proof__plate">
            ${homeMedia(project, "proof__media home-media")}
            <span class="proof__reg proof__reg--left" aria-hidden="true">${homeRegMark}</span>
            <span class="proof__reg proof__reg--right" aria-hidden="true">${homeRegMark}</span>
          </span>
          <span class="proof__bar" aria-hidden="true" data-proof-bar>${"<i></i>".repeat(6)}<i class="proof__k"></i><i class="proof__k proof__k--50"></i><i class="proof__k proof__k--25"></i></span>
          <span class="proof__body">
            <strong class="proof__title">${project.title}</strong>
            <span class="proof__summary">${project.summary}</span>
          </span>
          <span class="proof__sign">
            <span><em>Sector</em>${project.discipline}</span>
            <span><em>Role</em>${project.services.join(", ")}</span>
            <span class="proof__approve"><em>Approved</em><b aria-hidden="true"></b></span>
          </span>
          <span class="proof__foot" aria-hidden="true">Raheem Animashaun — Proof ${project.number} — ${project.title} — ${project.discipline} — ${project.year} — Lagos</span>
          ${homeStamp(project)}
        </a>`).join("")}
    </div>`,
    exhibition: () => homeProjects.map((project) => `
    <article class="exhibit">
      <a class="exhibit__frame" href="${homeHref(project)}" aria-label="${project.title} case study">
        ${homeMedia(project, "exhibit__media home-media")}
      </a>
      <aside class="exhibit__label">
        <p class="exhibit__number">${project.number}</p>
        <p class="exhibit__artist">Raheem Animashaun<span>Lagos, Nigeria</span></p>
        <h3 class="exhibit__title"><em>${project.title}</em>, ${project.year}</h3>
        <p class="exhibit__medium">${project.services.join(", ")}</p>
        <p class="exhibit__note">${project.summary}</p>
        <p class="exhibit__sector">${project.discipline}</p>
        <a class="exhibit__link" href="${homeHref(project)}">Step inside <span aria-hidden="true">→</span></a>
      </aside>
    </article>`).join(""),
};
if (homeLanding && homeLayout && homeLayout !== "hero") {
    const [label, count] = homeHeaders[homeLayout];
    const section = document.createElement("section");
    section.className = `home-work home-work--${homeLayout}`;
    section.setAttribute("aria-labelledby", "home-work-title");
    section.innerHTML = `
    <header class="home-work__header">
      <p id="home-work-title">${label}</p>
      <p class="home-work__count">${count}</p>
    </header>
    ${homeBuilders[homeLayout]()}
    <a class="home-work__all" href="work.html">See all work <span aria-hidden="true">↗</span></a>`;
    homeLanding.after(section);
    if (homeLayout === "proofs")
        mountProofs(section);
    if (homeLayout === "exhibition")
        mountExhibition(section);
}
// Proofs: each colour bar takes its swatches from the project's own image, and
// the stamp lands the first time a sheet is picked up, then stays.
function mountProofs(section) {
    section.querySelectorAll(".proof").forEach((sheet) => {
        const image = sheet.querySelector(".home-media__still");
        const bar = sheet.querySelector("[data-proof-bar]");
        if (image && bar) {
            const paint = () => {
                proofSwatches(image).forEach((colour, index) => {
                    const swatch = bar.children[index];
                    if (swatch)
                        swatch.style.background = colour;
                });
            };
            if (image.complete && image.naturalWidth)
                paint();
            else
                image.addEventListener("load", paint, { once: true });
        }
        const stamp = () => sheet.classList.add("is-stamped");
        sheet.addEventListener("pointerenter", stamp, { once: true });
        sheet.addEventListener("focus", stamp, { once: true });
    });
}
// The six most common distinct colours in an image, darkest first.
function proofSwatches(image) {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 36;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context)
        return [];
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const buckets = new Map();
    for (let i = 0; i < data.length; i += 4) {
        const key = ((data[i] >> 5) << 6) | ((data[i + 1] >> 5) << 3) | (data[i + 2] >> 5);
        const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
        bucket.count += 1;
        bucket.r += data[i];
        bucket.g += data[i + 1];
        bucket.b += data[i + 2];
        buckets.set(key, bucket);
    }
    const picked = [];
    [...buckets.values()]
        .sort((a, b) => b.count - a.count)
        .forEach(({ count, r, g, b }) => {
        const colour = [r / count, g / count, b / count];
        const distinct = picked.every((other) => Math.hypot(colour[0] - other[0], colour[1] - other[1], colour[2] - other[2]) > 48);
        if (picked.length < 6 && distinct)
            picked.push(colour);
    });
    return picked
        .sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]))
        .map(([r, g, b]) => `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`);
}
// Exhibition: each piece's light fades up as you reach it and leans a little
// toward the cursor; the frame's shadow falls away from the light.
function mountExhibition(section) {
    const exhibits = section.querySelectorAll(".exhibit");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => entry.target.classList.toggle("is-lit", entry.isIntersecting));
    }, { threshold: 0.35 });
    exhibits.forEach((exhibit) => {
        observer.observe(exhibit);
        exhibit.addEventListener("pointermove", (event) => {
            const box = exhibit.getBoundingClientRect();
            const x = (event.clientX - box.left) / box.width;
            const y = (event.clientY - box.top) / box.height;
            exhibit.style.setProperty("--light-x", `${30 + x * 24}%`);
            exhibit.style.setProperty("--light-y", `${32 + y * 16}%`);
        });
        exhibit.addEventListener("pointerleave", () => {
            exhibit.style.removeProperty("--light-x");
            exhibit.style.removeProperty("--light-y");
        });
    });
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
