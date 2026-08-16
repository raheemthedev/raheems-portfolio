interface CaseStudyProject {
  number: string;
  title: string;
  discipline: string;
  year: string;
  summary: string;
  services: string[];
}

const caseStudyProjects: Record<string, CaseStudyProject> = {
  "01": {
    number: "01",
    title: "Project title",
    discipline: "Visual Identity",
    year: "2026",
    summary: "A flexible identity system built to make a growing brand feel clear, considered, and unmistakable.",
    services: ["Strategy", "Identity", "Guidelines"],
  },
  "02": {
    number: "02",
    title: "Project title",
    discipline: "Brand System",
    year: "2026",
    summary: "A brand system that gives a new venture the structure to move consistently across every touchpoint.",
    services: ["Brand system", "Art direction", "Digital"],
  },
  "03": {
    number: "03",
    title: "Project title",
    discipline: "Art Direction",
    year: "2025",
    summary: "A visual direction that turns a point of view into a recognizable world for people to step into.",
    services: ["Concept", "Campaign", "Editorial"],
  },
  "04": {
    number: "04",
    title: "Project title",
    discipline: "Packaging",
    year: "2025",
    summary: "Packaging designed to hold attention on the shelf while keeping the product story direct and useful.",
    services: ["Packaging", "Typography", "Production"],
  },
  "05": {
    number: "05",
    title: "Project title",
    discipline: "Campaign Design",
    year: "2024",
    summary: "A campaign language made for movement, giving a launch a sharper rhythm across physical and digital media.",
    services: ["Campaign", "Motion", "Social"],
  },
  "06": {
    number: "06",
    title: "Project title",
    discipline: "Digital Expression",
    year: "2024",
    summary: "A digital expression that carries the identity into a responsive, animated, and easy-to-use experience.",
    services: ["Web design", "Interaction", "Development"],
  },
};

const content = document.querySelector<HTMLElement>("#case-study-content");
if (!content) throw new Error("Case study content mount is missing.");

const requestedProject = new URLSearchParams(window.location.search).get("project") ?? "01";
const project = caseStudyProjects[requestedProject] ?? caseStudyProjects["01"];

content.innerHTML = `
  <header class="case-study-hero">
    <div class="case-study-hero__meta">
      <span>/${project.discipline}</span>
      <span>${project.year} / ${project.number}</span>
    </div>
    <div class="case-study-hero__copy">
      <p class="case-study-label">/ CASE STUDY</p>
      <h1>${project.title}</h1>
      <p class="case-study-hero__summary">${project.summary}</p>
    </div>
    <div class="case-study-hero__visual">
      <img src="reference/casestudy.png" alt="${project.title} project process preview" />
      <span class="case-study-hero__visual-note">motion / identity / digital</span>
    </div>
  </header>

  <section class="case-study-brief" aria-labelledby="case-study-brief-title">
    <p class="case-study-label">/ THE BRIEF</p>
    <div class="case-study-brief__grid">
      <h2 id="case-study-brief-title">A considered system with enough character to stay memorable.</h2>
      <div>
        <p>${project.summary}</p>
        <p>We shaped the visual language from the first direction through the final touchpoints, keeping each decision useful, legible, and ready to move.</p>
      </div>
    </div>
  </section>

  <section class="case-study-process" aria-labelledby="case-study-process-title">
    <div class="case-study-process__heading">
      <p class="case-study-label">/ PROCESS</p>
      <h2 id="case-study-process-title">From first thought to a working world.</h2>
    </div>
    <div class="case-study-process__grid">
      <div class="case-study-process__panel case-study-process__panel--dark"><span>01</span><strong>Direction</strong></div>
      <div class="case-study-process__panel case-study-process__panel--mid"><span>02</span><strong>System</strong></div>
      <div class="case-study-process__panel case-study-process__panel--light"><span>03</span><strong>Delivery</strong></div>
    </div>
  </section>

  <section class="case-study-services" aria-labelledby="case-study-services-title">
    <p class="case-study-label">/ SERVICES</p>
    <div class="case-study-services__row">
      <h2 id="case-study-services-title">${project.services.join(" / ")}</h2>
      <a href="work.html">Back to selected work <span aria-hidden="true">↗</span></a>
    </div>
  </section>
`;
