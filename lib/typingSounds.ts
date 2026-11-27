"use client";

import type { TypingSound } from "@/lib/writingModes";

// Typing sounds from real recordings (see public/sounds/typing/CREDITS.txt).
// Each sound is one small file holding several takes of every kind of key;
// a key picks a take at random, never the same twice in a row, and varies
// pitch and level a little so a run of letters never sounds like a loop.

export type KeyKind = "char" | "space" | "enter" | "backspace";

// [start, length] in milliseconds inside the sound's file.
type Take = [number, number];
type Pack = {
  file: string;
  takes: Partial<Record<KeyKind | "bell", Take[]>>;
  // How much the pitch may wander, as a fraction (0.03 = ±3%).
  pitch: number;
};

const PACKS: Record<Exclude<TypingSound, "none">, Pack> = {
  daktilo: {
    file: "/sounds/typing/typewriter.wav",
    pitch: 0.04,
    takes: {
      char: [[0, 223], [243, 223], [486, 171], [677, 147], [844, 203], [1067, 175], [1262, 179], [1461, 123], [1604, 223], [1847, 119], [1986, 191], [2197, 149], [2366, 102]],
      space: [[2488, 133], [2641, 103]],
      enter: [[2764, 119]],
      backspace: [[2903, 102]],
      bell: [[3025, 345]],
    },
  },
  mekanik: {
    file: "/sounds/typing/mechanical-brown.wav",
    pitch: 0.03,
    takes: {
      char: [[0, 211], [231, 191], [442, 200], [662, 192], [874, 193], [1087, 190], [1297, 192], [1509, 203], [1732, 198], [1950, 197], [2167, 187], [2374, 208]],
      space: [[2602, 216]],
      enter: [[2838, 194]],
      backspace: [[3052, 197]],
    },
  },
  tiklama: {
    file: "/sounds/typing/mechanical-blue.wav",
    pitch: 0.03,
    takes: {
      char: [[0, 177], [197, 180], [397, 172], [589, 221], [830, 163], [1013, 173], [1206, 173], [1399, 205], [1624, 191], [1835, 195], [2050, 205], [2275, 168]],
      space: [[2463, 243]],
      enter: [[2726, 201]],
      backspace: [[2947, 235]],
    },
  },
  yumusak: {
    file: "/sounds/typing/soft.wav",
    pitch: 0.03,
    takes: {
      char: [[0, 175.6], [195.6, 143], [358.6, 171], [549.6, 143], [712.6, 135], [867.6, 170], [1057.6, 147], [1224.6, 175], [1419.6, 155], [1594.6, 135], [1749.6, 174.7], [1944.2, 145.1]],
      space: [[2109.3, 175.3], [2304.6, 175]],
      enter: [[2499.6, 188.1], [2707.7, 173.4]],
      backspace: [[2901.1, 163], [3084.1, 166.1]],
    },
  },
  kalem: {
    file: "/sounds/typing/pencil.wav",
    pitch: 0.06,
    takes: {
      char: [[0, 75], [95, 75], [190, 75], [285, 75], [380, 75], [475, 75], [570, 75], [665, 75], [760, 75]],
      // A pencil makes no sound for a space.
      enter: [[855, 280]],
      backspace: [[1155, 160], [1335, 160]],
    },
  },
};

// Levels per sound, so switching doesn't jump in loudness.
const LEVEL: Record<Exclude<TypingSound, "none">, number> = {
  daktilo: 0.75,
  mekanik: 0.8,
  tiklama: 0.7,
  yumusak: 0.8,
  kalem: 0.6,
};

let context: AudioContext | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();
const lastTake = new Map<string, number>();

function audio() {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  if (context.state === "suspended") void context.resume();
  return context;
}

function load(ac: AudioContext, file: string) {
  let pending = buffers.get(file);
  if (!pending) {
    pending = fetch(file)
      .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error(String(res.status)))))
      .then((data) => ac.decodeAudioData(data))
      .catch(() => {
        buffers.delete(file); // try again next time
        return null;
      });
    buffers.set(file, pending);
  }
  return pending;
}

// Fetch a sound ahead of the first key, so the first press isn't silent.
export function preloadSound(sound: TypingSound) {
  if (sound === "none") return;
  const ac = audio();
  if (ac) void load(ac, PACKS[sound].file);
}

const vary = (amount: number) => 1 + (Math.random() * 2 - 1) * amount;

function pick(sound: string, kind: string, takes: Take[]) {
  const id = `${sound}:${kind}`;
  let index = Math.floor(Math.random() * takes.length);
  if (takes.length > 1 && index === lastTake.get(id)) index = (index + 1) % takes.length;
  lastTake.set(id, index);
  return takes[index];
}

function play(ac: AudioContext, buffer: AudioBuffer, take: Take, at: number, gain: number, rate: number) {
  const source = ac.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  const level = ac.createGain();
  level.gain.value = gain;
  source.connect(level).connect(ac.destination);
  source.start(at, take[0] / 1000, take[1] / 1000);
  source.onended = () => level.disconnect();
}

export function playKey(sound: TypingSound, key: KeyKind, volume: number) {
  if (sound === "none" || volume <= 0) return;
  const ac = audio();
  if (!ac) return;
  const pack = PACKS[sound];
  const takes = pack.takes[key] ?? (key === "space" ? undefined : pack.takes.char);
  if (!takes) return;
  const asked = performance.now();

  void load(ac, pack.file).then((buffer) => {
    // A sound that arrives late would only confuse; drop it.
    if (!buffer || performance.now() - asked > 250) return;
    const at = ac.currentTime + 0.001;
    const gain = volume * LEVEL[sound] * vary(0.12);
    play(ac, buffer, pick(sound, key, takes), at, gain, vary(pack.pitch));
    const bell = pack.takes.bell;
    if (key === "enter" && bell) play(ac, buffer, bell[0], at + 0.12, gain * 0.7, 1);
  });
}

export function keyKind(event: KeyboardEvent): KeyKind | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (event.key === "Enter") return "enter";
  if (event.key === " ") return "space";
  if (event.key === "Backspace" || event.key === "Delete") return "backspace";
  if (event.key.length === 1) return "char";
  return null;
}
