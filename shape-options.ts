// Other ways to show "What I shape", compared with
// ?shape=index|accordion|contents|ticker (the reel in shape.ts stays the
// default). Each is built from the section's own chapter markup, which stays
// in place for the reel. All four start from a ruled index of the chapters.
//   index     — after Collins' programme list and Dennis Snellenberg's "I can
//               help you with": three ruled rows; hovering one brings out a
//               card that trails the cursor through that chapter's frames.
//   accordion — after Rejouice and Koto's services: the rows open one at a
//               time into a panel with the chapter's sentence, link and frames.
//   contents  — like a book's contents: each chapter lists its frames as
//               entries, and pointing at one shows it large in a sticky view
//               beside the list.
//   ticker    — each row is a slow band of the chapter's name and frames,
//               alternate rows running opposite ways; hovering slows one and
//               page scroll hurries them along.

type ShapeOption = "index" | "accordion" | "contents" | "ticker";

interface ShapeOptionChapter {
  number: string;
  kind: string;
  about: string;
  tags: string[];
  link: { href: string; label: string };
  line: string;
  frames: { src: string; alt: string; caption: string; number: string }[];
}

const shapeOptions: ShapeOption[] = ["index", "accordion", "contents", "ticker"];
const shapeOptionRoot = document.querySelector<HTMLElement>("[data-shape]");
const shapeOptionAsked = new URLSearchParams(window.location.search).get("shape");
const shapeOption = shapeOptions.find((option) => option === shapeOptionAsked) ?? null;

const shapeOptionChapters = (root: HTMLElement): ShapeOptionChapter[] =>
  [...root.querySelectorAll<HTMLElement>(".shape-chapter")].map((chapter) => {
    const text = (selector: string) => chapter.querySelector(selector)?.textContent?.trim() ?? "";
    const link = chapter.querySelector<HTMLAnchorElement>(".shape-chapter__link");
    return {
      number: text(".shape-chapter__number"),
      kind: text(".shape-chapter__kind"),
      about: text(".shape-chapter__about"),
      tags: [...chapter.querySelectorAll(".shape-chapter__tags li")].map((item) => item.textContent?.trim() ?? ""),
      link: { href: link?.getAttribute("href") ?? "work.html", label: (link?.textContent ?? "").replace("↗", "").trim() },
      line: text(".shape-chapter__line").replace(/\s+/g, " "),
      frames: [...chapter.querySelectorAll<HTMLElement>(".shape-frame")].map((figure) => {
        const image = figure.querySelector("img");
        const caption = figure.querySelector("figcaption");
        return {
          src: image?.getAttribute("src") ?? "",
          alt: image?.getAttribute("alt") ?? "",
          number: caption?.querySelector("span")?.textContent?.trim() ?? "",
          caption: (caption?.textContent ?? "").replace(caption?.querySelector("span")?.textContent ?? "", "").trim(),
        };
      }),
    };
  });

const shapeOptionStill = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const shapeOptionHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* Index ------------------------------------------------------------------- */

