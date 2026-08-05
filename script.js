const root = document.documentElement;
const track = document.querySelector(".project-track");
const year = document.querySelector("#year");

year.textContent = new Date().getFullYear();

let railX = 0;
let startX = 0;
let startRailX = 0;
let isDragging = false;
let moved = false;

const railLimit = () => {
  const overflow = Math.max(0, track.scrollWidth - window.innerWidth);
  return overflow / 2 + Math.min(window.innerWidth * 0.18, 180);
};

const setRailPosition = (value) => {
  const limit = railLimit();
  railX = Math.max(-limit, Math.min(limit, value));
  root.style.setProperty("--rail-x", `${railX}px`);
};

track.addEventListener("pointerdown", (event) => {
  isDragging = true;
  moved = false;
  startX = event.clientX;
  startRailX = railX;
  track.setPointerCapture(event.pointerId);
});

track.addEventListener("pointermove", (event) => {
  if (!isDragging) return;
  const distance = event.clientX - startX;
  moved = moved || Math.abs(distance) > 3;
  setRailPosition(startRailX + distance);
});

const finishDrag = (event) => {
  if (!isDragging) return;
  isDragging = false;
  if (track.hasPointerCapture(event.pointerId)) {
    track.releasePointerCapture(event.pointerId);
  }
};

track.addEventListener("pointerup", finishDrag);
track.addEventListener("pointercancel", finishDrag);
track.addEventListener("dragstart", (event) => event.preventDefault());

track.addEventListener("click", (event) => {
  if (moved) event.preventDefault();
});

track.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  const direction = event.key === "ArrowLeft" ? 1 : -1;
  setRailPosition(railX + direction * 130);
});

window.addEventListener("resize", () => setRailPosition(railX));
