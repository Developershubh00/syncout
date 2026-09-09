import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function SectionHead({ title, sub, href }: { title: string; sub?: string; href?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 px-4">
      <div>
        <h2 className="text-[19px] leading-tight">{title}</h2>
        {sub && <p className="mt-0.5 text-[12.5px] text-muted">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="flex shrink-0 items-center gap-0.5 pb-0.5 text-[12.5px] font-semibold text-red">
          All
          <ChevronRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}
