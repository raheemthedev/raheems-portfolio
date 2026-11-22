// "What I shape", being chosen from the options below with ?shape=<option>
// (List is the default). The list in the page is the data for all of them:
// each item is something I make, its chapter, its link and its frame.
//   list      — after a studio's "What we do": a short statement beside one
//               long list set large and grey. The item nearest the middle of
//               the screen turns ink as the page scrolls, pointing at one
//               takes over, and its frame shows at the foot of the left column.
//   paragraph — everything in one block of running type, chapter numbers set
//               in among the words; pointing at a word brings its frame along
//               with the cursor and quiets the rest.
//   backdrop  — three columns, one per chapter; pointing at an item fills the
//               whole section with its frame behind the type, which turns
//               light over it.
//   brief     — "What are you making?": the items as choices a visitor can
//               pick; the picks build a sentence and a brief to email.
//   wheel     — the list on a turning drum: scrolling rolls it, the item at
//               the front is ink, with its chapter on the left and its frame,
//               large, on the right.
//   column    — after a portfolio's experience list: the three chapters set
//               small in grey at the left, a narrow column of their frames
//               at the right. The page's scroll runs the column up; the
//               chapter whose frame is in the middle turns ink with its
//               project beside it, and choosing a chapter glides to it.

type ShapeOption = "list" | "paragraph" | "backdrop" | "brief" | "wheel" | "column";

interface ShapeItem {
  name: string;
  href: string;
  chapter: string;
  src: string;
  number: string;
  caption: string;
}

const shapeOptions: ShapeOption[] = ["list", "paragraph", "backdrop", "brief", "wheel", "column"];
const shapeOptionAsked = new URLSearchParams(window.location.search).get("shape");
const shapeOption = shapeOptions.find((option) => option === shapeOptionAsked) ?? "list";
const shapeChapterNames: Record<string, string> = { "01": "Identity", "02": "Digital & motion", "03": "Campaigns" };
const shapeStill = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const shapeHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const shapeEmail = "animashaunraheem05@gmail.com";

const shapeRoot = document.querySelector<HTMLElement>("[data-shape]");
const shapeList = document.querySelector<HTMLElement>(".shape-list");

const shapeItems = (list: HTMLElement): ShapeItem[] => {
  const images = [...list.querySelectorAll<HTMLImageElement>(".shape-list__window img")];
  return [...list.querySelectorAll<HTMLElement>(".shape-list__items li")].map((item, n) => {
    const link = item.querySelector("a");
    return {
      name: link?.textContent?.trim() ?? "",
      href: link?.getAttribute("href") ?? "work.html",
      chapter: item.dataset.chapter ?? "01",
      src: images[n]?.getAttribute("src") ?? "",
      number: images[n]?.dataset.number ?? "",
      caption: images[n]?.dataset.caption ?? "",
    };
  });
};

const shapeChapters = (items: ShapeItem[]) =>
  Object.keys(shapeChapterNames).map((chapter) => ({
    number: chapter,
    name: shapeChapterNames[chapter],
    items: items.filter((item) => item.chapter === chapter),
  }));

const shapeCaption = (item: ShapeItem) => `<span>${item.number}</span> ${item.caption}`;

// Runs fn on the next frame after each scroll, once per frame.
const onShapeScroll = (fn: () => void) => {
  let frame = 0;
  window.addEventListener("scroll", () => {
    if (!frame) frame = requestAnimationFrame(() => {
      frame = 0;
      fn();
    });
  }, { passive: true });
  fn();
};

/* List -------------------------------------------------------------------- */

const mountShapeList = (list: HTMLElement) => {
  const items = [...list.querySelectorAll<HTMLElement>(".shape-list__items li")];
  const images = [...list.querySelectorAll<HTMLImageElement>(".shape-list__window img")];
  const caption = list.querySelector<HTMLElement>(".shape-list__caption");
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
  list.querySelector(".shape-list__items")?.addEventListener("pointerleave", () => {
    pointing = false;
  });

  // Otherwise the focus walks down the list with the page: whichever item is
  // nearest the middle of the screen.
  onShapeScroll(() => {
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
  });
};

/* Paragraph --------------------------------------------------------------- */

