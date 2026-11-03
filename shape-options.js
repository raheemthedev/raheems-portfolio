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
//   ticker    — each row is a slow band of the chapter's name and frames,
//               alternate rows running opposite ways; hovering slows one and
//               page scroll hurries them along.
//   capabilities — after Rejouice's services page: a plain statement, then
//               "(01) Identity" beside a stacked list of what it makes, with
//               one frame and the link at the side.
//   columns   — after Dennis Snellenberg's "I can help you with": three
//               numbered columns on a hairline, each a frame, a name, what it
//               covers and what it makes.
//   chapters  — after Koto's services page: a two-tone headline and a
//               "Jump to" bar, then each chapter as a bold-and-light sentence,
//               one wide image and a ruled list of what it makes.
// Two more ask what happens without the section:
//   grid      — after Koto's homepage grid: the section gives way to a body
//               of work, frames from across both case studies with a filter
//               by project.
//   none      — the section removed: Row, then About, then the footer.
const shapeOptions = [
    "index",
    "accordion",
    "ticker",
    "capabilities",
    "columns",
    "chapters",
    "grid",
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
/* Ticker ------------------------------------------------------------------ */
const mountShapeTicker = (root, chapters) => {
    const ticker = document.createElement("div");
    ticker.className = "shape-option shape-ticker";
    const run = (chapter) => chapter.frames.map((frame) => `
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
    const rows = [...ticker.querySelectorAll(".shape-ticker__row")];
    const tracks = rows.map((row) => row.querySelector(".shape-ticker__track"));
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
    const tick = (now) => {
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
/* What each chapter makes ------------------------------------------------- */
// Draft deliverables for the list-led options, taken from each chapter's
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
/* Columns ----------------------------------------------------------------- */
const mountShapeColumns = (root, chapters) => {
    const columns = document.createElement("div");
    columns.className = "shape-option shape-columns";
    columns.innerHTML = `
    <h3 class="shape-columns__title">I can help you shape …</h3>
    <div class="shape-columns__grid">
      ${chapters.map((chapter) => `
        <a class="shape-columns__column" href="${chapter.link.href}">
          <span class="shape-columns__number">${chapter.number}</span>
          <span class="shape-columns__media" aria-hidden="true">${chapter.frames.map((frame, n) => `<img src="${frame.src}" alt=""${n ? "" : ' class="is-shown"'} loading="lazy" decoding="async" />`).join("")}</span>
          <span class="shape-columns__kind">${chapter.kind}</span>
          <span class="shape-columns__about">${chapter.about}</span>
          <span class="shape-columns__makes">${shapeMakes(chapter).join(" · ")}</span>
          <span class="shape-columns__link">${chapter.link.label} <span aria-hidden="true">↗</span></span>
        </a>`).join("")}
    </div>`;
    root.append(columns);
    // A hovered column steps through its frames.
    columns.querySelectorAll(".shape-columns__column").forEach((column) => {
        const images = [...column.querySelectorAll("img")];
        let shown = 0;
        let timer = 0;
        column.addEventListener("pointerenter", () => {
            window.clearInterval(timer);
            if (shapeOptionStill)
                return;
            timer = window.setInterval(() => {
                shown = (shown + 1) % images.length;
                images.forEach((image, n) => image.classList.toggle("is-shown", n === shown));
            }, 900);
        });
        column.addEventListener("pointerleave", () => window.clearInterval(timer));
    });
};
/* Chapters ---------------------------------------------------------------- */
const mountShapeChapters = (root, chapters) => {
    const view = document.createElement("div");
    view.className = "shape-option shape-chapters";
    view.innerHTML = `
    <p class="shape-chapters__headline"><strong>What I shape.</strong> ${chapters.map((chapter) => `${chapter.kind}.`).join(" ")} Three ways into one idea.</p>
    <nav class="shape-chapters__jump" aria-label="Jump to a chapter"><span>Jump to</span>${chapters.map((chapter, index) => `<a href="#shape-chapter-${index}">${chapter.kind}</a>`).join("")}</nav>
    ${chapters.map((chapter, index) => `
      <section class="shape-chapters__chapter" id="shape-chapter-${index}">
        <p class="shape-chapters__lede"><strong>${chapter.kind}.</strong> ${chapter.about}</p>
        <a class="shape-chapters__wide" href="${chapter.link.href}" aria-label="${chapter.link.label}">
          <img src="${chapter.frames[0].src}" alt="${chapter.frames[0].alt}" loading="lazy" decoding="async" />
          <span class="shape-chapters__caption"><span>${chapter.frames[0].number}</span> ${chapter.frames[0].caption}</span>
        </a>
        <ul class="shape-chapters__makes">${shapeMakes(chapter).map((item) => `<li>${item}</li>`).join("")}</ul>
        <a class="shape-chapters__link" href="${chapter.link.href}">${chapter.link.label} <span aria-hidden="true">↗</span></a>
      </section>`).join("")}`;
    root.append(view);
    // The wide images drift a little against the scroll.
    const wides = [...view.querySelectorAll(".shape-chapters__wide img")];
    let frame = 0;
    const render = () => {
        frame = 0;
        wides.forEach((image) => {
            const box = image.parentElement?.getBoundingClientRect();
            if (!box || box.bottom < 0 || box.top > window.innerHeight)
                return;
            const travel = (box.top + box.height / 2 - window.innerHeight / 2) / window.innerHeight;
            image.style.transform = `translate3d(0, ${(travel * -8).toFixed(2)}%, 0) scale(1.18)`;
        });
    };
    if (!shapeOptionStill) {
        window.addEventListener("scroll", () => {
            if (!frame)
                frame = requestAnimationFrame(render);
        }, { passive: true });
        render();
    }
};
/* Grid (replaces the section) --------------------------------------------- */
// A body of work in place of What I shape: frames from across both case
// studies rather than only their covers, with a filter by project.
const shapeGridFrames = [
    ["01", "flip/LCover"], ["02", "electronic-botanica/l4-cover"], ["01", "flip/L3"], ["01", "flip/P7-1"],
    ["02", "electronic-botanica/l5"], ["01", "flip/L1"], ["01", "flip/L5"], ["02", "electronic-botanica/l6"],
    ["01", "flip/L4"], ["01", "flip/P9-1"], ["02", "electronic-botanica/p7-1"], ["01", "flip/L7"],
    ["01", "flip/L10"], ["02", "electronic-botanica/l8"], ["01", "flip/L2"], ["01", "flip/P13-2"],
    ["02", "electronic-botanica/p9-1"], ["01", "flip/L11"], ["01", "flip/L6"], ["02", "electronic-botanica/l11"],
    ["01", "flip/L12"], ["02", "electronic-botanica/p10-1"], ["01", "flip/L15"],
].map(([project, path]) => ({ project, src: `assets/projects/${path}.webp` }));
const mountShapeGrid = (root) => {
    const projects = archiveProjects.filter((project) => project.image);
    const name = (number) => projects.find((project) => project.number === number)?.title ?? "";
    const href = (number) => projects.find((project) => project.number === number)?.href ?? `case-study.html?project=${number}`;
    const grid = document.createElement("div");
    grid.className = "shape-option shape-grid";
    grid.innerHTML = `
    <header class="shape__head shape-grid__head">
      <p>/ Selected frames</p>
      <p class="shape__intro">${shapeGridFrames.length} frames from ${projects.length} projects</p>
      <a href="work.html">See all work ↗</a>
    </header>
    <div class="shape-grid__filters" role="group" aria-label="Filter by project">
      <button type="button" data-filter="all" aria-pressed="true">All <span>${shapeGridFrames.length}</span></button>
      ${projects.map((project) => `<button type="button" data-filter="${project.number}" aria-pressed="false">${project.title} <span>${shapeGridFrames.filter((frame) => frame.project === project.number).length}</span></button>`).join("")}
    </div>
    <div class="shape-grid__tiles">
      ${shapeGridFrames.map((frame) => `
        <a class="shape-grid__tile" href="${href(frame.project)}" data-project="${frame.project}">
          <img src="${frame.src}" alt="${name(frame.project)}" loading="lazy" decoding="async" />
          <span class="shape-grid__tag">${name(frame.project)} <span aria-hidden="true">↗</span></span>
        </a>`).join("")}
    </div>`;
    root.append(grid);
    const tiles = [...grid.querySelectorAll(".shape-grid__tile")];
    const buttons = [...grid.querySelectorAll(".shape-grid__filters button")];
    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const filter = button.dataset.filter ?? "all";
            buttons.forEach((other) => other.setAttribute("aria-pressed", String(other === button)));
            grid.classList.toggle("is-filtered", filter !== "all");
            tiles.forEach((tile) => {
                tile.hidden = filter !== "all" && tile.dataset.project !== filter;
            });
        });
    });
    // Tiles rise in as they arrive.
    const arrive = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting)
                return;
            entry.target.classList.add("is-in");
            arrive.unobserve(entry.target);
        });
    }, { rootMargin: "0px 0px -8% 0px" });
    tiles.forEach((tile) => arrive.observe(tile));
};
/* Choosing ---------------------------------------------------------------- */
if (shapeOptionRoot) {
    shapeOptionRoot.dataset.option = shapeOption;
    if (shapeOption === "grid")
        mountShapeGrid(shapeOptionRoot);
    else if (shapeOption !== "none")
        ({
            index: mountShapeIndex,
            accordion: mountShapeAccordion,
            ticker: mountShapeTicker,
            capabilities: mountShapeCapabilities,
            columns: mountShapeColumns,
            chapters: mountShapeChapters,
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
