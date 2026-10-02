"use client";
import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Module state survives client-side navigations, so the very first page load
// renders instantly (no fade on server HTML) and every navigation after that
// gets a short entrance.
let hydrated = false;

export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const animate = hydrated && !reduce;
  useEffect(() => {
    hydrated = true;
  }, []);
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 14, filter: "blur(4px)" } : false}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