const mountShapeIndex = (root: HTMLElement, chapters: ShapeOptionChapter[]) => {
  const list = document.createElement("div");
  list.className = "shape-option shape-index";
  list.innerHTML = chapters.map((chapter, index) => `
    <a class="shape-index__row" href="${chapter.link.href}" data-index="${index}">
      <span class="shape-index__number">${chapter.number}</span>
      <span class="shape-index__kind">${chapter.kind}</span>
      <span class="shape-index__about">${chapter.about}<span class="shape-index__tags">${chapter.tags.join(" · ")}</span></span>
      <span class="shape-index__arrow" aria-hidden="true">↗</span>
      <span class="shape-index__strip" aria-hidden="true">${chapter.frames.map((frame) => `<img src="${frame.src}" alt="" loading="lazy" decoding="async" />`).join("")}</span>
    </a>`).join("") + `
    <div class="shape-index__card" aria-hidden="true">
      <div class="shape-index__window">${chapters.map((chapter, index) => chapter.frames.map((frame, n) => `<img src="${frame.src}" alt="" data-chapter="${index}" data-frame="${n}" loading="lazy" decoding="async" />`).join("")).join("")}</div>
      <p class="shape-index__caption"></p>
    </div>`;
  root.append(list);
  if (!shapeOptionHover) return;

  const card = list.querySelector<HTMLElement>(".shape-index__card") as HTMLElement;
  const caption = list.querySelector<HTMLElement>(".shape-index__caption") as HTMLElement;
  const images = [...list.querySelectorAll<HTMLImageElement>(".shape-index__window img")];
  let active = -1;
  let shown = 0;
  let timer = 0;
  let frame = 0;
  const target = { x: 0, y: 0 };
  const at = { x: 0, y: 0 };

  const show = (chapter: number, n: number) => {
    shown = n;
    images.forEach((image) => {
      image.classList.toggle("is-shown", Number(image.dataset.chapter) === chapter && Number(image.dataset.frame) === n);
    });
    const current = chapters[chapter].frames[n];
    caption.innerHTML = `<span>${current.number}</span> ${current.caption}`;
  };
  // The card trails the cursor and leans a touch into its movement.
  const follow = () => {
    const dx = target.x - at.x;
    at.x += dx * 0.12;
    at.y += (target.y - at.y) * 0.12;
    card.style.transform = `translate3d(${at.x}px, ${at.y}px, 0) translate(-50%, -50%) rotate(${Math.max(-6, Math.min(6, dx * 0.04)).toFixed(2)}deg)`;
    frame = active >= 0 || Math.abs(dx) > 0.5 ? requestAnimationFrame(follow) : 0;
  };

  list.querySelectorAll<HTMLElement>(".shape-index__row").forEach((row) => {
    const index = Number(row.dataset.index);
    row.addEventListener("pointerenter", (event) => {
      const box = list.getBoundingClientRect();
      target.x = event.clientX - box.left;
      target.y = event.clientY - box.top;
      if (active < 0) {
        at.x = target.x;
        at.y = target.y;
      }
      active = index;
      list.classList.add("is-hovering");
      list.querySelectorAll(".shape-index__row").forEach((other) => other.classList.toggle("is-active", other === row));
      card.classList.add("is-shown");
      show(index, 0);
      window.clearInterval(timer);
      // Flick through the chapter's frames while the cursor stays.
      if (!shapeOptionStill) timer = window.setInterval(() => show(index, (shown + 1) % chapters[index].frames.length), 900);
      if (!frame) frame = requestAnimationFrame(follow);
    });
    row.addEventListener("pointermove", (event) => {
      const box = list.getBoundingClientRect();
      target.x = event.clientX - box.left;
      target.y = event.clientY - box.top;
    });
  });
  list.addEventListener("pointerleave", () => {
    active = -1;
    window.clearInterval(timer);
    list.classList.remove("is-hovering");
    list.querySelectorAll(".shape-index__row").forEach((row) => row.classList.remove("is-active"));
    card.classList.remove("is-shown");
  });
};

/* Accordion --------------------------------------------------------------- */

