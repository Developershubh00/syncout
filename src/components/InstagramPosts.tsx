import { Instagram, ExternalLink } from "lucide-react";

/** Real posts from the club's own Instagram, shown with Instagram's official embed (nothing is copied). */
export function InstagramPosts({ handle, posts }: { handle: string | null; posts: string[] }) {
  const embeds = posts
    .map((u) => u.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/i))
    .filter((m): m is RegExpMatchArray => Boolean(m))
    .map((m) => ({ kind: m[1].toLowerCase(), code: m[2] }));
  if (!handle && !embeds.length) return null;
  const profile = handle ? `https://www.instagram.com/${handle}/` : null;
  return (
    <section className="pt-7">
      <div className="flex items-end justify-between gap-3 px-4 lg:px-0">
        <h2 className="flex items-center gap-2 text-[17px]">
          <Instagram className="size-4 text-[#ff6ad5]" /> {handle ? <>From <span className="text-[#ff6ad5]">@{handle}</span></> : "From their Instagram"}
        </h2>
        {profile && (
          <a href={profile} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-muted hover:text-text">
            Open <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>
      {embeds.length > 0 ? (
        <div className="no-scrollbar mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 lg:px-0">
          {embeds.map((e) => (
            <div key={e.code} className="w-[300px] shrink-0 snap-start overflow-hidden rounded-[22px] border border-line bg-white">
              <iframe
                src={`https://www.instagram.com/${e.kind}/${e.code}/embed/`}
                title={`Instagram post from ${handle ?? "the club"}`}
                loading="lazy"
                className="block h-[470px] w-full"
                allowTransparency
                scrolling="no"
              />
            </div>
          ))}
        </div>
      ) : (
        profile && (
          <a href={profile} target="_blank" rel="noreferrer" className="mx-4 mt-3 flex items-center gap-3 rounded-[22px] border border-line bg-gradient-to-r from-[#ff2bd6]/12 to-[#ff8a00]/10 p-4 lg:mx-0">
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#ff2bd6] to-[#ff8a00]"><Instagram className="size-5 text-white" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold">See their photos on Instagram</span>
              <span className="block text-[12.5px] text-muted">@{handle} · nights, crowd and food</span>
            </span>
            <ExternalLink className="size-4 text-muted" />
          </a>
        )
      )}
    </section>
  );
}
