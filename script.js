"use strict";
// Browser build: npm run build
const root = document.documentElement;
const landing = document.querySelector(".landing");
const stage = document.querySelector(".project-stage");
const track = document.querySelector(".project-track");
const shaderCanvas = document.querySelector(".project-shader");
const year = document.querySelector("#year");
if (!landing || !stage || !track || !shaderCanvas || !year) {
    throw new Error("Project rail markup is incomplete.");
}
const projects = [
    {
        number: "05",
        title: "TODO TITLE",
        tags: ["CAMPAIGN DESIGN", "TODO DISCIPLINE"],
        style: "campaign",
    },
    {
        number: "06",
        title: "TODO TITLE",
        tags: ["DIGITAL EXPRESSION", "TODO DISCIPLINE"],
        style: "digital",
    },
    {
        number: "01",
        title: "TODO TITLE",
        tags: ["TODO DISCIPLINE", "VISUAL IDENTITY"],
        style: "identity",
    },
    {
        number: "02",
        title: "TODO TITLE",
        tags: ["BRAND SYSTEM", "TODO DISCIPLINE"],
        style: "brand",
    },
    {
        number: "03",
        title: "TODO TITLE",
        tags: ["ART DIRECTION", "TODO DISCIPLINE"],
        style: "direction",
    },
    {
        number: "04",
        title: "TODO TITLE",
        tags: ["PACKAGING", "TODO DISCIPLINE"],
        style: "packaging",
    },
];
// Keep several complete sequences in the rail so a fractional viewport or zoom
// never reaches the end of the rendered track while the loop is being wrapped.
const copies = 4;
track.innerHTML = Array.from({ length: copies }, (_, copyIndex) => projects
    .map((project) => `
        <article
          class="project-shell"
          role="listitem"
          ${copyIndex === 1 ? "" : 'aria-hidden="true"'}
        >
          <a class="project-card project-card--${project.style}" href="case-study.html?project=${encodeURIComponent(project.number)}" aria-label="View project ${project.number} case study" ${copyIndex === 1 ? "" : 'tabindex="-1"'}>
            <div class="project-card__media">
              ${project.image ? `<img src="${project.image}" alt="${project.imageAlt ?? project.title}" />` : ""}
            </div>
            <div class="project-card__meta">
              <div class="project-card__tags">
                ${project.tags.map((tag) => `<span>${tag}</span>`).join("")}
              </div>
              <div class="project-card__title">
                <strong>PROJECT ${project.number} — ${project.title}</strong>
                <span>${project.number} / TODO</span>
              </div>
            </div>
          </a>
        </article>
      `)
    .join("")).join("");
