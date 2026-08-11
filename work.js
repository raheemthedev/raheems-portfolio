"use strict";
const archiveProjects = [
    {
        number: "01",
        title: "Project title",
        discipline: "Visual Identity",
        category: "identity",
        style: "identity",
        year: "2026",
        summary: "A flexible identity system built to make a growing brand feel clear, considered, and unmistakable.",
        services: ["Strategy", "Identity", "Guidelines"],
    },
    {
        number: "02",
        title: "Project title",
        discipline: "Brand System",
        category: "identity",
        style: "brand",
        year: "2026",
        summary: "A brand system that gives a new venture the structure to move consistently across every touchpoint.",
        services: ["Brand system", "Art direction", "Digital"],
    },
    {
        number: "03",
        title: "Project title",
        discipline: "Art Direction",
        category: "direction",
        style: "direction",
        year: "2025",
        summary: "A visual direction that turns a point of view into a recognizable world for people to step into.",
        services: ["Concept", "Campaign", "Editorial"],
    },
    {
        number: "04",
        title: "Project title",
        discipline: "Packaging",
        category: "packaging",
        style: "packaging",
        year: "2025",
        summary: "Packaging designed to hold attention on the shelf while keeping the product story direct and useful.",
        services: ["Packaging", "Typography", "Production"],
    },
    {
        number: "05",
        title: "Project title",
        discipline: "Campaign Design",
        category: "campaign",
        style: "campaign",
        year: "2024",
        summary: "A campaign language made for movement, giving a launch a sharper rhythm across physical and digital media.",
        services: ["Campaign", "Motion", "Social"],
    },
    {
        number: "06",
        title: "Project title",
        discipline: "Digital Expression",
        category: "digital",
        style: "digital",
        year: "2024",
        summary: "A digital expression that carries the identity into a responsive, animated, and easy-to-use experience.",
        services: ["Web design", "Interaction", "Development"],
    },
];
const workGrid = document.querySelector(".work-grid");
const workArchive = document.querySelector(".work-archive");
const workDetailsList = document.querySelector(".work-details-list");
const filterButtons = [...document.querySelectorAll(".work-filter")];
const viewButtons = [...document.querySelectorAll(".work-view-button")];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
if (!workArchive || !workGrid || !workDetailsList || filterButtons.length === 0 || viewButtons.length === 0) {
    throw new Error("Work archive markup is incomplete.");
}
const projectMarkup = (project) => {
    const media = project.image
        ? `<img src="${project.image}" alt="${project.imageAlt ?? project.title}" />`
        : `<div class="work-card__blank" aria-hidden="true"></div>`;
    const content = `
    <div class="work-card__media">${media}</div>
    <div class="work-card__details">
      <h3>${project.title}</h3>
      <p>${project.discipline}</p>
      <span>${project.year}</span>
    </div>
  `;
    return `
    <article class="work-card work-card--${project.style}" data-category="${project.category}">
      ${project.href
        ? `<a href="${project.href}" aria-label="View ${project.title}">${content}</a>`
        : `<div class="work-card__inner">${content}</div>`}
    </article>
  `;
};
workGrid.innerHTML = archiveProjects.map(projectMarkup).join("");
const gridLayouts = [
    "work-card--wide-left",
    "work-card--tall-right",
    "work-card--compact-left",
    "work-card--wide-right",
    "work-card--mid-left",
    "work-card--offset-right",
];
const composeGrid = (visibleCards) => {
    workCards.forEach((card) => card.classList.remove(...gridLayouts));
    visibleCards.forEach((card, index) => {
        card.classList.add(gridLayouts[index % gridLayouts.length]);
    });
};
const galleryFrameMarkup = (project, index) => {
    const image = project.gallery?.[index] ?? project.image;
    const content = image
        ? `<img src="${image}" alt="${project.imageAlt ?? project.title} — frame ${index + 1}" />`
        : `<div class="work-card__blank" aria-hidden="true"></div>`;
    return `<div class="work-gallery__frame" style="--frame-index: ${index};">${content}</div>`;
};
const detailRowMarkup = (project) => {
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
        <button class="work-detail-row__case" type="button">See Full Case <span aria-hidden="true">↗</span></button>
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
const workCards = [...workGrid.querySelectorAll(".work-card")];
const workDetails = [...workDetailsList.querySelectorAll(".work-detail-row")];
const viewItems = [...workCards, ...workDetails];
const galleryRateFrames = new WeakMap();
const easeGalleryRate = (animation, targetRate, duration = 700) => {
    const existingFrame = galleryRateFrames.get(animation);
    if (existingFrame !== undefined)
        cancelAnimationFrame(existingFrame);
    const startRate = animation.playbackRate;
    const startTime = performance.now();
    const updateRate = (timestamp) => {
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        animation.playbackRate = startRate + (targetRate - startRate) * eased;
        if (progress < 1) {
            galleryRateFrames.set(animation, requestAnimationFrame(updateRate));
        }
        else {
            galleryRateFrames.delete(animation);
        }
    };
    galleryRateFrames.set(animation, requestAnimationFrame(updateRate));
};
document.querySelectorAll(".work-gallery").forEach((gallery) => {
    const track = gallery.querySelector(".work-gallery__track");
    const getTrackAnimation = () => track?.getAnimations()[0];
    gallery.querySelectorAll(".work-gallery__frame").forEach((frame) => {
        frame.addEventListener("pointerenter", () => gallery.classList.add("is-frame-expanded"));
        frame.addEventListener("pointerleave", () => gallery.classList.remove("is-frame-expanded"));
    });
    gallery.addEventListener("pointerenter", () => {
        const animation = getTrackAnimation();
        if (animation)
            easeGalleryRate(animation, 0, 420);
    });
    gallery.addEventListener("pointerleave", () => {
        gallery.classList.remove("is-frame-expanded");
        const animation = getTrackAnimation();
        if (animation)
            easeGalleryRate(animation, 1, 900);
    });
    gallery.addEventListener("focusin", () => {
        const animation = getTrackAnimation();
        if (animation)
            easeGalleryRate(animation, 0, 420);
    });
    gallery.addEventListener("focusout", () => {
        const animation = getTrackAnimation();
        if (animation)
            easeGalleryRate(animation, 1, 900);
    });
});
const revealCards = () => {
    if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
        viewItems.forEach((item) => item.classList.add("is-visible"));
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting)
                return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, { rootMargin: "0px 0px -8%", threshold: 0.08 });
    viewItems.forEach((item) => observer.observe(item));
};
const filterProjects = (filter) => {
    viewItems.forEach((item) => {
        const shouldShow = filter === "all" || item.dataset.category === filter;
        item.hidden = !shouldShow;
        if (shouldShow)
            item.classList.add("is-visible");
    });
    composeGrid(workCards.filter((card) => !card.hidden));
};
const setView = (view) => {
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
