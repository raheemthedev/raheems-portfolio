// Every project in the portfolio. Shared by the Work page (work.ts) and the
// archive (archive.ts); add new work here and both pages pick it up.

interface ArchiveProject {
  number: string;
  title: string;
  discipline: string;
  category: "identity" | "exhibition" | "direction" | "packaging" | "campaign" | "digital";
  style: string;
  year: string;
  summary: string;
  services: string[];
  image?: string;
  hoverImage?: string;
  imageAlt?: string;
  gallery?: string[];
  href?: string;
}

const archiveProjects: ArchiveProject[] = [
  {
    number: "01",
    title: "Flip",
    discipline: "Fintech / Cryptocurrency",
    category: "identity",
    style: "identity",
    year: "2024",
    summary: "A crypto exchange experience as simple as flipping a coin.",
    services: ["Brand identity", "Art direction", "Illustration"],
    image: "assets/projects/flip/LCover.jpg",
    hoverImage: "assets/projects/flip/flip-hover-all.gif?v=3",
    imageAlt: "Flip cryptocurrency exchange visual identity",
    gallery: [
      "assets/projects/flip/L1.jpg",
      "assets/projects/flip/L2.jpg",
      "assets/projects/flip/L3.jpg",
      "assets/projects/flip/L4.jpg",
      "assets/projects/flip/L5.jpg",
      "assets/projects/flip/L6.jpg",
      "assets/projects/flip/L7.jpg",
    ],
  },
  {
    number: "02",
    title: "Electronic Botanica",
    discipline: "Exhibition Identity",
    category: "exhibition",
    style: "brand",
    year: "2026",
    summary: "A generative art exhibition exploring the collision between organic forms and digital systems.",
    services: ["Brand identity", "Art direction", "Generative design"],
    image: "assets/projects/electronic-botanica/l4-cover.jpg",
    hoverImage: "assets/projects/electronic-botanica/hover.gif?v=1",
    imageAlt: "Electronic Botanica generative art exhibition identity",
    gallery: [
      "assets/projects/electronic-botanica/l4-cover.jpg",
      "assets/projects/electronic-botanica/l5.jpg",
      "assets/projects/electronic-botanica/l6.jpg",
      "assets/projects/electronic-botanica/l8.jpg",
      "assets/projects/electronic-botanica/l11.jpg",
      "assets/projects/electronic-botanica/p12.gif",
      "assets/projects/electronic-botanica/p13.webp",
    ],
  },
];

archiveProjects.push(
  { number: "03", title: "Project 03", discipline: "Art Direction", category: "direction", style: "direction", year: "TBC", summary: "Placeholder — project details and artwork to come.", services: ["Art Direction"] },
  { number: "04", title: "Project 04", discipline: "Packaging", category: "packaging", style: "packaging", year: "TBC", summary: "Placeholder — project details and artwork to come.", services: ["Packaging"] },
  { number: "05", title: "Project 05", discipline: "Campaign Design", category: "campaign", style: "campaign", year: "TBC", summary: "Placeholder — project details and artwork to come.", services: ["Campaign Design"] },
  { number: "06", title: "Project 06", discipline: "Digital Expression", category: "digital", style: "digital", year: "TBC", summary: "Placeholder — project details and artwork to come.", services: ["Digital Expression"] },
);
