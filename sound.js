"use strict";
// Sound and haptics for the whole site: small sounds synthesised with the Web
// Audio API (no files to download), and a buzz on phones that can vibrate.
// Browsers only allow sound after the visitor has clicked or pressed a key,
// so it wakes on the first one. "/ Sound on" in the nav (or S) turns both
// off and on, remembered across visits.
const siteSoundKey = "raheem-sound";
const siteSound = (() => {
    let enabled = true;
    try {
        enabled = window.localStorage.getItem(siteSoundKey) !== "off";
    }
    catch {
        // Without storage it simply starts on.
    }
    let audio = null;
    let master = null;
    let noise = null;
    const lastPlayed = new Map();
    const wake = () => {
        if (audio || !enabled)
            return;
        const Context = window.AudioContext ?? window.webkitAudioContext;
        if (!Context)
            return;
        audio = new Context();
        master = audio.createGain();
        master.gain.value = 0.32;
        master.connect(audio.destination);
        // Half a second of white noise, the raw stuff of rustles and knocks.
        noise = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.5), audio.sampleRate);
        const samples = noise.getChannelData(0);
        for (let index = 0; index < samples.length; index += 1)
            samples[index] = Math.random() * 2 - 1;
    };
    ["pointerdown", "keydown", "touchstart"].forEach((type) => {
        window.addEventListener(type, wake, { passive: true });
    });
    // A sound can run at most this often, so a burst of collisions or a sweep
    // of hovers doesn't turn into a buzz.
    const ready = (name, gap) => {
        if (!enabled || !audio || !master)
            return null;
        if (audio.state === "suspended")
            void audio.resume();
        const now = performance.now();
        if (now - (lastPlayed.get(name) ?? -Infinity) < gap)
            return null;
        lastPlayed.set(name, now);
        return { audio, master, at: audio.currentTime };
    };
    // A pitched tone that sweeps from one frequency to another and dies away.
    const tone = (out, from, to, length, volume, shape = "sine", delay = 0) => {
        const start = out.at + delay;
        const oscillator = out.audio.createOscillator();
        const gain = out.audio.createGain();
        oscillator.type = shape;
        oscillator.frequency.setValueAtTime(from, start);
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(to, 1), start + length);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
        oscillator.connect(gain).connect(out.master);
        oscillator.start(start);
        oscillator.stop(start + length + 0.02);
    };
    // A burst of filtered noise; `sweepTo` moves the filter as it plays.
    const hiss = (out, kind, frequency, length, volume, sweepTo = frequency) => {
        if (!noise)
            return;
        const source = out.audio.createBufferSource();
        source.buffer = noise;
        const filter = out.audio.createBiquadFilter();
        filter.type = kind;
        filter.frequency.setValueAtTime(frequency, out.at);
        filter.frequency.exponentialRampToValueAtTime(sweepTo, out.at + length);
        filter.Q.value = 0.9;
        const gain = out.audio.createGain();
        gain.gain.setValueAtTime(0.0001, out.at);
        gain.gain.exponentialRampToValueAtTime(volume, out.at + Math.min(0.02, length / 4));
        gain.gain.exponentialRampToValueAtTime(0.0001, out.at + length);
        source.connect(filter).connect(gain).connect(out.master);
        source.start(out.at);
        source.stop(out.at + length + 0.02);
    };
    // A pentatonic run, so any order of notes sounds like a tune.
    const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
    const sounds = {
        // The faintest tick, for hovering and small taps.
        tick(volume = 0.25) {
            const out = ready("tick", 45);
            if (out)
                tone(out, 2600, 1800, 0.035, volume * 0.5, "triangle");
        },
        // A cue striking a letter: a wooden knock, harder with more power (0–1).
        strike(power) {
            const out = ready("strike", 60);
            if (!out)
                return;
            tone(out, 180 + power * 60, 70, 0.12, 0.4 + power * 0.5);
            hiss(out, "bandpass", 2200, 0.05, 0.25 + power * 0.35);
        },
        // Letters clacking into each other (strength 0–1).
        clack(strength) {
            const out = ready("clack", 35);
            if (out) {
                tone(out, 1400 + strength * 600, 900, 0.045, 0.12 + strength * 0.3, "triangle");
                hiss(out, "bandpass", 3200, 0.03, 0.08 + strength * 0.15);
            }
        },
        // A letter bouncing off the edge of the screen (strength 0–1).
        bump(strength) {
            const out = ready("bump", 50);
            if (out)
                tone(out, 220, 110, 0.07, 0.1 + strength * 0.3);
        },
        // A letter dropping into a corner pocket.
        plop() {
            const out = ready("plop", 120);
            if (out)
                tone(out, 620, 140, 0.18, 0.45);
        },
        // A letter snapping into its place in the name.
        pop() {
            const out = ready("pop", 80);
            if (out)
                tone(out, 520, 1100, 0.09, 0.4);
        },
        // The name complete: three rising notes.
        chime() {
            const out = ready("chime", 400);
            if (!out)
                return;
            [0, 2, 4].forEach((step, index) => tone(out, scale[step] * 2, scale[step] * 2, 0.5, 0.22, "sine", index * 0.09));
        },
        // One note of the footer's RAHEEM, by letter, like a marimba.
        note(index) {
            const out = ready(`note-${index}`, 70);
            if (!out)
                return;
            const pitch = scale[index % scale.length];
            tone(out, pitch, pitch, 0.32, 0.22, "sine");
            tone(out, pitch * 4, pitch * 4, 0.06, 0.05, "sine");
        },
        // Paper picked up off the desk.
        rustle() {
            const out = ready("rustle", 120);
            if (out)
                hiss(out, "highpass", 2400, 0.14, 0.18, 5200);
        },
        // Something sent on its way: air rushing past.
        whoosh() {
            const out = ready("whoosh", 300);
            if (out)
                hiss(out, "bandpass", 500, 0.5, 0.3, 2600);
        },
    };
    // A buzz, where the device allows it (Android; not iPhone or desktop).
    const buzz = (pattern) => {
        if (enabled && typeof navigator.vibrate === "function")
            navigator.vibrate(pattern);
    };
    // The nav's sound switch.
    const toggle = document.createElement("a");
    toggle.href = "#";
    toggle.dataset.soundToggle = "";
    toggle.setAttribute("role", "button");
    const label = () => {
        toggle.innerHTML = `/ SOUND ${enabled ? "ON" : "OFF"} <span aria-hidden="true">S</span>`;
        toggle.setAttribute("aria-pressed", String(enabled));
        toggle.setAttribute("aria-label", enabled ? "Sound and haptics on — turn off" : "Sound and haptics off — turn on");
    };
    label();
    toggle.addEventListener("click", (event) => {
        event.preventDefault();
        enabled = !enabled;
        try {
            window.localStorage.setItem(siteSoundKey, enabled ? "on" : "off");
        }
        catch {
            // The choice lasts for this page.
        }
        label();
        wake();
        sounds.tick(0.6);
    });
    document.querySelector(".site-nav")?.append(toggle);
    // A soft tick on hovering the nav.
    document.querySelectorAll(".site-nav a").forEach((link) => {
        link.addEventListener("pointerenter", () => sounds.tick());
    });
    return { ...sounds, buzz };
})();
