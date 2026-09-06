"use strict";
const caseStudyProjects = {
    "01": { number: "01", title: "Flip", discipline: "Fintech / Cryptocurrency", year: "2024", summary: "A crypto exchange experience as simple as flipping a coin.", services: ["Brand identity", "Art direction", "Illustration", "Social media"], chapterTitle: "Own it. Flip it. Go big.", statement: "Any time. Any day. Any place." },
    "02": { number: "02", title: "Electronic Botanica", discipline: "Exhibition Identity / Generative Art", year: "2026", summary: "A generative art exhibition exploring the collision between organic forms and digital systems.", services: ["Brand identity", "Art direction", "Generative design", "Exhibition graphics"], chapterTitle: "Colours behave like electricity", statement: "Organic forms. Digital systems. One electric visual language." },
    "03": { number: "03", title: "Project 03", discipline: "Art Direction", year: "2025", summary: "Art direction that turns a distinct point of view into a recognizable visual world.", services: ["Concept", "Campaign", "Editorial"], chapterTitle: "A world with character", statement: "A visual world with enough character to be remembered and enough structure to grow." },
    "04": { number: "04", title: "Project 04", discipline: "Packaging", year: "2025", summary: "Packaging made to hold attention while keeping the product story direct and useful.", services: ["Packaging", "Typography", "Production"], chapterTitle: "Clarity you can hold", statement: "A tactile system that makes the product clear before a word needs to be read." },
    "05": { number: "05", title: "Project 05", discipline: "Campaign Design", year: "2024", summary: "A campaign language with enough rhythm to work across motion, social, and print.", services: ["Campaign", "Motion", "Social"], chapterTitle: "A repeatable rhythm", statement: "A campaign behaves like a rhythm: repeatable, flexible, and immediately familiar." },
    "06": { number: "06", title: "Project 06", discipline: "Digital Expression", year: "2024", summary: "A responsive digital expression carrying the identity into an animated experience.", services: ["Web design", "Interaction", "Development"], chapterTitle: "Designed to respond", statement: "The identity becomes most useful when it responds, moves, and feels alive." },
};
const content = document.querySelector("#case-study-content");
if (!content)
    throw new Error("Case study content mount is missing.");
const requestedProject = new URLSearchParams(window.location.search).get("project") ?? "01";
const project = caseStudyProjects[requestedProject] ?? caseStudyProjects["01"];
const nextNumber = project.number === "06" ? "01" : String(Number(project.number) + 1).padStart(2, "0");
const nextProject = caseStudyProjects[nextNumber];
const isFlipProject = project.number === "01";
const isBotanicaProject = project.number === "02";
const hasProjectAssets = isFlipProject || isBotanicaProject;
document.title = `${project.title} — Raheem case study`;
const media = (className, label, inner = "") => `
  <figure class="case-media ${className}" data-case-reveal>
    <div class="case-media__surface" role="img" aria-label="${project.title}: ${label} image placeholder">${inner}</div>
  </figure>
`;
const wordPlate = `<span class="case-media__word">${project.title}</span>`;
const statementPlate = `<span class="case-media__statement">${project.statement}</span>`;
const flipAsset = (name, alt, eager = false) => `
  <figure class="case-media case-media--asset" data-case-reveal>
    <img src="assets/projects/flip/${name}.jpg" alt="${alt}" width="2560" height="1440" loading="${eager ? "eager" : "lazy"}" decoding="async" draggable="false"${eager ? " fetchpriority=\"high\"" : ""} />
  </figure>
`;
const flipPair = (first, second, firstAlt, secondAlt) => `
  <div class="case-work__split case-work__split--assets" data-case-reveal>
    ${flipAsset(first, firstAlt)}
    ${flipAsset(second, secondAlt)}
  </div>
`;
const botanicaAsset = (name, alt, portrait = false) => `
  <figure class="case-media case-media--asset${portrait ? " case-media--asset-portrait" : ""}" data-case-reveal>
    <img src="assets/projects/electronic-botanica/${name}" alt="${alt}" loading="lazy" decoding="async" draggable="false" />
  </figure>
`;
const botanicaPair = (first, second, firstAlt, secondAlt) => `
  <div class="case-work__split case-work__split--assets" data-case-reveal>
    ${botanicaAsset(first, firstAlt)}
    ${botanicaAsset(second, secondAlt)}
  </div>
`;
const flipGallery = `
  ${flipAsset("L1", "Flip identity logo and ribbon system")}
  ${flipAsset("L2", "Flip.it wordmark on a blue field")}
  ${flipAsset("L3", "Flip cryptocurrency coin illustration system")}
  ${flipAsset("L4", "Own it, Flip it, Go big brand message")}
  ${flipAsset("L5", "Swap your crypto seamlessly campaign graphic")}
  ${flipAsset("L6", "Own it, Flip it campaign illustration")}
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
`;
const botanicaGallery = `
  ${botanicaAsset("l5.jpg", "Electronic Botanica generative flower collection")}
  ${botanicaAsset("l6.jpg", "Electronic Botanica opening night typographic composition")}
  ${botanicaPair("p7-1.jpg", "p7-2.jpg", "Electronic Botanica exhibition application", "Electronic Botanica flower artwork")}
  ${botanicaAsset("l8.jpg", "Electronic Botanica identity detail")}
  ${botanicaPair("p9-1.jpg", "p9-2.jpg", "Electronic Botanica poster application", "Electronic Botanica exhibition collateral")}
  ${botanicaPair("p10-1.jpg", "p10-2.webp", "Electronic Botanica portrait composition", "Animated generative flower study")}
  ${botanicaAsset("l11.jpg", "Electronic Botanica visual system strip")}
  ${botanicaAsset("p12.gif", "Animated Electronic Botanica exhibition poster sequence", true)}
  ${botanicaAsset("p13.webp", "Animated Electronic Botanica flower study", true)}
`;
const projectLead = isFlipProject
    ? "Flip redefines the crypto exchange experience through a platform designed to feel intuitive, friendly, and effortless."
    : isBotanicaProject
        ? "Electronic Botanica is a generative art exhibition where botanical forms are transformed through the visual language of digital systems."
        : "A focused creative system designed to give the work a distinct place in the world.";
