"use client";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { waLink } from "@/lib/whatsapp";
import { track } from "@/lib/track";

export function WhatsAppFab({ number }: { number: string }) {
  const path = usePathname();
  if (path.startsWith("/tickets") || path.startsWith("/login") || path.startsWith("/register")) return null;
  return (
    <a
      href={waLink(number, "Hi SyncOut! I have a question about a booking.")}
      target="_blank"
      rel="noreferrer"
      onClick={() => track("whatsapp_click", { label: path })}
      aria-label="Chat with SyncOut on WhatsApp"
      className="fixed right-4 z-30 grid size-12 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_8px_30px_rgba(37,211,102,.35)] transition-transform active:scale-95 lg:bottom-6 lg:right-6 lg:size-14"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 86px)" }}
    >
      <MessageCircle className="size-6" strokeWidth={2.2} />
    </a>
  );
}
