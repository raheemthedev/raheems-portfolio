interface PlaygroundTile {
  file: string;
  series: string;
  year: string;
  tone: string;
  ratio: number;
}

const TONES = [
  "#0b0b0b",
  "#161615",
  "#1e1e1c",
  "#242423",
  "#2d2d2a",
  "#35352f",
  "#3f3f39",
  "#4a4a43",
  "#55554d",
  "#66665e",
  "#77776e",
  "#8b8b81",
  "#9d9d93",
  "#aaa8a2",
  "linear-gradient(165deg, #2c2c29 0%, #0d0d0c 100%)",
  "linear-gradient(200deg, #43443d 0%, #161613 100%)",
  "linear-gradient(140deg, #101010 0%, #383833 100%)",
];

const RATIOS = [1.79, 1.49, 1.1, 1.0, 1.39, 0.9, 1.62, 1.2];

interface PlaygroundGroup {
  prefix: string;
  series: string;
  year: string;
  count: number;
  toneStart: number;
  ratioStart: number;
  exts?: string[];
}

const playgroundGroups: PlaygroundGroup[] = [
  {
    prefix: "PROJECT",
    series: "Selected work",
    year: "2026",
    count: 6,
    toneStart: 0,
    ratioStart: 0,
  },
  {
    prefix: "LOGO",
    series: "Logo experiments",
    year: "2026",
    count: 6,
    toneStart: 3,
    ratioStart: 2,
  },
  {
    prefix: "TYPE",
    series: "Type studies",
    year: "2025",
    count: 5,
    toneStart: 6,
    ratioStart: 4,
    exts: ["jpg", "jpg", "gif", "jpg", "jpg"],
  },
  {
    prefix: "POSTER",
    series: "Poster series",
    year: "2025",
    count: 6,
    toneStart: 9,
    ratioStart: 1,
    exts: ["jpg", "jpg", "jpg", "gif", "jpg", "jpg"],
  },
  {
    prefix: "MOTION",
    series: "Motion sketches",
    year: "2024",
    count: 4,
    toneStart: 14,
    ratioStart: 3,
    exts: ["mp4", "gif", "mp4", "gif"],
  },
  {
    prefix: "WEB",
    series: "Web experiments",
    year: "2024",
    count: 5,
    toneStart: 15,
    ratioStart: 5,
    exts: ["jpg", "gif", "jpg", "jpg", "jpg"],
  },
  {
    prefix: "PHOTO",
    series: "Photography",
    year: "2023",
    count: 4,
    toneStart: 8,
    ratioStart: 6,
  },
  {
    prefix: "PACK",
    series: "Packaging studies",
    year: "2023",
    count: 3,
    toneStart: 11,
    ratioStart: 7,
  },
  {
    prefix: "BRAND",
    series: "Brand sketches",
    year: "2022",
    count: 5,
    toneStart: 5,
    ratioStart: 2,
  },
];

const playgroundTiles: PlaygroundTile[] = playgroundGroups.flatMap((group) =>
  Array.from({ length: group.count }, (_, index) => ({
    file: `${group.prefix}_${String(index + 1).padStart(4, "0")}.${group.exts?.[index] ?? "jpg"}`,
    series: group.series,
    year: group.year,
    tone: TONES[(group.toneStart + index) % TONES.length],
    ratio: RATIOS[(group.ratioStart + index) % RATIOS.length],
  })),
);

const playgroundGrid = document.querySelector<HTMLElement>(".pg-grid");
const playgroundCount = document.querySelector<HTMLElement>(".pg-count");

if (!playgroundGrid) {
  throw new Error("Playground markup is incomplete.");
}

const tileMarkup = (tile: PlaygroundTile, index: number) => `
  <li class="pg-tile" style="--tile-order: ${index % 12};">
    <button class="pg-tile__trigger" type="button" aria-label="Enlarge ${tile.file}">
      <span class="pg-tile__top">
        <span class="pg-tile__dot" aria-hidden="true"></span>
        <span class="pg-tile__file">${tile.file}</span>
      </span>
      <span class="pg-tile__media" style="--tone: ${tile.tone}; --tile-ratio: ${tile.ratio};"></span>
    </button>
  </li>
`;