const mountShapeParagraph = (root: HTMLElement, items: ShapeItem[]) => {
  const view = document.createElement("div");
  view.className = "shape-option shape-paragraph";
  view.innerHTML = `
    <p class="shape-option__label">/ What I shape</p>
    <p class="shape-paragraph__text">${shapeChapters(items).map((chapter) => `
      <span class="shape-paragraph__chapter">(${chapter.number})</span> ${chapter.items.map((item) => `<a class="shape-paragraph__item" href="${item.href}" data-n="${items.indexOf(item)}">${item.name}</a>`).join('<span class="shape-paragraph__slash"> / </span>')}`).join(" ")}
    </p>
    <div class="shape-paragraph__card" aria-hidden="true">
      <span class="shape-paragraph__window">${items.map((item) => `<img src="${item.src}" alt="" loading="lazy" decoding="async" />`).join("")}</span>
      <p class="shape-paragraph__caption"></p>
    </div>`;
  root.append(view);
  if (!shapeHover) return;

  const card = view.querySelector<HTMLElement>(".shape-paragraph__card") as HTMLElement;
  const caption = view.querySelector<HTMLElement>(".shape-paragraph__caption") as HTMLElement;
  const images = [...view.querySelectorAll<HTMLImageElement>(".shape-paragraph__window img")];
  const target = { x: 0, y: 0 };
  const at = { x: 0, y: 0 };
  let over = false;
  let frame = 0;
  // The card follows the cursor a little behind it.
  const follow = () => {
    at.x += (target.x - at.x) * 0.14;
    at.y += (target.y - at.y) * 0.14;
    card.style.transform = `translate3d(${at.x}px, ${at.y}px, 0) translate(-50%, -110%)`;
    frame = over || Math.abs(target.x - at.x) > 0.5 ? requestAnimationFrame(follow) : 0;
  };
  view.querySelectorAll<HTMLElement>(".shape-paragraph__item").forEach((word) => {
    const n = Number(word.dataset.n);
    word.addEventListener("pointerenter", (event) => {
      const box = view.getBoundingClientRect();
      target.x = event.clientX - box.left;
      target.y = event.clientY - box.top;
      if (!over) {
        at.x = target.x;
        at.y = target.y;
      }
      over = true;
      view.classList.add("is-pointing");
      word.classList.add("is-active");
      images.forEach((image, m) => image.classList.toggle("is-shown", m === n));
      caption.innerHTML = shapeCaption(items[n]);
      card.classList.add("is-shown");
      if (!frame) frame = requestAnimationFrame(follow);
    });
    word.addEventListener("pointerleave", () => {
      over = false;
      word.classList.remove("is-active");
      view.classList.remove("is-pointing");
      card.classList.remove("is-shown");
    });
  });
  view.addEventListener("pointermove", (event) => {
    const box = view.getBoundingClientRect();
    target.x = event.clientX - box.left;
    target.y = event.clientY - box.top;
  });
};

/* Backdrop ---------------------------------------------------------------- */

const mountShapeBackdrop = (root: HTMLElement, items: ShapeItem[]) => {
  const view = document.createElement("div");
  view.className = "shape-option shape-backdrop";
  view.innerHTML = `
    <div class="shape-backdrop__images" aria-hidden="true">${items.map((item) => `<img src="${item.src}" alt="" loading="lazy" decoding="async" />`).join("")}</div>
    <p class="shape-option__label">/ What I shape</p>
    <div class="shape-backdrop__columns">
      ${shapeChapters(items).map((chapter) => `
        <div class="shape-backdrop__column">
          <p class="shape-backdrop__chapter"><span>${chapter.number}</span> ${chapter.name}</p>
          <ul>${chapter.items.map((item) => `<li><a href="${item.href}" data-n="${items.indexOf(item)}">${item.name}</a></li>`).join("")}</ul>
        </div>`).join("")}
    </div>
    <p class="shape-backdrop__caption" aria-hidden="true"></p>`;
  root.append(view);

  const images = [...view.querySelectorAll<HTMLImageElement>(".shape-backdrop__images img")];
  const caption = view.querySelector<HTMLElement>(".shape-backdrop__caption") as HTMLElement;
  view.querySelectorAll<HTMLElement>(".shape-backdrop__column a").forEach((link) => {
    const n = Number(link.dataset.n);
    link.addEventListener("pointerenter", () => {
      view.classList.add("is-lit");
      link.classList.add("is-active");
      images.forEach((image, m) => image.classList.toggle("is-shown", m === n));
      caption.innerHTML = shapeCaption(items[n]);
    });
    link.addEventListener("pointerleave", () => {
      view.classList.remove("is-lit");
      link.classList.remove("is-active");
    });
  });
};

/* Brief ------------------------------------------------------------------- */

