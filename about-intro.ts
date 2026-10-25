// The About page's "A little more about me" section. The desk is the design;
// the other takes are parked behind ?intro=lens|transcript|margins|slot. Each
// is built from the section's own copy
// — its eyebrow, headline and three notes — so the HTML stays the source.
//   lens        — "I tend to look twice": the notes sit faint, and a lens
//                 roams them (or follows the cursor), sharpening and enlarging
//                 whatever it passes over.
//   transcript  — "honest conversation": the section is an interview
//                 transcript with timecodes, the answers typing themselves in.
//   desk        — "the things I make, notice, save": the notes are index cards
//                 and prints dropped over the headline, to be picked up,
//                 thrown and rearranged.
//   margins     — the headline as an annotated proof: words are circled by
//                 hand as you scroll, with leader lines out to the notes.
//   slot        — "what makes ___ feel human": the section holds while the
//                 blank rolls through the things noticed, landing on
//                 "something" before the notes arrive.

type AboutIntro = "lens" | "transcript" | "desk" | "margins" | "slot";

const aboutIntros: { id: AboutIntro; label: string }[] = [
  { id: "lens", label: "Lens" },
  { id: "transcript", label: "Transcript" },
  { id: "desk", label: "Desk" },
  { id: "margins", label: "Margins" },
  { id: "slot", label: "Slot" },
];
// Where notes left on the desk go. With a Formspree form's endpoint here
// (https://formspree.io/f/…) they're sent quietly from the page; left empty,
// Send opens the visitor's mail app addressed to Raheem instead.
const aboutNoteEndpoint = "https://formspree.io/f/moeejevw";
const aboutIntroMail = "animashaunraheem05@gmail.com";
const aboutIntroSection = document.querySelector<HTMLElement>(".about-personal");
const aboutIntroStill = window.matchMedia("(prefers-reduced-motion: reduce)");
const aboutIntroWide = window.matchMedia("(min-width: 761px)");

const aboutIntroClamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const aboutIntroSmooth = (value: number) => value * value * (3 - 2 * value);
const isAboutIntro = (value: string | null): value is AboutIntro => aboutIntros.some((intro) => intro.id === value);

const aboutIntroEscape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Words as spans, each knowing its place in the line.
const aboutIntroWords = (text: string) =>
  aboutIntroEscape(text)
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => `<span class="intro-word" style="--i:${index}">${word}</span>`)
    .join(" ");

// Run `tick` every frame while `element` is on screen.
const aboutIntroLoop = (element: Element, tick: (now: number) => boolean | void) => {
  let frame: number | null = null;
  let visible = false;
  const run = (now: number) => {
    frame = null;
    const keepGoing = tick(now);
    if (visible && keepGoing !== false) frame = requestAnimationFrame(run);
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && frame === null) frame = requestAnimationFrame(run);
  });
  observer.observe(element);
  return {
    wake: () => {
      if (visible && frame === null) frame = requestAnimationFrame(run);
    },
    stop: () => {
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    },
  };
};

/* Crumpling a sent note ------------------------------------------------------ */

// Paint a note card onto a canvas as it looks — paper, tape, its words — so
// the canvas can be bent like the sheet itself. Positions come from layout
// (offsets), not the screen, since the card is turned on the desk.
const aboutIntroPaintNote = (card: HTMLElement, scale: number) => {
  const width = card.offsetWidth;
  const height = card.offsetHeight;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);
  const context = canvas.getContext("2d");
  if (!context) return canvas;
  context.scale(scale, scale);
  const cardStyle = getComputedStyle(card);
  context.fillStyle = cardStyle.backgroundColor;
  context.fillRect(0, 0, width, height);

  const tape = card.querySelector<HTMLElement>(".intro-card__tape");
  if (tape) {
    context.save();
    context.translate(tape.offsetLeft, tape.offsetTop + tape.offsetHeight / 2);
    context.rotate((-3 * Math.PI) / 180);
    context.fillStyle = getComputedStyle(tape).backgroundColor;
    context.fillRect(-tape.offsetWidth / 2, -tape.offsetHeight / 2, tape.offsetWidth, tape.offsetHeight);
    context.restore();
  }

  // Wrapped lines of text set the way the element sets them.
  const write = (element: HTMLElement | null, text: string, color?: string) => {
    if (!element || !text) return;
    const style = getComputedStyle(element);
    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    context.fillStyle = color ?? style.color;
    context.textBaseline = "top";
    const lineHeight = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.3;
    const left = element.offsetLeft + (Number.parseFloat(style.paddingLeft) || 0);
    const room = element.clientWidth - (Number.parseFloat(style.paddingLeft) || 0) - (Number.parseFloat(style.paddingRight) || 0);
    let top = element.offsetTop + (Number.parseFloat(style.paddingTop) || 0) + (lineHeight - Number.parseFloat(style.fontSize)) / 2;
    text.split("\n").forEach((paragraph) => {
      let line = "";
      paragraph.split(" ").forEach((word) => {
        const attempt = line ? `${line} ${word}` : word;
        if (context.measureText(attempt).width > room && line) {
          context.fillText(line, left, top);
          top += lineHeight;
          line = word;
        } else {
          line = attempt;
        }
      });
      context.fillText(line, left, top);
      top += lineHeight;
    });
  };
  const heading = card.querySelector<HTMLElement>(".intro-card__no");
  write(heading, heading?.textContent ?? "");
  const field = card.querySelector<HTMLTextAreaElement>("textarea");
  write(field, field?.value ?? "");
  const from = card.querySelector<HTMLInputElement>(".intro-card__from");
  write(from, from?.value || from?.placeholder || "", from?.value ? undefined : "rgba(11, 11, 11, 0.4)");

  const actions = card.querySelector<HTMLElement>(".intro-card__actions");
  if (actions) {
    context.strokeStyle = "rgba(11, 11, 11, 0.25)";
    context.setLineDash([3, 3]);
    context.beginPath();
    context.moveTo(actions.offsetLeft, actions.offsetTop + 0.5);
    context.lineTo(actions.offsetLeft + actions.offsetWidth, actions.offsetTop + 0.5);
    context.stroke();
    context.setLineDash([]);
    const send = actions.querySelector<HTMLElement>(".intro-card__send");
    if (send) {
      const left = actions.offsetLeft + send.offsetLeft;
      const top = actions.offsetTop + send.offsetTop;
      context.fillStyle = getComputedStyle(send).backgroundColor;
      context.beginPath();
      context.roundRect(left, top, send.offsetWidth, send.offsetHeight, send.offsetHeight / 2);
      context.fill();
      const style = getComputedStyle(send);
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      context.fillStyle = style.color;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText((send.textContent ?? "").trim().toUpperCase(), left + send.offsetWidth / 2, top + send.offsetHeight / 2);
      context.textAlign = "start";
    }
  }
  return canvas;
};

