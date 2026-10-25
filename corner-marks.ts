// The corner marks — "Ra" "he" "e" "m", the name split across the four
// corners. "Ra" is always the way home. The other three are snooker balls:
// press one and it steps out of its corner with a cue behind it; point where
// it should go — further away for a harder shot — and let go to strike. It rolls, cracks
// into the others and rebounds off the edges, knocking whatever it runs
// over on the page — down to single words — and one that slows near "Ra"
// drops into its place in the name. With all three in, "Raheem" waves. Sunk
// into a corner of the screen (any but the name's), a letter leaves it and
// turns up again at home.

const cornerHome = document.querySelector<HTMLElement>(".corner-mark--top-left");
const cornerMarks = {
  he: document.querySelector<HTMLElement>(".corner-mark--top-right"),
  e: document.querySelector<HTMLElement>(".corner-mark--bottom-left"),
  m: document.querySelector<HTMLElement>(".corner-mark--bottom-right"),
};
const cornerReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/* Physics ------------------------------------------------------------------ */

interface CornerBody {
  mark: HTMLElement;
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  turn: number;
  scale: number;
}

// Run a per-frame step for the three marks, each knowing its resting centre.
// The loop sleeps once nothing has moved for a moment and `keepAwake` has
// nothing pending; `wake` starts it again.
const cornerPhysics = (step: (bodies: CornerBody[], delta: number, now: number) => void, keepAwake: () => boolean) => {
  const marks = [cornerMarks.he, cornerMarks.e, cornerMarks.m].filter((mark): mark is HTMLElement => mark !== null);
  let bodies: CornerBody[] = [];
  let last = performance.now();
  let frame: number | null = null;
  let still = 0;

  const measure = () => {
    bodies = marks.map((mark) => {
      mark.style.transform = "";
      const bounds = mark.getBoundingClientRect();
      const previous = bodies.find((body) => body.mark === mark);
      const homeX = bounds.left + bounds.width / 2;
      const homeY = bounds.top + bounds.height / 2;
      return previous
        ? { ...previous, homeX, homeY }
        : { mark, homeX, homeY, x: homeX, y: homeY, velocityX: 0, velocityY: 0, turn: 0, scale: 1 };
    });
  };

  const render = (now: number) => {
    frame = null;
    const delta = Math.min(Math.max(now - last, 4), 40);
    last = now;
    const before = bodies.map((body) => body.x + body.y + body.turn + body.scale);
    step(bodies, delta, now);
    let moved = 0;
    bodies.forEach((body, index) => {
      moved += Math.abs(body.x + body.y + body.turn + body.scale - before[index]);
      body.mark.style.transform =
        `translate3d(${(body.x - body.homeX).toFixed(1)}px, ${(body.y - body.homeY).toFixed(1)}px, 0) rotate(${body.turn.toFixed(2)}deg) scale(${body.scale.toFixed(3)})`;
    });
    still = moved < 0.02 && !keepAwake() ? still + 1 : 0;
    if (still < 20) frame = requestAnimationFrame(render);
  };

  const wake = () => {
    still = 0;
    if (frame !== null) return;
    last = performance.now();
    frame = requestAnimationFrame(render);
  };

  window.addEventListener("resize", () => {
    measure();
    wake();
  });
  measure();
  wake();
  document.documentElement.classList.add("is-marks-loose");
  return { bodies: () => bodies, wake };
};

// A spring that pulls a body toward a point.
const cornerSpring = (body: CornerBody, targetX: number, targetY: number, delta: number, stiffness: number, damping: number) => {
  const step = delta / 16.7;
  body.velocityX += (targetX - body.x) * stiffness * step;
  body.velocityY += (targetY - body.y) * stiffness * step;
  body.velocityX *= Math.pow(damping, step);
  body.velocityY *= Math.pow(damping, step);
  body.x += body.velocityX * step;
  body.y += body.velocityY * step;
};

// Where each letter sits in the name, beside "Ra".
const cornerSpot = (body: CornerBody, all: CornerBody[]) => {
  const home = cornerHome?.getBoundingClientRect();
  if (!home) return { x: body.homeX, y: body.homeY };
  let left = home.right - 1;
  for (const other of all) {
    const width = other.mark.offsetWidth;
    if (other === body) return { x: left + width / 2, y: home.top + home.height / 2 };
    left += width - 1;
  }
  return { x: left, y: home.top + home.height / 2 };
};

