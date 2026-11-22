// "What I shape", being chosen from the options below with ?shape=<option>
// (List is the default; the reel in shape.ts is no longer loaded). Each is
// built from the section's own chapter markup.
//   list       — after a studio's "What we do": a label, a short statement and
//                a link, beside one long list of everything the three chapters
//                make, set large and grey. The item in focus turns ink and a
//                frame from its chapter shows at the foot of the left column;
//                scrolling walks the focus down the list, pointing takes it.
//   credits    — the section as a film's closing credits: each chapter, what
//                it was for, and what it made in two centred columns,
//                with a frame between each; lines brighten as they pass the
//                middle of the screen. It ends "Designed by Raheem Animashaun".
//   definition — a dictionary entry for "shape": pronunciation, part of
//                speech, then the three chapters as numbered senses, each with
//                a figure, related words and a cross-reference to its case
//                study, and the word's origin at the foot.

type ShapeOption = "list" | "credits" | "definition";

interface ShapeOptionChapter {
  number: string;
  kind: string;
  about: string;
  tags: string[];
  link: { href: string; label: string };
  line: string;
  frames: { src: string; alt: string; caption: string; number: string }[];
}

const shapeOptions: ShapeOption[] = ["list", "credits", "definition"];
const shapeOptionRoot = document.querySelector<HTMLElement>("[data-shape]");
const shapeOptionAsked = new URLSearchParams(window.location.search).get("shape");
const shapeOption = shapeOptions.find((option) => option === shapeOptionAsked) ?? "list";

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

// Draft deliverables, taken from each chapter's own description and frame
// captions. Edit freely.
const shapeDeliverables: Record<string, string[]> = {
  "01": ["Brand identity", "Naming", "Logos & marks", "Typography", "Colour", "Visual systems", "Art direction"],
  "02": ["Motion systems", "Generative design", "Exhibition identity", "Web & digital", "Screen design", "Type in motion"],
  "03": ["Launch campaigns", "Social", "Pitch decks", "Product notifications", "Stickers & merch", "Out of home"],
};
const shapeMakes = (chapter: ShapeOptionChapter) => shapeDeliverables[chapter.number] ?? chapter.tags;

// Everything made, in order, each with the chapter and frame it points to.
const shapeAllMakes = (chapters: ShapeOptionChapter[]) =>
  chapters.flatMap((chapter, index) => shapeMakes(chapter).map((item, n) => ({
    item,
    chapter: index,
    frame: chapter.frames[n % chapter.frames.length],
  })));

/* List -------------------------------------------------------------------- */

