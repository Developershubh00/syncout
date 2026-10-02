"use client";
import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Module state survives client-side navigations, so the very first page load
// renders instantly (no fade on server HTML) and every navigation after that
// gets a short entrance. Only opacity + transform, which settle to `none`:
// a lingering filter or transform would trap fixed overlays (sheets) under the tab bar.
let hydrated = false;

export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const animate = hydrated && !reduce;
  useEffect(() => {
    hydrated = true;
  }, []);
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 14 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
