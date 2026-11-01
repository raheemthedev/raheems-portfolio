// Other ways to show "What I shape", compared with ?shape=index|words|split
// (the reel and sentence in shape.ts stay the default). Each is built from the
// section's own chapter markup, which stays in place for the reel.
//   index — after Collins' programme list and Dennis Snellenberg's "I can help
//           you with": three ruled rows, each a big name, a line on what it
//           covers and its disciplines. Hovering a row brings out a card that
//           trails the cursor and flicks through that chapter's frames. On
//           touch each row carries its frames in a small strip instead.
//   words — after Locomotive and Rejouice's oversized type: the three names
//           set huge, one under another. The section pins and, as you scroll,
//           each name in turn splits open around a window onto its frames,
//           with what it covers beneath.
//   split — after Koto and Collins' case pages: a sticky column on the left
//           names the chapter in view while its frames scroll past on the
//           right, wiping in as they arrive.

type ShapeOption = "index" | "words" | "split";

interface ShapeOptionChapter {
  number: string;
  kind: string;
  about: string;
  tags: string[];
  link: { href: string; label: string };
  line: string;
  frames: { src: string; alt: string; caption: string; number: string }[];
}

const shapeOptions: ShapeOption[] = ["index", "words", "split"];
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

/* Words ------------------------------------------------------------------- */

const mountShapeWords = (root: HTMLElement, chapters: ShapeOptionChapter[]) => {
  const words = document.createElement("div");
  words.className = "shape-option shape-words";
  // Each name splits after its first half, where its window opens.
  const halves = (word: string) => {
    const cut = Math.ceil(word.length / 2);
    return [word.slice(0, cut), word.slice(cut)];
  };
  const names = chapters.map((chapter) => {
    const name = chapter.kind.split(/\s*&\s*/).pop() ?? chapter.kind;
    return name.charAt(0).toUpperCase() + name.slice(1);
  });
  words.innerHTML = `
    <div class="shape-words__pin">
      <div class="shape-words__lines">
        ${chapters.map((chapter, index) => {
          const [start, end] = halves(names[index]);
          return `
            <div class="shape-words__line" data-index="${index}">
              <span class="shape-words__number">${chapter.number}</span>
              <span class="shape-words__half">${start}</span>
              <span class="shape-words__window">${chapter.frames.map((frame) => `<img src="${frame.src}" alt="" loading="lazy" decoding="async" />`).join("")}</span>
              <span class="shape-words__half">${end}</span>
            </div>`;
        }).join("")}
      </div>
      <div class="shape-words__details">
        ${chapters.map((chapter, index) => `
          <div class="shape-words__detail" data-index="${index}">
            <p class="shape-words__line-text">${chapter.line}</p>
            <p class="shape-words__about">${chapter.about}</p>
            <p class="shape-words__tags">${chapter.tags.join(" · ")}</p>
            <a class="shape-words__link" href="${chapter.link.href}">${chapter.link.label} <span aria-hidden="true">↗</span></a>
          </div>`).join("")}
      </div>
    </div>`;
  root.append(words);

  const lines = [...words.querySelectorAll<HTMLElement>(".shape-words__line")];
  const details = [...words.querySelectorAll<HTMLElement>(".shape-words__detail")];
  const windows = lines.map((line) => [...line.querySelectorAll<HTMLImageElement>(".shape-words__window img")]);
  let frame = 0;
  // Eased per line so the windows open and close softly whichever way you scroll.
  const open = chapters.map(() => 0);
  let current = -1;

  const render = () => {
    frame = 0;
    const box = words.getBoundingClientRect();
    const travel = Math.max(1, words.offsetHeight - window.innerHeight);
    const progress = Math.max(0, Math.min(0.9999, -box.top / travel));
    const position = progress * chapters.length;
    const index = Math.floor(position);
    const within = position - index;
    let moving = false;
    lines.forEach((line, n) => {
      const goal = n === index ? 1 : 0;
      open[n] += (goal - open[n]) * (shapeOptionStill ? 1 : 0.12);
      if (Math.abs(goal - open[n]) > 0.002) moving = true;
      line.style.setProperty("--open", open[n].toFixed(3));
      line.classList.toggle("is-active", n === index);
    });
    // The open window steps through its frames as you scroll through it.
    const frames = windows[index];
    const shown = Math.min(frames.length - 1, Math.floor(within * frames.length));
    frames.forEach((image, n) => image.classList.toggle("is-shown", n === shown));
    if (index !== current) {
      current = index;
      details.forEach((detail, n) => detail.classList.toggle("is-active", n === index));
    }
    if (moving) frame = requestAnimationFrame(render);
  };
  const request = () => {
    if (!frame) frame = requestAnimationFrame(render);
  };
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  render();
};

