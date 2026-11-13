// "What I shape", being chosen from the options below with ?shape=<option>
// (Index is the default; the reel in shape.ts is no longer loaded). Each is
// built from the section's own chapter markup, and all start from a ruled
// index of the chapters.
//   index     — after Collins' programme list and Dennis Snellenberg's "I can
//               help you with": three ruled rows; hovering one brings out a
//               card that trails the cursor through that chapter's frames.
//   capabilities — after Rejouice's services page: a plain statement, then
//               "(01) Identity" beside a stacked list of what it makes, with
//               one frame and the link at the side.
//   stack     — each chapter a full card that pins as you scroll and the
//               next slides over it, the one beneath settling back; frames
//               change slowly inside each card.
//   focus     — one pinned frame on the left; the chapters scroll past on the
//               right, and the frame follows whichever is in the middle,
//               stepping through its images as you read down it.
//   tabs      — the three chapters as tabs with a thin bar that fills and
//               moves on to the next; each shows its sentence, what it makes
//               and three frames. Hover pauses it; it only runs in view.
//   margins   — an editorial page: each chapter one sentence set large and
//               light, with footnote numbers that point to small captioned
//               frames in the margin.
// One more asks what happens without the section:
//   none      — the section removed: Row, then About, then the footer.

type ShapeOption =
  | "index"
  | "capabilities"
  | "stack"
  | "focus"
  | "tabs"
  | "margins"
  | "none";

interface ShapeOptionChapter {
  number: string;
  kind: string;
  about: string;
  tags: string[];
  link: { href: string; label: string };
  line: string;
  frames: { src: string; alt: string; caption: string; number: string }[];
}

const shapeOptions: ShapeOption[] = [
  "index",
  "capabilities",
  "stack",
  "focus",
  "tabs",
  "margins",
  "none",
];
const shapeOptionRoot = document.querySelector<HTMLElement>("[data-shape]");
const shapeOptionAsked = new URLSearchParams(window.location.search).get("shape");
const shapeOption = shapeOptions.find((option) => option === shapeOptionAsked) ?? "index";

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

/* What each chapter makes ------------------------------------------------- */

// Draft deliverables for the list-led options, taken from each chapter's
// own description and frame captions. Edit freely.
const shapeDeliverables: Record<string, string[]> = {
  "01": ["Brand identity", "Naming", "Logos & marks", "Typography", "Colour", "Visual systems", "Art direction"],
  "02": ["Motion systems", "Generative design", "Exhibition identity", "Web & digital", "Screen design", "Type in motion"],
  "03": ["Launch campaigns", "Social", "Pitch decks", "Product notifications", "Stickers & merch", "Out of home"],
};
const shapeMakes = (chapter: ShapeOptionChapter) => shapeDeliverables[chapter.number] ?? chapter.tags;

/* Capabilities ------------------------------------------------------------ */

const mountShapeCapabilities = (root: HTMLElement, chapters: ShapeOptionChapter[]) => {
  const capabilities = document.createElement("div");
  capabilities.className = "shape-option shape-capabilities";
  capabilities.innerHTML = `
    <p class="shape-capabilities__statement">Three ways an idea takes shape. One designer, from the first mark to the last campaign.</p>
    ${chapters.map((chapter) => `
      <div class="shape-capabilities__row">
        <p class="shape-capabilities__label">(${chapter.number}) ${chapter.kind}</p>
        <ul class="shape-capabilities__list">${shapeMakes(chapter).map((item) => `<li>${item}</li>`).join("")}</ul>
        <div class="shape-capabilities__side">
          <span class="shape-capabilities__media">${chapter.frames.map((frame, n) => `<img src="${frame.src}" alt=""${n ? "" : ' class="is-shown"'} loading="lazy" decoding="async" />`).join("")}</span>
          <a class="shape-capabilities__link" href="${chapter.link.href}">${chapter.link.label} <span aria-hidden="true">↗</span></a>
        </div>
      </div>`).join("")}`;
  root.append(capabilities);

  // Pointing at an item shows the frame that goes with it, in turn.
  capabilities.querySelectorAll<HTMLElement>(".shape-capabilities__row").forEach((row) => {
    const images = [...row.querySelectorAll<HTMLImageElement>(".shape-capabilities__media img")];
    row.querySelectorAll<HTMLElement>(".shape-capabilities__list li").forEach((item, n) => {
      item.addEventListener("pointerenter", () => {
        images.forEach((image, m) => image.classList.toggle("is-shown", m === n % images.length));
      });
    });
  });
};