// Rolling on felt: friction instead of gravity, cushions, a little spin.
const cornerRoll = (body: CornerBody, delta: number, radius: number, friction = 0.975) => {
  const step = delta / 16.7;
  body.velocityX *= Math.pow(friction, step);
  body.velocityY *= Math.pow(friction, step);
  body.x += body.velocityX * step;
  body.y += body.velocityY * step;
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (body.x < radius || body.x > width - radius) {
    body.x = Math.max(radius, Math.min(width - radius, body.x));
    body.velocityX *= -0.8;
  }
  if (body.y < radius || body.y > height - radius) {
    body.y = Math.max(radius, Math.min(height - radius, body.y));
    body.velocityY *= -0.8;
  }
  body.turn += (body.velocityX + body.velocityY) * 0.4 * step;
};

// Letters bump into each other rather than overlap.
const cornerCollide = (all: CornerBody[], radius: number, bounce: number) => {
  for (let first = 0; first < all.length; first += 1) {
    for (let second = first + 1; second < all.length; second += 1) {
      const a = all[first];
      const b = all[second];
      const gapX = b.x - a.x;
      const gapY = b.y - a.y;
      const gap = Math.hypot(gapX, gapY) || 1;
      const overlap = radius * 2 - gap;
      if (overlap <= 0) continue;
      const normalX = gapX / gap;
      const normalY = gapY / gap;
      a.x -= normalX * overlap * 0.5;
      a.y -= normalY * overlap * 0.5;
      b.x += normalX * overlap * 0.5;
      b.y += normalY * overlap * 0.5;
      const closing = (b.velocityX - a.velocityX) * normalX + (b.velocityY - a.velocityY) * normalY;
      if (closing < 0) {
        const impulse = closing * (1 + bounce) * 0.5;
        a.velocityX += normalX * impulse;
        a.velocityY += normalY * impulse;
        b.velocityX -= normalX * impulse;
        b.velocityY -= normalY * impulse;
      }
    }
  }
};

// A small fixed readout beside "Ra".
const cornerReadout = () => {
  const readout = document.createElement("span");
  readout.className = "corner-greeting";
  readout.setAttribute("aria-live", "polite");
  document.body.append(readout);
  // `after` moves it along, past letters that have joined "Ra".
  const say = (message: string, after = 0) => {
    readout.textContent = message;
    readout.classList.toggle("is-shown", message !== "");
    const home = cornerHome?.getBoundingClientRect();
    if (home) {
      readout.style.top = `${home.top + home.height / 2}px`;
      readout.style.left = `${home.right + after + 14}px`;
    }
  };
  return say;
};

/* Impact -------------------------------------------------------------------- */

// Whatever a struck letter rolls over takes the knock: a heading, a line of
// text, an image is shoved along the letter's path, tips a little and springs
// back — harder the faster the shot, less the bigger the thing it hits.
interface CornerKnocked {
  x: number;
  y: number;
  turn: number;
  velocityX: number;
  velocityY: number;
  spin: number;
  struck: number;
}

// Never knocked: the game's own pieces.
const cornerUnknockable = ".corner-mark, .corner-cue, .corner-guide, .corner-greeting, .shape-preview";
const cornerKnocked = new Map<HTMLElement, CornerKnocked>();
let cornerKnockFrame: number | null = null;

const cornerSettle = () => {
  cornerKnockFrame = null;
  cornerKnocked.forEach((state, element) => {
    state.velocityX = (state.velocityX - state.x * 0.1) * 0.74;
    state.velocityY = (state.velocityY - state.y * 0.1) * 0.74;
    state.spin = (state.spin - state.turn * 0.1) * 0.74;
    state.x += state.velocityX;
    state.y += state.velocityY;
    state.turn += state.spin;
    if (Math.abs(state.x) + Math.abs(state.y) + Math.abs(state.turn) + Math.abs(state.velocityX) + Math.abs(state.velocityY) < 0.05) {
      element.style.removeProperty("translate");
      element.style.removeProperty("rotate");
      cornerKnocked.delete(element);
      return;
    }
    element.style.translate = `${state.x.toFixed(2)}px ${state.y.toFixed(2)}px`;
    element.style.rotate = `${state.turn.toFixed(3)}deg`;
  });
  if (cornerKnocked.size > 0) cornerKnockFrame = requestAnimationFrame(cornerSettle);
};

