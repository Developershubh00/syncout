"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Renders into <body>, so overlays sit above the tab bar no matter where they're used. */
export function Portal({ children }: { children: React.ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => setEl(document.body), []);
  return el ? createPortal(children, el) : null;
}