const mountShapeBrief = (root: HTMLElement, items: ShapeItem[]) => {
  const view = document.createElement("div");
  view.className = "shape-option shape-brief";
  view.innerHTML = `
    <div class="shape-brief__intro">
      <p class="shape-option__label">/ What I shape</p>
      <h3 class="shape-brief__title">What are you making?</h3>
      <p class="shape-brief__lede">Pick what you need, as much or as little as you like. I’ll take it from there.</p>
    </div>
    <div class="shape-brief__groups">
      ${shapeChapters(items).map((chapter) => `
        <div class="shape-brief__group">
          <p class="shape-brief__chapter"><span>${chapter.number}</span> ${chapter.name}</p>
          <div class="shape-brief__choices">${chapter.items.map((item) => `<button type="button" aria-pressed="false" data-n="${items.indexOf(item)}">${item.name}</button>`).join("")}</div>
        </div>`).join("")}
    </div>
    <div class="shape-brief__summary" aria-live="polite">
      <div class="shape-brief__frames" aria-hidden="true"></div>
      <p class="shape-brief__sentence">Nothing picked yet.</p>
      <a class="shape-brief__send" href="mailto:${shapeEmail}">Send this brief <span aria-hidden="true">↗</span></a>
    </div>`;
  root.append(view);

  const buttons = [...view.querySelectorAll<HTMLButtonElement>(".shape-brief__choices button")];
  const sentence = view.querySelector<HTMLElement>(".shape-brief__sentence") as HTMLElement;
  const frames = view.querySelector<HTMLElement>(".shape-brief__frames") as HTMLElement;
  const send = view.querySelector<HTMLAnchorElement>(".shape-brief__send") as HTMLAnchorElement;
  const joined = (names: string[]) =>
    names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

  const update = () => {
    const picked = buttons.filter((button) => button.getAttribute("aria-pressed") === "true").map((button) => items[Number(button.dataset.n)]);
    const names = picked.map((item) => item.name.toLowerCase());
    sentence.textContent = picked.length ? `I’d like help with ${joined(names)}.` : "Nothing picked yet.";
    view.classList.toggle("has-picks", picked.length > 0);
    // The picks' frames gather in a small fanned stack.
    frames.innerHTML = picked.slice(-5).map((item, n, shown) => `<img src="${item.src}" alt="" style="--n: ${n - (shown.length - 1) / 2}" />`).join("");
    const body = picked.length ? `Hi Raheem,\n\nI’d like help with ${joined(names)}.\n\nA little about the project:\n` : "Hi Raheem,\n\n";
    send.href = `mailto:${shapeEmail}?subject=${encodeURIComponent("A new project")}&body=${encodeURIComponent(body)}`;
  };
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      button.setAttribute("aria-pressed", String(button.getAttribute("aria-pressed") !== "true"));
      update();
    });
  });
  update();
};

/* Wheel ------------------------------------------------------------------- */

const mountShapeWheel = (root: HTMLElement, items: ShapeItem[]) => {
  const view = document.createElement("div");
  view.className = "shape-option shape-wheel";
  view.style.setProperty("--count", String(items.length));
  view.innerHTML = `
    <div class="shape-wheel__stage">
      <div class="shape-wheel__side">
        <p class="shape-option__label">/ What I shape</p>
        <p class="shape-wheel__chapter"><span>${items[0].chapter}</span> <span class="shape-wheel__name">${shapeChapterNames[items[0].chapter]}</span></p>
      </div>
      <ul class="shape-wheel__drum">
        ${items.map((item, n) => `<li><a href="${item.href}" data-n="${n}">${item.name}</a></li>`).join("")}
      </ul>
      <figure class="shape-wheel__figure" aria-hidden="true">
        <span class="shape-wheel__window">${items.map((item, n) => `<img src="${item.src}" alt=""${n ? "" : ' class="is-shown"'} loading="lazy" decoding="async" />`).join("")}</span>
      </figure>
    </div>`;
  root.append(view);

  const rows = [...view.querySelectorAll<HTMLElement>(".shape-wheel__drum li")];
  const images = [...view.querySelectorAll<HTMLImageElement>(".shape-wheel__window img")];
  const chapterNumber = view.querySelector<HTMLElement>(".shape-wheel__chapter span") as HTMLElement;
  const chapterName = view.querySelector<HTMLElement>(".shape-wheel__name") as HTMLElement;
  const step = 17; // degrees between items on the drum
  let target = 0;
  let turn = 0;
  let front = -1;
  let frame = 0;

  const draw = () => {
    turn += (target - turn) * (shapeStill ? 1 : 0.09);
    rows.forEach((row, n) => {
      const angle = (n - turn) * step;
      const hidden = Math.abs(angle) > 85;
      row.style.visibility = hidden ? "hidden" : "visible";
      if (hidden) return;
      row.style.transform = `rotateX(${(-angle).toFixed(2)}deg) translateZ(var(--radius))`;
      row.style.opacity = Math.max(0.08, 1 - Math.abs(angle) / 80).toFixed(3);
    });
    const nearest = Math.round(turn);
    if (nearest !== front) {
      front = nearest;
      rows.forEach((row, n) => row.classList.toggle("is-front", n === nearest));
      images.forEach((image, n) => image.classList.toggle("is-shown", n === nearest));
      chapterNumber.textContent = items[nearest].chapter;
      chapterName.textContent = shapeChapterNames[items[nearest].chapter];
    }
    frame = Math.abs(target - turn) > 0.001 ? requestAnimationFrame(draw) : 0;
  };
  // The page's scroll through the section turns the drum.
  onShapeScroll(() => {
    const box = view.getBoundingClientRect();
    const travel = Math.max(1, box.height - window.innerHeight);
    target = Math.min(1, Math.max(0, -box.top / travel)) * (items.length - 1);
    if (!frame) frame = requestAnimationFrame(draw);
  });
};