// The word under a point, wrapped in its own span the first time it's hit so
// it can move by itself.
const cornerWordAt = (pointX: number, pointY: number) => {
  let node: Node | null = null;
  let offset = 0;
  if (document.caretRangeFromPoint) {
    const range = document.caretRangeFromPoint(pointX, pointY);
    node = range?.startContainer ?? null;
    offset = range?.startOffset ?? 0;
  } else if ("caretPositionFromPoint" in document) {
    const position = (document as Document & { caretPositionFromPoint: (x: number, y: number) => { offsetNode: Node; offset: number } | null })
      .caretPositionFromPoint(pointX, pointY);
    node = position?.offsetNode ?? null;
    offset = position?.offset ?? 0;
  }
  if (!node || node.nodeType !== Node.TEXT_NODE) return null;
  const parent = node.parentElement;
  if (!parent || parent.closest(`${cornerUnknockable}, script, style, textarea, input, select, option`)) return null;
  if (parent.classList.contains("corner-word")) return parent;
  // Inside a flex or grid layout a wrapped word would become an item of its
  // own and be spaced out like one (a button's label, say), so the whole
  // thing is knocked instead.
  if (/flex|grid/.test(getComputedStyle(parent).display)) return null;
  const text = node.textContent ?? "";
  let start = offset;
  let end = offset;
  while (start > 0 && !/\s/.test(text[start - 1])) start -= 1;
  while (end < text.length && !/\s/.test(text[end])) end += 1;
  if (start === end) return null;
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  // Only if the point is really on the word, not in the space beside a line.
  const box = range.getBoundingClientRect();
  if (pointX < box.left - 6 || pointX > box.right + 6 || pointY < box.top - 6 || pointY > box.bottom + 6) return null;
  const word = document.createElement("span");
  word.className = "corner-word";
  range.surroundContents(word);
  return word;
};

// Otherwise the nearest thing under the point that's able to move (inline
// boxes can't be translated): an image or other block small enough to shift.
// Text moves only word by word, so a block holding text qualifies only when
// it's small, like a button.
const cornerBlockAt = (pointX: number, pointY: number) => {
  const viewport = window.innerWidth * window.innerHeight;
  let element = document.elementsFromPoint(pointX, pointY).find((candidate) => !candidate.closest(cornerUnknockable)) ?? null;
  while (element && element !== document.body && element !== document.documentElement) {
    if (element instanceof HTMLElement || element instanceof SVGSVGElement) {
      const bounds = element.getBoundingClientRect();
      const area = bounds.width * bounds.height;
      const display = getComputedStyle(element).display;
      const hasText = (element.textContent ?? "").trim() !== "";
      if (display !== "inline" && display !== "contents" && area < viewport * (hasText ? 0.03 : 0.3)) {
        return element as HTMLElement;
      }
    }
    element = element.parentElement;
  }
  return null;
};

// Knock what's at a point with `force` of the letter's momentum.
const cornerKnock = (body: CornerBody, pointX: number, pointY: number, force: number, now: number) => {
  const target = cornerWordAt(pointX, pointY) ?? cornerBlockAt(pointX, pointY);
  if (!target) return;
  const state = cornerKnocked.get(target);
  if (state && now - state.struck < 220) return;
  // Leave alone anything already moved by its own `translate` or `rotate`.
  if (!state) {
    const style = getComputedStyle(target);
    if (style.translate !== "none" || style.rotate !== "none") return;
  }
  const bounds = target.getBoundingClientRect();
  const heft = Math.min(Math.max(Math.sqrt(bounds.width * bounds.height) / 140, 1), 4);
  const knocked = state ?? { x: 0, y: 0, turn: 0, velocityX: 0, velocityY: 0, spin: 0, struck: now };
  knocked.struck = now;
  const limit = 11 / heft;
  knocked.velocityX += Math.max(-limit, Math.min(limit, (body.velocityX * force) / heft));
  knocked.velocityY += Math.max(-limit, Math.min(limit, (body.velocityY * force) / heft));
  // Struck off-centre, it tips the way it's hit.
  const across = (pointX - (bounds.left + bounds.width / 2)) / Math.max(bounds.width, 1);
  knocked.spin += Math.max(-4, Math.min(4, ((body.velocityY * across - body.velocityX * 0.1) * force * 0.8) / heft));
  cornerKnocked.set(target, knocked);
  if (cornerKnockFrame === null) cornerKnockFrame = requestAnimationFrame(cornerSettle);
};

// A rolling letter knocks what's under it, and glances what it passes close
// by. The letters step out of the way of their own hit-testing meanwhile.
const cornerImpact = (body: CornerBody, now: number) => {
  const speed = Math.hypot(body.velocityX, body.velocityY);
  if (speed < 2.5 || cornerReducedMotion.matches) return;
  const sideX = -body.velocityY / speed;
  const sideY = body.velocityX / speed;
  const marks = [cornerHome, cornerMarks.he, cornerMarks.e, cornerMarks.m];
  marks.forEach((mark) => mark?.style.setProperty("pointer-events", "none"));
  cornerKnock(body, body.x, body.y, 0.5, now);
  cornerKnock(body, body.x + sideX * 30, body.y + sideY * 30, 0.25, now);
  cornerKnock(body, body.x - sideX * 30, body.y - sideY * 30, 0.25, now);
  marks.forEach((mark) => mark?.style.removeProperty("pointer-events"));
};