// The same note, crumpled: a wrinkle map laid over it — two scales of paper
// facets (cells around scattered points, each tilted its own way), lit from
// the top left, with a dark crease where neighbouring facets meet. It's mapped
// onto the bending sheet like the note itself, so the wrinkles fold with it.
// Crumpled paper's small-scale surface: three scales of facets (cells around
// scattered points, each tilted its own way and bowed a little), with a crease
// where neighbouring facets meet. Per pixel: the tilt, and how creased it is.
const aboutIntroFacets = (width: number, height: number) => {
  const tiltX = new Float32Array(width * height);
  const tiltY = new Float32Array(width * height);
  const crease = new Float32Array(width * height);
  const layers = [
    { cell: Math.max(width, height) / 6, tilt: 0.3, crease: 0.035 },
    { cell: Math.max(width, height) / 16, tilt: 0.34, crease: 0.05 },
    { cell: Math.max(width, height) / 38, tilt: 0.3, crease: 0.08 },
  ].map((layer) => {
    const columns = Math.ceil(width / layer.cell) + 1;
    const rows = Math.ceil(height / layer.cell) + 1;
    const seeds = Array.from({ length: columns * rows }, (_, index) => ({
      x: ((index % columns) + 0.1 + Math.random() * 0.8) * layer.cell,
      y: (Math.floor(index / columns) + 0.1 + Math.random() * 0.8) * layer.cell,
      tiltX: (Math.random() - 0.5) * 2 * layer.tilt,
      tiltY: (Math.random() - 0.5) * 2 * layer.tilt,
    }));
    return { ...layer, columns, rows, seeds };
  });
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      let creased = 1;
      layers.forEach((layer) => {
        const cellX = Math.floor(x / layer.cell);
        const cellY = Math.floor(y / layer.cell);
        let nearest = Infinity;
        let second = Infinity;
        let chosen = layer.seeds[0];
        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
            const column = cellX + offsetX;
            const row = cellY + offsetY;
            if (column < 0 || row < 0 || column >= layer.columns || row >= layer.rows) continue;
            const seed = layer.seeds[row * layer.columns + column];
            const distance = Math.hypot(x - seed.x, y - seed.y);
            if (distance < nearest) {
              second = nearest;
              nearest = distance;
              chosen = seed;
            } else if (distance < second) {
              second = distance;
            }
          }
        }
        // Each facet bows a little, so its light shifts across it.
        tiltX[index] += chosen.tiltX + ((x - chosen.x) / layer.cell) * layer.tilt * 0.5;
        tiltY[index] += chosen.tiltY + ((y - chosen.y) / layer.cell) * layer.tilt * 0.5;
        // Near the boundary between two facets: the crease itself, a thin line.
        const edge = Math.min((second - nearest) / (layer.cell * layer.crease), 1);
        creased = Math.min(creased, Math.sqrt(edge));
      });
      crease[index] = creased;
    }
  }
  return { tiltX, tiltY, crease };
};

// The same note, crumpled flat for the 2D crumple: the facets lit from the top
// left and laid over it.
const aboutIntroWrinkle = (texture: HTMLCanvasElement) => {
  const scale = 0.5;
  const width = Math.max(1, Math.round(texture.width * scale));
  const height = Math.max(1, Math.round(texture.height * scale));
  const light = { x: -0.5, y: -0.62, z: 0.6 };
  const flat = light.z;
  const facets = aboutIntroFacets(width, height);

  const shade = document.createElement("canvas");
  shade.width = width;
  shade.height = height;
  const shadeContext = shade.getContext("2d");
  const shine = document.createElement("canvas");
  shine.width = width;
  shine.height = height;
  const shineContext = shine.getContext("2d");
  if (!shadeContext || !shineContext) return texture;
  const shadePixels = shadeContext.createImageData(width, height);
  const shinePixels = shineContext.createImageData(width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const tiltX = facets.tiltX[y * width + x];
      const tiltY = facets.tiltY[y * width + x];
      const creased = 0.62 + 0.38 * facets.crease[y * width + x];
      const length = Math.hypot(tiltX, tiltY, 1);
      const lit = ((-tiltX * light.x - tiltY * light.y + light.z) / length) / flat;
      const index = (y * width + x) * 4;
      // Mostly bright paper; warm shadow only where a facet turns away.
      const light01 = Math.max(0, Math.min(1, lit)) * creased;
      const value = 0.6 + 0.4 * Math.pow(light01, 0.8);
      shadePixels.data[index] = Math.round(255 * value);
      shadePixels.data[index + 1] = Math.round(255 * Math.pow(value, 1.12));
      shadePixels.data[index + 2] = Math.round(255 * Math.pow(value, 1.4));
      shadePixels.data[index + 3] = 255;
      shinePixels.data[index] = 255;
      shinePixels.data[index + 1] = 255;
      shinePixels.data[index + 2] = 255;
      shinePixels.data[index + 3] = Math.round(Math.max(0, Math.min(1, (lit - 1) * 1.6)) * 200);
    }
  }
  shadeContext.putImageData(shadePixels, 0, 0);
  shineContext.putImageData(shinePixels, 0, 0);

  const crumpled = document.createElement("canvas");
  crumpled.width = texture.width;
  crumpled.height = texture.height;
  const context = crumpled.getContext("2d");
  if (!context) return texture;
  context.drawImage(texture, 0, 0);
  context.imageSmoothingQuality = "high";
  context.globalCompositeOperation = "multiply";
  context.drawImage(shade, 0, 0, texture.width, texture.height);
  context.globalCompositeOperation = "source-over";
  context.drawImage(shine, 0, 0, texture.width, texture.height);
  return crumpled;
};

// A sheet of paper as a cloth of points: neighbours keep their spacing (it
// can't stretch), diagonals hold it square (it can't shear), and points two
// apart resist bending, so folds come out sharp. `step(squeeze)` closes a
// sphere around it like cupped hands, from just around the flat sheet down to
// a ball; with nowhere to go, the paper buckles and folds over itself. Points
// are in the sheet's own pixels, `z` toward the viewer.
const aboutIntroPaperSim = (width: number, height: number, columns: number) => {
  const rows = Math.max(Math.round(columns * 0.7), Math.round(columns * (height / width)));
  const across = columns + 1;
  const count = across * (rows + 1);
  const x = new Float32Array(count);
  const y = new Float32Array(count);
  const z = new Float32Array(count);
  const lastX = new Float32Array(count);
  const lastY = new Float32Array(count);
  const lastZ = new Float32Array(count);
  const lump = new Float32Array(count);
  for (let row = 0; row <= rows; row += 1) {
    for (let column = 0; column <= columns; column += 1) {
      const index = row * across + column;
      x[index] = lastX[index] = (column / columns) * width;
      y[index] = lastY[index] = (row / rows) * height;
      // The faintest unevenness, so it knows which way to buckle.
      z[index] = lastZ[index] = (Math.random() - 0.5) * 2;
      // A little give point to point, so its surface isn't smooth.
      lump[index] = 0.95 + Math.random() * 0.08;
    }
  }
  // Stiffer against bending on a finer sheet, so the folds stay large.
  const bend = Math.min(0.2 + columns * 0.006, 0.5);
  const links: [number, number, number, number][] = [];
  const link = (first: number, second: number, stiffness: number) => {
    links.push([first, second, Math.hypot(x[first] - x[second], y[first] - y[second]), stiffness]);
  };
  for (let row = 0; row <= rows; row += 1) {
    for (let column = 0; column <= columns; column += 1) {
      const index = row * across + column;
      if (column < columns) link(index, index + 1, 1);
      if (row < rows) link(index, index + across, 1);
      if (column < columns && row < rows) {
        link(index, index + across + 1, 0.6 + Math.random() * 0.3);
        link(index + 1, index + across, 0.6 + Math.random() * 0.3);
      }
      if (column < columns - 1) link(index, index + 2, bend);
      if (row < rows - 1) link(index, index + across * 2, bend);
    }
  }
  const centreX = width / 2;
  const centreY = height / 2;
  const openRadius = Math.hypot(width, height) / 2 + 4;
  const ballRadius = Math.max(width, height) * 0.26;
  // The hands aren't a sphere: a lopsided, slightly long wad, turned at random,
  // with broad lumps around it (a few waves round its outline).
  const turn = Math.random() * Math.PI;
  const turnCos = Math.cos(turn);
  const turnSin = Math.sin(turn);
  const stretch = 1.08 + Math.random() * 0.22;
  const waves = [2, 3, 5].map((count) => ({ count, phase: Math.random() * Math.PI * 2, size: 0.1 + Math.random() * 0.08 }));
  const shapeAt = (alongX: number, alongY: number, alongZ: number) => {
    const angle = Math.atan2(alongY, alongX);
    const tilt = Math.atan2(alongZ, Math.hypot(alongX, alongY));
    return waves.reduce((sum, wave) => sum + wave.size * Math.sin(wave.count * angle + wave.phase) * Math.cos(tilt), 1);
  };

  const step = (squeeze: number) => {
    const radius = openRadius + (ballRadius - openRadius) * squeeze;
    for (let index = 0; index < count; index += 1) {
      const moveX = (x[index] - lastX[index]) * 0.82;
      const moveY = (y[index] - lastY[index]) * 0.82;
      const moveZ = (z[index] - lastZ[index]) * 0.82;
      lastX[index] = x[index];
      lastY[index] = y[index];
      lastZ[index] = z[index];
      x[index] += moveX;
      y[index] += moveY;
      z[index] += moveZ + (Math.random() - 0.5) * 0.35 * (1 - squeeze);
    }
    for (let pass = 0; pass < 12; pass += 1) {
      for (let index = 0; index < count; index += 1) {
        const offsetX = x[index] - centreX;
        const offsetY = y[index] - centreY;
        const offsetZ = z[index];
        // Measured in the wad's own frame, which is a little longer one way.
        const alongX = offsetX * turnCos + offsetY * turnSin;
        const alongY = (-offsetX * turnSin + offsetY * turnCos) / (1 + (stretch - 1) * squeeze);
        const alongZ = offsetZ;
        const distance = Math.hypot(alongX, alongY, alongZ) || 1;
        // Its shape only shows as it closes, so the sheet starts square.
        const shape = 1 + (shapeAt(alongX, alongY, alongZ) * lump[index] - 1) * squeeze;
        const limit = radius * shape;
        if (distance > limit) {
          const pull = limit / distance;
          x[index] = centreX + offsetX * pull;
          y[index] = centreY + offsetY * pull;
          z[index] = offsetZ * pull;
        }
      }
      links.forEach(([first, second, rest, stiffness]) => {
        const dx = x[second] - x[first];
        const dy = y[second] - y[first];
        const dz = z[second] - z[first];
        const length = Math.hypot(dx, dy, dz) || 1;
        // Paper won't stretch and won't squash either, so being squeezed it
        // can only fold.
        const strain = (length - rest) / length;
        const amount = stiffness * 0.5;
        const shiftX = dx * strain * amount;
        const shiftY = dy * strain * amount;
        const shiftZ = dz * strain * amount;
        x[first] += shiftX;
        y[first] += shiftY;
        z[first] += shiftZ;
        x[second] -= shiftX;
        y[second] -= shiftY;
        z[second] -= shiftZ;
      });
    }
    return radius;
  };

  return { x, y, z, count, columns, rows, across, centreX, centreY, ballRadius, step };
};

