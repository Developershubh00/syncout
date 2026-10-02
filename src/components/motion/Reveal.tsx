"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";

/**
 * Entrance animation that never hides server-rendered content.
 *
 * Content is visible in the HTML (good for first paint and SEO). After the
 * page hydrates, anything still BELOW the fold is tucked away and slides in
 * when it scrolls into view. Things already on screen just stay put.
 */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  scale = 1,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  scale?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();
  const reduce = useReducedMotion();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    controls.set({ opacity: 0, y, scale });
    setArmed(true);
  }, [controls, reduce, y, scale]);

  useEffect(() => {
    if (!armed || !ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        controls.start({ opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 24, stiffness: 170, delay } });
        io.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [armed, controls, delay]);

  return (
    <motion.div ref={ref} animate={controls} className={className}>
      {children}
    </motion.div>
  );
}

/** A card in a grid: reveals like <Reveal>, staggered across the row, and reacts to hover/tap. */
export function MotionCard({
  children,
  index = 0,
  columns = 3,
  className,
}: {
  children: React.ReactNode;
  index?: number;
  columns?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <Reveal delay={(index % columns) * 0.07} y={30} scale={0.97} className={className}>
      <motion.div
        whileHover={reduce ? undefined : { y: -6 }}
        whileTap={reduce ? undefined : { scale: 0.97 }}
        transition={{ type: "spring", damping: 20, stiffness: 320 }}
      >
        {children}
      </motion.div>
    </Reveal>
  );
}
