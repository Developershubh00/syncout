"use client";
import { useEffect, useState } from "react";
import { MARK_PATH, GRADIENT } from "./mark";

/**
 * First-open loading screen. The animation is plain CSS (globals.css, .splash*)
 * so it plays before any JavaScript arrives, and hides itself even if JS never
 * does. Shown once per visit; skipped for "reduce motion".
 */
export function Splash() {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (document.documentElement.classList.contains("no-splash")) return setGone(true);
    try {
      sessionStorage.setItem("so_splash", "1");
    } catch {}
    const t = setTimeout(() => setGone(true), 4900);
    return () => clearTimeout(t);
  }, []);
  if (gone) return null;
  return (
    <div className="splash" aria-hidden onClick={() => setGone(true)}>
      <div className="splash-layer l1" />
      <div className="splash-layer l2" />
      <div className="splash-layer l3" />
      <div className="splash-center">
        <svg viewBox="0 0 120 60" className="splash-svg" aria-hidden>
          <defs>
            <linearGradient id="spl-m" x1="0" y1="0" x2="1" y2="0">
              {GRADIENT.map((s) => (
                <stop key={s.offset} offset={s.offset} stopColor={s.color} />
              ))}
            </linearGradient>
            {/* a flat line has no height, so its gradient must be in user space */}
            <linearGradient id="spl-t" gradientUnits="userSpaceOnUse" x1="110" y1="0" x2="330" y2="0">
              <stop offset="0%" stopColor="#f2c14e" />
              <stop offset="100%" stopColor="#ff2bd6" />
            </linearGradient>
          </defs>
          <path className="splash-mark" d={MARK_PATH} pathLength={1} fill="none" stroke="url(#spl-m)" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
          <g className="splash-eyes">
            <g className="splash-eyes-inner">
              <rect x={26.8} y={23} width={6.4} height={14} rx={3.2} fill="#fff" />
              <rect x={86.8} y={23} width={6.4} height={14} rx={3.2} fill="#fff" />
            </g>
          </g>
          <rect className="splash-gap" x={104} y={20} width={13} height={20} fill="#08080a" />
          <path className="splash-tail" d="M111 30H330" pathLength={1} fill="none" stroke="url(#spl-t)" strokeWidth={4} strokeLinecap="round" />
        </svg>
        <span className="splash-word">
          {"syncout".split("").map((ch, i) => (
            <span key={i} style={{ "--i": i } as React.CSSProperties} className={i >= 4 ? "out" : undefined}>
              {ch}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
