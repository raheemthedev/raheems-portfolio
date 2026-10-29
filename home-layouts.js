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
//   scrub    — the work cards, but moving across an image flips through the
//              project's whole gallery, with a frame counter beneath it.
//   stack    — one full-screen card per project, pinned as you scroll so the
//              next slides over it while the one beneath sinks back.
//   strips   — each project as a title line over a slow film strip of its
//              gallery; hovering pauses it and lifts the frame you're on.
// "hero" is the original homepage.
const homeLayouts = [
    { id: "work", label: "Work" },
    { id: "scrub", label: "Scrub" },
    { id: "stack", label: "Stack" },
    { id: "strips", label: "Strips" },
    { id: "feature", label: "Feature" },
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
// The cover first, then the rest of the project's gallery.
const homeFrames = (project) => [project.image, ...(project.gallery ?? []).filter((src) => src !== project.image)];
const homeCardText = (project) => `
  <span class="home-card__head"><span class="home-card__number">${project.number}</span><strong>${project.title}</strong><span class="home-card__arrow" aria-hidden="true">→</span></span>
  <span class="home-card__meta">${project.discipline} · ${project.year}</span>
  <span class="home-card__summary">${project.summary}</span>
  <span class="home-card__services">${project.services.join(" · ")}</span>`;
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
    scrub: () => `
    <div class="home-work__grid">
      ${homeProjects.map((project) => {
        const frames = homeFrames(project);
        return `
        <a class="home-card home-scrub" href="${homeHref(project)}" data-scrub>
          <span class="home-scrub__media home-media">
            ${frames.map((src, index) => `<img class="home-scrub__frame${index ? "" : " is-on"}" ${index ? `data-src="${src}"` : `src="${src}"`} alt="${index ? "" : project.imageAlt ?? project.title}" draggable="false" loading="lazy" decoding="async" />`).join("")}
          </span>
          <span class="home-scrub__track" aria-hidden="true">
            <span class="home-scrub__ticks">${"<i></i>".repeat(frames.length)}</span>
            <span class="home-scrub__count"><b>01</b> / ${String(frames.length).padStart(2, "0")}</span>
          </span>
          ${homeCardText(project)}
        </a>`;
    }).join("")}
    </div>`,
    stack: () => `
    <div class="home-stack">
      ${homeProjects.map((project, index) => `
        <a class="home-stack__card${index % 2 ? " home-stack__card--ink" : ""}" href="${homeHref(project)}" style="--i: ${index};" data-stack-card>
          ${homeMedia(project, "home-stack__media home-media")}
          <span class="home-stack__info">
            <span class="home-stack__number">${project.number}</span>
            <strong class="home-stack__title">${project.title}</strong>
            <span class="home-stack__summary">${project.summary}</span>
            ${homeDetails(project)}
            <span class="home-stack__cta">View case study <span aria-hidden="true">→</span></span>
          </span>
        </a>`).join("")}
    </div>`,
    strips: () => homeProjects.map((project, index) => {
        const frames = homeFrames(project);
        const reel = frames.map((src) => `<img data-src="${src}" alt="" draggable="false" decoding="async" />`).join("");
        return `
    <article class="home-strip${index % 2 ? " home-strip--reverse" : ""}">
      <a class="home-strip__head" href="${homeHref(project)}">
        <span class="home-strip__number">${project.number}</span>
        <strong class="home-strip__title">${project.title}</strong>
        <span class="home-strip__meta">${project.discipline}<br />${project.services.join(", ")} · ${project.year}</span>
        <span class="home-strip__arrow" aria-hidden="true">→</span>
      </a>
      <a class="home-strip__reel" href="${homeHref(project)}" aria-label="${project.title}: ${project.summary}" data-strip>
        <span class="home-strip__track" style="--frames: ${frames.length};">${reel}${reel}</span>
      </a>
    </article>`;
    }).join(""),
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
    if (homeLayout === "scrub")
        mountScrub(section);
    if (homeLayout === "stack")
        mountStack(section);
    if (homeLayout === "strips")
        mountStrips(section);
}
// Fill in deferred images once they're needed.
const homeLoad = (root) => {
    root.querySelectorAll("img[data-src]").forEach((image) => {
        image.src = image.dataset.src;
        image.removeAttribute("data-src");
        // Wide banners would crop to a sliver, so they sit whole on a dark ground.
        image.addEventListener("load", () => {
            if (image.naturalWidth / image.naturalHeight > 2.2)
                image.classList.add("is-wide");
        }, { once: true });
    });
};
// Scrub: the cursor's place across the image picks the frame. A horizontal
// drag does the same on a phone.
function mountScrub(section) {
    section.querySelectorAll("[data-scrub]").forEach((card) => {
        const media = card.querySelector(".home-scrub__media");
        const frames = [...card.querySelectorAll(".home-scrub__frame")];
        const ticks = [...card.querySelectorAll(".home-scrub__ticks i")];
        const count = card.querySelector(".home-scrub__count b");
        if (!media)
            return;
        let current = 0;
        const show = (index) => {
            if (index === current)
                return;
            frames[current].classList.remove("is-on");
            ticks[current]?.classList.remove("is-on");
            frames[index].classList.add("is-on");
            ticks[index]?.classList.add("is-on");
            if (count)
                count.textContent = String(index + 1).padStart(2, "0");
            current = index;
        };
        ticks[0]?.classList.add("is-on");
        media.addEventListener("pointerenter", () => homeLoad(media), { once: true });
        media.addEventListener("pointermove", (event) => {
            const box = media.getBoundingClientRect();
            const ratio = Math.min(0.999, Math.max(0, (event.clientX - box.left) / box.width));
            show(Math.floor(ratio * frames.length));
        });
        card.addEventListener("pointerleave", () => show(0));
    });
}
// Stack: as the next card slides up over one, that one sinks back and dims.
function mountStack(section) {
    const cards = [...section.querySelectorAll("[data-stack-card]")];
    let frame = 0;
    const update = () => {
        frame = 0;
        cards.forEach((card, index) => {
            const next = cards[index + 1];
            if (!next)
                return;
            const top = card.getBoundingClientRect().top;
            const nextTop = next.getBoundingClientRect().top;
            const covered = Math.min(1, Math.max(0, 1 - (nextTop - top) / card.offsetHeight));
            card.style.setProperty("--covered", covered.toFixed(3));
        });
    };
    const request = () => {
        if (!frame)
            frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    update();
}
// Strips: images load as a strip comes near, and the film only runs while it
// is on screen.
function mountStrips(section) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting)
                homeLoad(entry.target);
            entry.target.classList.toggle("is-running", entry.isIntersecting);
        });
    }, { rootMargin: "300px 0px" });
    section.querySelectorAll("[data-strip]").forEach((strip) => observer.observe(strip));
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
