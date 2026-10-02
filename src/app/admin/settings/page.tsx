import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/session";
import { getSettingsFresh } from "@/lib/settings";
import { pushEnabled } from "@/lib/push";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  if (!(await getAdmin())) redirect("/admin");
  const settings = await getSettingsFresh();
  return (
    <div className="px-4 pt-6 lg:px-0">
      <h1 className="font-display text-[24px] font-extrabold tracking-tight lg:text-[30px]">Settings</h1>
      <div className="mt-5">
        <SettingsForm
          initial={settings}
          status={{
            push: pushEnabled(),
            mail: process.env.MAIL_ENABLED === "true" && Boolean(process.env.RESEND_API_KEY),
            blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
          }}
        />
      </div>
      <div className="h-10" />
    </div>
  );
}
