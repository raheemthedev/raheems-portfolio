"use strict";
// "What I shape", being chosen from the options below with ?shape=<option>
// (Index is the default; the reel in shape.ts is no longer loaded). Each is
// built from the section's own chapter markup, and all start from a ruled
// index of the chapters.
//   index     — after Collins' programme list and Dennis Snellenberg's "I can
//               help you with": three ruled rows; hovering one brings out a
//               card that trails the cursor through that chapter's frames.
//   accordion — after Rejouice and Koto's services: the rows open one at a
//               time into a panel with the chapter's sentence, link and frames.
//   capabilities — after Rejouice's services page: a plain statement, then
//               "(01) Identity" beside a stacked list of what it makes, with
//               one frame and the link at the side.
// One more asks what happens without the section:
//   none      — the section removed: Row, then About, then the footer.
const shapeOptions = [
    "index",
    "accordion",
    "capabilities",
    "none",
];
const shapeOptionRoot = document.querySelector("[data-shape]");
const shapeOptionAsked = new URLSearchParams(window.location.search).get("shape");
const shapeOption = shapeOptions.find((option) => option === shapeOptionAsked) ?? "index";
const shapeOptionChapters = (root) => [...root.querySelectorAll(".shape-chapter")].map((chapter) => {
    const text = (selector) => chapter.querySelector(selector)?.textContent?.trim() ?? "";
    const link = chapter.querySelector(".shape-chapter__link");
    return {
        number: text(".shape-chapter__number"),
        kind: text(".shape-chapter__kind"),
        about: text(".shape-chapter__about"),
        tags: [...chapter.querySelectorAll(".shape-chapter__tags li")].map((item) => item.textContent?.trim() ?? ""),
        link: { href: link?.getAttribute("href") ?? "work.html", label: (link?.textContent ?? "").replace("↗", "").trim() },
        line: text(".shape-chapter__line").replace(/\s+/g, " "),
        frames: [...chapter.querySelectorAll(".shape-frame")].map((figure) => {
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
const mountShapeIndex = (root, chapters) => {
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
    if (!shapeOptionHover)
        return;
    const card = list.querySelector(".shape-index__card");
    const caption = list.querySelector(".shape-index__caption");
    const images = [...list.querySelectorAll(".shape-index__window img")];
    let active = -1;
    let shown = 0;
    let timer = 0;
    let frame = 0;
    const target = { x: 0, y: 0 };
    const at = { x: 0, y: 0 };
    const show = (chapter, n) => {
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
    list.querySelectorAll(".shape-index__row").forEach((row) => {
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
            if (!shapeOptionStill)
                timer = window.setInterval(() => show(index, (shown + 1) % chapters[index].frames.length), 900);
            if (!frame)
                frame = requestAnimationFrame(follow);
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
const mountShapeAccordion = (root, chapters) => {
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
    const items = [...list.querySelectorAll(".shape-accordion__item")];
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
/* What each chapter makes ------------------------------------------------- */
// Draft deliverables for Capabilities, taken from each chapter's
// own description and frame captions. Edit freely.
const shapeDeliverables = {
    "01": ["Brand identity", "Naming", "Logos & marks", "Typography", "Colour", "Visual systems", "Art direction"],
    "02": ["Motion systems", "Generative design", "Exhibition identity", "Web & digital", "Screen design", "Type in motion"],
    "03": ["Launch campaigns", "Social", "Pitch decks", "Product notifications", "Stickers & merch", "Out of home"],
};
const shapeMakes = (chapter) => shapeDeliverables[chapter.number] ?? chapter.tags;
/* Capabilities ------------------------------------------------------------ */
const mountShapeCapabilities = (root, chapters) => {
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
    capabilities.querySelectorAll(".shape-capabilities__row").forEach((row) => {
        const images = [...row.querySelectorAll(".shape-capabilities__media img")];
        row.querySelectorAll(".shape-capabilities__list li").forEach((item, n) => {
            item.addEventListener("pointerenter", () => {
                images.forEach((image, m) => image.classList.toggle("is-shown", m === n % images.length));
            });
        });
    });
};
/* Choosing ---------------------------------------------------------------- */
if (shapeOptionRoot) {
    shapeOptionRoot.dataset.option = shapeOption;
    if (shapeOption !== "none")
        ({
            index: mountShapeIndex,
            accordion: mountShapeAccordion,
            capabilities: mountShapeCapabilities,
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
        const option = event.target.closest("button")?.dataset.option;
        if (!option)
            return;
        const url = new URL(window.location.href);
        url.searchParams.set("shape", option);
        url.hash = "what-i-shape";
        window.location.href = url.toString();
    });
    new IntersectionObserver(([entry]) => {
        picker.classList.toggle("is-shown", entry.isIntersecting);
    }).observe(shapeOptionRoot.parentElement ?? shapeOptionRoot);
}
