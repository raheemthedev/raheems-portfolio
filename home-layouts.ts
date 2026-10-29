// Work-first homepages, for visitors who want proof of work straight away.
// Chosen before anything draws by a small script in index.html's head
// (?home=, remembered), which sets <html data-home>. In these layouts the
// interactive hero (Horizon/Field, hero-modes.ts) and the original wheel stay
// unmounted, and the work is built here from archiveProjects:
//   work     — the statement, then the case studies as two large cards, each
//              with its sector, year, summary and services.
//   feature  — the statement, then each case study as a full-width spread: a
//              big image beside its details, alternating sides.
//   sentence — the statement keeps talking: the work named inside a sentence,
//              each name with an image pill that grows and plays on hover.
//   trail    — the names set huge and loose; moving across one leaves a trail
//              of that project's images behind the cursor.
//   scatter  — the work thrown loosely across the page, to grab and throw.
//   toss     — a messy pile of the work: flick the top image off and it goes
//              to the bottom, and the details follow whichever is on top.
// "hero" is the original homepage.

type HomeLayout = "hero" | "work" | "feature" | "sentence" | "trail" | "scatter" | "toss";

const homeLayouts: { id: HomeLayout; label: string }[] = [
  { id: "work", label: "Work" },
  { id: "feature", label: "Feature" },
  { id: "sentence", label: "Sentence" },
  { id: "trail", label: "Trail" },
  { id: "scatter", label: "Scatter" },
  { id: "toss", label: "Toss" },
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

// The cover, then up to five more images from the project's gallery.
const homeFrames = (project: ArchiveProject, count = 6) =>
  [project.image as string, ...(project.gallery ?? []).filter((src) => src !== project.image)].slice(0, count);

// How each project reads inside a sentence.
const homeLines: Record<string, string> = {
  "01": "a crypto exchange that makes trading feel as simple as flipping a coin",
  "02": "a generative art show where organic forms collide with digital systems",
};

const homeYear = (project: ArchiveProject) => `’${project.year.slice(-2)}`;

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
  sentence: () => `
    <p class="home-sentence">
      Lately, that’s looked like${homeProjects.map((project, index) => `${index ? (index === homeProjects.length - 1 ? " and" : ",") : ""}
        <a class="home-sentence__project" href="${homeHref(project)}"><span class="home-sentence__pill">${homeMedia(project, "home-media")}</span>${project.title}<sup>${homeYear(project)}</sup></a><span class="home-sentence__line">, ${homeLines[project.number] ?? project.summary.toLowerCase().replace(/\.$/, "")}</span>`).join("")}.
      <span class="home-sentence__more">There’s more in the <a href="work.html">archive&nbsp;↗</a></span>
    </p>`,
  trail: () => `
    <div class="home-trail" data-trail>
      ${homeProjects.map((project, index) => `
        <a class="home-trail__item" href="${homeHref(project)}" style="--indent: ${[0, 10, 4, 14][index % 4]}vw;" data-trail-item="${index}">
          <span class="home-trail__number">${project.number}</span>
          <strong class="home-trail__title">${project.title}</strong>
          <span class="home-trail__meta">${project.discipline}<br />${project.services.join(", ")} · ${project.year}</span>
          ${homeMedia(project, "home-trail__cover home-media")}
        </a>`).join("")}
    </div>`,
  scatter: () => `
    <div class="home-scatter" data-scatter>
      ${homeScatterItems().map(({ project, src, cover }, index) => `
        <a class="home-scatter__item${cover ? " home-scatter__item--cover" : ""}" href="${homeHref(project)}" draggable="false" data-scatter-item="${index}">
          <img src="${src}" alt="${cover ? project.imageAlt ?? project.title : ""}" draggable="false" loading="lazy" decoding="async" />
          <span class="home-scatter__tag">${cover ? `${project.number} ${project.title} · ${project.discipline}` : `${project.title} ${homeYear(project)}`}</span>
        </a>`).join("")}
    </div>`,
  toss: () => `
    <div class="home-toss" data-toss>
      <div class="home-toss__info" aria-live="polite">
        <p class="home-toss__number"></p>
        <h3 class="home-toss__title"></h3>
        <p class="home-toss__summary"></p>
        <p class="home-toss__meta"></p>
        <a class="home-toss__cta" href="#">View case study <span aria-hidden="true">→</span></a>
        <button class="home-toss__next" type="button">Flick to the next <span aria-hidden="true">↻</span></button>
      </div>
      <div class="home-toss__pile">
        ${homeTossCards().map(({ project, src }, index) => `
          <a class="home-toss__card" href="${homeHref(project)}" draggable="false" data-project="${homeProjects.indexOf(project)}" style="--r: ${((index * 47) % 13) - 6}deg; --x: ${((index * 29) % 17) - 8}px; --y: ${((index * 31) % 15) - 7}px;">
            <img src="${src}" alt="" draggable="false" decoding="async" />
          </a>`).join("")}
      </div>
    </div>`,
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

  if (homeLayout === "trail") mountTrail(section);
  if (homeLayout === "scatter") mountScatter(section);
  if (homeLayout === "toss") mountToss(section);
}