/* Stack ------------------------------------------------------------------- */

const mountShapeStack = (root: HTMLElement, chapters: ShapeOptionChapter[]) => {
  const stack = document.createElement("div");
  stack.className = "shape-option shape-stack";
  stack.innerHTML = chapters.map((chapter, index) => `
    <article class="shape-stack__card" style="--i: ${index}">
      <div class="shape-stack__text">
        <p class="shape-stack__number">${chapter.number} <span>/ 0${chapters.length}</span></p>
        <div>
          <h3 class="shape-stack__kind">${chapter.kind}</h3>
          <p class="shape-stack__about">${chapter.about}</p>
        </div>
        <div>
          <ul class="shape-stack__makes">${shapeMakes(chapter).map((item) => `<li>${item}</li>`).join("")}</ul>
          <a class="shape-stack__link" href="${chapter.link.href}">${chapter.link.label} <span aria-hidden="true">↗</span></a>
        </div>
      </div>
      <a class="shape-stack__media" href="${chapter.link.href}" aria-label="${chapter.link.label}">
        ${chapter.frames.map((frame, n) => `<img src="${frame.src}" alt=""${n ? "" : ' class="is-shown"'} loading="lazy" decoding="async" />`).join("")}
        <span class="shape-stack__caption"><span>${chapter.frames[0].number}</span> ${chapter.frames[0].caption}</span>
      </a>
    </article>`).join("");
  root.append(stack);

  const cards = [...stack.querySelectorAll<HTMLElement>(".shape-stack__card")];
  // Frames change slowly while a card is on screen.
  cards.forEach((card, index) => {
    const images = [...card.querySelectorAll<HTMLImageElement>(".shape-stack__media img")];
    const caption = card.querySelector<HTMLElement>(".shape-stack__caption") as HTMLElement;
    let shown = 0;
    let timer = 0;
    new IntersectionObserver(([entry]) => {
      window.clearInterval(timer);
      if (!entry.isIntersecting || shapeOptionStill) return;
      timer = window.setInterval(() => {
        shown = (shown + 1) % images.length;
        images.forEach((image, n) => image.classList.toggle("is-shown", n === shown));
        const frame = chapters[index].frames[shown];
        caption.innerHTML = `<span>${frame.number}</span> ${frame.caption}`;
      }, 2600);
    }, { threshold: 0.4 }).observe(card);
  });

  // The card beneath settles back as the next one slides over it.
  let frame = 0;
  const render = () => {
    frame = 0;
    cards.forEach((card, index) => {
      const next = cards[index + 1];
      if (!next) return;
      const top = card.getBoundingClientRect().top;
      const under = Math.min(1, Math.max(0, 1 - (next.getBoundingClientRect().top - top) / card.offsetHeight));
      card.style.setProperty("--under", under.toFixed(3));
    });
  };
  if (!shapeOptionStill) {
    window.addEventListener("scroll", () => {
      if (!frame) frame = requestAnimationFrame(render);
    }, { passive: true });
    render();
  }
};

/* Focus ------------------------------------------------------------------- */

