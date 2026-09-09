import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-dvh max-w-lg place-items-center px-6 text-center">
      <div>
        <p className="font-display text-[64px] font-extrabold leading-none text-red">404</p>
        <h1 className="mt-3 font-display text-[22px] font-extrabold tracking-tight">
          This page left early
        </h1>
        <p className="mx-auto mt-2 max-w-[32ch] text-[13.5px] leading-relaxed text-muted">
          The link is dead or the night has passed. The rest of the city is still open.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-12 items-center rounded-2xl bg-red px-6 text-[15px] font-semibold"
        >
          Back to tonight
        </Link>
      </div>
    </div>
  );
}