const mountShapeList = (root: HTMLElement, chapters: ShapeOptionChapter[]) => {
  const makes = shapeAllMakes(chapters);
  const view = document.createElement("div");
  view.className = "shape-option shape-list";
  view.innerHTML = `
    <div class="shape-list__side">
      <p class="shape-list__label">/ What I shape</p>
      <div class="shape-list__intro">
        <p>I design ideas into brands people remember.</p>
        <p>My work spans, but is never limited to, the following:</p>
        <a class="shape-list__link" href="work.html">See my work</a>
      </div>
      <figure class="shape-list__figure" aria-hidden="true">
        <span class="shape-list__window">${makes.map((make, n) => `<img src="${make.frame.src}" alt="" data-n="${n}"${n ? "" : ' class="is-shown"'} loading="lazy" decoding="async" />`).join("")}</span>
        <figcaption class="shape-list__caption"><span>${makes[0].frame.number}</span> ${makes[0].frame.caption}</figcaption>
      </figure>
    </div>
    <ul class="shape-list__items">
      ${makes.map((make, n) => `<li${n ? "" : ' class="is-active"'}><a href="${chapters[make.chapter].link.href}" data-n="${n}">${make.item}</a></li>`).join("")}
    </ul>`;
  root.append(view);

  const items = [...view.querySelectorAll<HTMLElement>(".shape-list__items li")];
  const images = [...view.querySelectorAll<HTMLImageElement>(".shape-list__window img")];
  const caption = view.querySelector<HTMLElement>(".shape-list__caption") as HTMLElement;
  let active = 0;
  let pointing = false;
  const focus = (n: number) => {
    if (n === active) return;
    active = n;
    items.forEach((item, m) => item.classList.toggle("is-active", m === n));
    images.forEach((image, m) => image.classList.toggle("is-shown", m === n));
    caption.innerHTML = `<span>${makes[n].frame.number}</span> ${makes[n].frame.caption}`;
  };

  // Pointing at an item takes the focus.
  items.forEach((item, n) => {
    item.addEventListener("pointerenter", () => {
      pointing = true;
      focus(n);
    });
  });
  view.querySelector(".shape-list__items")?.addEventListener("pointerleave", () => {
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
};

/* Credits ----------------------------------------------------------------- */

const mountShapeCredits = (root: HTMLElement, chapters: ShapeOptionChapter[]) => {
  const project = (chapter: ShapeOptionChapter) => chapter.frames[0].caption.split(" — ")[0] || chapter.link.label;
  const view = document.createElement("div");
  view.className = "shape-option shape-credits";
  view.innerHTML = `
    <p class="shape-credits__title shape-credits__line">What I shape</p>
    ${chapters.map((chapter) => `
      <section class="shape-credits__chapter">
        <p class="shape-credits__kind shape-credits__line"><span>${chapter.number}</span> ${chapter.kind}</p>
        <p class="shape-credits__for shape-credits__line">for ${project(chapter)}</p>
        <ul class="shape-credits__names">
          ${shapeMakes(chapter).map((item) => `<li class="shape-credits__line">${item}</li>`).join("")}
        </ul>
        <a class="shape-credits__frame shape-credits__line" href="${chapter.link.href}">
          <span class="shape-credits__media"><img src="${chapter.frames[0].src}" alt="${chapter.frames[0].alt}" loading="lazy" decoding="async" /></span>
          <span class="shape-credits__caption">${chapter.link.label} <span aria-hidden="true">↗</span></span>
        </a>
      </section>`).join("")}
    <div class="shape-credits__end shape-credits__line">
      <p>Designed by</p>
      <p class="shape-credits__name">Raheem Animashaun</p>
      <a class="shape-credits__link" href="mailto:animashaunraheem05@gmail.com">Start a project ↗</a>
    </div>`;
  root.append(view);

  // Lines brighten as they pass the middle of the screen, like credits
  // rolling past a lit strip.
  const lines = [...view.querySelectorAll<HTMLElement>(".shape-credits__line")];
  let frame = 0;
  const render = () => {
    frame = 0;
    const middle = window.innerHeight / 2;
    lines.forEach((line) => {
      const box = line.getBoundingClientRect();
      if (box.bottom < -100 || box.top > window.innerHeight + 100) return;
      const away = Math.abs(box.top + box.height / 2 - middle) / (window.innerHeight * 0.5);
      line.style.opacity = Math.max(0.12, Math.min(1, 1.25 - away)).toFixed(3);
    });
  };
  if (!shapeOptionStill) {
    window.addEventListener("scroll", () => {
      if (!frame) frame = requestAnimationFrame(render);
    }, { passive: true });
    render();
  }
};

/* Definition -------------------------------------------------------------- */

const mountShapeDefinition = (root: HTMLElement, chapters: ShapeOptionChapter[]) => {
  // "I give an idea…" reads as the sense "to give an idea…".
  const sense = (chapter: ShapeOptionChapter) => chapter.line.replace(/^I\s+/, "to ").replace(/\.$/, "");
  const view = document.createElement("div");
  view.className = "shape-option shape-definition";
  view.innerHTML = `
    <header class="shape-definition__head">
      <h3 class="shape-definition__word">shape</h3>
      <p class="shape-definition__say">/ʃeɪp/ <span>verb</span> <span>shaped · shaping · shapes</span></p>
    </header>
    <ol class="shape-definition__senses">
      ${chapters.map((chapter) => `
        <li class="shape-definition__sense">
          <span class="shape-definition__number">${Number(chapter.number)}</span>
          <div class="shape-definition__text">
            <p class="shape-definition__field">${chapter.kind}</p>
            <p class="shape-definition__meaning">${sense(chapter)}.</p>
            <p class="shape-definition__gloss">${chapter.about}</p>
            <p class="shape-definition__related"><span>Related</span> ${shapeMakes(chapter).slice(0, 5).join(", ").toLowerCase()}</p>
            <a class="shape-definition__see" href="${chapter.link.href}"><span>See</span> ${chapter.link.label} <span aria-hidden="true">↗</span></a>
          </div>
          <figure class="shape-definition__figure">
            <span class="shape-definition__media"><img src="${chapter.frames[0].src}" alt="${chapter.frames[0].alt}" loading="lazy" decoding="async" /></span>
            <figcaption>fig. ${chapter.frames[0].number} — ${chapter.frames[0].caption}</figcaption>
          </figure>
        </li>`).join("")}
    </ol>
    <p class="shape-definition__origin"><span>Origin</span> Old English <em>gesceap</em>, “creation, form”: to make something exist, and then to give it a form of its own.</p>`;
  root.append(view);

  // Each sense rises in as it arrives.
  const arrive = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      arrive.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -12% 0px" });
  view.querySelectorAll(".shape-definition__sense").forEach((item) => arrive.observe(item));
};

/* Choosing ---------------------------------------------------------------- */

if (shapeOptionRoot) {
  shapeOptionRoot.dataset.option = shapeOption;
  ({
    list: mountShapeList,
    credits: mountShapeCredits,
    definition: mountShapeDefinition,
  })[shapeOption](shapeOptionRoot, shapeOptionChapters(shapeOptionRoot));

  // Temporary picker for comparing them, shown while the section is in view.
  const picker = document.createElement("div");
  picker.className = "shape-picker";
  picker.setAttribute("role", "group");
  picker.setAttribute("aria-label", "What I shape layout");
  picker.innerHTML = shapeOptions
    .map((option) => `<button type="button" data-option="${option}" aria-pressed="${shapeOption === option}">${option.charAt(0).toUpperCase() + option.slice(1)}</button>`)
    .join("");
  document.body.append(picker);
  picker.addEventListener("click", (event) => {
    const option = (event.target as Element).closest<HTMLButtonElement>("button")?.dataset.option;
    if (!option) return;
    const url = new URL(window.location.href);
    url.searchParams.set("shape", option);
    url.hash = "what-i-shape";
    window.location.href = url.toString();
  });
  new IntersectionObserver(([entry]) => {
    picker.classList.toggle("is-shown", entry.isIntersecting);
  }).observe(shapeOptionRoot.parentElement ?? shapeOptionRoot);
}
