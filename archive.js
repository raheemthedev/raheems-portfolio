"use strict";
// Works archive: every project in projects-data.ts as a ruled index you can
// filter by discipline and sort. Rows share the homepage Index behaviour
// (index-list.ts) and open with the same full-screen transition.
const archiveIndexRoot = document.querySelector(".archive-index");
const archiveList = document.querySelector(".archive-list");
const archiveEmpty = document.querySelector(".archive-empty");
const archiveTotal = document.querySelector("[data-archive-total]");
const archiveFilterGroup = document.querySelector("[data-archive-filters]");
const archiveSortButtons = [...document.querySelectorAll("[data-archive-sort]")];
if (!archiveIndexRoot || !archiveList || !archiveEmpty || !archiveTotal || !archiveFilterGroup) {
    throw new Error("Archive markup is incomplete.");
}
const archiveCategoryLabels = {
    identity: "Brand Identity",
    exhibition: "Exhibition",
    direction: "Art Direction",
    packaging: "Packaging",
    campaign: "Campaign",
    digital: "Digital",
};
let archiveFilter = "all";
let archiveSort = "number";
let archiveIndex = null;
const archiveHref = (project) => project.href ?? `case-study.html?project=${encodeURIComponent(project.number)}`;
const archivePreview = (project) => `
  <span class="archive-preview archive-preview--${project.style}">
    ${project.image
    ? `<img src="${project.image}" alt="" draggable="false" />`
    : `<span class="archive-preview__number">${project.number}</span>`}
  </span>
`;
// Undated work ("TBC") sorts after everything with a year.
const archiveYear = (project) => {
    const year = Number.parseInt(project.year, 10);
    return Number.isNaN(year) ? -Infinity : year;
};
const sortArchive = (items) => {
    const sorted = [...items];
    if (archiveSort === "year")
        sorted.sort((a, b) => archiveYear(b) - archiveYear(a) || a.number.localeCompare(b.number));
    if (archiveSort === "title")
        sorted.sort((a, b) => a.title.localeCompare(b.title));
    if (archiveSort === "number")
        sorted.sort((a, b) => a.number.localeCompare(b.number));
    return sorted;
};
const renderArchive = () => {
    archiveIndex?.destroy();
    archiveIndex = null;
    const visible = sortArchive(archiveProjects.filter((project) => archiveFilter === "all" || project.category === archiveFilter));
    archiveList.classList.remove("is-in");
    archiveList.innerHTML = visible
        .map((project, index) => `
        <li style="--row: ${index};">
          <a class="archive-row" href="${archiveHref(project)}" data-index-row>
            <span class="archive-row__number">${project.number}</span>
            <span class="archive-row__title" data-index-roll>${project.title}</span>
            <span class="archive-row__discipline">${project.discipline}</span>
            <span class="archive-row__services">${project.services.join(", ")}</span>
            <span class="archive-row__year">${project.year}</span>
            <span class="archive-row__arrow" aria-hidden="true"><span>↗</span></span>
          </a>
        </li>
      `)
        .join("");
    archiveEmpty.hidden = visible.length > 0;
    archiveIndex = createIndexList(archiveIndexRoot, {
        previews: visible.map(archivePreview),
        labels: visible.map((project) => `<span>${project.title}</span><em>${project.year}</em>`),
        onOpen: (index, from) => {
            const project = visible[index];
            transitionToPage(archiveHref(project), archivePreview(project), from, project.title);
        },
    });
    // Rows rise in on the next frame so a re-sort reads as a fresh deal.
    requestAnimationFrame(() => requestAnimationFrame(() => archiveList.classList.add("is-in")));
};
const setPressed = (buttons, active) => {
    buttons.forEach((button) => {
        const isActive = button === active;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
};
// Filters come from the disciplines actually present, so new work adds its own.
const archiveCategories = [...new Set(archiveProjects.map((project) => project.category))];
archiveFilterGroup.innerHTML = [
    `<button class="work-filter is-active" type="button" data-archive-filter="all" aria-pressed="true">All</button>`,
    ...archiveCategories.map((category) => `<button class="work-filter" type="button" data-archive-filter="${category}" aria-pressed="false">${archiveCategoryLabels[category]}</button>`),
].join("");
const archiveFilterButtons = [...archiveFilterGroup.querySelectorAll("[data-archive-filter]")];
archiveFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        archiveFilter = button.dataset.archiveFilter ?? "all";
        setPressed(archiveFilterButtons, button);
        renderArchive();
    });
});
archiveSortButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const sort = button.dataset.archiveSort;
        archiveSort = sort === "year" || sort === "title" ? sort : "number";
        setPressed(archiveSortButtons, button);
        renderArchive();
    });
});
archiveTotal.textContent = String(archiveProjects.length).padStart(2, "0");
renderArchive();
