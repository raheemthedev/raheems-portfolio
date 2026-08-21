interface ArchiveProject {
  number: string;
  title: string;
  discipline: string;
  category: "identity" | "campaign" | "digital" | "direction" | "packaging";
  style: string;
  year: string;
  summary: string;
  services: string[];
  image?: string;
  imageAlt?: string;
  gallery?: string[];
  href?: string;
}

const archiveProjects: ArchiveProject[] = [
  {
    number: "01",
    title: "Project 01",
    discipline: "Visual Identity",
    category: "identity",
    style: "identity",
    year: "2026",
    summary: "A flexible visual identity designed to feel clear, considered, and unmistakable.",
    services: ["Strategy", "Identity", "Guidelines"],
  },
  {
    number: "02",
    title: "Project 02",
    discipline: "Brand System",
    category: "identity",
    style: "brand",
    year: "2026",
    summary: "A brand system built to move consistently across physical and digital touchpoints.",
    services: ["Brand system", "Art direction", "Digital"],
  },
  {
    number: "03",
    title: "Project 03",
    discipline: "Art Direction",
    category: "direction",
    style: "direction",
    year: "2025",
    summary: "Art direction that turns a distinct point of view into a recognizable visual world.",
    services: ["Concept", "Campaign", "Editorial"],
  },
  {
    number: "04",
    title: "Project 04",
    discipline: "Packaging",
    category: "packaging",
    style: "packaging",
    year: "2025",
    summary: "Packaging made to hold attention while keeping the product story direct and useful.",
    services: ["Packaging", "Typography", "Production"],
  },
  {
    number: "05",
    title: "Project 05",
    discipline: "Campaign Design",
    category: "campaign",
    style: "campaign",
    year: "2024",
    summary: "A campaign language with enough rhythm to work across motion, social, and print.",
    services: ["Campaign", "Motion", "Social"],
  },
  {
    number: "06",
    title: "Project 06",
    discipline: "Digital Expression",
    category: "digital",
    style: "digital",
    year: "2024",
    summary: "A responsive digital expression carrying the identity into an animated experience.",
    services: ["Web design", "Interaction", "Development"],
  },
];

const workGrid = document.querySelector<HTMLElement>(".work-grid");
const workArchive = document.querySelector<HTMLElement>(".work-archive");
const workDetailsList = document.querySelector<HTMLElement>(".work-details-list");
const filterButtons = [...document.querySelectorAll<HTMLButtonElement>(".work-filter")];
const viewButtons = [...document.querySelectorAll<HTMLButtonElement>(".work-view-button")];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (!workArchive || !workGrid || !workDetailsList || filterButtons.length === 0 || viewButtons.length === 0) {
  throw new Error("Work archive markup is incomplete.");
}

const projectMarkup = (project: ArchiveProject, index: number) => {
  const caseStudyHref = `case-study.html?project=${encodeURIComponent(project.number)}`;
  const media = project.image
    ? `<img src="${project.image}" alt="${project.imageAlt ?? project.title}" />`
    : `<div class="work-card__blank" aria-hidden="true"><span>${project.number}</span></div>`;

  const content = `
    <div class="work-card__media">${media}</div>
    <div class="work-card__details">
      <div class="work-card__heading">
        <h3>${project.title}</h3>
        <span>View case study</span>
      </div>
      <p class="work-card__summary">${project.summary}</p>
    </div>
  `;

  return `
    <article class="work-card work-card--${project.style}" data-category="${project.category}" style="--project-order: ${index};">
      <a href="${caseStudyHref}" aria-label="View ${project.title} case study">${content}</a>
    </article>
  `;
};

workGrid.innerHTML = archiveProjects.map(projectMarkup).join("");

const gridLayouts = [
  "work-card--wide",
  "work-card--offset",
  "work-card--small",
  "work-card--large",
  "work-card--medium",
  "work-card--end",
] as const;

const composeGrid = (visibleCards: HTMLElement[]) => {
  workCards.forEach((card) => card.classList.remove(...gridLayouts));
  workGrid.classList.toggle("is-single", visibleCards.length === 1);
  visibleCards.forEach((card, index) => {
    card.classList.add(gridLayouts[index % gridLayouts.length]);
  });
};

const galleryFrameMarkup = (project: ArchiveProject, index: number) => {
  const image = project.gallery?.[index] ?? project.image;
  const content = image
    ? `<img src="${image}" alt="${project.imageAlt ?? project.title} — frame ${index + 1}" />`
    : `<div class="work-card__blank" aria-hidden="true"></div>`;

  const caseStudyHref = `case-study.html?project=${encodeURIComponent(project.number)}`;
  return `<a class="work-gallery__frame" href="${caseStudyHref}" aria-label="View ${project.title} case study frame ${index + 1}" style="--frame-index: ${index};">${content}</a>`;
};

