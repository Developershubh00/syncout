import Link from "next/link";

/* Internal links double as SEO: every city landing page is one hop from anywhere. */
const cols = [
  {
    head: "Dandiya 2026",
    items: [
      ["Dandiya in Delhi", "/dandiya/new-delhi"],
      ["Dandiya in Gurugram", "/dandiya/gurugram"],
      ["Dandiya in Noida", "/dandiya/noida"],
      ["All Navratri events", "/dandiya"],
    ],
  },
  {
    head: "Clubs & guestlists",
    items: [
      ["Clubs in Delhi", "/clubs/in/new-delhi"],
      ["Clubs in Gurugram", "/clubs/in/gurugram"],
      ["Clubs in Noida", "/clubs/in/noida"],
      ["Tonight's nights", "/nights"],
    ],
  },
  {
    head: "Events",
    items: [
      ["Events in Delhi", "/events/in/new-delhi"],
      ["Events in Gurugram", "/events/in/gurugram"],
      ["Events in Noida", "/events/in/noida"],
      ["Your passes", "/passes"],
    ],
  },
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
            Guestlists, club nights and Dandiya events across Delhi, Gurugram and Noida. 21+ with a government photo ID
            for clubs. Entry stays at the venue&apos;s discretion and guestlists close at 6 PM on the day.
          </p>
          <p className="mt-6 text-[12px] text-faint">© {new Date().getFullYear()} SyncOut</p>
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
