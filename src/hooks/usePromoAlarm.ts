import { useEffect, useRef } from "react";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Unlocks audio on the first user interaction (browsers block autoplay). */
if (typeof window !== "undefined") {
  const unlock = () => getCtx();
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

function beep(at: number, freq: number) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, c.currentTime + at);
  gain.gain.exponentialRampToValueAtTime(0.18, c.currentTime + at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + 0.16);
  osc.connect(gain).connect(c.destination);
  osc.start(c.currentTime + at);
  osc.stop(c.currentTime + at + 0.2);
}

/**
 * Plays an alarm every second during the final minute of a promotion.
 * `key` keeps each promotion independent.
 */
export function usePromoAlarm(msLeft: number, key: string, enabled = true) {
  const lastSecond = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const active = msLeft > 0 && msLeft <= 60_000;
    if (!active) {
      lastSecond.current = null;
      return;
    }
    const second = Math.ceil(msLeft / 1000);
    if (lastSecond.current === second) return;
    lastSecond.current = second;
    if (second <= 10) {
      beep(0, 1200);
    } else if (second % 5 === 0 || second === 60) {
      beep(0, 880);
      beep(0.18, 1100);
    }
  }, [msLeft, key, enabled]);
}
