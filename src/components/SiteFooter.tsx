import Link from "next/link";

const cols = [
  { head: "Explore", items: [["Tonight", "/nights"], ["All clubs", "/clubs"], ["Search", "/search"]] },
  { head: "Your account", items: [["Your list", "/profile"], ["Passes", "/passes"], ["Settings", "/profile"]] },
  { head: "Company", items: [["For venues", "/clubs"], ["Contact", "/profile"], ["Terms", "/"]] },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 hidden border-t border-line lg:block">
      <div className="mx-auto grid max-w-[1280px] grid-cols-[1.4fr_repeat(3,1fr)] gap-10 px-6 py-14">
        <div>
          <p className="font-display text-[21px] font-extrabold tracking-tight">
            Sync<span className="text-red">Out</span>
          </p>
          <p className="mt-3 max-w-[38ch] text-[13px] leading-relaxed text-muted">
            Guestlists for Delhi NCR. 21+ with a government photo ID. Entry stays at the
            venue&apos;s discretion and lists close at 6 PM on the day.
          </p>
          <p className="mt-6 text-[12px] text-faint">
            © {new Date().getFullYear()} SyncOut
          </p>
        </div>

        {cols.map((col) => (
          <div key={col.head}>
            <p className="text-[13px] font-semibold">{col.head}</p>
            <ul className="mt-3 space-y-2.5">
              {col.items.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-[13px] text-muted transition-colors hover:text-text">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