// The flat fallback for crumpling a note, on a 2D canvas: the paper is
// simulated (aboutIntroPaperSim) and each facet drawn with the note (or the
// blank back, where the sheet has flipped over), lit by the way it faces and
// darker deep inside the ball. `onBall` hears when it's done, with the canvas
// to throw.
const aboutIntroCrumple = (card: HTMLElement, host: HTMLElement, duration: number, onBall: (canvas: HTMLCanvasElement) => void) => {
  const width = card.offsetWidth;
  const height = card.offsetHeight;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const margin = 40;
  const texture = aboutIntroPaintNote(card, ratio);
  const wrinkled = aboutIntroWrinkle(texture);
  const paper = getComputedStyle(card).backgroundColor;
  const canvas = document.createElement("canvas");
  canvas.className = "intro-crumple";
  canvas.setAttribute("aria-hidden", "true");
  canvas.width = Math.ceil((width + margin * 2) * ratio);
  canvas.height = Math.ceil((height + margin * 2) * ratio);
  canvas.style.width = `${width + margin * 2}px`;
  canvas.style.height = `${height + margin * 2}px`;
  canvas.style.left = `${-margin}px`;
  canvas.style.top = `${-margin}px`;
  canvas.style.transform = card.style.transform;
  canvas.style.zIndex = card.style.zIndex;
  host.append(canvas);
  card.style.visibility = "hidden";
  const context = canvas.getContext("2d");
  if (!context) {
    onBall(canvas);
    return;
  }

  const sheet = aboutIntroPaperSim(width, height, 20);
  const { x, y, z, columns, rows, across, centreX, centreY, ballRadius } = sheet;
  const light = { x: -0.42, y: -0.55, z: 0.72 };
  const started = performance.now();

  const triangles: [number, number, number][] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const a = row * across + column;
      // Each cell split along a random diagonal, so the folds don't line up
      // in a regular pattern.
      if (Math.random() < 0.5) triangles.push([a, a + 1, a + across], [a + 1, a + across + 1, a + across]);
      else triangles.push([a, a + 1, a + across + 1], [a, a + across + 1, a + across]);
    }
  }

  const frame = (now: number) => {
    const progress = Math.min((now - started) / duration, 1);
    const squeeze = 1 - Math.pow(1 - progress, 2.2);
    const radius = sheet.step(squeeze);

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(ratio, 0, 0, ratio, margin * ratio, margin * ratio);

    // Its shadow on the desk, gathering in as it balls up.
    const shadowRadius = Math.max(radius * 0.95, ballRadius);
    const shadow = context.createRadialGradient(centreX + 4, centreY + 10, 0, centreX + 4, centreY + 10, shadowRadius);
    shadow.addColorStop(0, `rgba(0, 0, 0, ${(0.1 + squeeze * 0.16).toFixed(3)})`);
    shadow.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = shadow;
    context.fillRect(-margin, -margin, width + margin * 2, height + margin * 2);

    // Furthest facets first, nearer ones over them.
    triangles.sort((first, second) => (z[first[0]] + z[first[1]] + z[first[2]]) - (z[second[0]] + z[second[1]] + z[second[2]]));
    const wrinkling = Math.min(squeeze * 1.6, 0.85);

    triangles.forEach(([first, second, third]) => {
      const ax = x[second] - x[first];
      const ay = y[second] - y[first];
      const az = z[second] - z[first];
      const bx = x[third] - x[first];
      const by = y[third] - y[first];
      const bz = z[third] - z[first];
      let nx = ay * bz - az * by;
      let ny = az * bx - ax * bz;
      let nz = ax * by - ay * bx;
      const length = Math.hypot(nx, ny, nz) || 1;
      nx /= length;
      ny /= length;
      nz /= length;
      // Facing away: we're looking at the back of the paper.
      const back = nz < 0;
      if (back) {
        nx = -nx;
        ny = -ny;
        nz = -nz;
      }
      // Grown a hair from its middle so neighbouring facets meet without seams.
      const midX = (x[first] + x[second] + x[third]) / 3;
      const midY = (y[first] + y[second] + y[third]) / 3;
      const corners = [first, second, third].map((index) => {
        const dx = x[index] - midX;
        const dy = y[index] - midY;
        const reach = Math.hypot(dx, dy) || 1;
        return { x: x[index] + (dx / reach) * 0.6, y: y[index] + (dy / reach) * 0.6 };
      });
      const trace = () => {
        context.beginPath();
        context.moveTo(corners[0].x, corners[0].y);
        context.lineTo(corners[1].x, corners[1].y);
        context.lineTo(corners[2].x, corners[2].y);
        context.closePath();
      };
      context.save();
      trace();
      context.clip();
      if (back) {
        context.fillStyle = paper;
        context.fill();
      } else {
        // Map the note's picture onto the facet.
        const u0 = ((first % across) / columns) * texture.width;
        const v0 = (Math.floor(first / across) / rows) * texture.height;
        const u1 = ((second % across) / columns) * texture.width;
        const v1 = (Math.floor(second / across) / rows) * texture.height;
        const u2 = ((third % across) / columns) * texture.width;
        const v2 = (Math.floor(third / across) / rows) * texture.height;
        const det = u0 * (v1 - v2) + u1 * (v2 - v0) + u2 * (v0 - v1);
        if (det) {
          const x0 = x[first];
          const y0 = y[first];
          const x1 = x[second];
          const y1 = y[second];
          const x2 = x[third];
          const y2 = y[third];
          context.transform(
            (x0 * (v1 - v2) + x1 * (v2 - v0) + x2 * (v0 - v1)) / det,
            (y0 * (v1 - v2) + y1 * (v2 - v0) + y2 * (v0 - v1)) / det,
            (x0 * (u2 - u1) + x1 * (u0 - u2) + x2 * (u1 - u0)) / det,
            (y0 * (u2 - u1) + y1 * (u0 - u2) + y2 * (u1 - u0)) / det,
            (x0 * (u1 * v2 - u2 * v1) + x1 * (u2 * v0 - u0 * v2) + x2 * (u0 * v1 - u1 * v0)) / det,
            (y0 * (u1 * v2 - u2 * v1) + y1 * (u2 * v0 - u0 * v2) + y2 * (u0 * v1 - u1 * v0)) / det,
          );
          context.drawImage(texture, 0, 0);
          context.globalAlpha = wrinkling;
          context.drawImage(wrinkled, 0, 0);
          context.globalAlpha = 1;
        }
      }
      context.restore();
      // Light by the way it faces, and less of it deep inside the ball.
      const facing = Math.max(0, nx * light.x + ny * light.y + nz * light.z);
      const depth = Math.hypot(midX - centreX, midY - centreY, (z[first] + z[second] + z[third]) / 3) / Math.max(radius, 1);
      const tucked = 0.55 + 0.45 * Math.min(Math.pow(depth, 1.5), 1);
      // Relative to the flat sheet, so it starts exactly as the note looked.
      const brightness = ((0.5 + 0.62 * facing) / (0.5 + 0.62 * light.z)) * (back ? 0.9 : 1) * (squeeze < 0.05 ? 1 : 1 - (1 - tucked) * squeeze);
      // Shading comes in with the squeeze, so the flat sheet starts clean.
      const shading = Math.min(squeeze * 3, 1);
      const lit = 1 + (brightness - 1) * shading;
      trace();
      context.fillStyle = lit < 1
        ? `rgba(46, 34, 6, ${Math.min((1 - lit) * 0.95, 0.6).toFixed(3)})`
        : `rgba(255, 255, 255, ${Math.min((lit - 1) * 1.5, 0.45).toFixed(3)})`;
      context.fill();
    });

    if (progress < 1) requestAnimationFrame(frame);
    else onBall(canvas);
  };
  requestAnimationFrame(frame);
};

