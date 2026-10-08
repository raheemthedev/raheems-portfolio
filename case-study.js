"use strict";
const caseStudyProjects = {
    "01": { number: "01", title: "Flip", discipline: "Fintech / Cryptocurrency", year: "2024", summary: "A crypto exchange experience as simple as flipping a coin.", services: ["Brand identity", "Art direction", "Illustration", "Social media"], chapterTitle: "Own it. Flip it. Go big.", statement: "Any time. Any day. Any place." },
    "02": { number: "02", title: "Electronic Botanica", discipline: "Exhibition Identity / Generative Art", year: "2026", summary: "A generative art exhibition exploring the collision between organic forms and digital systems.", services: ["Brand identity", "Art direction", "Generative design", "Exhibition graphics"], chapterTitle: "Colours behave like electricity", statement: "Organic forms. Digital systems. One electric visual language." },
};
caseStudyProjects["03"] = { number: "03", title: "Project 03", discipline: "Art Direction", year: "TBC", summary: "Placeholder — project details and artwork to come.", services: ["Art Direction"], chapterTitle: "Project in progress", statement: "Artwork to come" };
caseStudyProjects["04"] = { number: "04", title: "Project 04", discipline: "Packaging", year: "TBC", summary: "Placeholder — project details and artwork to come.", services: ["Packaging"], chapterTitle: "Project in progress", statement: "Artwork to come" };
caseStudyProjects["05"] = { number: "05", title: "Project 05", discipline: "Campaign Design", year: "TBC", summary: "Placeholder — project details and artwork to come.", services: ["Campaign Design"], chapterTitle: "Project in progress", statement: "Artwork to come" };
caseStudyProjects["06"] = { number: "06", title: "Project 06", discipline: "Digital Expression", year: "TBC", summary: "Placeholder — project details and artwork to come.", services: ["Digital Expression"], chapterTitle: "Project in progress", statement: "Artwork to come" };
const content = document.querySelector("#case-study-content");
if (!content)
    throw new Error("Case study content mount is missing.");