const mountShapeAccordion = (root: HTMLElement, chapters: ShapeOptionChapter[]) => {
  const list = document.createElement("div");
  list.className = "shape-option shape-accordion";
  list.innerHTML = chapters.map((chapter, index) => `
    <div class="shape-accordion__item${index ? "" : " is-open"}">
      <button class="shape-accordion__head" type="button" aria-expanded="${!index}">
        <span class="shape-accordion__number">${chapter.number}</span>
        <span class="shape-accordion__kind">${chapter.kind}</span>
        <span class="shape-accordion__tags">${chapter.tags.join(" · ")}</span>
        <span class="shape-accordion__toggle" aria-hidden="true"></span>
      </button>
      <div class="shape-accordion__panel">
        <div class="shape-accordion__inner">
          <div class="shape-accordion__text">
            <p class="shape-accordion__line">${chapter.line}</p>
            <p class="shape-accordion__about">${chapter.about}</p>
            <a class="shape-accordion__link" href="${chapter.link.href}">${chapter.link.label} <span aria-hidden="true">↗</span></a>
          </div>
          <div class="shape-accordion__frames">
            ${chapter.frames.map((frame) => `
              <figure class="shape-accordion__frame">
                <span class="shape-accordion__media"><img src="${frame.src}" alt="${frame.alt}" loading="lazy" decoding="async" /></span>
                <figcaption><span>${frame.number}</span> ${frame.caption}</figcaption>
              </figure>`).join("")}
          </div>
        </div>
      </div>
    </div>`).join("");
  root.append(list);

  // One chapter open at a time; opening another closes the last.
  const items = [...list.querySelectorAll<HTMLElement>(".shape-accordion__item")];
  items.forEach((item) => {
    item.querySelector(".shape-accordion__head")?.addEventListener("click", () => {
      const opening = !item.classList.contains("is-open");
      items.forEach((other) => {
        const open = other === item && opening;
        other.classList.toggle("is-open", open);
        other.querySelector(".shape-accordion__head")?.setAttribute("aria-expanded", String(open));
      });
    });
  });
};

/* Contents ---------------------------------------------------------------- */

const mountShapeContents = (root: HTMLElement, chapters: ShapeOptionChapter[]) => {
  const frames = chapters.flatMap((chapter) => chapter.frames);
  const contents = document.createElement("div");
  contents.className = "shape-option shape-contents";
  let count = 0;
  contents.innerHTML = `
    <div class="shape-contents__list">
      ${chapters.map((chapter) => `
        <section class="shape-contents__chapter">
          <h3 class="shape-contents__kind"><span>${chapter.number}</span>${chapter.kind}</h3>
          <p class="shape-contents__about">${chapter.about}</p>
          <ol class="shape-contents__entries">
            ${chapter.frames.map((frame) => `
              <li>
                <a class="shape-contents__entry" href="${chapter.link.href}" data-frame="${count++}">
                  <span class="shape-contents__thumb"><img src="${frame.src}" alt="" loading="lazy" decoding="async" /></span>
                  <span class="shape-contents__entry-number">${frame.number}</span>
                  <span class="shape-contents__entry-title">${frame.caption}</span>
                  <span class="shape-contents__entry-arrow" aria-hidden="true">→</span>
                </a>
              </li>`).join("")}
          </ol>
          <p class="shape-contents__tags">${chapter.tags.join(" · ")}</p>
        </section>`).join("")}
    </div>
    <div class="shape-contents__view" aria-hidden="true">
      <div class="shape-contents__sticky">
        <div class="shape-contents__window">${frames.map((frame) => `<img src="${frame.src}" alt="" loading="lazy" decoding="async" />`).join("")}</div>
        <p class="shape-contents__caption"></p>
      </div>
    </div>`;
  root.append(contents);

  const images = [...contents.querySelectorAll<HTMLImageElement>(".shape-contents__window img")];
  const entries = [...contents.querySelectorAll<HTMLElement>(".shape-contents__entry")];
  const caption = contents.querySelector<HTMLElement>(".shape-contents__caption") as HTMLElement;
  const show = (index: number) => {
    images.forEach((image, n) => image.classList.toggle("is-shown", n === index));
    entries.forEach((entry, n) => entry.classList.toggle("is-active", n === index));
    caption.innerHTML = `<span>${frames[index].number}</span> ${frames[index].caption}`;
  };
  show(0);
  entries.forEach((entry, index) => {
    entry.addEventListener("pointerenter", () => show(index));
    entry.addEventListener("focus", () => show(index));
  });
};

/* Ticker ------------------------------------------------------------------ */

