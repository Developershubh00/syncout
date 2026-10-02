import Link from "next/link";
import { dbHealth, healthAdvice } from "@/db/health";

/** Development only: explains an empty page when the cause is the database. Never renders in production. */
export async function DevDbHint() {
  if (process.env.NODE_ENV === "production") return null;
  const advice = healthAdvice(await dbHealth());
  if (!advice.length) return null;
  return (
    <div className="mx-4 mt-4 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-[13px] leading-relaxed text-amber-100 lg:mx-0">
      <p className="font-semibold">Dev note — why this is empty (visitors never see this box):</p>
      <ul className="mt-1.5 list-disc space-y-1 pl-5">
        {advice.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
      <p className="mt-2">
        Or use the one-click buttons in{" "}
        <Link href="/admin" className="underline">
          Admin → Overview
        </Link>
        .
      </p>
    </div>
  );
}