const projectStoryOne = isFlipProject
    ? "Designed with usability at its heart, Flip makes converting cryptocurrencies intuitive and stress-free, regardless of the user’s level of expertise. The visual identity turns the familiar motion of flipping a coin into a clear and memorable brand idea."
    : isBotanicaProject
        ? "The identity stages a collision between organic growth and electronic behaviour. Familiar flowers are rebuilt through saturated colour, halftone texture, reflective forms, and shifting generative compositions."
        : "The opportunity was to build an identity that could communicate with clarity without becoming anonymous. Every decision needed to support one central idea while remaining useful across changing formats.";
const projectStoryTwo = isFlipProject
    ? "Every interaction is smooth and straightforward, removing hidden charges and unnecessary complications. The flexible illustration, typography, and social system make navigating Flip feel natural while giving the platform an optimistic and recognisable voice."
    : isBotanicaProject
        ? "A restrained typographic framework gives the expressive imagery room to behave. Across posters, motion, exhibition graphics, and digital formats, the system feels simultaneously cultivated and electric."
        : "The response brings typography, composition, image, and motion into one flexible language—creating a foundation that can evolve while always feeling recognisable.";
content.innerHTML = `
  <article class="case-showcase case-showcase--${project.number}">
    <header class="case-hero${hasProjectAssets ? " case-hero--asset" : ""}" data-case-reveal>
      ${isFlipProject ? `<img src="assets/projects/flip/LCover.jpg" alt="Flip cryptocurrency exchange brand identity" width="2560" height="1440" decoding="async" fetchpriority="high" draggable="false" />` : isBotanicaProject ? `<img src="assets/projects/electronic-botanica/l4-cover.jpg" alt="Electronic Botanica generative art exhibition identity" width="1920" height="1285" decoding="async" fetchpriority="high" draggable="false" />` : `
        <div class="case-hero__art">
          <h1>${project.title}</h1>
          <div class="case-hero__base">
            <span>${project.discipline}</span>
            <span class="case-hero__monogram">R</span>
            <span>${project.year}</span>
          </div>
        </div>
      `}
    </header>

    <section class="case-brief" aria-labelledby="case-brief-heading">
      <aside class="case-brief__facts" data-case-reveal>
        <h2>${project.title}</h2>
        <dl>
          <div><dt>Industry</dt><dd>${project.discipline}</dd></div>
          <div><dt>What I did</dt><dd>${project.services.join(", ")}</dd></div>
          <div><dt>Year</dt><dd>${project.year}</dd></div>
        </dl>
      </aside>

      <div class="case-brief__story" data-case-reveal>
        <h2 id="case-brief-heading">${project.summary}</h2>
        <p class="case-brief__lead">${projectLead}</p>
        <h3>${project.chapterTitle}</h3>
        <p>${projectStoryOne}</p>
        <p>${projectStoryTwo}</p>
        <button class="case-brief__more" type="button" aria-expanded="false">More info</button>
      </div>
    </section>

    <section class="case-work" aria-label="${project.title} work showcase">
      ${isFlipProject ? flipGallery : isBotanicaProject ? botanicaGallery : `
        ${media("case-media--wide case-media--soft", "opening image")}
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
      `}
    </section>

    <a class="case-next" href="case-study.html?project=${nextNumber}" data-case-reveal>
      <span>/ Next project</span>
      <strong>${nextProject.title}</strong>
      <span aria-hidden="true">↘</span>
    </a>
  </article>
`;
const moreButton = content.querySelector(".case-brief__more");
const story = content.querySelector(".case-brief__story");
moreButton?.addEventListener("click", () => {
    const expanded = moreButton.getAttribute("aria-expanded") === "true";
    moreButton.setAttribute("aria-expanded", String(!expanded));
    moreButton.textContent = expanded ? "More info" : "Less info";
    story?.classList.toggle("is-expanded", !expanded);
});
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
