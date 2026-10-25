"use strict";
// Every project in the portfolio. Shared by the Work page (work.ts) and the
// archive (archive.ts); add new work here and both pages pick it up.
const archiveProjects = [
    {
        number: "01",
        title: "Flip",
        discipline: "Fintech / Cryptocurrency",
        category: "identity",
        style: "identity",
        year: "2024",
        summary: "A crypto exchange experience as simple as flipping a coin.",
        services: ["Brand identity", "Art direction", "Illustration"],
        image: "assets/projects/flip/LCover.webp",
        hoverImage: "assets/projects/flip/flip-hover-all.gif?v=3",
        imageAlt: "Flip cryptocurrency exchange visual identity",
        gallery: [
            "assets/projects/flip/L1.webp",
            "assets/projects/flip/L2.webp",
            "assets/projects/flip/L3.webp",
            "assets/projects/flip/L4.webp",
            "assets/projects/flip/L5.webp",
            "assets/projects/flip/L6.webp",
            "assets/projects/flip/L7.webp",
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
        image: "assets/projects/electronic-botanica/l4-cover.webp",
        hoverImage: "assets/projects/electronic-botanica/hover.gif?v=1",
        imageAlt: "Electronic Botanica generative art exhibition identity",
        gallery: [
            "assets/projects/electronic-botanica/l4-cover.webp",
            "assets/projects/electronic-botanica/l5.webp",
            "assets/projects/electronic-botanica/l6.webp",
            "assets/projects/electronic-botanica/l8.webp",
            "assets/projects/electronic-botanica/l11.webp",
            "assets/projects/electronic-botanica/p12.webp",
            "assets/projects/electronic-botanica/p13.webp",
        ],
    },
];
archiveProjects.push({ number: "03", title: "Project 03", discipline: "Art Direction", category: "direction", style: "direction", year: "TBC", summary: "Placeholder — project details and artwork to come.", services: ["Art Direction"] }, { number: "04", title: "Project 04", discipline: "Packaging", category: "packaging", style: "packaging", year: "TBC", summary: "Placeholder — project details and artwork to come.", services: ["Packaging"] }, { number: "05", title: "Project 05", discipline: "Campaign Design", category: "campaign", style: "campaign", year: "TBC", summary: "Placeholder — project details and artwork to come.", services: ["Campaign Design"] }, { number: "06", title: "Project 06", discipline: "Digital Expression", category: "digital", style: "digital", year: "TBC", summary: "Placeholder — project details and artwork to come.", services: ["Digital Expression"] });