year.textContent = String(new Date().getFullYear());
const shells = [...track.querySelectorAll(".project-shell")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const siteLoader = document.querySelector(".site-loader");
const loaderWord = siteLoader?.querySelector(".site-loader__word") ?? null;
const loaderPieces = [...document.querySelectorAll("[data-loader-piece]")];
const cornerTargets = [
    document.querySelector(".corner-mark--top-left"),
    document.querySelector(".corner-mark--top-right"),
    document.querySelector(".corner-mark--bottom-left"),
    document.querySelector(".corner-mark--bottom-right"),
];
shells.forEach((shell, index) => {
    shell.style.setProperty("--card-order", String(index % projects.length));
});
const FRAME_DURATION = 1000 / 60;
const FRICTION_PER_FRAME = 0.875;
const MAX_VELOCITY = 3.6;
const STOP_SPEED = 0.008;
const META_REVEAL_SPEED = 1.6;
const META_REVEAL_IDLE = 112;
const AUTO_SCROLL_SPEED = 0.022;
const AUTO_SCROLL_HOVER_SPEED = 0.0008;
const AUTO_SCROLL_EASE = 760;
let currentOffset = 0;
let railVelocity = 0;
let autoScrollVelocity = reducedMotion.matches ? 0 : AUTO_SCROLL_SPEED;
let sequenceStride = 1;
let groupWidth = 1;
let tileWidth = 1;
let railGap = 0;
let animationFrame = null;
let lastFrameTime = performance.now();
let isDragging = false;
let lastPointerX = 0;
let lastPointerTime = 0;
let pointerVelocity = 0;
let dragDistance = 0;
let frameLag = 0;
let frameLagVelocity = 0;
let motionDirection = "left";
let metadataHidden = false;
let lastMotionInputTime = 0;
let isStageHovered = false;
let gyroTargetX = 0;
let gyroTargetY = 0;
let gyroX = 0;
let gyroY = 0;
let gyroPresenceTarget = 0;
let gyroPresence = 0;
const modulo = (value, divisor) => ((value % divisor) + divisor) % divisor;
const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);
const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));
const finishSiteLoader = async (fadeDuration = 140) => {
    document.body.classList.remove("is-loader-active");
    if (!siteLoader)
        return;
    if (fadeDuration <= 0 || !("animate" in siteLoader)) {
        siteLoader.remove();
        return;
    }
    try {
        const fade = siteLoader.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fadeDuration, easing: "ease-out", fill: "forwards" });
        await fade.finished;
    }
    catch {
        // Removing the loader is more important than preserving the final fade.
    }
    siteLoader.remove();
};
const runSiteLoader = async () => {
    const panelTop = siteLoader?.querySelector(".site-loader__panel--top");
    const panelRight = siteLoader?.querySelector(".site-loader__panel--right");
    const panelBottom = siteLoader?.querySelector(".site-loader__panel--bottom");
    const panelLeft = siteLoader?.querySelector(".site-loader__panel--left");
    const siteHeader = document.querySelector(".site-header");
    const statement = document.querySelector(".statement");
    const scrollCue = document.querySelector(".scroll-cue");
    const panelsReady = panelTop && panelRight && panelBottom && panelLeft;
    const targetsReady = cornerTargets.every((target) => target !== null);
    if (!siteLoader ||
        !("animate" in siteLoader) ||
        !loaderWord ||
        loaderPieces.length !== 4 ||
        !panelsReady ||
        !targetsReady) {
        await finishSiteLoader(0);
        return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    try {
        await document.fonts.ready;
    }
    catch {
        // Continue with the fallback font metrics if font loading is unavailable.
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    if (reducedMotion.matches) {
        await wait(500);
        await finishSiteLoader(320);
        return;
    }
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isCompact = viewportWidth <= 800;
    const windowWidthRatio = isCompact ? 0.8 : 0.48;
    const windowHeightRatio = isCompact ? 0.56 : 0.58;
    const windowFrame = {
        left: viewportWidth * ((1 - windowWidthRatio) / 2),
        right: viewportWidth * ((1 + windowWidthRatio) / 2),
        top: viewportHeight * ((1 - windowHeightRatio) / 2),
        bottom: viewportHeight * ((1 + windowHeightRatio) / 2),
    };
    const horizontalOffset = isCompact ? 14 : clamp(viewportWidth * 0.023, 22, 38);
    const topOffset = isCompact ? 18 : clamp(viewportHeight * 0.034, 24, 38);
    const bottomOffset = isCompact ? 14 : clamp(viewportHeight * 0.02, 14, 24);
    const midpointCenters = [
        { x: windowFrame.left - horizontalOffset, y: windowFrame.top - topOffset },
        { x: windowFrame.right + horizontalOffset, y: windowFrame.top - topOffset },
        { x: windowFrame.left - horizontalOffset, y: windowFrame.bottom + bottomOffset },
        { x: windowFrame.right + horizontalOffset, y: windowFrame.bottom + bottomOffset },
    ];
    const pieceGeometry = loaderPieces.map((piece, index) => {
        const pieceBounds = piece.getBoundingClientRect();
        const targetBounds = cornerTargets[index].getBoundingClientRect();
        const startCenter = {
            x: pieceBounds.left + pieceBounds.width / 2,
            y: pieceBounds.top + pieceBounds.height / 2,
        };
        const targetCenter = {
            x: targetBounds.left + targetBounds.width / 2,
            y: targetBounds.top + targetBounds.height / 2,
        };
        const targetScale = targetBounds.height / Math.max(pieceBounds.height, 1);
        return {
            startCenter,
            targetCenter,
            midpointCenter: midpointCenters[index],
            targetScale,
            midpointScale: targetScale * 1.06,
        };
    });
    const phaseOneDuration = 920;
    const phaseTwoDuration = 1040;
    const phaseOneEasing = "cubic-bezier(0.62, 0, 0.16, 1)";
    const phaseTwoEasing = "cubic-bezier(0.76, 0, 0.24, 1)";
    await wait(520);
    const phaseOnePanels = [
        panelTop.animate([
            { height: "50vh" },
            { height: `${windowFrame.top}px` },
        ], { duration: phaseOneDuration, easing: phaseOneEasing, fill: "forwards" }),
        panelBottom.animate([
            { height: "50vh" },
            { height: `${viewportHeight - windowFrame.bottom}px` },
        ], { duration: phaseOneDuration, easing: phaseOneEasing, fill: "forwards" }),
        panelLeft.animate([
            { top: "50vh", bottom: "50vh", width: "50vw" },
            {
                top: `${windowFrame.top}px`,
                bottom: `${viewportHeight - windowFrame.bottom}px`,
                width: `${windowFrame.left}px`,
            },
        ], { duration: phaseOneDuration, easing: phaseOneEasing, fill: "forwards" }),
        panelRight.animate([
            { top: "50vh", bottom: "50vh", width: "50vw" },
            {
                top: `${windowFrame.top}px`,
                bottom: `${viewportHeight - windowFrame.bottom}px`,
                width: `${viewportWidth - windowFrame.right}px`,
            },
        ], { duration: phaseOneDuration, easing: phaseOneEasing, fill: "forwards" }),
    ];
    const phaseOnePieces = loaderPieces.map((piece, index) => {
        const geometry = pieceGeometry[index];
        return piece.animate([
            { transform: "translate3d(0, 0, 0) scale(1)", opacity: 1 },
            {
                transform: `translate3d(${geometry.midpointCenter.x - geometry.startCenter.x}px, ${geometry.midpointCenter.y - geometry.startCenter.y}px, 0) scale(${geometry.midpointScale})`,
                opacity: 0.62,
            },
        ], { duration: phaseOneDuration, easing: phaseOneEasing, fill: "forwards" });
    });
    await Promise.all([...phaseOnePanels, ...phaseOnePieces].map((animation) => animation.finished));
    await wait(240);
    const phaseTwoPanels = [
        panelTop.animate([{ height: `${windowFrame.top}px` }, { height: "0px" }], { duration: phaseTwoDuration, easing: phaseTwoEasing, fill: "forwards" }),
        panelBottom.animate([{ height: `${viewportHeight - windowFrame.bottom}px` }, { height: "0px" }], { duration: phaseTwoDuration, easing: phaseTwoEasing, fill: "forwards" }),
        panelLeft.animate([
            {
                top: `${windowFrame.top}px`,
                bottom: `${viewportHeight - windowFrame.bottom}px`,
                width: `${windowFrame.left}px`,
            },
            { top: "0px", bottom: "0px", width: "0px" },
        ], { duration: phaseTwoDuration, easing: phaseTwoEasing, fill: "forwards" }),
        panelRight.animate([
            {
                top: `${windowFrame.top}px`,
                bottom: `${viewportHeight - windowFrame.bottom}px`,
                width: `${viewportWidth - windowFrame.right}px`,
            },
            { top: "0px", bottom: "0px", width: "0px" },
        ], { duration: phaseTwoDuration, easing: phaseTwoEasing, fill: "forwards" }),
    ];
    const phaseTwoPieces = loaderPieces.map((piece, index) => {
        const geometry = pieceGeometry[index];
        return piece.animate([
            {
                transform: `translate3d(${geometry.midpointCenter.x - geometry.startCenter.x}px, ${geometry.midpointCenter.y - geometry.startCenter.y}px, 0) scale(${geometry.midpointScale})`,
                opacity: 0.62,
            },
            {
                transform: `translate3d(${geometry.targetCenter.x - geometry.startCenter.x}px, ${geometry.targetCenter.y - geometry.startCenter.y}px, 0) scale(${geometry.targetScale})`,
                opacity: 1,
            },
        ], { duration: phaseTwoDuration, easing: phaseTwoEasing, fill: "forwards" });
    });
    await wait(540);
    const landingAnimations = [];
    if (siteHeader) {
        landingAnimations.push(siteHeader.animate([
            { opacity: 0, translate: "0 -12px" },
            { opacity: 1, translate: "0 0" },
        ], { duration: 620, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }));
    }
    if (statement) {
        landingAnimations.push(statement.animate([
            { opacity: 0, translate: "0 22px" },
            { opacity: 1, translate: "0 0" },
        ], { duration: 760, delay: 80, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }));
    }
    landingAnimations.push(stage.animate([
        { opacity: 0, clipPath: "inset(48% 0 48% 0 round 14px)" },
        { opacity: 1, clipPath: "inset(0% 0 0% 0 round 0px)" },
    ], { duration: 900, delay: 150, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }));
    if (scrollCue) {
        landingAnimations.push(scrollCue.animate([
            { opacity: 0, translate: "0 12px" },
            { opacity: 1, translate: "0 0" },
        ], { duration: 560, delay: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }));
    }
    await Promise.all([...phaseTwoPanels, ...phaseTwoPieces, ...landingAnimations].map((animation) => animation.finished));
    await finishSiteLoader();
};
const beginMotion = (offsetDelta, now = performance.now()) => {
    if (reducedMotion.matches || Math.abs(offsetDelta) < 0.01)
        return;
    motionDirection = offsetDelta > 0 ? "left" : "right";
    lastMotionInputTime = now;
    metadataHidden = true;
    stage.classList.add("is-moving");
    stage.style.setProperty("--meta-hide-x", motionDirection === "left" ? "12px" : "-12px");
};
const revealMetadata = () => {
    if (reducedMotion.matches || isDragging || !metadataHidden)
        return;
    metadataHidden = false;
    stage.classList.remove("is-moving");
};
const compileShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    if (!shader)
        return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn("Project shader compile failed:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
};
const createShaderRenderer = (canvas) => {
    const gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        depth: false,
        premultipliedAlpha: true,
        powerPreference: "high-performance",
    });
    if (!gl) {
        canvas.hidden = true;
        return null;
    }
    const vertexSource = `
    attribute vec2 a_position;

    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;
    const fragmentSource = `
    precision mediump float;

    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_velocity;
    uniform float u_rail_x;
    uniform float u_stride;
    uniform float u_card_width;

    float hash(vec2 point) {
      return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float local_x = mod(gl_FragCoord.x - u_rail_x, u_stride);
      float left_edge = smoothstep(0.0, 2.0, local_x);
      float right_edge = 1.0 - smoothstep(u_card_width - 2.0, u_card_width, local_x);
      float inside_card = left_edge * right_edge;

      float drift = sin((uv.x * 2.4 + uv.y * 1.7 + u_time * 0.035 + u_velocity * 0.4) * 6.28318);
      float grain = hash(floor(gl_FragCoord.xy * 0.55) + floor(u_time * 3.0));
      float energy = clamp(abs(u_velocity), 0.0, 1.0);
      float tone = 0.42 + drift * 0.022 + (grain - 0.5) * (0.024 + energy * 0.018);
      float alpha = inside_card * (0.28 + energy * 0.08);

      gl_FragColor = vec4(vec3(tone), alpha);
    }
  `;
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) {
        canvas.hidden = true;
        return null;
    }
    const program = gl.createProgram();
    if (!program) {
        canvas.hidden = true;
        return null;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn("Project shader link failed:", gl.getProgramInfoLog(program));
        canvas.hidden = true;
        return null;
    }
    const buffer = gl.createBuffer();
    const positionLocation = gl.getAttribLocation(program, "a_position");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const velocityLocation = gl.getUniformLocation(program, "u_velocity");
    const railXLocation = gl.getUniformLocation(program, "u_rail_x");
    const strideLocation = gl.getUniformLocation(program, "u_stride");
    const cardWidthLocation = gl.getUniformLocation(program, "u_card_width");
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    const resize = () => {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(1, Math.round(stage.clientWidth * pixelRatio));
        const height = Math.max(1, Math.round(stage.clientHeight * pixelRatio));
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            gl.viewport(0, 0, width, height);
        }
    };
    const render = (time, velocity, railX, stride, cardWidth) => {
        resize();
        const pixelRatio = canvas.width / Math.max(stage.clientWidth, 1);
        gl.useProgram(program);
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        gl.uniform1f(timeLocation, time * 0.001);
        gl.uniform1f(velocityLocation, clamp(velocity / MAX_VELOCITY, -1, 1));
        gl.uniform1f(railXLocation, railX * pixelRatio);
        gl.uniform1f(strideLocation, Math.max(stride * pixelRatio, 1));
        gl.uniform1f(cardWidthLocation, Math.max(cardWidth * pixelRatio, 1));
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    return { resize, render };
};
const shaderRenderer = createShaderRenderer(shaderCanvas);
const measureRail = () => {
    const firstTile = track.querySelector(".project-shell");
    if (!firstTile)
        return;
    const styles = getComputedStyle(track);
    railGap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
    tileWidth = firstTile.getBoundingClientRect().width;
    const nextSequenceTile = shells[projects.length];
    const measuredStride = nextSequenceTile
        ? nextSequenceTile.offsetLeft - firstTile.offsetLeft
        : 0;
    sequenceStride = measuredStride > 0
        ? measuredStride
        : projects.length * (tileWidth + railGap);
    groupWidth = sequenceStride - railGap;
    shaderRenderer?.resize();
};
const renderFramePhysics = (deltaTime) => {
    if (reducedMotion.matches)
        return;
    const frameScale = deltaTime / FRAME_DURATION;
    const lagTarget = clamp(-railVelocity / MAX_VELOCITY, -1, 1);
    frameLagVelocity += (lagTarget - frameLag) * 0.095 * frameScale;
    frameLagVelocity *= Math.pow(0.7, frameScale);
    frameLag += frameLagVelocity * frameScale;
    const stageBounds = stage.getBoundingClientRect();
    const stageCenter = stageBounds.left + stageBounds.width / 2;
    const cursorX = stageCenter + gyroX * stageBounds.width / 2;
    shells.forEach((shell) => {
        const shellBounds = shell.getBoundingClientRect();
        const shellCenter = shellBounds.left + shellBounds.width / 2;
        const stagePosition = clamp((shellCenter - stageCenter) / (stageBounds.width / 2), -1.3, 1.3);
        const cursorDistance = Math.abs(shellCenter - cursorX) / (stageBounds.width * 0.52);
        const proximity = clamp(1 - cursorDistance, 0, 1) * gyroPresence;
        const localDirection = clamp((cursorX - shellCenter) / (stageBounds.width * 0.42), -1, 1);
        const edgeWeight = 1 - Math.min(Math.abs(stagePosition), 1) * 0.12;
        const inertiaX = frameLag * 9 * edgeWeight;
        const inertiaY = frameLag * 1.05;
        const depth = proximity * 2.5;
        const gyroRotateX = -gyroY * (1.1 + proximity * 0.25);
        const gyroRotateY = gyroX * 1.4 + localDirection * proximity * 0.65;
        shell.style.setProperty("--card-inertia-x", `${inertiaX}px`);
        shell.style.setProperty("--card-inertia-y", `${inertiaY}deg`);
        shell.style.setProperty("--card-depth", `${depth}px`);
        shell.style.setProperty("--card-gyro-x", `${gyroRotateX}deg`);
        shell.style.setProperty("--card-gyro-y", `${gyroRotateY}deg`);
    });
};
const renderRail = (timestamp) => {
    animationFrame = null;
    const deltaTime = clamp(timestamp - lastFrameTime || FRAME_DURATION, 4, 34);
    lastFrameTime = timestamp;
    const gyroEase = 1 - Math.exp(-deltaTime / 190);
    const presenceEase = 1 - Math.exp(-deltaTime / 150);
    gyroX += (gyroTargetX - gyroX) * gyroEase;
    gyroY += (gyroTargetY - gyroY) * gyroEase;
    gyroPresence += (gyroPresenceTarget - gyroPresence) * presenceEase;
    const autoScrollTarget = reducedMotion.matches
        ? 0
        : isStageHovered
            ? AUTO_SCROLL_HOVER_SPEED
            : AUTO_SCROLL_SPEED;
    const autoScrollEase = 1 - Math.exp(-deltaTime / AUTO_SCROLL_EASE);
    autoScrollVelocity += (autoScrollTarget - autoScrollVelocity) * autoScrollEase;
    if (!isDragging && !reducedMotion.matches) {
        currentOffset += (railVelocity + autoScrollVelocity) * deltaTime;
        railVelocity *= Math.pow(FRICTION_PER_FRAME, deltaTime / FRAME_DURATION);
        if (Math.abs(railVelocity) < STOP_SPEED) {
            railVelocity = 0;
        }
    }
    if (Math.abs(currentOffset) > sequenceStride * 100) {
        currentOffset = modulo(currentOffset, sequenceStride);
    }
    const phase = modulo(currentOffset, sequenceStride);
    const centeredStart = (stage.clientWidth - groupWidth) / 2;
    const railX = centeredStart - sequenceStride - phase;
    const gyroRailX = gyroX * 1.2;
    const gyroRailY = gyroY * 0.8;
    root.style.setProperty("--rail-x", `${railX}px`);
    root.style.setProperty("--gyro-rail-x", `${gyroRailX}px`);
    root.style.setProperty("--gyro-rail-y", `${gyroRailY}px`);
    renderFramePhysics(deltaTime);
    shaderRenderer?.render(timestamp, railVelocity, railX + gyroRailX, tileWidth + railGap, tileWidth);
    const speed = Math.abs(railVelocity);
    if (metadataHidden &&
        !isDragging &&
        speed <= META_REVEAL_SPEED &&
        timestamp - lastMotionInputTime >= META_REVEAL_IDLE) {
        revealMetadata();
    }
    const gyroMoving = Math.abs(gyroTargetX - gyroX) > 0.001 ||
        Math.abs(gyroTargetY - gyroY) > 0.001 ||
        Math.abs(gyroPresenceTarget - gyroPresence) > 0.001;
    const framePhysicsMoving = Math.abs(frameLag) > 0.001 ||
        Math.abs(frameLagVelocity) > 0.001;
    const autoScrollMoving = !reducedMotion.matches &&
        !isDragging &&
        (Math.abs(autoScrollVelocity) > 0.0001 ||
            Math.abs(autoScrollTarget - autoScrollVelocity) > 0.0001);
    const needsMotionFrame = !isDragging && (speed > 0 || autoScrollMoving);
    if (needsMotionFrame || gyroMoving || framePhysicsMoving) {
        animationFrame = requestAnimationFrame(renderRail);
    }
    else if (metadataHidden && !isDragging) {
        revealMetadata();
    }
};
const requestRender = () => {
    if (animationFrame === null) {
        lastFrameTime = performance.now();
        animationFrame = requestAnimationFrame(renderRail);
    }
};
const addVelocity = (distance, strength) => {
    const now = performance.now();
    beginMotion(distance, now);
    railVelocity = clamp(railVelocity + distance * strength, -MAX_VELOCITY, MAX_VELOCITY);
    requestRender();
};
stage.addEventListener("wheel", (event) => {
    const rawDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (rawDelta === 0)
        return;
    event.preventDefault();
    const modeScale = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? stage.clientWidth
            : 1;
    const delta = clamp(rawDelta * modeScale, -220, 220);
    if (reducedMotion.matches) {
        currentOffset += delta;
        railVelocity = 0;
        requestRender();
        return;
    }
    currentOffset += delta * 0.16;
    addVelocity(delta, 0.0135);
}, { passive: false });
track.addEventListener("pointerdown", (event) => {
    if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
    isDragging = true;
    lastPointerX = event.clientX;
    lastPointerTime = performance.now();
    pointerVelocity = 0;
    dragDistance = 0;
    railVelocity = 0;
    track.setPointerCapture(event.pointerId);
});
track.addEventListener("pointermove", (event) => {
    if (!isDragging)
        return;
    const now = performance.now();
    const elapsed = Math.max(1, now - lastPointerTime);
    const railDelta = -(event.clientX - lastPointerX);
    pointerVelocity = railDelta / elapsed;
    dragDistance += Math.abs(railDelta);
    railVelocity = pointerVelocity;
    currentOffset += railDelta;
    beginMotion(railDelta, now);
    lastPointerX = event.clientX;
    lastPointerTime = now;
    requestRender();
});
const finishDrag = (event) => {
    if (!isDragging)
        return;
    isDragging = false;
    const now = performance.now();
    const freshness = clamp(1 - (now - lastPointerTime) / 110, 0, 1);
    railVelocity = reducedMotion.matches
        ? 0
        : clamp(pointerVelocity * freshness * 0.92, -MAX_VELOCITY, MAX_VELOCITY);
    if (Math.abs(railVelocity) > STOP_SPEED) {
        beginMotion(railVelocity * FRAME_DURATION, now);
    }
    if (track.hasPointerCapture(event.pointerId)) {
        track.releasePointerCapture(event.pointerId);
    }
    requestRender();
};
track.addEventListener("pointerup", finishDrag);
track.addEventListener("pointercancel", finishDrag);
track.addEventListener("dragstart", (event) => event.preventDefault());
track.addEventListener("click", (event) => {
    const target = event.target instanceof Element
        ? event.target.closest(".project-card")
        : null;
    if (!target)
        return;
    event.preventDefault();
    if (dragDistance > 10)
        return;
    window.location.assign(target.href);
});
stage.addEventListener("pointerenter", () => {
    isStageHovered = true;
    requestRender();
});
stage.addEventListener("pointerleave", () => {
    isStageHovered = false;
    requestRender();
});
const resetGyro = () => {
    gyroTargetX = 0;
    gyroTargetY = 0;
    gyroPresenceTarget = 0;
    requestRender();
};
const updateGyroFromPointer = (event) => {
    const bounds = landing.getBoundingClientRect();
    const isInsideLanding = event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom;
    if (!isInsideLanding) {
        resetGyro();
        return;
    }
    gyroTargetX = clamp((event.clientX - (bounds.left + bounds.width / 2)) / (bounds.width / 2), -1, 1);
    gyroTargetY = clamp((event.clientY - (bounds.top + bounds.height / 2)) / (bounds.height / 2), -1, 1);
    gyroPresenceTarget = 1;
    requestRender();
};
landing.addEventListener("pointerenter", updateGyroFromPointer);
window.addEventListener("pointermove", updateGyroFromPointer, { passive: true });
landing.addEventListener("pointerleave", resetGyro);
window.addEventListener("blur", resetGyro);
track.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
        return;
    event.preventDefault();
    const distance = event.key === "ArrowLeft" ? -266 : 266;
    if (reducedMotion.matches) {
        currentOffset += distance;
        requestRender();
        return;
    }
    addVelocity(distance, 0.0045);
});
window.addEventListener("resize", () => {
    measureRail();
    requestRender();
});
reducedMotion.addEventListener("change", () => {
    stage.classList.remove("is-moving");
    metadataHidden = false;
    railVelocity = 0;
    autoScrollVelocity = reducedMotion.matches ? 0 : AUTO_SCROLL_SPEED;
    frameLag = 0;
    frameLagVelocity = 0;
    gyroTargetX = 0;
    gyroTargetY = 0;
    gyroX = 0;
    gyroY = 0;
    gyroPresenceTarget = 0;
    gyroPresence = 0;
    root.style.setProperty("--gyro-rail-x", "0px");
    root.style.setProperty("--gyro-rail-y", "0px");
    shells.forEach((shell) => {
        shell.style.removeProperty("--card-inertia-x");
        shell.style.removeProperty("--card-inertia-y");
        shell.style.removeProperty("--card-depth");
        shell.style.removeProperty("--card-gyro-x");
        shell.style.removeProperty("--card-gyro-y");
    });
    requestRender();
});
measureRail();
renderRail(performance.now());
void runSiteLoader().catch(() => finishSiteLoader(0));