const requestedProject = new URLSearchParams(window.location.search).get("project") ?? "01";
const project = caseStudyProjects[requestedProject] ?? caseStudyProjects["01"];
const nextNumber = project.number === "01" ? "02" : "01";
const isFlipProject = project.number === "01";
const isBotanicaProject = project.number === "02";
const hasProjectAssets = isFlipProject || isBotanicaProject;
const projectSubtitle = isFlipProject ? "A familiar gesture. A new identity." : isBotanicaProject ? "Organic forms. Digital expression." : "A project in progress.";
document.title = `${project.title} — Raheem case study`;
const media = (className, label, inner = "") => `
  <figure class="case-media ${className}" data-case-reveal>
    <div class="case-media__surface" role="img" aria-label="${project.title}: ${label} image placeholder">${inner}</div>
  </figure>
`;
const wordPlate = `<span class="case-media__word">${project.title}</span>`;
const statementPlate = `<span class="case-media__statement">${project.statement}</span>`;
// Reserve the real artwork proportions so chapter links don't shift while images load.
const flipDimensions = {
    L11: [2560, 1108], L12: [2560, 1156], L14: [2560, 1484], L15: [2560, 1056],
    L16: [2560, 1156], L17: [2560, 1156], L5: [2560, 1085], L6: [2560, 730], L8: [2560, 1042],
    "P13-1": [2078, 1734], "P13-2": [1630, 1734], "P7-1": [1800, 2050], "P7-2": [1800, 2050],
    "P9-1": [2396, 1528], "P9-2": [1278, 1528],
};
const flipAsset = (name, alt, eager = false) => `
  <figure class="case-media case-media--asset" data-case-reveal>
    <img src="assets/projects/flip/${name}.jpg" alt="${alt}" width="${flipDimensions[name]?.[0] ?? 2560}" height="${flipDimensions[name]?.[1] ?? 1440}" loading="${eager ? "eager" : "lazy"}" decoding="async" draggable="false"${eager ? " fetchpriority=\"high\"" : ""} />
  </figure>
`;
const flipPair = (first, second, firstAlt, secondAlt) => `
  <div class="case-work__split case-work__split--assets" data-case-reveal>
    ${flipAsset(first, firstAlt)}
    ${flipAsset(second, secondAlt)}
  </div>
`;
const botanicaDimensions = {
    "l4-cover.jpg": [1920, 1285], "l5.jpg": [1920, 1285], "l6.jpg": [1920, 1035],
    "l8.jpg": [1920, 396], "l11.jpg": [1920, 396], "p7-1.jpg": [919, 1053], "p7-2.jpg": [943, 1053],
    "p9-1.jpg": [944, 1153], "p9-2.jpg": [944, 1153], "p10-1.jpg": [723, 964],
    "p10-2.webp": [720, 880], "p12.gif": [720, 960], "p13.webp": [720, 960],
};
const botanicaAsset = (name, alt, portrait = false) => `
  <figure class="case-media case-media--asset${portrait ? " case-media--asset-portrait" : ""}" data-case-reveal>
    <img src="assets/projects/electronic-botanica/${name}" alt="${alt}" width="${botanicaDimensions[name][0]}" height="${botanicaDimensions[name][1]}" loading="${name === 'l4-cover.jpg' ? 'eager' : 'lazy'}" decoding="async" draggable="false" />
  </figure>
`;
const botanicaPair = (first, second, firstAlt, secondAlt) => `
  <div class="case-work__split case-work__split--assets" data-case-reveal>
    ${botanicaAsset(first, firstAlt)}
    ${botanicaAsset(second, secondAlt)}
  </div>
`;
const storyChapters = isFlipProject ? [
    { id: "brief", label: "The brief", title: "Make crypto feel approachable.", text: "Flip’s identity starts with a simple question: how can a technical category feel less distant? The direction uses a familiar gesture—the flip of a coin—to give the brand an immediate, everyday reference." },
    { id: "identity", label: "Identity", title: "An idea you can recognise.", text: "The wordmark and ribbon forms establish the core language. They can hold the composition on their own, or sit alongside the more playful illustrations without losing recognition." },
    { id: "illustration", label: "Illustration", title: "Give the idea some movement.", text: "Coins become the characters of the system. Changes in angle, scale, and arrangement turn a recurring object into a flexible way to communicate exchange, momentum, and possibility." },
    { id: "voice", label: "Colour & voice", title: "Bright, direct, optimistic.", text: "Blue and yellow give the work contrast and energy. Short messages keep the tone direct, letting the visuals do much of the explaining rather than adding another layer of technical language." },
    { id: "applications", label: "Applications", title: "One language, different encounters.", text: "Social layouts, illustrated campaigns, notifications, and physical applications test the same ingredients in different settings. The aim is consistency without making every frame identical." },
    { id: "reflection", label: "In perspective", title: "A system, not just a mark.", text: "One uncomplicated idea connects the mark, illustrations, messages, and applications. Together, they show how the coin-flip concept can become a recognisable visual system rather than a single graphic." },
] : isBotanicaProject ? [
    { id: "brief", label: "The brief", title: "Where nature meets a digital pulse.", text: "Electronic Botanica brings botanical forms into an electronic visual world. The identity explores that tension: something recognisably organic, expressed through texture, saturated colour, and shifting digital compositions." },
    { id: "visual-language", label: "Visual language", title: "Let the flowers behave differently.", text: "Halftone patterns and reflective surfaces give familiar forms an unfamiliar character. A quieter typographic framework anchors the imagery, creating room for the artwork to be expressive without losing the information." },
    { id: "applications", label: "Applications", title: "An exhibition with a shared language.", text: "The identity moves through posters and exhibition applications. Scale and composition change from piece to piece, while the recurring forms and palette keep the collection connected." },
    { id: "motion", label: "Motion studies", title: "The identity doesn’t have to stand still.", text: "The animated poster sequence and flower studies extend the same visual ingredients into time. Movement becomes another way to explore the relationship between cultivation and computation." },
    { id: "reflection", label: "In perspective", title: "Cultivated and electric.", text: "The collection holds two contrasting qualities together: the familiarity of botanical forms and the unpredictability of digital expression. The applications and motion studies explore how far that relationship can stretch while staying connected." },
] : [
    { id: "brief", label: "Project preview", title: "A place for the next project.", text: "This is a placeholder slot. The project name, story, credits, and artwork will be added when the work is ready." },
];
const storyChapter = (id) => {
    const chapter = storyChapters.find((entry) => entry.id === id);
    if (!chapter)
        return "";
    const opening = id === "brief";
    return `<section class="case-chapter${opening ? " case-chapter--intro" : ""}" id="${id}" data-story-chapter aria-labelledby="${id}-title">${opening ? `<h2 id="${id}-title">${chapter.title}</h2>` : `<p class="case-chapter__label">${chapter.label}</p>`}<div class="case-chapter__body">${opening ? "" : `<h2 id="${id}-title">${chapter.title}</h2>`}<p>${chapter.text}</p></div></section>`;
};
const flipGallery = `
  ${storyChapter("brief")}
  ${flipAsset("L1", "Flip identity logo and ribbon system")}
  ${storyChapter("identity")}
  ${flipAsset("L2", "Flip.it wordmark on a blue field")}
  ${storyChapter("illustration")}
  ${flipAsset("L3", "Flip cryptocurrency coin illustration system")}
  ${storyChapter("voice")}
  ${flipAsset("L4", "Own it, Flip it, Go big brand message")}
  ${flipAsset("L5", "Swap your crypto seamlessly campaign graphic")}
  ${flipAsset("L6", "Own it, Flip it campaign illustration")}
  ${storyChapter("applications")}
  ${flipAsset("L7", "Flip social media campaign system")}
  ${flipPair("P7-1", "P7-2", "Flip customer transaction campaign", "Flip cryptocurrency selection interface")}
  ${flipAsset("L8", "Any time, Any day, Any place brand statement")}
  ${flipPair("P9-1", "P9-2", "Flip transaction notification system", "Flip cryptocurrency illustration detail")}
  ${flipAsset("L10", "Flip social media profile application")}
  ${flipAsset("L11", "Flip social story design system")}
  ${flipAsset("L12", "Flip mobile social profile application")}
  ${flipPair("P13-1", "P13-2", "Flip customer photography", "Flip it, Go big campaign illustration")}
  ${flipAsset("L14", "Flip sticker applications")}
  ${flipAsset("L15", "Flip campaign icon system")}
  ${flipAsset("L16", "Flip branded tote bag applications")}
  ${flipAsset("L17", "Flip branded bucket hat application")}
  ${storyChapter("reflection")}
`;
const botanicaGallery = `
  ${storyChapter("brief")}
  ${botanicaAsset("l5.jpg", "Electronic Botanica generative flower collection")}
  ${storyChapter("visual-language")}
  ${botanicaAsset("l6.jpg", "Electronic Botanica opening night typographic composition")}
  ${storyChapter("applications")}
  ${botanicaPair("p7-1.jpg", "p7-2.jpg", "Electronic Botanica exhibition application", "Electronic Botanica flower artwork")}
  ${botanicaAsset("l8.jpg", "Electronic Botanica identity detail")}
  ${botanicaPair("p9-1.jpg", "p9-2.jpg", "Electronic Botanica poster application", "Electronic Botanica exhibition collateral")}
  ${storyChapter("motion")}
  ${botanicaPair("p10-1.jpg", "p10-2.webp", "Electronic Botanica portrait composition", "Animated generative flower study")}
  ${botanicaAsset("l11.jpg", "Electronic Botanica visual system strip")}
  ${botanicaAsset("p12.gif", "Animated Electronic Botanica exhibition poster sequence", true)}
  ${botanicaAsset("p13.webp", "Animated Electronic Botanica flower study", true)}
  ${storyChapter("reflection")}
`;
const galleryMarkup = isFlipProject
    ? `${flipAsset("LCover", "Flip cryptocurrency exchange brand identity cover", true)}<header class="case-mobile-intro"><h1>${project.title}</h1><p>${projectSubtitle}</p><small>${project.discipline} · ${project.year}</small></header>${flipGallery}`
    : isBotanicaProject
        ? `${botanicaAsset("l4-cover.jpg", "Electronic Botanica generative art exhibition identity cover")}<header class="case-mobile-intro"><h1>${project.title}</h1><p>${projectSubtitle}</p><small>${project.discipline} · ${project.year}</small></header>${botanicaGallery}`
        : `
      ${media("case-media--wide case-media--soft", "opening image")}
      <header class="case-mobile-intro"><h1>${project.title}</h1><p>${projectSubtitle}</p><small>${project.discipline} · Placeholder</small></header>
      ${storyChapter("brief")}
      ${media("case-media--wide case-media--brand", "identity wordmark", wordPlate)}
      <div class="case-work__split case-work__split--equal">
        ${media("case-media--portrait case-media--mid", "identity detail")}
        ${media("case-media--portrait case-media--dark", "motion study")}
      </div>
      ${media("case-media--wide case-media--device", "digital application", `<span class="case-media__device"><i></i><b>Raheem</b><small>${project.discipline}</small></span>`)}
      ${media("case-media--wide case-media--statement-panel", "campaign statement", statementPlate)}
      <div class="case-work__split case-work__split--uneven">
        ${media("case-media--square case-media--light", "graphic application")}
        ${media("case-media--portrait case-media--soft", "photographic application")}
      </div>
      ${media("case-media--wide case-media--dark case-media--closing", "final project image")}
    `;