// Scatter: each project's cover and three more frames, interleaved so the two
// projects mix on the table.
function homeScatterItems() {
  const lists = homeProjects.map((project) => homeFrames(project, 4).map((src, index) => ({ project, src, cover: index === 0 })));
  const items: { project: ArchiveProject; src: string; cover: boolean }[] = [];
  for (let index = 0; index < 4; index += 1) lists.forEach((list) => list[index] && items.push(list[index]));
  return items;
}

// Toss: the pile, bottom card first, so the first project's cover ends on top.
function homeTossCards() {
  return homeProjects
    .flatMap((project) => homeFrames(project, 3).map((src) => ({ project, src })))
    .reverse();
}

// Trail: moving across a name leaves that project's images behind the cursor.
function mountTrail(section: HTMLElement) {
  const root = section.querySelector<HTMLElement>("[data-trail]");
  if (!root || !window.matchMedia("(hover: hover)").matches) return;
  const frames = homeProjects.map((project) => homeFrames(project));
  const loaded = new Set<number>();
  const turn = homeProjects.map(() => 0);
  let last: [number, number] | null = null;

  root.querySelectorAll<HTMLElement>("[data-trail-item]").forEach((item) => {
    const index = Number(item.dataset.trailItem);
    item.addEventListener("pointerenter", () => {
      if (loaded.has(index)) return;
      loaded.add(index);
      frames[index].forEach((src) => { new Image().src = src; });
    });
    item.addEventListener("pointermove", (event) => {
      const box = root.getBoundingClientRect();
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      if (last && Math.hypot(x - last[0], y - last[1]) < 90) return;
      last = [x, y];
      const image = document.createElement("img");
      image.className = "home-trail__drop";
      image.src = frames[index][turn[index] % frames[index].length];
      image.alt = "";
      image.style.left = `${x}px`;
      image.style.top = `${y}px`;
      turn[index] += 1;
      root.append(image);
      const tilt = Math.random() * 10 - 5;
      image.animate([
        { opacity: 0, transform: `translate(-50%, -50%) scale(0.55) rotate(${tilt * 2}deg)` },
        { opacity: 1, transform: `translate(-50%, -50%) scale(1) rotate(${tilt}deg)`, offset: 0.18 },
        { opacity: 1, transform: `translate(-50%, -50%) scale(1) rotate(${tilt}deg)`, offset: 0.6 },
        { opacity: 0, transform: `translate(-50%, -48%) scale(0.9) rotate(${tilt}deg)` },
      ], { duration: 1300, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }).finished.then(() => image.remove());
    });
    item.addEventListener("pointerleave", () => { last = null; });
  });
}