playgroundGrid.innerHTML = playgroundTiles.map(tileMarkup).join("");

if (playgroundCount) {
  playgroundCount.textContent = `(${playgroundTiles.length} works)`;
}

const revealItems = [...playgroundGrid.querySelectorAll<HTMLElement>(".pg-tile")];

const revealTiles = () => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
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
    { rootMargin: "0px 0px -6%", threshold: 0.05 },
  );

  revealItems.forEach((item) => observer.observe(item));
};

const lightbox = document.createElement("div");
lightbox.className = "pg-lightbox";
lightbox.setAttribute("role", "dialog");
lightbox.setAttribute("aria-modal", "true");
lightbox.setAttribute("aria-label", "Enlarged work");
lightbox.innerHTML = `
  <button class="pg-lightbox__close" type="button" aria-label="Close">Close <span aria-hidden="true">✕</span></button>
  <button class="pg-lightbox__nav pg-lightbox__nav--prev" type="button" aria-label="Previous work"><span aria-hidden="true">←</span></button>
  <figure class="pg-lightbox__figure">
    <div class="pg-lightbox__media"></div>
    <figcaption class="pg-lightbox__caption"></figcaption>
  </figure>
  <button class="pg-lightbox__nav pg-lightbox__nav--next" type="button" aria-label="Next work"><span aria-hidden="true">→</span></button>
`;
document.body.append(lightbox);

const lightboxMedia = lightbox.querySelector<HTMLElement>(".pg-lightbox__media");
const lightboxCaption = lightbox.querySelector<HTMLElement>(".pg-lightbox__caption");
const lightboxClose = lightbox.querySelector<HTMLButtonElement>(".pg-lightbox__close");
const lightboxPrev = lightbox.querySelector<HTMLButtonElement>(".pg-lightbox__nav--prev");
const lightboxNext = lightbox.querySelector<HTMLButtonElement>(".pg-lightbox__nav--next");

let activeTile = -1;
let lastFocused: HTMLElement | null = null;

const showTile = (index: number, direction = 0) => {
  const tile = playgroundTiles[index];
  if (!tile || !lightboxMedia || !lightboxCaption) return;
  activeTile = index;

  lightboxMedia.style.setProperty("--tone", tile.tone);
  lightboxMedia.style.setProperty("--tile-ratio", String(tile.ratio));
  lightboxCaption.textContent = `${tile.file} — ${tile.series}, ${tile.year}`;
  lightboxMedia.classList.remove("is-swapping");
  void lightboxMedia.offsetWidth;
  if (direction !== 0) lightboxMedia.classList.add("is-swapping");
};

const openLightbox = (index: number, trigger: HTMLElement) => {
  lastFocused = trigger;
  showTile(index);
  lightbox.classList.add("is-open");
  document.body.style.overflow = "hidden";
  lightboxClose?.focus();
};

const closeLightbox = () => {
  lightbox.classList.remove("is-open");
  document.body.style.overflow = "";
  activeTile = -1;
  lastFocused?.focus();
  lastFocused = null;
};

const stepTile = (direction: number) => {
  if (activeTile < 0) return;
  const next = (activeTile + direction + playgroundTiles.length) % playgroundTiles.length;
  showTile(next, direction);
};

playgroundGrid.addEventListener("click", (event) => {
  const trigger = (event.target as HTMLElement).closest<HTMLElement>(".pg-tile__trigger");
  if (!trigger) return;
  const tile = trigger.closest<HTMLElement>(".pg-tile");
  const index = tile ? [...playgroundGrid.children].indexOf(tile) : -1;
  if (index >= 0) openLightbox(index, trigger);
});

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox || event.target === lightboxMedia) closeLightbox();
});
lightboxClose?.addEventListener("click", closeLightbox);
lightboxPrev?.addEventListener("click", () => stepTile(-1));
lightboxNext?.addEventListener("click", () => stepTile(1));

document.addEventListener("keydown", (event) => {
  if (!lightbox.classList.contains("is-open")) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") stepTile(-1);
  if (event.key === "ArrowRight") stepTile(1);
});

revealTiles();