/* Split ------------------------------------------------------------------- */

const mountShapeSplit = (root: HTMLElement, chapters: ShapeOptionChapter[]) => {
  const split = document.createElement("div");
  split.className = "shape-option shape-split";
  split.innerHTML = `
    <div class="shape-split__aside">
      <div class="shape-split__sticky">
        <ol class="shape-split__rail">${chapters.map((chapter) => `<li><span>${chapter.number}</span> ${chapter.kind}</li>`).join("")}</ol>
        ${chapters.map((chapter, index) => `
          <div class="shape-split__chapter" data-index="${index}">
            <p class="shape-split__number">${chapter.number}</p>
            <h3 class="shape-split__kind">${chapter.kind}</h3>
            <p class="shape-split__line">${chapter.line}</p>
            <p class="shape-split__about">${chapter.about}</p>
            <ul class="shape-split__tags">${chapter.tags.map((tag) => `<li>${tag}</li>`).join("")}</ul>
            <a class="shape-split__link" href="${chapter.link.href}">${chapter.link.label} <span aria-hidden="true">↗</span></a>
          </div>`).join("")}
      </div>
    </div>
    <div class="shape-split__frames">
      ${chapters.map((chapter, index) => `
        <div class="shape-split__group" data-index="${index}">
          <p class="shape-split__group-label">${chapter.number} ${chapter.kind}<span>${chapter.line}</span></p>
          ${chapter.frames.map((frame) => `
            <figure class="shape-split__frame">
              <span class="shape-split__media"><img src="${frame.src}" alt="${frame.alt}" loading="lazy" decoding="async" /></span>
              <figcaption><span>${frame.number}</span> ${frame.caption}</figcaption>
            </figure>`).join("")}
        </div>`).join("")}
    </div>`;
  root.append(split);

  const asides = [...split.querySelectorAll<HTMLElement>(".shape-split__chapter")];
  const rail = [...split.querySelectorAll<HTMLElement>(".shape-split__rail li")];
  const groups = [...split.querySelectorAll<HTMLElement>(".shape-split__group")];
  const pick = (index: number) => {
    asides.forEach((aside, n) => aside.classList.toggle("is-active", n === index));
    rail.forEach((item, n) => item.classList.toggle("is-active", n === index));
  };
  pick(0);
  // The chapter whose frames cross the middle of the screen is the one named.
  const middle = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) pick(groups.indexOf(entry.target as HTMLElement));
    });
  }, { rootMargin: "-50% 0px -50% 0px" });
  groups.forEach((group) => middle.observe(group));
  // Frames wipe in as they arrive.
  const arrive = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      arrive.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -12% 0px" });
  split.querySelectorAll(".shape-split__frame").forEach((figure) => arrive.observe(figure));
};

/* Choosing ---------------------------------------------------------------- */

if (shapeOptionRoot) {
  if (shapeOption) {
    const chapters = shapeOptionChapters(shapeOptionRoot);
    shapeOptionRoot.dataset.option = shapeOption;
    ({ index: mountShapeIndex, words: mountShapeWords, split: mountShapeSplit })[shapeOption](shapeOptionRoot, chapters);
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