// three.js for the WebGL crumple, loaded only once someone opens a note.
declare const THREE: any;
let aboutThree: Promise<boolean> | null = null;
const aboutLoadThree = () => {
  aboutThree ??= new Promise<boolean>((resolve) => {
    if (typeof THREE !== "undefined") {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.onload = () => resolve(typeof THREE !== "undefined");
    script.onerror = () => resolve(false);
    document.head.append(script);
  });
  return aboutThree;
};

// The paper's fine wrinkles as a normal map, so each catches the light.
const aboutIntroPaperNormals = (width: number, height: number) => {
  const facets = aboutIntroFacets(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return canvas;
  const pixels = context.createImageData(width, height);
  for (let index = 0; index < width * height; index += 1) {
    // Creases dip, so their sides tilt in more steeply.
    const depth = 1 + (1 - facets.crease[index]) * 1.6;
    const nx = -facets.tiltX[index] * depth;
    const ny = facets.tiltY[index] * depth;
    const length = Math.hypot(nx, ny, 1);
    pixels.data[index * 4] = Math.round(((nx / length) * 0.5 + 0.5) * 255);
    pixels.data[index * 4 + 1] = Math.round(((ny / length) * 0.5 + 0.5) * 255);
    pixels.data[index * 4 + 2] = Math.round(((1 / length) * 0.5 + 0.5) * 255);
    pixels.data[index * 4 + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  return canvas;
};

// Crumple a note in WebGL: the simulated sheet (aboutIntroPaperSim) as a
// lit paper surface — the note on the front, blank paper on the back, the fine
// wrinkles in its normal map deepening as it's squeezed — lit from the top
// left with soft shadows, on itself and on the desk beneath. Returns false if
// WebGL isn't to be had, so the flat crumple can step in.
const aboutIntroCrumple3D = (card: HTMLElement, host: HTMLElement, duration: number, onBall: (canvas: HTMLCanvasElement) => void) => {
  if (typeof THREE === "undefined") return false;
  const width = card.offsetWidth;
  const height = card.offsetHeight;
  const margin = 40;
  const fullWidth = width + margin * 2;
  const fullHeight = height + margin * 2;
  let renderer: any;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch {
    return false;
  }
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(ratio);
  renderer.setSize(fullWidth, fullHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas: HTMLCanvasElement = renderer.domElement;
  canvas.className = "intro-crumple";
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.left = `${-margin}px`;
  canvas.style.top = `${-margin}px`;
  canvas.style.transform = card.style.transform;
  canvas.style.zIndex = card.style.zIndex;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-fullWidth / 2, fullWidth / 2, fullHeight / 2, -fullHeight / 2, -2000, 2000);
  camera.position.set(0, 0, 1000);

  // Soft daylight from above, and a key light from the top left that casts
  // the shadows; together they light the flat sheet as it looked.
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd2c6a0, 0.56));
  const key = new THREE.DirectionalLight(0xffffff, 0.72);
  key.position.set(-0.45, 0.6, 1).multiplyScalar(600);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  const reach = Math.max(fullWidth, fullHeight);
  Object.assign(key.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 1, far: 3000 });
  key.shadow.bias = -0.0015;
  key.shadow.radius = 4;
  scene.add(key);

  const ratioCanvas = Math.min(window.devicePixelRatio || 1, 2);
  const note = new THREE.CanvasTexture(aboutIntroPaintNote(card, ratioCanvas));
  note.encoding = THREE.sRGBEncoding;
  note.anisotropy = 4;
  const wrinkles = new THREE.CanvasTexture(aboutIntroPaperNormals(Math.round(width * 2), Math.round(height * 2)));
  wrinkles.anisotropy = 4;
  const paperColor = new THREE.Color(getComputedStyle(card).backgroundColor);
  paperColor.convertSRGBToLinear();
  const normalScale = new THREE.Vector2(0, 0);
  const front = new THREE.MeshStandardMaterial({ map: note, normalMap: wrinkles, normalScale, roughness: 0.92, metalness: 0, side: THREE.FrontSide });
  const back = new THREE.MeshStandardMaterial({ color: paperColor, normalMap: wrinkles, normalScale, roughness: 0.92, metalness: 0, side: THREE.BackSide });

  const sheet = aboutIntroPaperSim(width, height, 40);
  const geometry = new THREE.PlaneGeometry(width, height, sheet.columns, sheet.rows);
  const positions = geometry.attributes.position;
  [front, back].forEach((material) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  });
  // The desk under it, only there to catch its shadow.
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(fullWidth * 2, fullHeight * 2), new THREE.ShadowMaterial({ opacity: 0.22 }));
  desk.receiveShadow = true;
  scene.add(desk);

  host.append(canvas);
  card.style.visibility = "hidden";
  const started = performance.now();

  const frame = (now: number) => {
    const progress = Math.min((now - started) / duration, 1);
    // Quick to start, slow to finish, like a hand squeezing.
    const squeeze = 1 - Math.pow(1 - progress, 2.2);
    const radius = sheet.step(squeeze);
    for (let index = 0; index < sheet.count; index += 1) {
      positions.setXYZ(index, sheet.x[index] - sheet.centreX, sheet.centreY - sheet.y[index], sheet.z[index]);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    const wrinkling = Math.min(squeeze * 1.8, 1);
    normalScale.set(wrinkling * 1.3, wrinkling * 1.3);
    // The ball sits on the desk.
    desk.position.z = -Math.max(radius, sheet.ballRadius) - 2;
    renderer.render(scene, camera);
    if (progress < 1) {
      requestAnimationFrame(frame);
      return;
    }
    onBall(canvas);
    // Free the GPU once the ball has been thrown and removed.
    const release = new MutationObserver(() => {
      if (canvas.isConnected) return;
      release.disconnect();
      geometry.dispose();
      note.dispose();
      wrinkles.dispose();
      front.dispose();
      back.dispose();
      renderer.dispose();
    });
    release.observe(host, { childList: true });
  };
  requestAnimationFrame(frame);
  return true;
};

