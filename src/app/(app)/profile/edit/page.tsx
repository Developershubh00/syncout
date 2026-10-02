import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getUser } from "@/lib/session";
import { ProfileEditor } from "@/components/ProfileEditor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit profile", robots: { index: false } };

export default async function EditProfilePage() {
  const me = await getUser();
  if (!me) redirect("/login");
  const [u] = await db
    .select({ name: users.name, email: users.email, phone: users.phone, instagram: users.instagram, citySlug: users.citySlug, gender: users.gender, passwordSet: users.passwordSet })
    .from(users)
    .where(eq(users.id, me.id))
    .limit(1);
  if (!u) redirect("/login");
  return (
    <div className="mx-auto max-w-[560px] px-4 pb-12 pt-5 lg:px-0">
      <Link href="/profile" className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-text"><ChevronLeft className="size-4" /> Profile</Link>
      <h1 className="mb-5 mt-3 font-display text-[27px] font-extrabold tracking-tight">Edit profile</h1>
      <ProfileEditor me={u} />
    </div>
  );
}