const mountShapeTicker = (root: HTMLElement, chapters: ShapeOptionChapter[]) => {
  const ticker = document.createElement("div");
  ticker.className = "shape-option shape-ticker";
  const run = (chapter: ShapeOptionChapter) => chapter.frames.map((frame) => `
    <span class="shape-ticker__word">${chapter.kind}</span>
    <span class="shape-ticker__frame"><img src="${frame.src}" alt="" loading="lazy" decoding="async" /></span>`).join("");
  ticker.innerHTML = chapters.map((chapter) => `
    <a class="shape-ticker__row" href="${chapter.link.href}" aria-label="${chapter.kind}: ${chapter.about}">
      <span class="shape-ticker__band" aria-hidden="true"><span class="shape-ticker__track">${run(chapter)}${run(chapter)}</span></span>
      <span class="shape-ticker__meta">
        <span class="shape-ticker__number">${chapter.number}</span>
        <span class="shape-ticker__about">${chapter.about}</span>
        <span class="shape-ticker__tags">${chapter.tags.join(" · ")}</span>
        <span class="shape-ticker__link">${chapter.link.label} <span aria-hidden="true">↗</span></span>
      </span>
    </a>`).join("");
  root.append(ticker);

  const rows = [...ticker.querySelectorAll<HTMLElement>(".shape-ticker__row")];
  const tracks = rows.map((row) => row.querySelector<HTMLElement>(".shape-ticker__track") as HTMLElement);
  // Alternate rows run opposite ways; hovering one slows it almost to a stop,
  // and page scroll hurries them all along.
  const offsets = rows.map(() => 0);
  const speeds = rows.map(() => 1);
  let hovered = -1;
  let push = 0;
  let scrolled = window.scrollY;
  let visible = false;
  let frame = 0;
  let previous = 0;
  rows.forEach((row, index) => {
    row.addEventListener("pointerenter", () => { hovered = index; });
    row.addEventListener("pointerleave", () => { hovered = -1; });
  });
  window.addEventListener("scroll", () => {
    push += Math.abs(window.scrollY - scrolled) * 0.06;
    scrolled = window.scrollY;
  }, { passive: true });
  const tick = (now: number) => {
    const delta = previous ? Math.min(48, now - previous) / 16.67 : 1;
    previous = now;
    push *= Math.pow(0.9, delta);
    tracks.forEach((track, index) => {
      speeds[index] += ((index === hovered ? 0.08 : 1) - speeds[index]) * 0.06 * delta;
      const half = track.scrollWidth / 2 || 1;
      offsets[index] = (offsets[index] + (0.45 + push) * speeds[index] * delta) % half;
      const x = index % 2 ? offsets[index] - half : -offsets[index];
      track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    });
    frame = visible && !shapeOptionStill ? requestAnimationFrame(tick) : 0;
  };
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !frame) {
      previous = 0;
      frame = requestAnimationFrame(tick);
    }
  }).observe(ticker);
};

/* Choosing ---------------------------------------------------------------- */

if (shapeOptionRoot) {
  if (shapeOption) {
    const chapters = shapeOptionChapters(shapeOptionRoot);
    shapeOptionRoot.dataset.option = shapeOption;
    ({ index: mountShapeIndex, accordion: mountShapeAccordion, contents: mountShapeContents, ticker: mountShapeTicker })[shapeOption](shapeOptionRoot, chapters);
  }

  // Temporary picker for comparing them, shown while the section is in view.
  const picker = document.createElement("div");
  picker.className = "shape-picker";
  picker.setAttribute("role", "group");
  picker.setAttribute("aria-label", "What I shape layout");
  picker.innerHTML = (["reel", ...shapeOptions] as string[])
    .map((option) => `<button type="button" data-option="${option}" aria-pressed="${(shapeOption ?? "reel") === option}">${option.charAt(0).toUpperCase() + option.slice(1)}</button>`)
    .join("");
  document.body.append(picker);
  picker.addEventListener("click", (event) => {
    const option = (event.target as Element).closest<HTMLButtonElement>("button")?.dataset.option;
    if (!option) return;
    const url = new URL(window.location.href);
    if (option === "reel") url.searchParams.delete("shape");
    else url.searchParams.set("shape", option);
    url.hash = "what-i-shape";
    window.location.href = url.toString();
  });
  new IntersectionObserver(([entry]) => {
    picker.classList.toggle("is-shown", entry.isIntersecting);
  }).observe(shapeOptionRoot);
}