if (aboutIntroSection) {
  const clean = (text: string | null | undefined) => (text ?? "").replace(/\s+/g, " ").trim();
  const eyebrow = clean(aboutIntroSection.querySelector(".about-personal__eyebrow")?.textContent);
  const title = clean(aboutIntroSection.querySelector("h2")?.textContent);
  const notes = [...aboutIntroSection.querySelectorAll(".about-personal__notes p")].map((note) => clean(note.textContent));
  const titleId = aboutIntroSection.querySelector("h2")?.id ?? "about-personal-title";

  /* Lens -------------------------------------------------------------------- */

  const buildLens = (root: HTMLElement) => {
    const notesHtml = notes
      .map((note, index) => `<p><span class="intro-lens__no">0${index + 1}</span>${aboutIntroEscape(note)}</p>`)
      .join("");
    root.innerHTML = `
      <p class="intro-eyebrow">${aboutIntroEscape(eyebrow)}</p>
      <h2 class="intro-title" id="${titleId}">${aboutIntroEscape(title)}</h2>
      <div class="intro-lens">
        <div class="intro-lens__text">${notesHtml}</div>
        <div class="intro-lens__glass" aria-hidden="true"><div class="intro-lens__text">${notesHtml}</div></div>
        <span class="intro-lens__ring" aria-hidden="true"><span>×1.45</span></span>
      </div>
      <p class="intro-hint">I tend to look twice — move over the words</p>`;
    const lens = root.querySelector<HTMLElement>(".intro-lens");
    const glass = root.querySelector<HTMLElement>(".intro-lens__glass");
    const magnified = glass?.querySelector<HTMLElement>(".intro-lens__text");
    const ring = root.querySelector<HTMLElement>(".intro-lens__ring");
    if (!lens || !glass || !magnified || !ring) return () => {};

    const abort = new AbortController();
    const point = { x: 0, y: 0, targetX: 0, targetY: 0, placed: false };
    let hovering = false;
    lens.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      const bounds = lens.getBoundingClientRect();
      hovering = true;
      point.targetX = event.clientX - bounds.left;
      point.targetY = event.clientY - bounds.top;
      loop.wake();
    }, { signal: abort.signal });
    lens.addEventListener("pointerleave", () => {
      hovering = false;
    }, { signal: abort.signal });

    const loop = aboutIntroLoop(lens, (now) => {
      const width = lens.clientWidth;
      const height = lens.clientHeight;
      // Left alone, the lens reads along the lines by itself.
      if (!hovering) {
        point.targetX = width * (0.5 + 0.42 * Math.sin(now / 2900));
        point.targetY = height * (0.5 + 0.38 * Math.sin(now / 1100));
      }
      if (!point.placed) {
        point.x = point.targetX;
        point.y = point.targetY;
        point.placed = true;
      }
      const ease = aboutIntroStill.matches ? 1 : hovering ? 0.22 : 0.06;
      point.x += (point.targetX - point.x) * ease;
      point.y += (point.targetY - point.y) * ease;
      const radius = aboutIntroClamp(width * 0.1, 80, 150);
      glass.style.clipPath = `circle(${radius}px at ${point.x.toFixed(1)}px ${point.y.toFixed(1)}px)`;
      magnified.style.transformOrigin = `${point.x.toFixed(1)}px ${point.y.toFixed(1)}px`;
      ring.style.width = ring.style.height = `${radius * 2}px`;
      ring.style.transform = `translate3d(${(point.x - radius).toFixed(1)}px, ${(point.y - radius).toFixed(1)}px, 0)`;
      return !aboutIntroStill.matches || hovering;
    });
    return () => {
      abort.abort();
      loop.stop();
    };
  };

  /* Transcript ---------------------------------------------------------------- */

  const buildTranscript = (root: HTMLElement) => {
    const exchanges: { question: string; answer: string; lead?: boolean }[] = [
      { question: "What pulls your attention?", answer: title, lead: true },
      { question: "Where do you find it?", answer: notes[0] ?? "" },
      { question: "How do you like to work?", answer: notes[1] ?? "" },
      { question: "And this page?", answer: notes[2] ?? "" },
    ];
    const time = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    let clock = 3;
    const lines = exchanges.map(({ question, answer, lead }) => {
      const asked = clock;
      clock += 4;
      const answered = clock;
      clock += Math.round(answer.split(" ").length / 2.6) + 3;
      const answerTag = lead ? "h2" : "p";
      const answerId = lead ? ` id="${titleId}"` : "";
      return `
        <li class="intro-line intro-line--q"><span class="intro-line__time">${time(asked)}</span><span class="intro-line__who">Q.</span><p class="intro-line__text">${aboutIntroEscape(question)}</p></li>
        <li class="intro-line intro-line--a${lead ? " is-lead" : ""}"><span class="intro-line__time">${time(answered)}</span><span class="intro-line__who">R.</span><${answerTag} class="intro-line__text"${answerId}>${aboutIntroWords(answer)}</${answerTag}></li>`;
    }).join("");
    root.innerHTML = `
      <header class="intro-transcript__head">
        <p>${aboutIntroEscape(eyebrow)} — in conversation</p>
        <p>Transcript / Lagos</p>
        <p class="intro-transcript__rec"><i></i> Rec</p>
      </header>
      <ol class="intro-transcript">${lines}</ol>`;

    // Each line types itself in as it arrives; the caret sits on the one in progress.
    const timers: number[] = [];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const line = entry.target as HTMLElement;
        observer.unobserve(line);
        line.classList.add("is-typing");
        const words = line.querySelectorAll(".intro-word").length;
        timers.push(window.setTimeout(() => line.classList.add("is-typed"), aboutIntroStill.matches ? 0 : 260 + words * 55));
      });
    }, { rootMargin: "0px 0px -12%" });
    root.querySelectorAll(".intro-line").forEach((line) => observer.observe(line));
    return () => {
      observer.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  };

  /* Desk ---------------------------------------------------------------------- */

  const buildDesk = (root: HTMLElement) => {
    const prints = [
      { src: "assets/projects/electronic-botanica/l8.webp", caption: "Kept / Electronic Botanica" },
      { src: "assets/projects/flip/L3.webp", caption: "Kept / Flip" },
    ];
    const cards = [
      ...notes.map((note, index) => `
        <article class="intro-card">
          <span class="intro-card__tape" aria-hidden="true"></span>
          <p class="intro-card__no">No. 0${index + 1}</p>
          <p class="intro-card__text">${aboutIntroEscape(note)}</p>
        </article>`),
      ...prints.map((print) => `
        <figure class="intro-card intro-card--print">
          <img src="${print.src}" alt="" draggable="false" loading="lazy" />
          <figcaption>${print.caption}</figcaption>
        </figure>`),
    ].join("");
    root.innerHTML = `
      <p class="intro-eyebrow">${aboutIntroEscape(eyebrow)}</p>
      <div class="intro-desk">
        <div class="intro-desk__centre">
          <h2 class="intro-title intro-desk__title" id="${titleId}">${aboutIntroEscape(title)}</h2>
          <button type="button" class="intro-desk__add" aria-label="Add a note: ask Raheem something">
            <span class="intro-desk__plus" aria-hidden="true"></span>
            <span class="intro-desk__add-label" aria-hidden="true">Want to ask Raheem something?</span>
          </button>
          <p class="intro-desk__thanks" aria-live="polite"></p>
        </div>
        ${cards}
        <p class="intro-hint intro-desk__hint">Pick them up — move things around, or leave a note</p>
      </div>`;
    const desk = root.querySelector<HTMLElement>(".intro-desk");
    const add = root.querySelector<HTMLButtonElement>(".intro-desk__add");
    if (!desk || !add) return () => {};
    const abort = new AbortController();

    // Where each lands on the desk, as a share of it, and how it's turned.
    const spots = [
      { x: 0.16, y: 0.74, turn: -5 },
      { x: 0.7, y: 0.86, turn: 3 },
      { x: 0.89, y: 0.58, turn: -2 },
      { x: 0.76, y: 0.2, turn: 7 },
      { x: 0.12, y: 0.24, turn: -9 },
    ];
    let stack = 10;
    type DeskBody = {
      card: HTMLElement;
      spot: { x: number; y: number; turn: number };
      x: number;
      y: number;
      turn: number;
      velocityX: number;
      velocityY: number;
      spin: number;
      dropAt: number;
      settled: boolean;
      held: boolean;
    };
    const bodyFor = (card: HTMLElement, spot: DeskBody["spot"]): DeskBody => ({
      card,
      spot,
      x: 0,
      y: 0,
      turn: 0,
      velocityX: 0,
      velocityY: 0,
      spin: 0,
      dropAt: 0,
      settled: false,
      held: false,
    });
    const bodies = [...desk.querySelectorAll<HTMLElement>(".intro-card")].map((card, index) => bodyFor(card, spots[index % spots.length]));
    let started = 0;
    let hinted = false;

    const place = (body: DeskBody) => {
      body.card.style.transform =
        `translate3d(${(body.x - body.card.offsetWidth / 2).toFixed(1)}px, ${(body.y - body.card.offsetHeight / 2).toFixed(1)}px, 0) rotate(${body.turn.toFixed(2)}deg)`;
    };

    const loop = aboutIntroLoop(desk, (now) => {
      if (!aboutIntroWide.matches) return false;
      const width = desk.clientWidth;
      const height = desk.clientHeight;
      if (!started) {
        started = now;
        // Once everything has landed, the plus says what it's for, briefly.
        if (!hinted) {
          hinted = true;
          window.setTimeout(() => {
            add.classList.add("is-hinting");
            window.setTimeout(() => add.classList.remove("is-hinting"), 2800);
          }, 1600);
        }
        // Dropped onto the desk one after another, from above.
        bodies.forEach((body, index) => {
          body.dropAt = now + (aboutIntroStill.matches ? 0 : 160 + index * 140);
          body.x = body.spot.x * width;
          body.y = aboutIntroStill.matches ? body.spot.y * height : -body.card.offsetHeight;
          body.turn = body.spot.turn * (aboutIntroStill.matches ? 1 : 4);
        });
      }
      let moving = false;
      bodies.forEach((body) => {
        if (body.held) {
          moving = true;
          place(body);
          return;
        }
        if (!body.settled) {
          if (now < body.dropAt) {
            moving = true;
            place(body);
            return;
          }
          // Falling into place.
          body.velocityY += (body.spot.y * height - body.y) * 0.06;
          body.velocityY *= 0.72;
          body.spin += (body.spot.turn - body.turn) * 0.06;
          body.spin *= 0.72;
          body.y += body.velocityY;
          body.turn += body.spin;
          if (Math.abs(body.spot.y * height - body.y) < 0.4 && Math.abs(body.velocityY) < 0.2) body.settled = true;
          moving = true;
          place(body);
          return;
        }
        // Sliding across the desk after a throw.
        if (Math.abs(body.velocityX) + Math.abs(body.velocityY) + Math.abs(body.spin) > 0.05) {
          body.x += body.velocityX;
          body.y += body.velocityY;
          body.turn += body.spin;
          body.velocityX *= 0.9;
          body.velocityY *= 0.9;
          body.spin *= 0.88;
          const halfWidth = body.card.offsetWidth / 2;
          const halfHeight = body.card.offsetHeight / 2;
          if (body.x < halfWidth * 0.4 || body.x > width - halfWidth * 0.4) {
            body.x = aboutIntroClamp(body.x, halfWidth * 0.4, width - halfWidth * 0.4);
            body.velocityX *= -0.5;
          }
          if (body.y < halfHeight * 0.4 || body.y > height - halfHeight * 0.4) {
            body.y = aboutIntroClamp(body.y, halfHeight * 0.4, height - halfHeight * 0.4);
            body.velocityY *= -0.5;
          }
          moving = true;
          place(body);
        }
      });
      return moving;
    });

    const makeMovable = (body: DeskBody) => {
      let lastX = 0;
      let lastY = 0;
      let lastTime = 0;
      body.card.addEventListener("pointerdown", (event) => {
        if (!aboutIntroWide.matches) return;
        // Writing in a note or pressing its buttons doesn't pick it up.
        if (event.target instanceof Element && event.target.closest("textarea, input, button")) return;
        event.preventDefault();
        body.held = true;
        body.settled = true;
        body.velocityX = body.velocityY = body.spin = 0;
        stack += 1;
        body.card.style.zIndex = String(stack);
        body.card.classList.add("is-held");
        body.card.setPointerCapture(event.pointerId);
        lastX = event.clientX;
        lastY = event.clientY;
        lastTime = performance.now();
        loop.wake();
      }, { signal: abort.signal });
      body.card.addEventListener("pointermove", (event) => {
        if (!body.held) return;
        const now = performance.now();
        const elapsed = Math.max(now - lastTime, 1) / 16.7;
        const moveX = event.clientX - lastX;
        const moveY = event.clientY - lastY;
        body.x += moveX;
        body.y += moveY;
        body.velocityX = moveX / elapsed;
        body.velocityY = moveY / elapsed;
        // It swings a little with the drag.
        body.turn += (aboutIntroClamp(moveX * 0.6, -14, 14) - (body.turn - body.spot.turn) * 0.1) * 0.08;
        lastX = event.clientX;
        lastY = event.clientY;
        lastTime = now;
      }, { signal: abort.signal });
      const release = () => {
        if (!body.held) return;
        body.held = false;
        body.card.classList.remove("is-held");
        body.spin = body.velocityX * 0.25;
        loop.wake();
      };
      body.card.addEventListener("pointerup", release, { signal: abort.signal });
      body.card.addEventListener("pointercancel", release, { signal: abort.signal });
    };
    bodies.forEach(makeMovable);

    // The plus drops a blank note onto the desk; what's written on it goes
    // to Raheem (see aboutNoteEndpoint), and a sent note is crumpled up and
    // tossed away.
    const thanks = root.querySelector<HTMLElement>(".intro-desk__thanks");
    let written = 0;

    // Crumple a sent note into a ball (aboutIntroCrumple3D, or the flat
    // aboutIntroCrumple), then squeeze it once and toss it up off the desk.
    const crumple = (body: DeskBody) => {
      const index = bodies.indexOf(body);
      if (index >= 0) bodies.splice(index, 1);
      const { card } = body;
      const finish = (ball?: HTMLElement) => {
        ball?.remove();
        card.remove();
      };
      if (aboutIntroStill.matches) {
        finish();
        return;
      }
      const toBall = (ball: HTMLCanvasElement) => {
        const toss = (Math.random() < 0.5 ? -1 : 1) * window.innerWidth * 0.45;
        const flight = ball.animate(
          [
            { scale: "1", rotate: "0deg", translate: "0 0", opacity: 1 },
            { scale: "0.9", rotate: "-6deg", translate: "0 4px", opacity: 1, offset: 0.14 },
            { scale: "0.96", rotate: "50deg", translate: `${(toss * 0.25).toFixed(0)}px -24vh`, opacity: 1, offset: 0.45 },
            { scale: "0.7", rotate: "540deg", translate: `${toss.toFixed(0)}px -100vh`, opacity: 0 },
          ],
          { duration: 1000, delay: 140, easing: "cubic-bezier(0.33, 0, 0.25, 1)", fill: "forwards" },
        );
        flight.finished.then(() => finish(ball)).catch(() => finish(ball));
      };
      // In WebGL with real lighting when three.js is there; drawn flat otherwise.
      void aboutLoadThree().then((ready: boolean) => {
        if (!ready || !aboutIntroCrumple3D(card, desk, 1300, toBall)) aboutIntroCrumple(card, desk, 1150, toBall);
      });
    };

    const sendNote = async (message: string, from: string) => {
      if (!aboutNoteEndpoint) {
        const subject = encodeURIComponent("A note from your About page");
        const text = from ? `${message}\n\n— ${from}` : message;
        window.location.href = `mailto:${aboutIntroMail}?subject=${subject}&body=${encodeURIComponent(text)}`;
        return true;
      }
      const response = await fetch(aboutNoteEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ message, email: from || undefined, _subject: "A note from your About page" }),
      });
      return response.ok;
    };

    add.addEventListener("click", () => {
      if (desk.querySelectorAll(".intro-card--note").length >= 4) return;
      // Get the 3D crumple ready while they write.
      void aboutLoadThree();
      written += 1;
      const card = document.createElement("article");
      card.className = "intro-card intro-card--note";
      card.innerHTML = `
        <span class="intro-card__tape" aria-hidden="true"></span>
        <button type="button" class="intro-card__close" aria-label="Discard this note">×</button>
        <p class="intro-card__no">For Raheem</p>
        <label class="visually-hidden" for="intro-note-${written}">Your note to Raheem</label>
        <textarea id="intro-note-${written}" class="intro-card__field" rows="5" placeholder="Want to know more about Raheem?"></textarea>
        <label class="visually-hidden" for="intro-from-${written}">Your email, for a reply</label>
        <input id="intro-from-${written}" class="intro-card__from" type="email" placeholder="Your email, for a reply (optional)" autocomplete="email" />
        <div class="intro-card__actions">
          <span class="intro-card__status" aria-live="polite"></span>
          <button type="button" class="intro-card__send">Send <span aria-hidden="true">↗</span></button>
        </div>`;
      desk.append(card);
      stack += 1;
      card.style.zIndex = String(stack);
      const field = card.querySelector<HTMLTextAreaElement>("textarea");
      const from = card.querySelector<HTMLInputElement>(".intro-card__from");
      const send = card.querySelector<HTMLButtonElement>(".intro-card__send");
      const status = card.querySelector<HTMLElement>(".intro-card__status");
      // The × discards the note: it drops away and is gone.
      card.querySelector<HTMLButtonElement>(".intro-card__close")?.addEventListener("click", () => {
        const body = bodies.find((candidate) => candidate.card === card);
        if (body) bodies.splice(bodies.indexOf(body), 1);
        const away = card.animate(
          [
            { scale: "1", translate: "0 0", opacity: 1 },
            { scale: "0.9", translate: "0 24px", opacity: 0 },
          ],
          { duration: aboutIntroStill.matches ? 1 : 260, easing: "cubic-bezier(0.5, 0, 0.75, 0)", fill: "forwards" },
        );
        away.finished.then(() => card.remove()).catch(() => card.remove());
      }, { signal: abort.signal });
      send?.addEventListener("click", async () => {
        const message = field?.value.trim() ?? "";
        if (!message) {
          card.classList.remove("is-empty");
          void card.offsetWidth;
          card.classList.add("is-empty");
          field?.focus();
          return;
        }
        if (send) send.disabled = true;
        if (status) status.textContent = aboutNoteEndpoint ? "Sending…" : "";
        let sent = false;
        try {
          sent = await sendNote(message, from?.value.trim() ?? "");
        } catch {
          sent = false;
        }
        if (!sent) {
          if (send) send.disabled = false;
          if (status) status.textContent = "Didn't send — try again";
          return;
        }
        const body = bodies.find((candidate) => candidate.card === card);
        if (body) crumple(body);
        if (thanks) {
          thanks.textContent = aboutNoteEndpoint ? "Sent — thanks for the note." : "Over to your mail app — thanks for the note.";
          thanks.classList.add("is-shown");
          window.setTimeout(() => thanks.classList.remove("is-shown"), 3600);
        }
      }, { signal: abort.signal });

      const body = bodyFor(card, { x: 0.5 + ((written % 3) - 1) * 0.16, y: 0.46, turn: (written % 2 ? -1 : 1) * (2 + written) });
      bodies.push(body);
      if (aboutIntroWide.matches && started) {
        body.x = body.spot.x * desk.clientWidth;
        body.y = -card.offsetHeight;
        body.turn = body.spot.turn * 4;
        body.dropAt = performance.now();
      }
      makeMovable(body);
      loop.wake();
      // Focus once it has landed, so the page doesn't jump to it mid-fall.
      window.setTimeout(() => field?.focus({ preventScroll: true }), aboutIntroStill.matches ? 0 : 500);
    }, { signal: abort.signal });

    window.addEventListener("resize", () => {
      started = 0;
      bodies.forEach((body) => {
        body.settled = false;
      });
      loop.wake();
    }, { signal: abort.signal });

    return () => {
      abort.abort();
      loop.stop();
    };
  };

  /* Margins ------------------------------------------------------------------- */

  const buildMargins = (root: HTMLElement) => {
    // Which word each note answers to.
    const annotated = [
      { word: "something", note: 0 },
      { word: "feel", note: 1 },
      { word: "human.", note: 2 },
    ];
    const keys = ["a", "b", "c"];
    const titleHtml = aboutIntroEscape(title)
      .split(" ")
      .map((word) => {
        const mark = annotated.find((entry) => entry.word === word);
        return mark ? `<mark class="intro-mark" data-key="${keys[mark.note]}">${word}</mark>` : word;
      })
      .join(" ");
    root.innerHTML = `
      <p class="intro-eyebrow">${aboutIntroEscape(eyebrow)}</p>
      <div class="intro-margins">
        <h2 class="intro-title intro-margins__title" id="${titleId}">${titleHtml}</h2>
        <svg class="intro-margins__ink" aria-hidden="true"></svg>
        <div class="intro-margins__notes">
          ${notes.map((note, index) => `<aside class="intro-note" data-key="${keys[index]}"><span class="intro-note__key">${keys[index]}</span><p>${aboutIntroEscape(note)}</p></aside>`).join("")}
        </div>
      </div>`;
    const sheet = root.querySelector<HTMLElement>(".intro-margins");
    const ink = root.querySelector<SVGSVGElement>(".intro-margins__ink");
    if (!sheet || !ink) return () => {};
    const abort = new AbortController();
    let strokes: { circle: SVGPathElement; leader: SVGPathElement; note: HTMLElement; lengths: [number, number] }[] = [];

    // A loose, hand-drawn loop around a word: an ellipse that overshoots
    // where it started, with a little wobble.
    const loopAround = (box: DOMRect, seed: number) => {
      const centreX = box.left + box.width / 2;
      const centreY = box.top + box.height * 0.55;
      const radiusX = box.width / 2 + 18;
      const radiusY = box.height / 2 + 6;
      const points: string[] = [];
      for (let step = 0; step <= 44; step += 1) {
        const angle = -2.6 + (step / 40) * Math.PI * 2;
        const wobble = 1 + Math.sin(step * 0.33 + seed) * 0.045 + step * 0.0014;
        points.push(`${(centreX + Math.cos(angle) * radiusX * wobble).toFixed(1)} ${(centreY + Math.sin(angle) * radiusY * wobble).toFixed(1)}`);
      }
      return `M ${points.join(" L ")}`;
    };

    const draw = () => {
      const sheetBox = sheet.getBoundingClientRect();
      ink.setAttribute("viewBox", `0 0 ${sheet.clientWidth} ${sheet.clientHeight}`);
      ink.innerHTML = "";
      strokes = [];
      if (!aboutIntroWide.matches) return;
      // Notes line up in the same order as their words across the page, so
      // the leaders don't cross.
      const marks = [...sheet.querySelectorAll<HTMLElement>(".intro-mark")];
      [...marks]
        .sort((first, second) => first.getBoundingClientRect().left - second.getBoundingClientRect().left)
        .forEach((mark, rank) => {
          sheet.querySelector<HTMLElement>(`.intro-note[data-key="${mark.dataset.key}"]`)?.style.setProperty("order", String(rank));
        });
      marks.forEach((mark, index) => {
        const note = sheet.querySelector<HTMLElement>(`.intro-note[data-key="${mark.dataset.key}"]`);
        if (!note) return;
        const raw = mark.getBoundingClientRect();
        const box = new DOMRect(raw.left - sheetBox.left, raw.top - sheetBox.top, raw.width, raw.height);
        const noteBox = note.getBoundingClientRect();
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "path");
        circle.setAttribute("d", loopAround(box, index * 2.3));
        circle.setAttribute("class", "intro-margins__loop");
        // The leader leaves the loop's foot and lands on the note's key.
        const fromX = box.left + box.width / 2;
        const fromY = box.bottom + 10;
        const toX = noteBox.left - sheetBox.left + 8;
        const toY = noteBox.top - sheetBox.top - 10;
        const leader = document.createElementNS("http://www.w3.org/2000/svg", "path");
        leader.setAttribute("d", `M ${fromX.toFixed(1)} ${fromY.toFixed(1)} C ${fromX.toFixed(1)} ${(fromY + (toY - fromY) * 0.6).toFixed(1)}, ${toX.toFixed(1)} ${(toY - (toY - fromY) * 0.5).toFixed(1)}, ${toX.toFixed(1)} ${toY.toFixed(1)}`);
        leader.setAttribute("class", "intro-margins__leader");
        ink.append(circle, leader);
        const lengths: [number, number] = [circle.getTotalLength(), leader.getTotalLength()];
        circle.style.strokeDasharray = `${lengths[0]}`;
        leader.style.strokeDasharray = `${lengths[1]}`;
        strokes.push({ circle, leader, note, lengths });
      });
    };

    // Scrolling down the sheet draws each annotation in turn.
    const loop = aboutIntroLoop(sheet, () => {
      const box = sheet.getBoundingClientRect();
      const height = window.innerHeight;
      const progress = aboutIntroStill.matches ? 1 : aboutIntroClamp((height * 0.85 - box.top) / (box.height * 0.9), 0, 1);
      strokes.forEach((stroke, index) => {
        const own = aboutIntroClamp((progress - index * 0.18) / 0.5, 0, 1);
        const ring = aboutIntroSmooth(aboutIntroClamp(own / 0.45, 0, 1));
        const line = aboutIntroSmooth(aboutIntroClamp((own - 0.4) / 0.45, 0, 1));
        stroke.circle.style.strokeDashoffset = `${(stroke.lengths[0] * (1 - ring)).toFixed(1)}`;
        stroke.leader.style.strokeDashoffset = `${(stroke.lengths[1] * (1 - line)).toFixed(1)}`;
        stroke.note.style.setProperty("--shown", aboutIntroClamp((own - 0.75) / 0.25, 0, 1).toFixed(3));
      });
      return false;
    });

    const redraw = () => {
      draw();
      loop.wake();
    };
    window.addEventListener("scroll", loop.wake, { passive: true, signal: abort.signal });
    window.addEventListener("resize", redraw, { signal: abort.signal });
    document.fonts?.ready.then(redraw);
    requestAnimationFrame(redraw);
    return () => {
      abort.abort();
      loop.stop();
    };
  };

  /* Slot ------------------------------------------------------------------------ */

  const buildSlot = (root: HTMLElement) => {
    const phrases = ["a street sign", "the pacing of a film", "the shape of a sentence", "one tiny interaction", "a quiet conversation", "something"];
    root.innerHTML = `
      <div class="intro-slot">
        <div class="intro-slot__pin">
          <p class="intro-eyebrow">${aboutIntroEscape(eyebrow)}</p>
          <h2 class="intro-title intro-slot__title" id="${titleId}">
            I’m interested in what makes
            <span class="intro-slot__reel" aria-hidden="true"><span class="intro-slot__track">${phrases.map((phrase) => `<span>${phrase}</span>`).join("")}</span></span><span class="visually-hidden">something</span>
            feel human.
          </h2>
          <p class="intro-slot__count" aria-hidden="true"><span>01</span> / ${String(phrases.length).padStart(2, "0")}</p>
          <div class="intro-slot__notes">
            ${notes.map((note, index) => `<p><span>0${index + 1}</span>${aboutIntroEscape(note)}</p>`).join("")}
          </div>
        </div>
      </div>`;
    const slot = root.querySelector<HTMLElement>(".intro-slot");
    const reel = root.querySelector<HTMLElement>(".intro-slot__reel");
    const track = root.querySelector<HTMLElement>(".intro-slot__track");
    const count = root.querySelector<HTMLElement>(".intro-slot__count span");
    if (!slot || !reel || !track) return () => {};
    const abort = new AbortController();
    const spans = [...track.querySelectorAll<HTMLElement>("span")];
    let widths: number[] = [];
    const measure = () => {
      widths = spans.map((span) => span.scrollWidth);
    };

    const loop = aboutIntroLoop(slot, () => {
      if (!widths.length) measure();
      const range = slot.offsetHeight - window.innerHeight;
      const progress = range > 0 ? aboutIntroClamp(-slot.getBoundingClientRect().top / range, 0, 1) : 1;
      // Rolls through the phrases with a short hold on each, landing on the
      // last with time to spare.
      const position = aboutIntroClamp(progress / 0.78, 0, 1) * (phrases.length - 1);
      const index = Math.floor(position);
      const fraction = position - index;
      const eased = index + aboutIntroSmooth(aboutIntroClamp((fraction - 0.3) / 0.4, 0, 1));
      const next = Math.min(index + 1, phrases.length - 1);
      const width = widths[index] + (widths[next] - widths[index]) * (eased - index);
      track.style.transform = `translate3d(0, ${(-eased * 1.04).toFixed(4)}em, 0)`;
      reel.style.width = `${width.toFixed(1)}px`;
      if (count) count.textContent = String(Math.round(eased) + 1).padStart(2, "0");
      slot.classList.toggle("is-landed", progress > 0.8);
      return false;
    });
    window.addEventListener("scroll", loop.wake, { passive: true, signal: abort.signal });
    window.addEventListener("resize", () => {
      measure();
      loop.wake();
    }, { signal: abort.signal });
    document.fonts?.ready.then(() => {
      measure();
      loop.wake();
    });
    return () => {
      abort.abort();
      loop.stop();
    };
  };

  /* Choosing ------------------------------------------------------------------------ */

  const builders: Record<AboutIntro, (root: HTMLElement) => () => void> = {
    lens: buildLens,
    transcript: buildTranscript,
    desk: buildDesk,
    margins: buildMargins,
    slot: buildSlot,
  };

  const stage = document.createElement("div");
  stage.className = "intro-stage";
  aboutIntroSection.replaceChildren(stage);
  const requested = new URLSearchParams(window.location.search).get("intro");
  const chosen = isAboutIntro(requested) ? requested : "desk";
  aboutIntroSection.dataset.intro = chosen;
  builders[chosen](stage);
}
