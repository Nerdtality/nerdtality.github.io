// data.jsx — minimal personal info

const PROFILE = {
  name: "Chance Dority",
  role: "Senior Systems & Network Engineer",
  location: "Columbia, MO",
  // Web3Forms access key — delivers form submissions to your inbox.
  // This key can only send TO you, never read anything. Safe to leave in source.
  contactKey: "2ac58c44-3608-404c-9b0e-292a1fee3482",
  intro: [
    "I build the quiet networks and systems underneath government, public safety, and healthcare. The kind of infrastructure that runs for years without anyone having to think about it.",
  ],
  // a few short things to know, not a resume
  facts: [
    { k: "Cleared", v: "Clearance Eligable · CJIS-cleared background", featured: true },
    { k: "Now",  v: "Senior infra at an MSP" },
    { k: "Past", v: "Manufacturing IT, hospital IT" },
    { k: "Years", v: "8+ in IT & infrastructure", count: 8 },
    { k: "Lives", v: "Denver, CO" },
    { k: "Specialty", v: "Gov't agencies · 911 call centers · Public safety systems", wide: true, highlight: true },
    { k: "Also", v: "Eagle Scout · Tech School Curriculum Advisor", wide: true },
    { k: "Off-clock", v: "Storm chasing · Caving · Amateur radio · Home automation", wide: true },
  ],
};

Object.assign(window, { PROFILE });
