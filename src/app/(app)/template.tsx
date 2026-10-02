import { PageTransition } from "@/components/motion/PageTransition";

// A template re-mounts on every navigation, so each page gets a short entrance.
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
