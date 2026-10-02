/** Default openings — loaded by `npm run db:seed` or Admin → Careers → "Load default roles". Edit freely afterwards. */
export type SeedOpening = {
  slug: string; title: string; team: string;
  type: "full_time" | "part_time" | "internship" | "volunteer" | "contract";
  location: string; workMode: "onsite" | "hybrid" | "remote";
  summary: string; responsibilities: string[]; requirements: string[]; perks: string[];
};

const NCR = "Delhi NCR";
const NIGHTLIFE_PERKS = ["Guestlist access at partner venues", "Work on the biggest nights in NCR", "Fast-moving team, real ownership"];

export const DEFAULT_OPENINGS: SeedOpening[] = [
  {
    slug: "sde-1-full-stack", title: "SDE-1 (Full-stack)", team: "Engineering", type: "full_time", location: NCR, workMode: "hybrid",
    summary: "Build the app people use to get into Delhi NCR's best nights — booking flows, payments, the door scanner and the admin tools behind them.",
    responsibilities: ["Ship features end to end in Next.js, TypeScript and Postgres", "Own performance and reliability of booking and payment flows", "Build internal tools the ops team uses every night", "Review code and keep the codebase simple"],
    requirements: ["0–2 years building web apps (internships count)", "Comfortable with React and TypeScript", "Some SQL and API design", "A link to something you've built"],
    perks: ["Laptop provided", ...NIGHTLIFE_PERKS],
  },
  {
    slug: "content-editor", title: "Content & Social Editor", team: "Content", type: "full_time", location: NCR, workMode: "hybrid",
    summary: "Own what SyncOut says and how it looks — event write-ups, Instagram, WhatsApp updates and the copy on the site.",
    responsibilities: ["Write and edit event and club listings", "Plan and publish the Instagram calendar", "Edit short videos and carousels", "Keep the brand voice sharp and consistent"],
    requirements: ["A portfolio of writing or social work", "Strong English; Hindi a plus", "Comfort with Canva/CapCut or similar", "Knows Delhi NCR nightlife"],
    perks: NIGHTLIFE_PERKS,
  },
  {
    slug: "content-creator-reels", title: "Content Creator (Reels & Shorts)", team: "Content", type: "contract", location: NCR, workMode: "onsite",
    summary: "Shoot and edit the reels that make people want to be there — at Dandiya nights, club launches and guestlist nights.",
    responsibilities: ["Shoot on-ground content at events", "Edit vertical video fast, same night when needed", "Spot trends and turn them into formats"],
    requirements: ["Portfolio of reels/shorts", "Own phone or camera kit", "Available evenings and weekends"],
    perks: ["Paid per shoot", ...NIGHTLIFE_PERKS],
  },
  {
    slug: "event-planner", title: "Event Planner / Event Ops", team: "Events", type: "full_time", location: NCR, workMode: "onsite",
    summary: "Plan and run nights with our partner venues — line-ups, guestlists, door operations and the guest experience.",
    responsibilities: ["Plan event calendars with venues and promoters", "Run door and guestlist operations on event nights", "Coordinate artists, vendors and volunteers", "Report on attendance and feedback after each night"],
    requirements: ["1+ year in events, hospitality or nightlife", "Calm under pressure at 11 PM on a Saturday", "Strong network in Delhi NCR a big plus"],
    perks: NIGHTLIFE_PERKS,
  },
  {
    slug: "partnerships-associate", title: "Partnerships Associate — Venues & Promoters", team: "Partnerships", type: "full_time", location: NCR, workMode: "onsite",
    summary: "Bring the best clubs, bars and event organisers onto SyncOut and keep them growing with us.",
    responsibilities: ["Pitch and sign venues and organisers", "Negotiate guestlist and ticket allocations", "Be the day-to-day contact for partners"],
    requirements: ["Sales or partnerships experience (any industry)", "Confident in person and on calls", "Two-wheeler and willingness to travel across NCR"],
    perks: ["Incentives on signed partners", ...NIGHTLIFE_PERKS],
  },
  {
    slug: "photographer-videographer", title: "Photographer & Videographer", team: "Content", type: "part_time", location: NCR, workMode: "onsite",
    summary: "Capture the nights — crowd, artists and venues — for our app, Instagram and partners.",
    responsibilities: ["Shoot events and venue spaces", "Deliver edited sets within 24 hours"],
    requirements: ["Portfolio of event or nightlife work", "Own kit"],
    perks: ["Paid per event", "Credit on every post"],
  },
  {
    slug: "sde-intern", title: "Software Engineering Intern", team: "Engineering", type: "internship", location: NCR, workMode: "remote",
    summary: "Three to six months building real features with the engineering team — with a path to SDE-1.",
    responsibilities: ["Build and ship features with code review", "Fix bugs and write small tools", "Learn how a live product runs"],
    requirements: ["Student or recent graduate", "Knows JavaScript/TypeScript basics", "A GitHub or project link"],
    perks: ["Stipend", "Certificate and letter of recommendation", "Pre-placement offer for strong interns"],
  },
  {
    slug: "marketing-intern", title: "Marketing & Growth Intern", team: "Marketing", type: "internship", location: NCR, workMode: "hybrid",
    summary: "Help run campaigns for Dandiya season and beyond — ads, influencer tie-ups and on-campus promotion.",
    responsibilities: ["Support Instagram and ads campaigns", "Coordinate influencers and college ambassadors", "Track what works and report weekly"],
    requirements: ["Curious about growth and social", "Good communication", "Available 3+ months"],
    perks: ["Stipend", "Certificate", "Event access"],
  },
  {
    slug: "content-writing-intern", title: "Content Writing Intern", team: "Content", type: "internship", location: NCR, workMode: "remote",
    summary: "Write the listings, guides and posts that help people pick their night.",
    responsibilities: ["Write event and club write-ups", "Draft city guides for SEO", "Proofread across the site"],
    requirements: ["Writing samples", "Good grammar and an ear for tone"],
    perks: ["Stipend", "Certificate", "Bylines"],
  },
  {
    slug: "city-ambassador", title: "Campus & City Ambassador", team: "Community", type: "internship", location: NCR, workMode: "remote",
    summary: "Be SyncOut on your campus or in your area — bring friends to the best nights and earn while doing it.",
    responsibilities: ["Share events with your network", "Organise group bookings", "Feed back what your crowd wants"],
    requirements: ["Active social circle in Delhi NCR", "18+"],
    perks: ["Free guestlist spots", "Rewards for every group you bring", "Certificate"],
  },
  {
    slug: "event-volunteer", title: "Event Volunteer — Navratri Crew", team: "Events", type: "volunteer", location: NCR, workMode: "onsite",
    summary: "Join the crew at Dandiya and Garba nights — help guests in, keep queues moving and be part of the biggest nights of the season.",
    responsibilities: ["Help with check-in and ticket scanning", "Guide guests and answer questions", "Support the team on the night"],
    requirements: ["18+", "Available on at least two event evenings", "Friendly and reliable"],
    perks: ["Free entry to the event you work", "Food on the night", "Volunteer certificate"],
  },
  {
    slug: "guest-experience-volunteer", title: "Guest Experience Volunteer", team: "Events", type: "volunteer", location: NCR, workMode: "onsite",
    summary: "Help make club nights and events feel welcoming — from the guestlist desk to helping groups find their way.",
    responsibilities: ["Welcome guests at the SyncOut desk", "Help with guestlist questions on the night"],
    requirements: ["18+", "Evenings and weekends"],
    perks: ["Guestlist access", "Certificate"],
  },
];

export const JOB_TYPE_LABEL: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  volunteer: "Volunteer",
};
export const WORK_MODE_LABEL: Record<string, string> = { onsite: "On-site", hybrid: "Hybrid", remote: "Remote" };
