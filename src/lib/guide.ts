/**
 * The guide's answers. Scripted on purpose: instant, free, never makes things
 * up — and "talk to a person" is always one tap away.
 */
export type GuideAction = { label: string; href: string; whatsapp?: boolean };
export type GuideReply = { text: string; actions?: GuideAction[] };
export type GuideCtx = { signedIn: boolean; whatsappHref: (q: string) => string };

type Intent = { id: string; chip?: string; keys: string[]; reply: (c: GuideCtx, q: string) => GuideReply };

const person = (c: GuideCtx, q: string): GuideAction => ({ label: "Talk to a person", href: c.whatsappHref(q), whatsapp: true });

export const INTENTS: Intent[] = [
  {
    id: "where",
    chip: "Where's my ticket?",
    keys: ["my ticket", "my tickets", "my pass", "my passes", "my booking", "where is", "where's", "qr", "status", "find my"],
    reply: (c) => ({
      text: `Everything you've booked is in Passes — event tickets on top, guestlist passes below. Confirmed ones carry a QR for the entry, and they open even without signal once you've viewed them.${c.signedIn ? "" : " Booked without logging in? We made an account for you on that phone, so Passes already has it there."}`,
      actions: [{ label: "Open Passes", href: "/passes" }],
    }),
  },
  {
    id: "pay",
    chip: "How do I pay?",
    keys: ["pay", "payment", "upi", "gpay", "phonepe", "paytm", "paid", "screenshot", "utr", "verify", "confirm"],
    reply: (c, q) => ({
      text: "Pick your tickets, then pay by UPI from your ticket page — any UPI app works. Send the payment screenshot on WhatsApp from that same page and we confirm it, usually within minutes. Your ticket then turns Confirmed with a QR.",
      actions: [{ label: "Browse events", href: "/events" }, person(c, q)],
    }),
  },
  {
    id: "refund",
    chip: "Refunds",
    keys: ["refund", "cancel", "cancellation", "money back", "return"],
    reply: () => ({
      text: "Full refund if an event is cancelled or moved, if we couldn't confirm your tickets, or if you were charged twice. No refund for no-shows or entry refused at the door. Approved refunds reach your UPI account in 5–7 working days.",
      actions: [{ label: "Refund policy", href: "/refunds" }],
    }),
  },
  {
    id: "events",
    chip: "Dandiya & Garba",
    keys: ["dandiya", "garba", "navratri", "event", "events", "concert", "book ticket", "buy ticket"],
    reply: () => ({
      text: "Navratri runs 11–19 October with Dandiya and Garba nights across Delhi, Gurugram and Noida. Pick an event, choose a date and ticket type, add your details — it takes about a minute.",
      actions: [{ label: "Dandiya nights", href: "/dandiya" }, { label: "All events", href: "/events" }],
    }),
  },
  {
    id: "guestlist",
    chip: "Get on a guestlist",
    keys: ["guestlist", "guest list", "free entry", "apply", "approval", "approved", "tonight", "club night", "list"],
    reply: () => ({
      text: "Guestlists are free. Pick a night, tell us who's coming, and we confirm by 6 PM on the day — you'll get a notification and an email either way. Lists close at 6 PM.",
      actions: [{ label: "Tonight's nights", href: "/nights" }],
    }),
  },
  {
    id: "house",
    chip: "In-house clubs",
    keys: ["in-house", "inhouse", "in house", "premium", "millionaire", "impulse", "levernasia", "levernesia", "syncout house", "food", "drinks"],
    reply: () => ({
      text: "SyncOut House is our in-house club family at Gardens Galleria, Noida — Impulse, Levernasia and Millionaire The Lux Club. Premium crowd, food and drinks, and our own team on the door.",
      actions: [
        { label: "Impulse", href: "/clubs/impulse-gardens-galleria" },
        { label: "Levernasia", href: "/clubs/levernasia-gardens-galleria" },
        { label: "Millionaire", href: "/clubs/millionaire-the-lux-club-gardens-galleria" },
      ],
    }),
  },
  {
    id: "entry",
    chip: "Entry rules",
    keys: ["entry", "id", "age", "dress", "dress code", "rules", "bouncer", "door", "21", "25", "allowed"],
    reply: () => ({
      text: "Carry a government photo ID for everyone in your group. Clubs set their own age limits and dress codes — smart casuals usually work; shorts and slippers usually don't. Reach before the time on your pass.",
      actions: [{ label: "Terms", href: "/terms" }],
    }),
  },
  {
    id: "couples",
    chip: "Couples & stag",
    keys: ["couple", "couples", "stag", "guys", "boys", "girls", "ladies", "female", "male", "single"],
    reply: () => ({
      text: "Girls' lists are usually free. Couples apply as pairs — equal girls and guys, up to four couples. Stag (guys) entries are limited, and some nights close them.",
      actions: [{ label: "See tonight's nights", href: "/nights" }],
    }),
  },
  {
    id: "clubs",
    keys: ["club", "clubs", "bar", "lounge", "pub", "noida", "gurugram", "gurgaon", "delhi", "galleria", "party"],
    reply: () => ({
      text: "Here are the clubs by city — Gardens Galleria in Noida is the busiest strip right now.",
      actions: [
        { label: "Noida", href: "/clubs/in/noida" },
        { label: "Gurugram", href: "/clubs/in/gurugram" },
        { label: "Delhi", href: "/clubs" },
      ],
    }),
  },
  {
    id: "promo",
    keys: ["promo", "coupon", "discount", "offer", "early bird", "cheaper", "code"],
    reply: () => ({
      text: "Got a promo code? Enter it at the last step of checkout — or open the link your friend or creator shared, and it applies by itself. Early-bird prices show a countdown on the ticket card.",
      actions: [{ label: "Browse events", href: "/events" }],
    }),
  },
  {
    id: "group",
    keys: ["friends", "group", "split", "separately", "share my ticket", "each friend"],
    reply: () => ({
      text: "Booked for a group? Open your confirmed ticket and use “Send each friend their own pass” — everyone gets a personal QR and can arrive separately.",
      actions: [{ label: "Open Passes", href: "/passes" }],
    }),
  },
  {
    id: "account",
    keys: ["account", "login", "log in", "password", "sign up", "register", "forgot", "email"],
    reply: () => ({
      text: "If you booked without logging in, we made an account for you and you're logged in on that phone. Set a password in Profile → Edit to log in anywhere else. Forgot it? Use “Forgot password” on the login page.",
      actions: [{ label: "Profile", href: "/profile" }, { label: "Forgot password", href: "/forgot" }],
    }),
  },
  {
    id: "careers",
    keys: ["job", "jobs", "career", "careers", "intern", "internship", "volunteer", "hiring", "work with"],
    reply: () => ({ text: "We're hiring — roles, internships and a volunteer crew for Navratri.", actions: [{ label: "Careers", href: "/careers" }] }),
  },
  {
    id: "partner",
    keys: ["list my venue", "my venue", "partner", "organiser", "organizer", "promote my event", "collab"],
    reply: () => ({ text: "Run a venue or an event? Tell us about it and our partnerships team will call you.", actions: [{ label: "Partner with us", href: "/contact?topic=partner" }] }),
  },
  {
    id: "person",
    chip: "Talk to a person",
    keys: ["human", "person", "agent", "talk", "call", "whatsapp", "support", "someone", "real"],
    reply: (c, q) => ({ text: "Of course — tap below to chat with our team on WhatsApp. Evenings are busy, but we usually reply within minutes.", actions: [person(c, q)] }),
  },
  {
    id: "hello",
    keys: ["hi", "hello", "hey", "hii", "yo", "namaste"],
    reply: () => ({ text: "Hey! Ask me about tickets, guestlists, payments, refunds, entry rules or our in-house clubs." }),
  },
];

export const CHIPS = INTENTS.filter((i) => i.chip).map((i) => ({ id: i.id, label: i.chip! }));

export function replyFor(q: string, c: GuideCtx): GuideReply {
  const text = ` ${q.toLowerCase().replace(/[^a-z0-9'\- ]/g, " ").replace(/\s+/g, " ")} `;
  let best: Intent | null = null;
  let score = 0;
  for (const intent of INTENTS) {
    let s = 0;
    for (const k of intent.keys) if (text.includes(` ${k} `) || (k.length > 4 && text.includes(k))) s += k.includes(" ") ? 2 : 1;
    if (s > score) {
      best = intent;
      score = s;
    }
  }
  if (best) return best.reply(c, q);
  return { text: "I'm not sure about that one yet — but a real person can help right away.", actions: [person(c, q)] };
}

export const replyForChip = (id: string, c: GuideCtx) => INTENTS.find((i) => i.id === id)!.reply(c, INTENTS.find((i) => i.id === id)!.chip ?? "");
