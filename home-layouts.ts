// Work-first homepages, for visitors who want proof of work straight away.
// Chosen before anything draws by a small script in index.html's head
// (?home=, remembered), which sets <html data-home>. In these layouts the
// interactive hero (Horizon/Field, hero-modes.ts) and the original wheel stay
// unmounted, and the work is built here from archiveProjects:
//   work     — the statement, then the case studies as two large cards, each
//              with its sector, year, summary and services.
//   feature  — the statement, then each case study as a full-width spread: a
//              big image beside its details, alternating sides.
//   row      — after Ross Mason (iamrossmason.com) and the original rail: a
//              row of frames drifting through a lens that opens whichever is
//              in it. The lens follows the cursor; the row can be dragged,
//              thrown, stepped with the arrow keys and nudged by page scroll.
// "hero" is the original homepage.

type HomeLayout = "hero" | "work" | "feature" | "row";

const homeLayouts: { id: HomeLayout; label: string }[] = [
  { id: "work", label: "Work" },
  { id: "feature", label: "Feature" },
  { id: "row", label: "Row" },
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

// The images each project shows on the homepage, cover first. Kept to the
// lighter files; the heaviest animated ones stay in the case studies.
const homeGallery: Record<string, string[]> = {
  "01": ["LCover", "L1", "L3", "P7-1", "L4", "P9-1", "L7"].map((name) => `assets/projects/flip/${name}.webp`),
  "02": ["l4-cover", "l5", "p7-1", "p9-1", "l6", "p9-2", "p7-2"].map((name) => `assets/projects/electronic-botanica/${name}.webp`),
};
const homeFrames = (project: ArchiveProject) => homeGallery[project.number] ?? [project.image as string];

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
  row: () => `
    <div class="home-row" data-row>
      <div class="home-row__strip" tabindex="0" aria-label="Selected work. Drag, or use the arrow keys, to move through it.">
        ${homeProjects.map((project, index) => homeFrames(project).map((src, n) => `
          <a class="home-row__item" href="${homeHref(project)}" draggable="false" data-project="${index}">
            <span class="home-row__label">${project.number}.${n + 1}<br />${project.title}<br /><em>[${project.services[n % project.services.length]}]</em></span>
            <span class="home-row__media">
              <img src="${src}" alt="${n ? "" : project.imageAlt ?? project.title}" draggable="false" loading="${index ? "lazy" : "eager"}" decoding="async" />
              ${!n && project.hoverImage ? `<img class="home-row__motion" data-src="${project.hoverImage}" alt="" draggable="false" />` : ""}
            </span>
          </a>`).join("")).join("")}
      </div>
      <span class="home-row__cursor" aria-hidden="true">Drag</span>
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

  if (homeLayout === "row") mountRow(section);
}

// Row (after Ross Mason): every frame sits in one looping row, and one frame
// at a time is open (taller and wider, hanging from the top), easing open
// slowly while the one before it eases shut. At rest the open frame sits in
// the centre, and every few seconds the row glides calmly on to the next.
// Hovering a frame opens it where it is, with the row holding still. Each
// image shifts a little inside its frame as it passes. The open frame is sized
// so the statement and the row fit in one screen. The row can be dragged (it
// settles with a frame in the centre), stepped with the arrow keys, and is
// nudged along by page scroll. Clicking a side frame glides it to the centre;
// clicking the open one opens its case study with the site's page transition.
function mountRow(section: HTMLElement) {
  const root = section.querySelector<HTMLElement>("[data-row]");
  const strip = root?.querySelector<HTMLElement>(".home-row__strip");
  const cursor = root?.querySelector<HTMLElement>(".home-row__cursor");
  if (!root || !strip || !cursor) return;

  // Three copies, so the loop never shows a gap.
  const originals = [...strip.querySelectorAll<HTMLAnchorElement>(".home-row__item")];
  const count = originals.length;
  [1, 2].forEach(() => originals.forEach((item) => {
    const copy = item.cloneNode(true) as HTMLAnchorElement;
    copy.setAttribute("aria-hidden", "true");
    strip.append(copy);
  }));
  const items = [...strip.querySelectorAll<HTMLAnchorElement>(".home-row__item")];
  items.forEach((item) => { item.tabIndex = -1; });
  const media = items.map((item) => item.querySelector<HTMLElement>(".home-row__media") as HTMLElement);
  const stills = items.map((item) => item.querySelector<HTMLImageElement>(".home-row__media img") as HTMLImageElement);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const firstLabel = strip.querySelector<HTMLElement>(".home-row__label") as HTMLElement;
  let size = { base: 0, gap: 0, short: 0, tall: 0, open: 0 };
  const measure = () => {
    const width = root.clientWidth;
    const narrow = width < 761;
    // The open frame takes whatever height is left under the statement.
    const top = strip.getBoundingClientRect().top + window.scrollY + firstLabel.offsetHeight;
    const room = window.innerHeight - top - (narrow ? 20 : 28);
    const tall = Math.max(narrow ? 200 : 170, Math.min(room, narrow ? width * 0.62 : Math.min(560, width * 0.3)));
    size = {
      base: narrow ? width * 0.15 : Math.min(150, Math.max(90, width * 0.075), tall * 0.3),
      gap: narrow ? 6 : 8,
      short: tall * 0.34,
      tall,
      open: 3.6,
    };
    root.style.setProperty("--row-tall", `${size.tall}px`);
  };
  measure();
  const pitch = () => size.base + size.gap;
  const period = () => count * pitch();
  const centre = () => root.clientWidth / 2;

  // Frames are counted along the endless row (k), not by element; frame k is
  // drawn by element k minus a whole number of copies.
  const offsetFor = (k: number) => k * pitch() - period() + size.gap + size.base / 2 - centre();
  const frameAt = (value: number) => Math.round((centre() + value + period() - size.gap - size.base / 2) / pitch());

  // The row eases toward `aim` through a second, smoothed aim, so every move
  // starts gently and lands gently.
  const ease = 0.055;
  const pause = 3400;
  let offset = offsetFor(count);
  let aim = offset;
  let smooth = offset;
  let restUntil = performance.now() + pause;
  // How open each frame is, by k.
  const opens = new Map<number, number>([[count, 1]]);
  let hovered: number | null = null;
  let hoverTimer = 0;
  let hovering = false;
  let held = false;
  let dragged = false;
  let pressX = 0;
  let lastX = 0;
  let lastTime = 0;
  let velocity = 0;
  let visible = true;
  let frame = 0;
  let previous = 0;
  let open = -1;
  let pointer = { x: 0, y: 0 };
  let cursorAt = { x: 0, y: 0 };
  let client = { x: 0, y: 0 };

  const glideTo = (k: number) => {
    aim = offsetFor(k);
    restUntil = 0;
  };

  const layout = () => {
    const step = pitch();
    const loop = period();
    const cycle = Math.floor(offset / loop);
    const wrapped = offset - cycle * loop;
    const starts = items.map((_, index) => index * step - wrapped - loop + size.gap);
    const amounts = items.map((_, index) => opens.get(index + cycle * count) ?? 0);
    const widths = amounts.map((amount) => size.base * (1 + (size.open - 1) * amount));
    let x = 0;
    const lefts = widths.map((width) => {
      const left = x;
      x += width + size.gap;
      return left;
    });
    // Keep the open frames centred on where they'd sit closed, weighted by how
    // open each is, so one frame handing over to the next never jumps.
    let pull = 1e-3 * starts[0];
    let weight = 1e-3;
    amounts.forEach((amount, index) => {
      if (amount < 1e-3) return;
      pull += amount * (starts[index] + size.base / 2 - lefts[index] - widths[index] / 2);
      weight += amount;
    });
    const shift = pull / weight;
    let biggest = 0;
    items.forEach((item, index) => {
      const amount = amounts[index];
      const left = lefts[index] + shift;
      item.style.transform = `translate3d(${left.toFixed(2)}px, 0, 0)`;
      item.style.width = `${widths[index].toFixed(2)}px`;
      item.style.setProperty("--open", amount.toFixed(3));
      media[index].style.height = `${(size.short + (size.tall - size.short) * amount).toFixed(2)}px`;
      // A little depth: the image slides inside its frame as it crosses.
      const across = Math.max(-1, Math.min(1, (left + widths[index] / 2 - centre()) / centre()));
      stills[index].style.transform = `translate3d(${(-across * 5).toFixed(2)}%, 0, 0) scale(1.12)`;
      if (amount > amounts[biggest]) biggest = index;
    });
    if (biggest !== open) {
      items[open]?.classList.remove("is-open");
      items[biggest].classList.add("is-open");
      open = biggest;
      const motion = originals[biggest % count].querySelector<HTMLImageElement>(".home-row__motion[data-src]");
      if (motion) {
        motion.src = motion.dataset.src as string;
        motion.removeAttribute("data-src");
        items.forEach((item, index) => {
          if (index % count !== biggest % count || item === originals[biggest % count]) return;
          const copy = item.querySelector<HTMLImageElement>(".home-row__motion[data-src]");
          if (copy) {
            copy.src = motion.src;
            copy.removeAttribute("data-src");
          }
        });
      }
    }
  };

  const tick = (now: number) => {
    const delta = previous ? Math.min(48, now - previous) / 16.67 : 1;
    previous = now;
    const amount = Math.min(1, ease * delta);
    if (held) {
      aim = smooth = offset;
    } else {
      smooth += (aim - smooth) * amount;
      offset += (smooth - offset) * amount;
      // At rest, wait a while, then glide on to the next frame (or back to
      // the nearest one, if the row was left between frames).
      const settled = Math.abs(aim - offset) < 0.5 && Math.abs(smooth - offset) < 0.5;
      if (settled && !hovering && !reduced) {
        if (!restUntil) restUntil = now + pause;
        else if (now > restUntil) {
          const k = frameAt(offset);
          aim = Math.abs(offsetFor(k) - offset) > 1 ? offsetFor(k) : offsetFor(k + 1);
          restUntil = 0;
        }
      }
    }
    // One frame opens: the one under the cursor, or the one heading for the
    // centre. The rest ease shut.
    const target = hovering && hovered !== null ? hovered : frameAt(aim);
    if (!opens.has(target)) opens.set(target, 0);
    opens.forEach((value, k) => {
      const next = value + ((k === target ? 1 : 0) - value) * Math.min(1, 0.06 * delta);
      if (k !== target && next < 1e-3) opens.delete(k);
      else opens.set(k, next);
    });
    cursorAt.x += (pointer.x - cursorAt.x) * 0.16 * delta;
    cursorAt.y += (pointer.y - cursorAt.y) * 0.16 * delta;
    cursor.style.transform = `translate3d(${cursorAt.x}px, ${cursorAt.y}px, 0) translate(-50%, -50%)`;
    layout();
    if (hovering) label();
    frame = visible ? requestAnimationFrame(tick) : 0;
  };
  const start = () => {
    if (!frame && visible) {
      previous = 0;
      frame = requestAnimationFrame(tick);
    }
  };

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && !document.hidden;
    start();
  }).observe(root);
  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
    start();
  });

  // The frame k an element is drawing right now.
  const frameOf = (index: number) => index + Math.floor(offset / period()) * count;

  // The pill that stands in for the cursor: "Drag" over the row, "View" over
  // the open frame.
  const label = () => {
    const over = document.elementFromPoint(client.x, client.y)?.closest(".home-row__item");
    const text = !(held && dragged) && over && over === items[open] ? "View" : "Drag";
    if (cursor.textContent !== text) cursor.textContent = text;
  };
  strip.addEventListener("pointerenter", (event) => {
    if (!canHover) return;
    hovering = true;
    const box = root.getBoundingClientRect();
    pointer = cursorAt = { x: event.clientX - box.left, y: event.clientY - box.top };
    root.classList.add("is-hovering");
  });
  strip.addEventListener("pointerleave", () => {
    hovering = false;
    hovered = null;
    window.clearTimeout(hoverTimer);
    restUntil = performance.now() + pause / 2;
    root.classList.remove("is-hovering");
  });
  strip.addEventListener("pointermove", (event) => {
    if (!canHover) return;
    const box = root.getBoundingClientRect();
    pointer = { x: event.clientX - box.left, y: event.clientY - box.top };
    client = { x: event.clientX, y: event.clientY };
    // Only a real move picks a frame, not the row shifting under a still cursor.
    if (held || (!event.movementX && !event.movementY)) return;
    // Open the frame under the cursor once the cursor settles on it.
    const over = (event.target as Element).closest<HTMLAnchorElement>(".home-row__item");
    if (!over) return;
    const k = frameOf(items.indexOf(over));
    window.clearTimeout(hoverTimer);
    if (k !== hovered) hoverTimer = window.setTimeout(() => { hovered = k; }, 90);
  });
  window.addEventListener("pointermove", (event) => {
    if (!held) return;
    const dx = event.clientX - lastX;
    if (Math.abs(event.clientX - pressX) > 4) dragged = true;
    offset -= dx;
    velocity = -(dx / Math.max(8, event.timeStamp - lastTime)) * 16;
    lastX = event.clientX;
    lastTime = event.timeStamp;
  });
  strip.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    held = true;
    dragged = false;
    pressX = lastX = event.clientX;
    lastTime = event.timeStamp;
    velocity = 0;
    root.classList.add("is-held");
  });
  const release = () => {
    if (!held) return;
    held = false;
    root.classList.remove("is-held");
    // Let go, the row carries on a little and settles with a frame centred.
    if (dragged) {
      hovered = null;
      glideTo(frameAt(offset + velocity * 12));
    }
  };
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
  strip.addEventListener("dragstart", (event) => event.preventDefault());

  items.forEach((item, index) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      if (dragged) return;
      if (index !== open) {
        // A side frame glides to the centre first.
        hovered = frameOf(index);
        glideTo(frameOf(index));
        return;
      }
      const image = stills[index];
      transitionToPage(item.href, `<img src="${image.currentSrc || image.src}" alt="" />`, media[index].getBoundingClientRect(), homeProjects[Number(item.dataset.project)].title);
    });
  });

  // Trackpads can push the row sideways, and the page's own scroll nudges it.
  strip.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault();
    aim += event.deltaX;
    restUntil = 0;
  }, { passive: false });
  let scrolled = window.scrollY;
  window.addEventListener("scroll", () => {
    const change = window.scrollY - scrolled;
    scrolled = window.scrollY;
    if (visible && !held && !reduced) {
      aim += change * 0.35;
      restUntil = 0;
    }
  }, { passive: true });

  // Arrow keys step a frame at a time; Enter opens the frame in the centre.
  strip.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      hovered = null;
      glideTo(frameAt(aim) + (event.key === "ArrowRight" ? 1 : -1));
    } else if (event.key === "Enter" && open >= 0) {
      event.preventDefault();
      items[open].click();
    }
  });

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const k = frameAt(aim);
      measure();
      offset = aim = smooth = offsetFor(k);
    }, 120);
  });
  document.fonts?.ready.then(() => {
    const k = frameAt(aim);
    measure();
    offset = aim = smooth = offsetFor(k);
  });
  start();
}