// Scatter: things land loosely on the page; grab one and throw it, and it
// glides, spins a little and knocks off the edges.
function mountScatter(section: HTMLElement) {
  const root = section.querySelector<HTMLElement>("[data-scatter]");
  if (!root) return;
  const items = [...root.querySelectorAll<HTMLElement>("[data-scatter-item]")];
  const wide = [
    [3, 4, 30, -4], [38, 0, 21, 3], [66, 8, 28, -2], [21, 47, 19, 5],
    [44, 36, 29, -3], [77, 55, 19, 4], [2, 64, 17, -6], [60, 76, 16, 2],
  ];
  const narrow = [
    [2, 1, 70, -3], [44, 20, 52, 4], [6, 34, 48, 5], [48, 44, 50, -4],
    [2, 60, 62, -2], [50, 70, 46, 3], [10, 82, 40, 6], [56, 88, 40, -5],
  ];
  const slots = window.innerWidth < 761 ? narrow : wide;
  const state = items.map((item, index) => {
    const [x, y, w, r] = slots[index % slots.length];
    item.style.width = `${w}%`;
    item.style.zIndex = String(index + 1);
    return { item, x: 0, y: 0, r, vx: 0, vy: 0, vr: 0, px: x, py: y };
  });
  const place = () => {
    const width = root.clientWidth;
    const height = root.clientHeight;
    state.forEach((thing) => {
      thing.x = (thing.px / 100) * width;
      thing.y = (thing.py / 100) * height;
      draw(thing);
    });
  };
  const draw = (thing: (typeof state)[number]) => {
    thing.item.style.transform = `translate(${thing.x}px, ${thing.y}px) rotate(${thing.r}deg)`;
  };
  place();
  let top = items.length;

  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  root.classList.add("is-live");
  const moving = new Set<(typeof state)[number]>();
  let frame = 0;
  const step = () => {
    const width = root.clientWidth;
    const height = root.clientHeight;
    moving.forEach((thing) => {
      thing.x += thing.vx;
      thing.y += thing.vy;
      thing.r += thing.vr;
      thing.vx *= 0.94;
      thing.vy *= 0.94;
      thing.vr *= 0.92;
      const maxX = width - thing.item.offsetWidth * 0.5;
      const maxY = height - thing.item.offsetHeight * 0.5;
      const minX = -thing.item.offsetWidth * 0.5;
      if (thing.x < minX || thing.x > maxX) { thing.x = Math.min(maxX, Math.max(minX, thing.x)); thing.vx *= -0.5; }
      if (thing.y < -40 || thing.y > maxY) { thing.y = Math.min(maxY, Math.max(-40, thing.y)); thing.vy *= -0.5; }
      draw(thing);
      if (Math.hypot(thing.vx, thing.vy) < 0.08 && Math.abs(thing.vr) < 0.02) moving.delete(thing);
    });
    frame = moving.size ? requestAnimationFrame(step) : 0;
  };

  state.forEach((thing) => {
    const { item } = thing;
    let held = false;
    let dragged = false;
    let start: [number, number] = [0, 0];
    let lastPoint: [number, number, number] = [0, 0, 0];
    item.addEventListener("dragstart", (event) => event.preventDefault());
    item.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      held = true;
      dragged = false;
      start = [event.clientX, event.clientY];
      lastPoint = [event.clientX, event.clientY, event.timeStamp];
      moving.delete(thing);
      thing.vx = thing.vy = thing.vr = 0;
      top += 1;
      item.style.zIndex = String(top);
      item.classList.add("is-held");
      item.setPointerCapture(event.pointerId);
    });
    item.addEventListener("pointermove", (event) => {
      if (!held) return;
      if (!dragged && Math.hypot(event.clientX - start[0], event.clientY - start[1]) > 5) dragged = true;
      const dx = event.clientX - lastPoint[0];
      const dy = event.clientY - lastPoint[1];
      const dt = Math.max(8, event.timeStamp - lastPoint[2]);
      thing.x += dx;
      thing.y += dy;
      const cap = (value: number) => Math.max(-36, Math.min(36, value));
      thing.vx = cap((dx / dt) * 16);
      thing.vy = cap((dy / dt) * 16);
      thing.vr = thing.vx * 0.05;
      lastPoint = [event.clientX, event.clientY, event.timeStamp];
      draw(thing);
    });
    const release = () => {
      if (!held) return;
      held = false;
      item.classList.remove("is-held");
      moving.add(thing);
      if (!frame) frame = requestAnimationFrame(step);
    };
    item.addEventListener("pointerup", release);
    item.addEventListener("pointercancel", release);
    item.addEventListener("click", (event) => {
      if (dragged) event.preventDefault();
    });
  });

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(place, 150);
  });
}