/* Column ------------------------------------------------------------------ */

const mountShapeColumn = (root: HTMLElement, items: ShapeItem[]) => {
  // Each frame once, in chapter order.
  const frames = items.filter((item, n) => items.findIndex((other) => other.src === item.src && other.chapter === item.chapter) === n);
  const chapters = shapeChapters(items);
  const project = (chapter: string) => frames.find((frame) => frame.chapter === chapter)?.caption.split(" — ")[0] ?? "";
  const view = document.createElement("div");
  view.className = "shape-option shape-column";
  view.style.setProperty("--count", String(frames.length));
  view.innerHTML = `
    <div class="shape-column__stage">
      <p class="shape-option__label">/ What I shape</p>
      <ul class="shape-column__chapters">
        ${chapters.map((chapter, n) => `
          <li${n ? "" : ' class="is-active"'}>
            <a href="${chapter.items[0].href}" data-chapter="${chapter.number}">${chapter.name}</a>
            <span class="shape-column__tag">${project(chapter.number)}</span>
          </li>`).join("")}
      </ul>
      <div class="shape-column__rail" aria-hidden="true">
        <div class="shape-column__track">
          ${frames.map((frame) => `<span class="shape-column__frame" data-chapter="${frame.chapter}"><img src="${frame.src}" alt="" loading="lazy" decoding="async" /></span>`).join("")}
        </div>
      </div>
    </div>`;
  root.append(view);

  const rail = view.querySelector<HTMLElement>(".shape-column__rail") as HTMLElement;
  const track = view.querySelector<HTMLElement>(".shape-column__track") as HTMLElement;
  const tiles = [...view.querySelectorAll<HTMLElement>(".shape-column__frame")];
  const rows = [...view.querySelectorAll<HTMLElement>(".shape-column__chapters li")];
  let target = 0;
  let at = 0;
  let frame = 0;
  let current = "";

  const travel = () => Math.max(0, track.offsetHeight - rail.offsetHeight);
  const draw = () => {
    at += (target - at) * (shapeStill ? 1 : 0.1);
    track.style.transform = `translate3d(0, ${(-at * travel()).toFixed(1)}px, 0)`;
    // The chapter whose frame sits across the middle of the rail leads.
    const middle = rail.getBoundingClientRect().top + rail.offsetHeight / 2;
    let chapter = tiles[0].dataset.chapter ?? "01";
    tiles.forEach((tile) => {
      if (tile.getBoundingClientRect().top < middle) chapter = tile.dataset.chapter ?? chapter;
    });
    if (chapter !== current) {
      current = chapter;
      rows.forEach((row) => row.classList.toggle("is-active", row.querySelector("a")?.dataset.chapter === chapter));
    }
    frame = Math.abs(target - at) > 0.0005 ? requestAnimationFrame(draw) : 0;
  };
  // The page's scroll through the section runs the column.
  const progress = () => {
    const box = view.getBoundingClientRect();
    return Math.min(1, Math.max(0, -box.top / Math.max(1, box.height - window.innerHeight)));
  };
  onShapeScroll(() => {
    target = progress();
    if (!frame) frame = requestAnimationFrame(draw);
  });

  // Pointing at a chapter glides the page to its first frame.
  rows.forEach((row) => {
    const link = row.querySelector<HTMLElement>("a");
    link?.addEventListener("pointerenter", () => {
      if (!shapeHover) return;
      const first = tiles.findIndex((tile) => tile.dataset.chapter === link.dataset.chapter);
      const share = Math.min(1, (tiles[first].offsetTop) / Math.max(1, travel()));
      const box = view.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + box.top + share * (box.height - window.innerHeight) + 2, behavior: "smooth" });
    });
  });
};

/* Choosing ---------------------------------------------------------------- */

if (shapeRoot && shapeList) {
  shapeRoot.dataset.option = shapeOption;
  if (shapeOption === "list") mountShapeList(shapeList);
  else ({
    paragraph: mountShapeParagraph,
    backdrop: mountShapeBackdrop,
    brief: mountShapeBrief,
    wheel: mountShapeWheel,
    column: mountShapeColumn,
  })[shapeOption](shapeRoot, shapeItems(shapeList));

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
  }).observe(shapeRoot);
}