const projectCover = (candidate) => {
    if (candidate.number === "01") {
        return `<img src="assets/projects/flip/LCover.jpg" alt="Flip brand identity project" loading="lazy" decoding="async" draggable="false" />`;
    }
    if (candidate.number === "02") {
        return `<img src="assets/projects/electronic-botanica/l4-cover.jpg" alt="Electronic Botanica exhibition identity project" loading="lazy" decoding="async" draggable="false" />`;
    }
    return `<span class="case-more__placeholder case-more__placeholder--${candidate.number}" aria-hidden="true"><b>${candidate.title}</b><i>${candidate.number}</i></span>`;
};
const nextProject = caseStudyProjects[nextNumber];
const projectCard = (candidate) => `
  <a class="case-more__card" href="case-study.html?project=${candidate.number}">
    <figure class="case-more__visual">${projectCover(candidate)}</figure>
    <div class="case-more__card-copy"><div><h3>${candidate.title}</h3><p>${candidate.summary}</p></div><ul aria-label="${candidate.title} disciplines">${candidate.services.slice(0, 2).map((service) => `<li>${service}</li>`).join("")}</ul></div>
  </a>
`;
const projectDetails = `<details class="case-dossier__credits"><summary>Project details <span aria-hidden="true">+</span></summary><div><p>${project.services.join(" · ")}</p><p>${hasProjectAssets ? "Design & art direction<br />Raheem Animashaun" : "Credits to be confirmed."}</p></div></details>`;
content.innerHTML = `
  <article class="case-showcase case-showcase--${project.number}">
    <div class="case-project">
      <aside class="case-dossier" aria-label="${project.title} project brief">
        <div class="case-dossier__sticky">
          <div class="case-dossier__identity"><h1>${project.title}</h1><p>${projectSubtitle}</p><small>${project.discipline} · ${hasProjectAssets ? project.year : "Placeholder"}</small></div>
          <nav class="case-chapters" aria-label="Case study chapters">
            ${storyChapters.map((chapter, index) => `<a href="#${chapter.id}"${index === 0 ? ' class="is-active" aria-current="location"' : ""}><span class="case-chapters__dot" aria-hidden="true"></span>${chapter.label}</a>`).join("")}
          </nav>
          ${projectDetails}
        </div>
      </aside>

      <section class="case-work" aria-label="${project.title} work showcase">
        <nav class="case-mobile-chapters" aria-label="Case study chapters">${storyChapters.map((chapter) => `<a href="#${chapter.id}">${chapter.label}</a>`).join("")}</nav>
        ${galleryMarkup}
        <div class="case-mobile-details">${projectDetails}</div>
      </section>
    </div>

    <section class="case-more" aria-labelledby="case-more-title">
      <div class="case-more__heading"><h2 id="case-more-title">Want to see more work?</h2><a href="work.html">See all projects ↗</a></div>
      <div class="case-more__grid">${projectCard(nextProject)}</div>
    </section>
  </article>
`;
const chapterMarkers = [...document.querySelectorAll("[data-story-chapter]")];
const chapterLinks = [...document.querySelectorAll(".case-chapters a, .case-mobile-chapters a")];
let chapterFrame = 0;
const updateChapter = () => {
    chapterFrame = 0;
    const focusLine = window.innerHeight * .35;
    let active = chapterMarkers[0];
    chapterMarkers.forEach((marker) => { if (marker.getBoundingClientRect().top <= focusLine)
        active = marker; });
    chapterLinks.forEach((link) => {
        const current = link.hash === `#${active?.id}`;
        link.classList.toggle("is-active", current);
        if (current)
            link.setAttribute("aria-current", "location");
        else
            link.removeAttribute("aria-current");
    });
};
window.addEventListener("scroll", () => { if (!chapterFrame)
    chapterFrame = requestAnimationFrame(updateChapter); }, { passive: true });
window.addEventListener("resize", updateChapter);
chapterLinks.forEach((link) => link.addEventListener("click", (event) => {
    const marker = chapterMarkers.find((item) => `#${item.id}` === link.hash);
    if (!marker)
        return;
    event.preventDefault();
    history.replaceState(null, "", link.hash);
    marker.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
}));
updateChapter();
const restoreChapterAnchor = () => {
    const marker = chapterMarkers.find((item) => `#${item.id}` === window.location.hash);
    marker?.scrollIntoView({ behavior: "instant", block: "start" });
    updateChapter();
};
window.addEventListener("pageshow", (event) => {
    if (!event.persisted)
        requestAnimationFrame(restoreChapterAnchor);
}, { once: true });
const caseStudyRevealItems = [...document.querySelectorAll("[data-case-reveal]")];
const caseStudyReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
if (caseStudyReducedMotion.matches || !("IntersectionObserver" in window)) {
    caseStudyRevealItems.forEach((item) => item.classList.add("is-visible"));
}
else {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting)
                return;
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
        });
    }, { rootMargin: "0px 0px -5%", threshold: 0.04 });
    caseStudyRevealItems.forEach((item) => revealObserver.observe(item));
}
