// "What I shape": one long list of what I make. The item nearest the middle
// of the screen turns ink as the page scrolls, pointing at one takes over,
// and the frame that goes with it shows at the foot of the left column.

const shapeList = document.querySelector<HTMLElement>(".shape-list");

if (shapeList) {
  const items = [...shapeList.querySelectorAll<HTMLElement>(".shape-list__items li")];
  const images = [...shapeList.querySelectorAll<HTMLImageElement>(".shape-list__window img")];
  const caption = shapeList.querySelector<HTMLElement>(".shape-list__caption");
  let active = 0;
  let pointing = false;

  const focus = (n: number) => {
    if (n === active) return;
    active = n;
    items.forEach((item, m) => item.classList.toggle("is-active", m === n));
    images.forEach((image, m) => image.classList.toggle("is-shown", m === n));
    const image = images[n];
    if (caption && image) caption.innerHTML = `<span>${image.dataset.number ?? ""}</span> ${image.dataset.caption ?? ""}`;
  };

  // Pointing at an item takes the focus.
  items.forEach((item, n) => {
    item.addEventListener("pointerenter", () => {
      pointing = true;
      focus(n);
    });
  });
  shapeList.querySelector(".shape-list__items")?.addEventListener("pointerleave", () => {
    pointing = false;
  });

  // Otherwise the focus walks down the list with the page: whichever item is
  // nearest the middle of the screen.
  let frame = 0;
  const render = () => {
    frame = 0;
    if (pointing) return;
    const middle = window.innerHeight * 0.5;
    let nearest = 0;
    let distance = Infinity;
    items.forEach((item, n) => {
      const box = item.getBoundingClientRect();
      const gap = Math.abs(box.top + box.height / 2 - middle);
      if (gap < distance) {
        distance = gap;
        nearest = n;
      }
    });
    focus(nearest);
  };
  window.addEventListener("scroll", () => {
    if (!frame) frame = requestAnimationFrame(render);
  }, { passive: true });
  render();
}
