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
const copies = 3;
track.innerHTML = Array.from({ length: copies }, (_, copyIndex) => projects
    .map((project) => `
        <article
          class="project-shell"
          role="listitem"
          ${copyIndex === 1 ? "" : 'aria-hidden="true"'}
        >
          <div class="project-card project-card--${project.style}">
            <div class="project-card__meta">
              <div class="project-card__tags">
                ${project.tags.map((tag) => `<span>${tag}</span>`).join("")}
              </div>
              <div class="project-card__title">
                <strong>PROJECT ${project.number} — ${project.title}</strong>
                <span>${project.number} / TODO</span>
              </div>
            </div>
          </div>
        </article>
      `)
    .join("")).join("");
year.textContent = String(new Date().getFullYear());
const shells = [...track.querySelectorAll(".project-shell")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
shells.forEach((shell, index) => {
    shell.style.setProperty("--card-order", String(index % projects.length));
});
const FRAME_DURATION = 1000 / 60;
const FRICTION_PER_FRAME = 0.875;
const MAX_VELOCITY = 3.6;
const STOP_SPEED = 0.008;
const META_REVEAL_SPEED = 1.25;
const META_REVEAL_IDLE = 28;
let currentOffset = 0;
let railVelocity = 0;
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
let frameLag = 0;
let frameLagVelocity = 0;
let motionDirection = "left";
let metadataHidden = false;
let lastMotionInputTime = 0;
let revealTimer = null;
let gyroTargetX = 0;
let gyroTargetY = 0;
let gyroX = 0;
let gyroY = 0;
let gyroPresenceTarget = 0;
let gyroPresence = 0;
const modulo = (value, divisor) => ((value % divisor) + divisor) % divisor;
const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);
const clearRevealState = () => {
    if (revealTimer !== null) {
        window.clearTimeout(revealTimer);
        revealTimer = null;
    }
    stage.classList.remove("reveal-from-left", "reveal-from-right");
};
const beginMotion = (offsetDelta, now = performance.now()) => {
    if (reducedMotion.matches || Math.abs(offsetDelta) < 0.01)
        return;
    motionDirection = offsetDelta > 0 ? "left" : "right";
    lastMotionInputTime = now;
    metadataHidden = true;
    clearRevealState();
    stage.classList.add("is-moving");
    stage.style.setProperty("--meta-hide-x", motionDirection === "left" ? "8px" : "-8px");
};
const revealMetadata = () => {
    if (reducedMotion.matches || isDragging || !metadataHidden)
        return;
    metadataHidden = false;
    stage.classList.remove("is-moving");
    clearRevealState();
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
    sequenceStride = projects.length * (tileWidth + railGap);
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
    const compression = clamp(Math.abs(railVelocity) * 0.18 + Math.abs(frameLagVelocity) * 0.08, 0, 0.32);
    const frameScaleY = 1 - compression;
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
        const lift = -Math.abs(frameLag) * 0.65 * edgeWeight;
        const depth = proximity * 4.5;
        const gyroRotateX = -gyroY * (1.65 + proximity * 0.42);
        const gyroRotateY = gyroX * 2.1 + localDirection * proximity * 1.25;
        shell.style.setProperty("--card-inertia-x", `${inertiaX}px`);
        shell.style.setProperty("--card-inertia-y", `${inertiaY}deg`);
        shell.style.setProperty("--card-lift", `${lift}px`);
        shell.style.setProperty("--card-depth", `${depth}px`);
        shell.style.setProperty("--frame-scale-y", String(frameScaleY));
        shell.style.setProperty("--card-gyro-x", `${gyroRotateX}deg`);
        shell.style.setProperty("--card-gyro-y", `${gyroRotateY}deg`);
    });
};
const renderRail = (timestamp) => {
    animationFrame = null;
    const deltaTime = clamp(timestamp - lastFrameTime || FRAME_DURATION, 4, 34);
    lastFrameTime = timestamp;
    const gyroEase = 1 - Math.exp(-deltaTime / 165);
    const presenceEase = 1 - Math.exp(-deltaTime / 120);
    gyroX += (gyroTargetX - gyroX) * gyroEase;
    gyroY += (gyroTargetY - gyroY) * gyroEase;
    gyroPresence += (gyroPresenceTarget - gyroPresence) * presenceEase;
    if (!isDragging && !reducedMotion.matches) {
        currentOffset += railVelocity * deltaTime;
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
    const gyroRailX = gyroX * 2.2;
    const gyroRailY = gyroY * 1.6;
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
    const needsMotionFrame = !isDragging && speed > 0;
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
    stage.classList.remove("is-moving", "reveal-from-left", "reveal-from-right");
    metadataHidden = false;
    railVelocity = 0;
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
        shell.style.removeProperty("--card-lift");
        shell.style.removeProperty("--card-depth");
        shell.style.removeProperty("--frame-scale-y");
        shell.style.removeProperty("--card-gyro-x");
        shell.style.removeProperty("--card-gyro-y");
    });
    requestRender();
});
measureRail();
renderRail(performance.now());
