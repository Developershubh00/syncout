import Link from "next/link";

export function Empty({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="mx-4 rounded-[18px] border border-dashed border-line px-5 py-8 text-center">
      <p className="text-[15px] font-semibold">{title}</p>
      <p className="mx-auto mt-1.5 max-w-[34ch] text-[13px] leading-relaxed text-muted">{body}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-4 inline-flex h-10 items-center rounded-xl bg-raised px-4 text-[13.5px] font-semibold"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
