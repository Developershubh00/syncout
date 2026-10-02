"use client";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/** Poster drifts slower than the page and the title lifts away as you scroll. */
export function ParallaxHero({ image, overlay, className }: { image: React.ReactNode; overlay: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["0%", "22%"]);
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1.04, 1.14]);
  const fade = useTransform(scrollYProgress, [0, 0.7], reduce ? [1, 1] : [1, 0]);
  const lift = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["0%", "-30%"]);
  return (
    <div ref={ref} className={className}>
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        {image}
      </motion.div>
      <motion.div className="absolute inset-0" style={{ opacity: fade, y: lift }}>
        {overlay}
      </motion.div>
    </div>
  );
}