/* Cue ----------------------------------------------------------------------- */

// Snooker for the name: press a letter and it steps out onto the cloth with
// the cue behind it. Point where it should go; holding loads the cue, letting
// go strikes. The letter rolls, cracks into the others and rebounds off the
// cushions, and one that slows near "Ra" drops into its place in the name.
// With all three in, "Raheem" waves.
const cornerCue = () => {
  const RADIUS = 20;
  // How far the pointer is drawn from the letter for a full-power shot.
  const FULL_DRAW = 380;
  // How close to a screen corner a letter must run to be sunk there.
  const POCKET = 70;
  const STEP_OUT = 220;
  const say = cornerReadout();
  const placed = new Set<CornerBody>();
  const rolled = new Map<CornerBody, number>();
  const sinking = new Set<CornerBody>();
  let whole = 0;
  let aiming: { body: CornerBody; pointerX: number; pointerY: number } | null = null;

  const cue = document.createElement("span");
  cue.className = "corner-cue";
  const guide = document.createElement("span");
  guide.className = "corner-guide";
  [cue, guide].forEach((line) => {
    line.setAttribute("aria-hidden", "true");
    document.body.append(line);
  });

  // Which way the shot goes (toward the pointer) and how loaded the cue is:
  // the further the pointer from the letter, the harder — move it back in to
  // ease off.
  const shotOf = (state: NonNullable<typeof aiming>) => {
    const aimX = state.pointerX - state.body.x;
    const aimY = state.pointerY - state.body.y;
    const reach = Math.hypot(aimX, aimY) || 1;
    const load = Math.min(Math.max((reach - 30) / FULL_DRAW, 0), 1);
    return { directionX: aimX / reach, directionY: aimY / reach, load };
  };

  // The cue lies behind the letter, drawn back as it loads; a guide runs
  // ahead, longer the harder the shot.
  const drawCue = (gap: number) => {
    if (!aiming) return;
    const { body } = aiming;
    const { directionX, directionY, load } = shotOf(aiming);
    const back = Math.atan2(-directionY, -directionX);
    cue.style.transform =
      `translate3d(${(body.x - directionX * gap).toFixed(1)}px, ${(body.y - directionY * gap).toFixed(1)}px, 0) rotate(${back.toFixed(4)}rad)`;
    guide.style.width = `${(60 + load * 560).toFixed(1)}px`;
    guide.style.transform =
      `translate3d(${(body.x + directionX * 24).toFixed(1)}px, ${(body.y + directionY * 24).toFixed(1)}px, 0) rotate(${(back + Math.PI).toFixed(4)}rad)`;
    guide.style.opacity = (0.35 + load * 0.65).toFixed(3);
  };

  // Out of its corner, toward the middle of the screen, so the cue has room.
  const stepOut = (body: CornerBody) => {
    const towardX = window.innerWidth / 2 - body.homeX;
    const towardY = window.innerHeight / 2 - body.homeY;
    const reach = Math.hypot(towardX, towardY) || 1;
    return { x: body.homeX + (towardX / reach) * STEP_OUT, y: body.homeY + (towardY / reach) * STEP_OUT };
  };

  const physics = cornerPhysics((all, delta, now) => {
    const step = delta / 16.7;
    all.forEach((body, index) => {
      // A letter back from a pocket grows into place.
      if (body.scale < 1 && !sinking.has(body)) body.scale = Math.min(1, body.scale + (1.08 - body.scale) * 0.14 * step);
      if (aiming?.body === body) {
        const out = stepOut(body);
        if (Math.hypot(body.x - body.homeX, body.y - body.homeY) < STEP_OUT * 1.1) {
          cornerSpring(body, out.x, out.y, delta, 0.16, 0.6);
        } else {
          body.velocityX = 0;
          body.velocityY = 0;
        }
        body.turn *= Math.pow(0.8, step);
        return;
      }
      if (placed.has(body)) {
        const target = cornerSpot(body, all);
        cornerSpring(body, target.x, target.y, delta, 0.2, 0.62);
        body.turn = whole > 0 ? Math.sin(now / 140 - index * 0.9) * 12 * whole : body.turn * 0.8;
        return;
      }
      if (sinking.has(body)) {
        // Through the pocket and off the screen, then back home with a pop.
        body.x += body.velocityX * step;
        body.y += body.velocityY * step;
        body.turn += body.velocityX * 0.6 * step;
        body.scale = Math.max(0.4, body.scale - 0.02 * step);
        const margin = 80;
        if (body.x < -margin || body.y < -margin || body.x > window.innerWidth + margin || body.y > window.innerHeight + margin) {
          sinking.delete(body);
          rolled.delete(body);
          body.x = body.homeX;
          body.y = body.homeY;
          body.velocityX = body.velocityY = 0;
          body.turn = 0;
          body.scale = 0;
        }
        return;
      }
      if (now - (rolled.get(body) ?? -Infinity) > 6000) {
        // Left alone, the balls are racked back in their corners.
        cornerSpring(body, body.homeX, body.homeY, delta, 0.025, 0.86);
        body.turn *= Math.pow(0.9, step);
        return;
      }
      // Running hard into a corner of the screen sinks it there.
      const speed = Math.hypot(body.velocityX, body.velocityY);
      const cornerX = body.velocityX < 0 ? 0 : window.innerWidth;
      const cornerY = body.velocityY < 0 ? 0 : window.innerHeight;
      // The top-left corner is where the name is made, so it has no pocket.
      const atName = cornerX === 0 && cornerY === 0;
      if (speed > 5 && !atName && Math.hypot(body.x - cornerX, body.y - cornerY) < POCKET) {
        sinking.add(body);
        return;
      }
      cornerRoll(body, delta, RADIUS, 0.978);
      cornerImpact(body, now);
      if (Math.hypot(body.velocityX, body.velocityY) > 0.4) rolled.set(body, now);
      // Slow enough near "Ra", it drops into the name; too fast and it runs on.
      const target = cornerSpot(body, all);
      if (Math.hypot(body.x - target.x, body.y - target.y) < 70 && Math.hypot(body.velocityX, body.velocityY) < 16) {
        placed.add(body);
        // Clear of the whole name, wherever its letters have landed.
        const nameWidth = all.reduce((width, other) => width + other.mark.offsetWidth - 1, 0);
        if (all.every((other) => placed.has(other))) {
          whole = 1;
          say("— hi, that's me.", nameWidth);
        } else {
          say(`${placed.size} of ${all.length}`, nameWidth);
        }
      }
    });
    const complete = all.length > 0 && all.every((body) => placed.has(body));
    whole = complete ? Math.max(0, whole - delta / 3000) : 0;
    cornerCollide(all.filter((body) => !placed.has(body) && !sinking.has(body) && aiming?.body !== body), RADIUS, 0.92);
    if (aiming) drawCue(24 + shotOf(aiming).load * 80);
  }, () => aiming !== null || whole > 0 || physics.bodies().some((body) =>
    // A loose letter still has to find its way home.
    !placed.has(body) && Math.hypot(body.x - body.homeX, body.y - body.homeY) > 0.5));
  const bodies = physics.bodies;

  [cornerMarks.he, cornerMarks.e, cornerMarks.m].forEach((mark) => {
    if (!mark) return;
    mark.classList.add("is-tossable");
    mark.addEventListener("pointerdown", (event) => {
      const body = bodies().find((candidate) => candidate.mark === mark);
      if (!body || sinking.has(body)) return;
      event.preventDefault();
      // Taking a placed letter back out of the name breaks it.
      if (placed.delete(body)) say("");
      whole = 0;
      body.velocityX = 0;
      body.velocityY = 0;
      aiming = { body, pointerX: event.clientX, pointerY: event.clientY };
      physics.wake();
      mark.setPointerCapture(event.pointerId);
      mark.classList.add("is-held");
      document.documentElement.classList.add("is-cue-aiming");
    });
    mark.addEventListener("pointermove", (event) => {
      if (aiming?.body.mark !== mark) return;
      aiming.pointerX = event.clientX;
      aiming.pointerY = event.clientY;
    });
    const strike = () => {
      if (aiming?.body.mark !== mark) return;
      const now = performance.now();
      const shot = aiming;
      const { directionX, directionY, load } = shotOf(shot);
      // The cue snaps forward into the letter, then fades.
      drawCue(14);
      aiming = null;
      mark.classList.remove("is-held");
      document.documentElement.classList.remove("is-cue-aiming");
      // A pointer still on the letter has nothing to aim at.
      if (Math.hypot(shot.pointerX - shot.body.x, shot.pointerY - shot.body.y) < 24) return;
      const power = 10 + load * 62;
      shot.body.velocityX = directionX * power;
      shot.body.velocityY = directionY * power;
      rolled.set(shot.body, now);
    };
    mark.addEventListener("pointerup", strike);
    mark.addEventListener("pointercancel", strike);
  });
};

cornerCue();