// Toss: drag or flick the top card off the pile; it slides back in at the
// bottom and the details change to whichever project is now on top.
function mountToss(section: HTMLElement) {
  const root = section.querySelector<HTMLElement>("[data-toss]");
  if (!root) return;
  const pile = root.querySelector<HTMLElement>(".home-toss__pile");
  const info = root.querySelector<HTMLElement>(".home-toss__info");
  const next = root.querySelector<HTMLButtonElement>(".home-toss__next");
  if (!pile || !info || !next) return;
  const order = [...pile.querySelectorAll<HTMLAnchorElement>(".home-toss__card")];
  const rest = "translate(-50%, -50%) translate(var(--x), var(--y)) rotate(var(--r))";
  let shown = -1;
  let busy = false;

  const describe = () => {
    order.forEach((card, index) => {
      card.style.zIndex = String(index + 1);
      card.tabIndex = index === order.length - 1 ? 0 : -1;
    });
    const index = Number(order[order.length - 1].dataset.project);
    if (index === shown) return;
    shown = index;
    const project = homeProjects[index];
    const fields: [string, string][] = [
      [".home-toss__number", `${project.number} <span>/ ${String(homeProjects.length).padStart(2, "0")}</span>`],
      [".home-toss__title", project.title],
      [".home-toss__summary", project.summary],
      [".home-toss__meta", `${project.discipline}<br />${project.services.join(", ")} · ${project.year}`],
    ];
    fields.forEach(([selector, html]) => {
      const field = info.querySelector<HTMLElement>(selector);
      if (field) field.innerHTML = html;
    });
    info.querySelector<HTMLAnchorElement>(".home-toss__cta")?.setAttribute("href", homeHref(project));
    info.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 500, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
  };

  // Send the top card off in a direction, then tuck it in at the bottom.
  const toss = async (card: HTMLAnchorElement, from: string, dx: number, dy: number) => {
    busy = true;
    const length = Math.hypot(dx, dy) || 1;
    const reach = pile.clientWidth * 0.85;
    const out = `translate(-50%, -50%) translate(${(dx / length) * reach}px, ${(dy / length) * reach * 0.6}px) rotate(${dx > 0 ? 18 : -18}deg)`;
    await card.animate([{ transform: from }, { transform: out }], { duration: 320, easing: "cubic-bezier(0.3, 0.7, 0.4, 1)", fill: "forwards" }).finished;
    order.pop();
    order.unshift(card);
    describe();
    const back = card.animate([{ transform: out }, { transform: rest }], { duration: 560, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" });
    await back.finished;
    card.getAnimations().forEach((animation) => animation.cancel());
    card.style.transform = "";
    busy = false;
  };

  order.forEach((card) => {
    let held = false;
    let dragged = false;
    let start: [number, number, number] = [0, 0, 0];
    let delta: [number, number] = [0, 0];
    card.addEventListener("dragstart", (event) => event.preventDefault());
    card.addEventListener("pointerdown", (event) => {
      if (busy || card !== order[order.length - 1] || event.button !== 0) return;
      held = true;
      dragged = false;
      start = [event.clientX, event.clientY, event.timeStamp];
      delta = [0, 0];
      card.setPointerCapture(event.pointerId);
      card.classList.add("is-held");
    });
    card.addEventListener("pointermove", (event) => {
      if (!held) return;
      delta = [event.clientX - start[0], event.clientY - start[1]];
      if (!dragged && Math.hypot(...delta) > 5) dragged = true;
      card.style.transform = `translate(-50%, -50%) translate(calc(var(--x) + ${delta[0]}px), calc(var(--y) + ${delta[1]}px)) rotate(calc(var(--r) + ${delta[0] * 0.05}deg))`;
    });
    const release = (event: PointerEvent) => {
      if (!held) return;
      held = false;
      card.classList.remove("is-held");
      const speed = Math.hypot(...delta) / Math.max(1, event.timeStamp - start[2]);
      const from = card.style.transform;
      if (Math.hypot(...delta) > 110 || (dragged && speed > 0.6)) {
        toss(card, from, delta[0], delta[1]);
      } else if (dragged) {
        card.style.transform = "";
        card.animate([{ transform: from }, { transform: rest }], { duration: 500, easing: "cubic-bezier(0.2, 1.3, 0.4, 1)" });
      }
    };
    card.addEventListener("pointerup", release);
    card.addEventListener("pointercancel", release);
    card.addEventListener("click", (event) => {
      if (dragged || card !== order[order.length - 1]) event.preventDefault();
    });
  });

  next.addEventListener("click", () => {
    if (!busy) toss(order[order.length - 1], rest, 1, -0.25);
  });
  describe();
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
