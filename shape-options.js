"use strict";
// Other ways to show "What I shape", compared with
// ?shape=<option> (see shapeOptions; the reel in shape.ts stays the
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
//   panels    — three tall panels side by side, each a chapter's frame; the
//               one under the cursor widens to tell its story and moves
//               through its frames.
//   invert    — the index rows, with ink washing in from whichever edge the
//               cursor crosses and the chapter's frames sliding in.
//   fill      — the names set huge, with the chapter's frames showing through
//               the letters of whichever is hovered or nearest the middle.
//   counter   — the section pins; a huge numeral rolls 01 → 03 like an
//               odometer as each chapter takes its turn beside it.
//   shapes    — mine: each chapter has its own shape (a circle for Identity,
//               like Flip's coin; a screen for Digital & motion; a poster for
//               Campaigns). The section pins and one window morphs between
//               them, with the chapter's frames inside.
//   venn      — mine: three overlapping circles, with each chapter's frames in
//               its own and the projects named where they overlap (and an
//               empty overlap asking "Yours?").
//   torch     — the spotlight pattern: the frames sit in the dark and a pool
//               of light trails the cursor (or wanders on touch), under the
//               chapter list.
//   mosaic    — the zoom-into-a-grid pattern: all the frames as one mosaic,
//               and the camera flies into each chapter's block in turn.
//   blueprint — mine: each chapter as a spec sheet, its frame drawn up with
//               construction guides and its real pixel size.
const shapeOptions = [
    "index",
    "accordion",
    "contents",
    "ticker",
    "panels",
    "invert",
    "fill",
    "counter",
    "shapes",
    "venn",
    "torch",
    "mosaic",
    "blueprint",
];
const shapeOptionRoot = document.querySelector("[data-shape]");
const shapeOptionAsked = new URLSearchParams(window.location.search).get("shape");
const shapeOption = shapeOptions.find((option) => option === shapeOptionAsked) ?? null;
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
/* Contents ---------------------------------------------------------------- */
const mountShapeContents = (root, chapters) => {
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
    const images = [...contents.querySelectorAll(".shape-contents__window img")];
    const entries = [...contents.querySelectorAll(".shape-contents__entry")];
    const caption = contents.querySelector(".shape-contents__caption");
    const show = (index) => {
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
/* Panels ------------------------------------------------------------------ */
const mountShapePanels = (root, chapters) => {
    const panels = document.createElement("div");
    panels.className = "shape-option shape-panels";
    panels.innerHTML = chapters.map((chapter, index) => `
    <a class="shape-panels__panel${index ? "" : " is-open"}" href="${chapter.link.href}">
      <span class="shape-panels__media" aria-hidden="true">${chapter.frames.map((frame, n) => `<img src="${frame.src}" alt=""${n ? "" : ' class="is-shown"'} loading="lazy" decoding="async" />`).join("")}</span>
      <span class="shape-panels__top"><span class="shape-panels__number">${chapter.number}</span><span class="shape-panels__kind">${chapter.kind}</span></span>
      <span class="shape-panels__body">
        <span class="shape-panels__line">${chapter.line}</span>
        <span class="shape-panels__tags">${chapter.tags.join(" · ")}</span>
        <span class="shape-panels__link">${chapter.link.label} <span aria-hidden="true">↗</span></span>
      </span>
    </a>`).join("");
    root.append(panels);
    const all = [...panels.querySelectorAll(".shape-panels__panel")];
    let open = 0;
    let shown = 0;
    let timer = 0;
    const cycle = () => {
        window.clearInterval(timer);
        if (shapeOptionStill)
            return;
        // The open panel moves through its frames while it stays open.
        timer = window.setInterval(() => {
            const images = [...all[open].querySelectorAll("img")];
            shown = (shown + 1) % images.length;
            images.forEach((image, n) => image.classList.toggle("is-shown", n === shown));
        }, 1800);
    };
    const openPanel = (index) => {
        if (index === open)
            return;
        open = index;
        shown = 0;
        all.forEach((panel, n) => {
            panel.classList.toggle("is-open", n === index);
            panel.querySelectorAll("img").forEach((image, m) => image.classList.toggle("is-shown", m === 0));
        });
        cycle();
    };
    all.forEach((panel, index) => {
        if (shapeOptionHover)
            panel.addEventListener("pointerenter", () => openPanel(index));
        // On touch the first tap opens a panel; the next follows its link.
        panel.addEventListener("click", (event) => {
            if (index === open)
                return;
            event.preventDefault();
            openPanel(index);
        });
    });
    cycle();
};
/* Invert ------------------------------------------------------------------ */
const mountShapeInvert = (root, chapters) => {
    const list = document.createElement("div");
    list.className = "shape-option shape-invert";
    list.innerHTML = chapters.map((chapter) => `
    <a class="shape-invert__row" href="${chapter.link.href}">
      <span class="shape-invert__fill" aria-hidden="true"></span>
      <span class="shape-invert__number">${chapter.number}</span>
      <span class="shape-invert__kind">${chapter.kind}</span>
      <span class="shape-invert__about">${chapter.about}<span class="shape-invert__tags">${chapter.tags.join(" · ")}</span></span>
      <span class="shape-invert__frames" aria-hidden="true">${chapter.frames.map((frame) => `<span class="shape-invert__frame"><img src="${frame.src}" alt="" loading="lazy" decoding="async" /></span>`).join("")}</span>
      <span class="shape-invert__arrow" aria-hidden="true">↗</span>
    </a>`).join("");
    root.append(list);
    // The ink comes in from whichever edge the cursor crossed, and leaves the
    // same way it goes.
    list.querySelectorAll(".shape-invert__row").forEach((row) => {
        const fill = row.querySelector(".shape-invert__fill");
        const edge = (event) => {
            const box = row.getBoundingClientRect();
            return event.clientY < box.top + box.height / 2 ? "-101%" : "101%";
        };
        row.addEventListener("pointerenter", (event) => {
            fill.style.transition = "none";
            fill.style.transform = `translateY(${edge(event)})`;
            void fill.offsetHeight;
            fill.style.transition = "";
            fill.style.transform = "translateY(0)";
            row.classList.add("is-inked");
        });
        row.addEventListener("pointerleave", (event) => {
            fill.style.transform = `translateY(${edge(event)})`;
            row.classList.remove("is-inked");
        });
    });
};
/* Fill -------------------------------------------------------------------- */
const mountShapeFill = (root, chapters) => {
    const fill = document.createElement("div");
    fill.className = "shape-option shape-fill";
    fill.innerHTML = chapters.map((chapter) => `
    <a class="shape-fill__row" href="${chapter.link.href}">
      <span class="shape-fill__number">${chapter.number}</span>
      <span class="shape-fill__word" style="--image: url('${chapter.frames[0].src}')">${chapter.kind}</span>
      <span class="shape-fill__side">
        <span class="shape-fill__about">${chapter.about}</span>
        <span class="shape-fill__tags">${chapter.tags.join(" · ")}</span>
        <span class="shape-fill__link">${chapter.link.label} <span aria-hidden="true">↗</span></span>
      </span>
    </a>`).join("");
    root.append(fill);
    const rows = [...fill.querySelectorAll(".shape-fill__row")];
    const words = rows.map((row) => row.querySelector(".shape-fill__word"));
    // Preload every frame so the letters never flash empty.
    chapters.forEach((chapter) => chapter.frames.forEach((frame) => { new Image().src = frame.src; }));
    let active = -1;
    let hovered = -1;
    let shown = 0;
    let timer = 0;
    const activate = (index) => {
        if (index === active)
            return;
        active = index;
        shown = 0;
        rows.forEach((row, n) => row.classList.toggle("is-filled", n === index));
        words[index].style.setProperty("--image", `url('${chapters[index].frames[0].src}')`);
        window.clearInterval(timer);
        if (shapeOptionStill)
            return;
        // The letters move through the chapter's frames while they're filled.
        timer = window.setInterval(() => {
            shown = (shown + 1) % chapters[index].frames.length;
            words[index].style.setProperty("--image", `url('${chapters[index].frames[shown].src}')`);
        }, 1500);
    };
    // The row nearest the middle of the screen fills, unless one is hovered.
    const nearest = () => {
        if (hovered >= 0)
            return;
        let best = 0;
        let distance = Infinity;
        rows.forEach((row, n) => {
            const box = row.getBoundingClientRect();
            const gap = Math.abs(box.top + box.height / 2 - window.innerHeight / 2);
            if (gap < distance) {
                distance = gap;
                best = n;
            }
        });
        activate(best);
    };
    rows.forEach((row, index) => {
        row.addEventListener("pointerenter", () => {
            hovered = index;
            activate(index);
        });
        row.addEventListener("pointerleave", () => {
            hovered = -1;
            nearest();
        });
        // Letters drift with the cursor, as if the image sits behind them.
        row.addEventListener("pointermove", (event) => {
            const box = words[index].getBoundingClientRect();
            words[index].style.setProperty("--x", `${(((event.clientX - box.left) / box.width) * 100).toFixed(1)}%`);
        });
    });
    window.addEventListener("scroll", nearest, { passive: true });
    nearest();
};
/* Counter ----------------------------------------------------------------- */
const mountShapeCounter = (root, chapters) => {
    const counter = document.createElement("div");
    counter.className = "shape-option shape-counter";
    counter.style.height = `${chapters.length * 110}vh`;
    counter.innerHTML = `
    <div class="shape-counter__pin">
      <div class="shape-counter__dial" aria-hidden="true">
        <span class="shape-counter__window"><span class="shape-counter__digits">${chapters.map((chapter) => `<span>${chapter.number}</span>`).join("")}</span></span>
        <span class="shape-counter__progress"><span></span></span>
        <span class="shape-counter__of">/ ${String(chapters.length).padStart(2, "0")}</span>
      </div>
      <div class="shape-counter__chapters">
        ${chapters.map((chapter, index) => `
          <div class="shape-counter__chapter${index ? "" : " is-active"}">
            <h3 class="shape-counter__kind">${chapter.kind}</h3>
            <p class="shape-counter__line">${chapter.line}</p>
            <p class="shape-counter__about">${chapter.about}</p>
            <div class="shape-counter__frames">${chapter.frames.map((frame) => `<figure><span><img src="${frame.src}" alt="${frame.alt}" loading="lazy" decoding="async" /></span><figcaption>${frame.number}</figcaption></figure>`).join("")}</div>
            <p class="shape-counter__tags">${chapter.tags.join(" · ")}</p>
            <a class="shape-counter__link" href="${chapter.link.href}">${chapter.link.label} <span aria-hidden="true">↗</span></a>
          </div>`).join("")}
      </div>
    </div>`;
    root.append(counter);
    const digits = counter.querySelector(".shape-counter__digits");
    const bar = counter.querySelector(".shape-counter__progress span");
    const blocks = [...counter.querySelectorAll(".shape-counter__chapter")];
    let current = 0;
    let frame = 0;
    const render = () => {
        frame = 0;
        const box = counter.getBoundingClientRect();
        const progress = Math.max(0, Math.min(0.9999, -box.top / Math.max(1, counter.offsetHeight - window.innerHeight)));
        bar.style.transform = `scaleX(${progress.toFixed(4)})`;
        const index = Math.floor(progress * chapters.length);
        if (index === current)
            return;
        current = index;
        // The numeral rolls to the next chapter like an odometer.
        digits.style.transform = `translateY(${(-index * 100) / chapters.length}%)`;
        blocks.forEach((block, n) => block.classList.toggle("is-active", n === index));
    };
    window.addEventListener("scroll", () => {
        if (!frame)
            frame = requestAnimationFrame(render);
    }, { passive: true });
    render();
};
/* Shapes ------------------------------------------------------------------ */
// Each chapter has a shape of its own: Identity a circle (Flip's coin),
// Digital & motion a screen, Campaigns a poster.
const shapeOptionForms = [
    { name: "Circle", clip: "inset(0% 0% 0% 0% round 50%)" },
    { name: "Screen", clip: "inset(19% 0% 19% 0% round 3%)" },
    { name: "Poster", clip: "inset(0% 17% 0% 17% round 1.5%)" },
];
const mountShapeShapes = (root, chapters) => {
    const shapes = document.createElement("div");
    shapes.className = "shape-option shape-shapes";
    shapes.style.height = `${chapters.length * 120}vh`;
    shapes.innerHTML = `
    <div class="shape-shapes__pin">
      <div class="shape-shapes__stage">
        <div class="shape-shapes__mask">
          ${chapters.map((chapter, index) => chapter.frames.map((frame, n) => `<img src="${frame.src}" alt="" data-chapter="${index}" data-frame="${n}" loading="lazy" decoding="async" />`).join("")).join("")}
        </div>
        <div class="shape-shapes__outline" aria-hidden="true"></div>
      </div>
      <div class="shape-shapes__text">
        <ol class="shape-shapes__legend">${chapters.map((chapter, index) => `<li><span class="shape-shapes__icon shape-shapes__icon--${index}"></span>${shapeOptionForms[index]?.name ?? ""}</li>`).join("")}</ol>
        ${chapters.map((chapter, index) => `
          <div class="shape-shapes__chapter">
            <p class="shape-shapes__form">${chapter.number} / ${shapeOptionForms[index]?.name ?? ""}</p>
            <h3 class="shape-shapes__kind">${chapter.kind}</h3>
            <p class="shape-shapes__line">${chapter.line}</p>
            <p class="shape-shapes__about">${chapter.about}</p>
            <p class="shape-shapes__tags">${chapter.tags.join(" · ")}</p>
            <a class="shape-shapes__link" href="${chapter.link.href}">${chapter.link.label} <span aria-hidden="true">↗</span></a>
          </div>`).join("")}
      </div>
    </div>`;
    root.append(shapes);
    const mask = shapes.querySelector(".shape-shapes__mask");
    const outline = shapes.querySelector(".shape-shapes__outline");
    const images = [...mask.querySelectorAll("img")];
    const texts = [...shapes.querySelectorAll(".shape-shapes__chapter")];
    const legend = [...shapes.querySelectorAll(".shape-shapes__legend li")];
    let current = -1;
    let shown = -1;
    let frame = 0;
    const render = () => {
        frame = 0;
        const box = shapes.getBoundingClientRect();
        const progress = Math.max(0, Math.min(0.9999, -box.top / Math.max(1, shapes.offsetHeight - window.innerHeight)));
        const position = progress * chapters.length;
        const index = Math.floor(position);
        // Scroll moves through the chapter's frames inside its shape.
        const next = Math.min(chapters[index].frames.length - 1, Math.floor((position - index) * chapters[index].frames.length));
        if (index !== current) {
            current = index;
            const form = shapeOptionForms[index] ?? shapeOptionForms[0];
            mask.style.clipPath = form.clip;
            outline.dataset.form = String(index);
            texts.forEach((text, n) => text.classList.toggle("is-active", n === index));
            legend.forEach((item, n) => item.classList.toggle("is-active", n === index));
        }
        if (next !== shown || index !== current) {
            shown = next;
            images.forEach((image) => image.classList.toggle("is-shown", Number(image.dataset.chapter) === index && Number(image.dataset.frame) === next));
        }
    };
    window.addEventListener("scroll", () => {
        if (!frame)
            frame = requestAnimationFrame(render);
    }, { passive: true });
    render();
};
/* Venn -------------------------------------------------------------------- */
const mountShapeVenn = (root, chapters) => {
    // Where each circle sits, and where its own frames gather, as fractions of
    // the square they share.
    const circles = [{ x: 0.35, y: 0.37 }, { x: 0.65, y: 0.37 }, { x: 0.5, y: 0.63 }];
    const homes = [{ x: 0.22, y: 0.41 }, { x: 0.78, y: 0.41 }, { x: 0.5, y: 0.79 }];
    const scatter = [{ x: -0.06, y: -0.05 }, { x: 0.05, y: -0.06 }, { x: -0.05, y: 0.06 }, { x: 0.06, y: 0.05 }];
    // The overlaps name the projects that live in both.
    const overlaps = [
        { x: 0.5, y: 0.27, label: "Electronic Botanica", between: [0, 1] },
        { x: 0.37, y: 0.6, label: "Flip", between: [0, 2] },
        { x: 0.63, y: 0.6, label: "Yours?", between: [1, 2], href: "mailto:animashaunraheem05@gmail.com" },
    ];
    const venn = document.createElement("div");
    venn.className = "shape-option shape-venn";
    venn.innerHTML = `
    <div class="shape-venn__board">
      ${chapters.map((chapter, index) => `
        <button class="shape-venn__circle" type="button" data-index="${index}" style="--x: ${circles[index]?.x ?? 0.5}; --y: ${circles[index]?.y ?? 0.5}">
          <span class="shape-venn__name"><span>${chapter.number}</span> ${chapter.kind}</span>
        </button>`).join("")}
      ${overlaps.map((overlap) => `<${overlap.href ? `a href="${overlap.href}"` : "span"} class="shape-venn__overlap${overlap.href ? " shape-venn__overlap--ask" : ""}" data-between="${overlap.between.join(" ")}" style="--x: ${overlap.x}; --y: ${overlap.y}">${overlap.label}</${overlap.href ? "a" : "span"}>`).join("")}
      ${chapters.map((chapter, index) => chapter.frames.map((frame, n) => `
        <span class="shape-venn__thumb" data-chapter="${index}" style="--x: ${(homes[index]?.x ?? 0.5) + (scatter[n]?.x ?? 0)}; --y: ${(homes[index]?.y ?? 0.5) + (scatter[n]?.y ?? 0)}; --turn: ${((n * 37) % 11) - 5}deg"><img src="${frame.src}" alt="" loading="lazy" decoding="async" /></span>`).join("")).join("")}
    </div>
    <div class="shape-venn__panel">
      <div class="shape-venn__detail is-active">
        <p class="shape-venn__eyebrow">Where the work sits</p>
        <p class="shape-venn__line">Most ideas live between disciplines. Point at a circle to see what's in it.</p>
      </div>
      ${chapters.map((chapter) => `
        <div class="shape-venn__detail">
          <p class="shape-venn__eyebrow">${chapter.number} ${chapter.kind}</p>
          <p class="shape-venn__line">${chapter.line}</p>
          <p class="shape-venn__about">${chapter.about}</p>
          <p class="shape-venn__tags">${chapter.tags.join(" · ")}</p>
          <a class="shape-venn__link" href="${chapter.link.href}">${chapter.link.label} <span aria-hidden="true">↗</span></a>
        </div>`).join("")}
    </div>`;
    root.append(venn);
    const board = venn.querySelector(".shape-venn__board");
    const details = [...venn.querySelectorAll(".shape-venn__detail")];
    const select = (index) => {
        board.dataset.active = index < 0 ? "" : String(index);
        venn.querySelectorAll("[data-chapter]").forEach((thumb) => thumb.classList.toggle("is-lit", Number(thumb.dataset.chapter) === index));
        venn.querySelectorAll(".shape-venn__circle").forEach((circle) => circle.classList.toggle("is-lit", Number(circle.dataset.index) === index));
        venn.querySelectorAll(".shape-venn__overlap").forEach((overlap) => {
            overlap.classList.toggle("is-lit", (overlap.dataset.between ?? "").split(" ").includes(String(index)));
        });
        details.forEach((detail, n) => detail.classList.toggle("is-active", n === index + 1));
    };
    venn.querySelectorAll(".shape-venn__circle").forEach((circle) => {
        const index = Number(circle.dataset.index);
        if (shapeOptionHover)
            circle.addEventListener("pointerenter", () => select(index));
        circle.addEventListener("click", () => select(board.dataset.active === String(index) ? -1 : index));
        circle.addEventListener("focus", () => select(index));
    });
    if (shapeOptionHover)
        board.addEventListener("pointerleave", () => select(-1));
};
/* Torch ------------------------------------------------------------------- */
const mountShapeTorch = (root, chapters) => {
    const frames = chapters.flatMap((chapter, index) => chapter.frames.map((frame) => ({ ...frame, chapter: index })));
    const torch = document.createElement("div");
    torch.className = "shape-option shape-torch";
    torch.innerHTML = `
    <div class="shape-torch__dark" aria-hidden="true">
      <div class="shape-torch__wall">${frames.map((frame) => `<span data-chapter="${frame.chapter}"><img src="${frame.src}" alt="" loading="lazy" decoding="async" /></span>`).join("")}</div>
    </div>
    <div class="shape-torch__list">
      <p class="shape-torch__hint">Move around. The work is in here.</p>
      ${chapters.map((chapter, index) => `
        <a class="shape-torch__row" href="${chapter.link.href}" data-index="${index}">
          <span class="shape-torch__number">${chapter.number}</span>
          <span class="shape-torch__kind">${chapter.kind}</span>
          <span class="shape-torch__about">${chapter.about}<span>${chapter.tags.join(" · ")}</span></span>
        </a>`).join("")}
    </div>`;
    root.append(torch);
    const dark = torch.querySelector(".shape-torch__dark");
    const target = { x: 0.5, y: 0.5 };
    const at = { x: 0.5, y: 0.5 };
    let size = 0;
    let sizeTarget = 0;
    let hovering = false;
    let visible = false;
    let frame = 0;
    let start = 0;
    // The light trails the cursor; with no cursor it wanders on its own.
    const tick = (now) => {
        if (!start)
            start = now;
        if (!hovering) {
            const t = (now - start) / 1000;
            target.x = 0.5 + Math.sin(t * 0.45) * 0.32;
            target.y = 0.5 + Math.sin(t * 0.7 + 1) * 0.28;
            sizeTarget = shapeOptionHover ? 0.12 : 0.34;
        }
        at.x += (target.x - at.x) * 0.1;
        at.y += (target.y - at.y) * 0.1;
        size += (sizeTarget - size) * 0.08;
        dark.style.setProperty("--x", `${(at.x * 100).toFixed(2)}%`);
        dark.style.setProperty("--y", `${(at.y * 100).toFixed(2)}%`);
        dark.style.setProperty("--r", `${(size * Math.max(torch.clientWidth, 400)).toFixed(1)}px`);
        frame = visible && !shapeOptionStill ? requestAnimationFrame(tick) : 0;
    };
    torch.addEventListener("pointermove", (event) => {
        if (!shapeOptionHover)
            return;
        const box = torch.getBoundingClientRect();
        hovering = true;
        target.x = (event.clientX - box.left) / box.width;
        target.y = (event.clientY - box.top) / box.height;
        sizeTarget = 0.16;
    });
    torch.addEventListener("pointerleave", () => { hovering = false; });
    // Pointing at a chapter lights its frames more widely.
    torch.querySelectorAll(".shape-torch__row").forEach((row) => {
        const index = row.dataset.index ?? "";
        row.addEventListener("pointerenter", () => {
            torch.dataset.active = index;
            sizeTarget = 0.24;
        });
        row.addEventListener("pointerleave", () => {
            delete torch.dataset.active;
            sizeTarget = 0.16;
        });
    });
    new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !frame)
            frame = requestAnimationFrame(tick);
    }).observe(torch);
    if (shapeOptionStill)
        dark.style.setProperty("--r", "100vmax");
};
/* Mosaic ------------------------------------------------------------------ */
const mountShapeMosaic = (root, chapters) => {
    const mosaic = document.createElement("div");
    mosaic.className = "shape-option shape-mosaic";
    mosaic.style.height = `${(chapters.length + 1) * 100}vh`;
    mosaic.innerHTML = `
    <div class="shape-mosaic__pin">
      <div class="shape-mosaic__camera">
        <div class="shape-mosaic__grid">
          ${chapters.map((chapter, index) => `
            <div class="shape-mosaic__block" data-index="${index}">
              ${chapter.frames.map((frame) => `<span><img src="${frame.src}" alt="" loading="lazy" decoding="async" /></span>`).join("")}
              <p class="shape-mosaic__label">${chapter.number} ${chapter.kind}</p>
            </div>`).join("")}
        </div>
      </div>
      <div class="shape-mosaic__text">
        <div class="shape-mosaic__chapter is-active">
          <p class="shape-mosaic__eyebrow">/ Three ways in</p>
          <p class="shape-mosaic__line">Everything I shape, at a glance. Keep scrolling to step inside.</p>
        </div>
        ${chapters.map((chapter) => `
          <div class="shape-mosaic__chapter">
            <p class="shape-mosaic__eyebrow">${chapter.number} ${chapter.kind}</p>
            <p class="shape-mosaic__line">${chapter.line}</p>
            <p class="shape-mosaic__about">${chapter.about}</p>
            <p class="shape-mosaic__tags">${chapter.tags.join(" · ")}</p>
            <a class="shape-mosaic__link" href="${chapter.link.href}">${chapter.link.label} <span aria-hidden="true">↗</span></a>
          </div>`).join("")}
      </div>
    </div>`;
    root.append(mosaic);
    const camera = mosaic.querySelector(".shape-mosaic__camera");
    const grid = mosaic.querySelector(".shape-mosaic__grid");
    const blocks = [...mosaic.querySelectorAll(".shape-mosaic__block")];
    const texts = [...mosaic.querySelectorAll(".shape-mosaic__chapter")];
    const view = { x: 0, y: 0, scale: 1 };
    const goal = { x: 0, y: 0, scale: 1 };
    let step = -1;
    let frame = 0;
    // Step 0 shows the whole grid; each later step flies the camera to a block.
    const aim = () => {
        const box = mosaic.getBoundingClientRect();
        const progress = Math.max(0, Math.min(0.9999, -box.top / Math.max(1, mosaic.offsetHeight - window.innerHeight)));
        const next = Math.floor(progress * (chapters.length + 1));
        if (next !== step) {
            step = next;
            texts.forEach((text, n) => text.classList.toggle("is-active", n === step));
            blocks.forEach((block, n) => block.classList.toggle("is-focus", n === step - 1));
            mosaic.classList.toggle("is-zoomed", step > 0);
        }
        const frameBox = camera.getBoundingClientRect();
        if (step === 0) {
            goal.x = 0;
            goal.y = 0;
            goal.scale = 1;
        }
        else {
            // Measured unscaled, from the grid's own layout.
            const block = blocks[step - 1];
            const scale = Math.min(frameBox.width / block.offsetWidth, frameBox.height / block.offsetHeight) * 0.86;
            goal.scale = scale;
            goal.x = (grid.offsetWidth / 2 - (block.offsetLeft + block.offsetWidth / 2)) * scale;
            goal.y = (grid.offsetHeight / 2 - (block.offsetTop + block.offsetHeight / 2)) * scale;
        }
    };
    const tick = () => {
        aim();
        const amount = shapeOptionStill ? 1 : 0.08;
        view.x += (goal.x - view.x) * amount;
        view.y += (goal.y - view.y) * amount;
        view.scale += (goal.scale - view.scale) * amount;
        grid.style.transform = `translate3d(${view.x.toFixed(2)}px, ${view.y.toFixed(2)}px, 0) scale(${view.scale.toFixed(4)})`;
        const settled = Math.abs(goal.x - view.x) < 0.3 && Math.abs(goal.y - view.y) < 0.3 && Math.abs(goal.scale - view.scale) < 0.001;
        frame = settled ? 0 : requestAnimationFrame(tick);
    };
    const request = () => {
        if (!frame)
            frame = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    request();
};
/* Blueprint --------------------------------------------------------------- */
const mountShapeBlueprint = (root, chapters) => {
    const blueprint = document.createElement("div");
    blueprint.className = "shape-option shape-blueprint";
    blueprint.innerHTML = chapters.map((chapter, index) => `
    <article class="shape-blueprint__sheet${index % 2 ? " shape-blueprint__sheet--flip" : ""}">
      <figure class="shape-blueprint__plate">
        <span class="shape-blueprint__media">${chapter.frames.map((frame, n) => `<img src="${frame.src}" alt="${frame.alt}"${n ? "" : ' class="is-shown"'} loading="lazy" decoding="async" />`).join("")}</span>
        <svg class="shape-blueprint__guides" viewBox="0 0 100 125" preserveAspectRatio="none" aria-hidden="true">
          <line x1="-8" y1="0" x2="108" y2="0" /><line x1="-8" y1="125" x2="108" y2="125" />
          <line x1="0" y1="-8" x2="0" y2="133" /><line x1="100" y1="-8" x2="100" y2="133" />
          <line x1="33.33" y1="0" x2="33.33" y2="125" class="is-grid" /><line x1="66.67" y1="0" x2="66.67" y2="125" class="is-grid" />
          <line x1="0" y1="41.67" x2="100" y2="41.67" class="is-grid" /><line x1="0" y1="83.33" x2="100" y2="83.33" class="is-grid" />
          <circle cx="50" cy="62.5" r="38" class="is-grid" />
          <line x1="0" y1="0" x2="100" y2="125" class="is-grid" /><line x1="100" y1="0" x2="0" y2="125" class="is-grid" />
        </svg>
        <span class="shape-blueprint__dim shape-blueprint__dim--width"></span>
        <span class="shape-blueprint__dim shape-blueprint__dim--height"></span>
        <figcaption class="shape-blueprint__note"><span>${chapter.frames[0].number}</span> ${chapter.frames[0].caption}</figcaption>
      </figure>
      <div class="shape-blueprint__spec">
        <p class="shape-blueprint__number">${chapter.number}</p>
        <h3 class="shape-blueprint__kind">${chapter.kind}</h3>
        <p class="shape-blueprint__line">${chapter.line}</p>
        <dl class="shape-blueprint__table">
          <div><dt>Covers</dt><dd>${chapter.about}</dd></div>
          <div><dt>Disciplines</dt><dd>${chapter.tags.join(", ")}</dd></div>
          <div><dt>Plates</dt><dd class="shape-blueprint__plates">${chapter.frames.map((frame, n) => `<button type="button" data-frame="${n}"${n ? "" : ' aria-pressed="true"'}>${frame.number}</button>`).join("")}</dd></div>
        </dl>
        <a class="shape-blueprint__link" href="${chapter.link.href}">${chapter.link.label} <span aria-hidden="true">↗</span></a>
      </div>
    </article>`).join("");
    root.append(blueprint);
    blueprint.querySelectorAll(".shape-blueprint__sheet").forEach((sheet, index) => {
        const images = [...sheet.querySelectorAll(".shape-blueprint__media img")];
        const width = sheet.querySelector(".shape-blueprint__dim--width");
        const height = sheet.querySelector(".shape-blueprint__dim--height");
        const note = sheet.querySelector(".shape-blueprint__note");
        const buttons = [...sheet.querySelectorAll(".shape-blueprint__plates button")];
        // The dimensions are the frame's real pixel size.
        const measure = (image) => {
            if (!image.naturalWidth)
                return;
            width.textContent = `${image.naturalWidth} px`;
            height.textContent = `${image.naturalHeight} px`;
        };
        const show = (n) => {
            images.forEach((image, m) => image.classList.toggle("is-shown", m === n));
            buttons.forEach((button, m) => button.setAttribute("aria-pressed", String(m === n)));
            const frame = chapters[index].frames[n];
            note.innerHTML = `<span>${frame.number}</span> ${frame.caption}`;
            if (images[n].complete)
                measure(images[n]);
            else
                images[n].addEventListener("load", () => measure(images[n]), { once: true });
        };
        buttons.forEach((button, n) => {
            button.addEventListener("click", () => show(n));
            if (shapeOptionHover)
                button.addEventListener("pointerenter", () => show(n));
        });
        show(0);
    });
    // The guides draw themselves in as each sheet arrives.
    const arrive = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting)
                return;
            entry.target.classList.add("is-drawn");
            arrive.unobserve(entry.target);
        });
    }, { rootMargin: "0px 0px -20% 0px" });
    blueprint.querySelectorAll(".shape-blueprint__sheet").forEach((sheet) => arrive.observe(sheet));
};
/* Choosing ---------------------------------------------------------------- */
if (shapeOptionRoot) {
    if (shapeOption) {
        const chapters = shapeOptionChapters(shapeOptionRoot);
        shapeOptionRoot.dataset.option = shapeOption;
        ({
            index: mountShapeIndex,
            accordion: mountShapeAccordion,
            contents: mountShapeContents,
            ticker: mountShapeTicker,
            panels: mountShapePanels,
            invert: mountShapeInvert,
            fill: mountShapeFill,
            counter: mountShapeCounter,
            shapes: mountShapeShapes,
            venn: mountShapeVenn,
            torch: mountShapeTorch,
            mosaic: mountShapeMosaic,
            blueprint: mountShapeBlueprint,
        })[shapeOption](shapeOptionRoot, chapters);
    }
    // Temporary picker for comparing them, shown while the section is in view.
    const picker = document.createElement("div");
    picker.className = "shape-picker";
    picker.setAttribute("role", "group");
    picker.setAttribute("aria-label", "What I shape layout");
    picker.innerHTML = ["reel", ...shapeOptions]
        .map((option) => `<button type="button" data-option="${option}" aria-pressed="${(shapeOption ?? "reel") === option}">${option.charAt(0).toUpperCase() + option.slice(1)}</button>`)
        .join("");
    document.body.append(picker);
    picker.addEventListener("click", (event) => {
        const option = event.target.closest("button")?.dataset.option;
        if (!option)
            return;
        const url = new URL(window.location.href);
        if (option === "reel")
            url.searchParams.delete("shape");
        else
            url.searchParams.set("shape", option);
        url.hash = "what-i-shape";
        window.location.href = url.toString();
    });
    new IntersectionObserver(([entry]) => {
        picker.classList.toggle("is-shown", entry.isIntersecting);
    }).observe(shapeOptionRoot);
}
