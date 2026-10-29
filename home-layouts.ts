// Work-first homepages, for visitors who want proof of work straight away.
// Chosen before anything draws by a small script in index.html's head
// (?home=, remembered), which sets <html data-home>. In these layouts the
// interactive hero (Horizon/Field, hero-modes.ts) and the original wheel stay
// unmounted, and the work is built here from archiveProjects:
//   work     — the statement, then the case studies as two large cards, each
//              with its sector, year, summary and services.
//   feature  — the statement, then each case study as a full-width spread: a
//              big image beside its details, alternating sides.
// "hero" is the original homepage.

type HomeLayout = "hero" | "work" | "feature";

const homeLayouts: { id: HomeLayout; label: string }[] = [
  { id: "work", label: "Work" },
  { id: "feature", label: "Feature" },
  { id: "hero", label: "Original" },
];
const homeLayoutKey = "raheem-home-layout";
const homeLayout = document.documentElement.dataset.home as HomeLayout | undefined;
const homeLanding = document.querySelector<HTMLElement>(".landing");

// Only finished work goes on the homepage.
const homeProjects = archiveProjects.filter((project) => project.image);
const homeHref = (project: ArchiveProject) => project.href ?? `case-study.html?project=${project.number}`;

const homeMedia = (project: ArchiveProject, className: string) => `
  <span class="${className}">
    <img class="home-media__still" src="${project.image}" alt="${project.imageAlt ?? project.title}" draggable="false" loading="lazy" decoding="async" />
    ${project.hoverImage ? `<img class="home-media__hover" src="${project.hoverImage}" alt="" aria-hidden="true" draggable="false" loading="lazy" decoding="async" />` : ""}
  </span>`;

const homeDetails = (project: ArchiveProject) => `
  <dl class="home-details">
    <div><dt>Sector</dt><dd>${project.discipline}</dd></div>
    <div><dt>Role</dt><dd>${project.services.join(", ")}</dd></div>
    <div><dt>Year</dt><dd>${project.year}</dd></div>
  </dl>`;

const homeBuilders: Record<Exclude<HomeLayout, "hero">, () => string> = {
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
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("button[data-home-layout]") : null;
    const choice = button?.dataset.homeLayout;
    if (!choice || choice === homeLayout) return;
    try {
      window.localStorage.setItem(homeLayoutKey, choice);
    } catch {
      // The reload below still carries the choice in the address.
    }
    const url = new URL(window.location.href);
    url.searchParams.set("home", choice);
    window.location.href = url.toString();
  });
  document.body.append(picker);
}