const mountShapeFocus = (root: HTMLElement, chapters: ShapeOptionChapter[]) => {
  const view = document.createElement("div");
  view.className = "shape-option shape-focus";
  view.innerHTML = `
    <div class="shape-focus__media" aria-hidden="true">
      <div class="shape-focus__window">${chapters.map((chapter, index) => chapter.frames.map((frame, n) => `<img src="${frame.src}" alt="" data-chapter="${index}" data-frame="${n}"${index || n ? "" : ' class="is-shown"'} loading="lazy" decoding="async" />`).join("")).join("")}</div>
      <p class="shape-focus__caption"><span>${chapters[0].frames[0].number}</span> ${chapters[0].frames[0].caption}</p>
    </div>
    <div class="shape-focus__chapters">
      ${chapters.map((chapter, index) => `
        <section class="shape-focus__chapter${index ? "" : " is-active"}">
          <p class="shape-focus__number">${chapter.number}</p>
          <h3 class="shape-focus__kind">${chapter.kind}</h3>
          <p class="shape-focus__about">${chapter.about}</p>
          <p class="shape-focus__makes">${shapeMakes(chapter).join(" · ")}</p>
          <a class="shape-focus__link" href="${chapter.link.href}">${chapter.link.label} <span aria-hidden="true">↗</span></a>
          <span class="shape-focus__strip" aria-hidden="true">${chapter.frames.map((frame) => `<img src="${frame.src}" alt="" loading="lazy" decoding="async" />`).join("")}</span>
        </section>`).join("")}
    </div>`;
  root.append(view);

  const sections = [...view.querySelectorAll<HTMLElement>(".shape-focus__chapter")];
  const images = [...view.querySelectorAll<HTMLImageElement>(".shape-focus__window img")];
  const caption = view.querySelector<HTMLElement>(".shape-focus__caption") as HTMLElement;
  let current = "0-0";
  let frame = 0;
  // Whichever chapter holds the middle of the screen leads, and the frame
  // steps through its images as you read down it.
  const render = () => {
    frame = 0;
    const middle = window.innerHeight / 2;
    let chapter = 0;
    sections.forEach((section, index) => {
      if (section.getBoundingClientRect().top < middle) chapter = index;
    });
    const box = sections[chapter].getBoundingClientRect();
    const count = chapters[chapter].frames.length;
    const n = Math.min(count - 1, Math.max(0, Math.floor(((middle - box.top) / box.height) * count)));
    if (`${chapter}-${n}` === current) return;
    current = `${chapter}-${n}`;
    sections.forEach((section, index) => section.classList.toggle("is-active", index === chapter));
    images.forEach((image) => {
      image.classList.toggle("is-shown", Number(image.dataset.chapter) === chapter && Number(image.dataset.frame) === n);
    });
    const shown = chapters[chapter].frames[n];
    caption.innerHTML = `<span>${shown.number}</span> ${shown.caption}`;
  };
  window.addEventListener("scroll", () => {
    if (!frame) frame = requestAnimationFrame(render);
  }, { passive: true });
  render();
};

/* Tabs -------------------------------------------------------------------- */

const mountShapeTabs = (root: HTMLElement, chapters: ShapeOptionChapter[]) => {
  const view = document.createElement("div");
  view.className = "shape-option shape-tabs";
  view.innerHTML = `
    <div class="shape-tabs__tabs" role="tablist" aria-label="What I shape">
      ${chapters.map((chapter, index) => `
        <button class="shape-tabs__tab" type="button" role="tab" aria-selected="${!index}">
          <span class="shape-tabs__number">${chapter.number}</span>
          <span class="shape-tabs__kind">${chapter.kind}</span>
          <span class="shape-tabs__bar" aria-hidden="true"><span></span></span>
        </button>`).join("")}
    </div>
    <div class="shape-tabs__panels">
      ${chapters.map((chapter, index) => `
        <div class="shape-tabs__panel${index ? "" : " is-shown"}" role="tabpanel">
          <div class="shape-tabs__text">
            <p class="shape-tabs__line">${chapter.line}</p>
            <p class="shape-tabs__about">${chapter.about}</p>
            <ul class="shape-tabs__makes">${shapeMakes(chapter).map((item) => `<li>${item}</li>`).join("")}</ul>
            <a class="shape-tabs__link" href="${chapter.link.href}">${chapter.link.label} <span aria-hidden="true">↗</span></a>
          </div>
          <div class="shape-tabs__frames">
            ${chapter.frames.slice(0, 3).map((frame) => `
              <figure class="shape-tabs__frame">
                <span class="shape-tabs__media"><img src="${frame.src}" alt="${frame.alt}" loading="lazy" decoding="async" /></span>
                <figcaption><span>${frame.number}</span> ${frame.caption}</figcaption>
              </figure>`).join("")}
          </div>
        </div>`).join("")}
    </div>`;
  root.append(view);

  const tabs = [...view.querySelectorAll<HTMLButtonElement>(".shape-tabs__tab")];
  const panels = [...view.querySelectorAll<HTMLElement>(".shape-tabs__panel")];
  const select = (chosen: number) => {
    tabs.forEach((tab, index) => tab.setAttribute("aria-selected", String(index === chosen)));
    panels.forEach((panel, index) => panel.classList.toggle("is-shown", index === chosen));
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(index));
    // The bar filling is the clock: when it ends, the next chapter comes up.
    tab.querySelector(".shape-tabs__bar span")?.addEventListener("animationend", () => select((index + 1) % tabs.length));
  });
  new IntersectionObserver(([entry]) => {
    view.classList.toggle("is-away", !entry.isIntersecting);
  }, { threshold: 0.3 }).observe(view);
};

