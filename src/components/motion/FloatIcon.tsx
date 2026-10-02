"use client";
import { motion, useReducedMotion } from "framer-motion";

/** A softly bobbing icon — for empty states and hero accents. */
export function FloatIcon({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className={className}
      animate={reduce ? undefined : { y: [0, -7, 0], rotate: [0, -4, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.span>
  );
}