const detailRowMarkup = (project: ArchiveProject) => {
  const frameCount = Math.max(7, project.gallery?.length ?? 0);
  const frames = Array.from({ length: frameCount }, (_, index) => galleryFrameMarkup(project, index)).join("");

  return `
    <article
      class="work-detail-row"
      data-category="${project.category}"
      role="listitem"
    >
      <div class="work-detail-row__header">
        <div class="work-detail-row__tags">
          ${[project.discipline, ...project.services.slice(0, 2)].map((tag) => `<span>${tag}</span>`).join("")}
        </div>
        <a class="work-detail-row__case" href="case-study.html?project=${encodeURIComponent(project.number)}">See Full Case <span aria-hidden="true">↗</span></a>
      </div>
      <div class="work-detail-row__intro">
        <h3><strong>${project.title}:</strong> visual language for a distinct point of view.</h3>
        <div class="work-detail-row__copy">
          <p>${project.summary}</p>
          <p>We created a flexible system that brings the identity together across print, digital, and physical touchpoints.</p>
        </div>
      </div>
      <div class="work-gallery" aria-label="${project.title} project frames">
        <div class="work-gallery__motion">
          <div class="work-gallery__track" style="--gallery-duration: ${42 + Number(project.number) * 2}s;">
            ${frames}
            ${frames}
          </div>
        </div>
      </div>
    </article>
  `;
};

workDetailsList.innerHTML = archiveProjects
  .map((project) => detailRowMarkup(project))
  .join("");

const workCards = [...workGrid.querySelectorAll<HTMLElement>(".work-card")];
const workDetails = [...workDetailsList.querySelectorAll<HTMLElement>(".work-detail-row")];
const viewItems = [...workCards, ...workDetails];
const galleryRateFrames = new WeakMap<Animation, number>();

const easeGalleryRate = (animation: Animation, targetRate: number, duration = 700) => {
  const existingFrame = galleryRateFrames.get(animation);
  if (existingFrame !== undefined) cancelAnimationFrame(existingFrame);

  const startRate = animation.playbackRate;
  const startTime = performance.now();

  const updateRate = (timestamp: number) => {
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    animation.playbackRate = startRate + (targetRate - startRate) * eased;

    if (progress < 1) {
      galleryRateFrames.set(animation, requestAnimationFrame(updateRate));
    } else {
      galleryRateFrames.delete(animation);
    }
  };

  galleryRateFrames.set(animation, requestAnimationFrame(updateRate));
};

document.querySelectorAll<HTMLElement>(".work-gallery").forEach((gallery) => {
  const track = gallery.querySelector<HTMLElement>(".work-gallery__track");
  const getTrackAnimation = () => track?.getAnimations()[0];

  gallery.querySelectorAll<HTMLElement>(".work-gallery__frame").forEach((frame) => {
    frame.addEventListener("pointerenter", () => gallery.classList.add("is-frame-expanded"));
    frame.addEventListener("pointerleave", () => gallery.classList.remove("is-frame-expanded"));
  });

  gallery.addEventListener("pointerenter", () => {
    const animation = getTrackAnimation();
    if (animation) easeGalleryRate(animation, 0, 420);
  });
  gallery.addEventListener("pointerleave", () => {
    gallery.classList.remove("is-frame-expanded");
    const animation = getTrackAnimation();
    if (animation) easeGalleryRate(animation, 1, 900);
  });
  gallery.addEventListener("focusin", () => {
    const animation = getTrackAnimation();
    if (animation) easeGalleryRate(animation, 0, 420);
  });
  gallery.addEventListener("focusout", () => {
    const animation = getTrackAnimation();
    if (animation) easeGalleryRate(animation, 1, 900);
  });
});

const revealCards = () => {
  if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
    viewItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8%", threshold: 0.08 },
  );

  viewItems.forEach((item) => observer.observe(item));
};

const filterProjects = (filter: string) => {
  viewItems.forEach((item) => {
    const shouldShow = filter === "all" || item.dataset.category === filter;
    item.hidden = !shouldShow;
    if (shouldShow) item.classList.add("is-visible");
  });

  composeGrid(workCards.filter((card) => !card.hidden));
};

const setView = (view: "grid" | "details") => {
  workArchive.dataset.view = view;
  const activeItems = view === "details" ? workDetails : workCards;
  activeItems.forEach((item) => item.classList.add("is-visible"));
  viewButtons.forEach((button) => {
    const isActive = button.dataset.viewButton === view;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
};

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });

    filterProjects(button.dataset.filter ?? "all");
  });
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const view = button.dataset.viewButton === "details" ? "details" : "grid";
    setView(view);
  });
});

revealCards();
composeGrid(workCards);
