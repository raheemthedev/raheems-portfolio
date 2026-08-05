const root = document.documentElement;
const stage = document.querySelector(".project-stage");
const track = document.querySelector(".project-track");
const year = document.querySelector("#year");

const projects = [
  {
    number: "05",
    title: "TODO TITLE",
    tags: ["CAMPAIGN DESIGN", "TODO DISCIPLINE"],
    style: "campaign",
  },
  {
    number: "06",
    title: "TODO TITLE",
    tags: ["DIGITAL EXPRESSION", "TODO DISCIPLINE"],
    style: "digital",
  },
  {
    number: "01",
    title: "TODO TITLE",
    tags: ["TODO DISCIPLINE", "VISUAL IDENTITY"],
    style: "identity",
  },
  {
    number: "02",
    title: "TODO TITLE",
    tags: ["BRAND SYSTEM", "TODO DISCIPLINE"],
    style: "brand",
  },
  {
    number: "03",
    title: "TODO TITLE",
    tags: ["ART DIRECTION", "TODO DISCIPLINE"],
    style: "direction",
  },
  {
    number: "04",
    title: "TODO TITLE",
    tags: ["PACKAGING", "TODO DISCIPLINE"],
    style: "packaging",
  },
];

const copies = 3;

track.innerHTML = Array.from({ length: copies }, (_, copyIndex) =>
  projects
    .map(
      (project) => `
        <article
          class="project-shell"
          role="listitem"
          ${copyIndex === 1 ? "" : 'aria-hidden="true"'}
        >
          <div class="project-card project-card--${project.style}">
            <div class="project-card__meta">
              <div class="project-card__tags">
                ${project.tags.map((tag) => `<span>${tag}</span>`).join("")}
              </div>
              <div class="project-card__title">
                <strong>PROJECT ${project.number} — ${project.title}</strong>
                <span>${project.number} / TODO</span>
              </div>
            </div>
          </div>
        </article>
      `,
    )
    .join(""),
).join("");

year.textContent = new Date().getFullYear();

let currentOffset = 0;
let targetOffset = 0;
let sequenceStride = 1;
let groupWidth = 1;
let animationFrame = null;
let isDragging = false;
let dragStartX = 0;
let dragStartOffset = 0;
let lastPointerX = 0;
let lastPointerTime = 0;
let pointerVelocity = 0;

const modulo = (value, divisor) => ((value % divisor) + divisor) % divisor;

const measureRail = () => {
  const firstTile = track.querySelector(".project-shell");
  const styles = getComputedStyle(track);
  const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
  const tileWidth = firstTile.getBoundingClientRect().width;

  sequenceStride = projects.length * (tileWidth + gap);
  groupWidth = sequenceStride - gap;
};

const renderRail = () => {
  animationFrame = null;

  if (!isDragging) {
    currentOffset += (targetOffset - currentOffset) * 0.14;
  }

  if (Math.abs(currentOffset) > sequenceStride * 100) {
    const normalized = modulo(currentOffset, sequenceStride);
    currentOffset = normalized;
    targetOffset = normalized;
  }

  const phase = modulo(currentOffset, sequenceStride);
  const referenceOffset = window.innerWidth > 800 ? 18 : 0;
  const centeredStart = (window.innerWidth - groupWidth) / 2 + referenceOffset;
  const railX = centeredStart - sequenceStride - phase;

  root.style.setProperty("--rail-x", `${railX}px`);

  if (!isDragging && Math.abs(targetOffset - currentOffset) > 0.05) {
    animationFrame = requestAnimationFrame(renderRail);
  }
};

const requestRender = () => {
  if (animationFrame === null) {
    animationFrame = requestAnimationFrame(renderRail);
  }
};

const moveRailBy = (distance) => {
  targetOffset += distance;
  requestRender();
};

stage.addEventListener(
  "wheel",
  (event) => {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (delta === 0) return;

    event.preventDefault();
    moveRailBy(delta * 0.82);
  },
  { passive: false },
);

track.addEventListener("pointerdown", (event) => {
  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  isDragging = true;
  dragStartX = event.clientX;
  dragStartOffset = currentOffset;
  lastPointerX = event.clientX;
  lastPointerTime = performance.now();
  pointerVelocity = 0;
  targetOffset = currentOffset;
  track.setPointerCapture(event.pointerId);
});

track.addEventListener("pointermove", (event) => {
  if (!isDragging) return;

  const now = performance.now();
  const elapsed = Math.max(1, now - lastPointerTime);
  const movement = event.clientX - lastPointerX;

  pointerVelocity = movement / elapsed;
  currentOffset = dragStartOffset - (event.clientX - dragStartX);
  targetOffset = currentOffset;
  lastPointerX = event.clientX;
  lastPointerTime = now;
  renderRail();
});

const finishDrag = (event) => {
  if (!isDragging) return;

  isDragging = false;
  targetOffset = currentOffset - pointerVelocity * 180;

  if (track.hasPointerCapture(event.pointerId)) {
    track.releasePointerCapture(event.pointerId);
  }

  requestRender();
};

track.addEventListener("pointerup", finishDrag);
track.addEventListener("pointercancel", finishDrag);
track.addEventListener("dragstart", (event) => event.preventDefault());

track.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

  event.preventDefault();
  moveRailBy(event.key === "ArrowLeft" ? -266 : 266);
});

window.addEventListener("resize", () => {
  measureRail();
  renderRail();
});

measureRail();
renderRail();