/* Margins ----------------------------------------------------------------- */

const mountShapeMargins = (root: HTMLElement, chapters: ShapeOptionChapter[]) => {
  const view = document.createElement("div");
  view.className = "shape-option shape-margins";
  const note = (chapter: ShapeOptionChapter, n: number) =>
    `<a class="shape-margins__mark" href="${chapter.link.href}" data-note="${chapter.frames[n].number}">${chapter.frames[n].number}</a>`;
  view.innerHTML = chapters.map((chapter) => `
    <section class="shape-margins__chapter">
      <p class="shape-margins__label">(${chapter.number})<br />${chapter.kind}</p>
      <p class="shape-margins__text">${chapter.line.replace(/\.$/, "")}${note(chapter, 0)} — ${chapter.about.charAt(0).toLowerCase() + chapter.about.slice(1).replace(/\.$/, "")}${note(chapter, 1)}. <span class="shape-margins__makes">${shapeMakes(chapter).slice(0, 4).join(", ").toLowerCase()}.</span></p>
      <aside class="shape-margins__notes">
        ${chapter.frames.slice(0, 2).map((frame) => `
          <a class="shape-margins__note" href="${chapter.link.href}" data-note="${frame.number}">
            <span class="shape-margins__media"><img src="${frame.src}" alt="${frame.alt}" loading="lazy" decoding="async" /></span>
            <span class="shape-margins__caption"><span>${frame.number}</span> ${frame.caption}</span>
          </a>`).join("")}
        <a class="shape-margins__link" href="${chapter.link.href}">${chapter.link.label} <span aria-hidden="true">↗</span></a>
      </aside>
    </section>`).join("");
  root.append(view);

  // A footnote number and its frame light up together.
  view.querySelectorAll<HTMLElement>("[data-note]").forEach((item) => {
    const pair = view.querySelectorAll<HTMLElement>(`[data-note="${item.dataset.note}"]`);
    item.addEventListener("pointerenter", () => {
      view.classList.add("is-noting");
      pair.forEach((other) => other.classList.add("is-lit"));
    });
    item.addEventListener("pointerleave", () => {
      view.classList.remove("is-noting");
      pair.forEach((other) => other.classList.remove("is-lit"));
    });
  });
  // Each chapter rises in as it arrives.
  const arrive = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      arrive.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -12% 0px" });
  view.querySelectorAll(".shape-margins__chapter").forEach((chapter) => arrive.observe(chapter));
};

/* Choosing ---------------------------------------------------------------- */

if (shapeOptionRoot) {
  shapeOptionRoot.dataset.option = shapeOption;
  if (shapeOption !== "none") ({
    index: mountShapeIndex,
    capabilities: mountShapeCapabilities,
    stack: mountShapeStack,
    focus: mountShapeFocus,
    tabs: mountShapeTabs,
    margins: mountShapeMargins,
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
