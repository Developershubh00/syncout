import { TabBar } from "@/components/TabBar";
import { ToastHost } from "@/components/ui/Toast";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastHost>
      <div className="mx-auto min-h-dvh max-w-lg">
        <main className="mb-tabbar">{children}</main>
      </div>
      <TabBar />
    </ToastHost>
  );
}
