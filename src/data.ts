// Central content + schedule data.
// The `batches` list is shaped like an API response so it can later be swapped
// for a fetch() to the admin/management system without touching any UI code.

export const px = (id: number, w = 1200, h = 800) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;

export const IMG = {
  hero: px(38519999, 2000, 1200),
  truck: px(37538286, 1000, 700),
  crane: px(5504388, 1000, 700),
  excavator: px(36102634, 1000, 700),
  forklift: px(37769430, 1000, 700),
  forkliftCab: px(41145603, 1000, 700),
  crew: px(38043248, 1200, 800),
  engineers: px(8961146, 1200, 800),
  safety: px(8487408, 1000, 700),
  site: px(3680959, 1000, 700),
  instructorA: px(8486977, 600, 700),
  instructorB: px(15947456, 600, 700),
  instructorC: px(3680959, 600, 700),
  instructorD: px(8487408, 600, 700),
  craneNight: px(10143241, 1000, 700),
  quarry: px(15071423, 1000, 700),
  person1: px(14950779, 200, 200),
  person2: px(35681211, 200, 200),
  person3: px(33799456, 200, 200),
};

export const contact = {
  phone: "+234 800 000 0000",
  phoneHref: "tel:+2348000000000",
  whatsapp: "2348000000000",
  email: "admissions@oldamtech.academy",
  address: "Plot 14, Industrial Training Avenue, Ikeja Industrial Estate, Lagos, Nigeria",
  hours: [
    { day: "Monday – Friday", time: "8:00 AM – 5:00 PM" },
    { day: "Saturday", time: "9:00 AM – 2:00 PM" },
    { day: "Sunday & Holidays", time: "Closed" },
  ],
};

export const currency = "₦";
export const money = (n: number) => `${currency}${n.toLocaleString("en-NG")}`;

export const REGISTRATION_FEE = 15000;
export const EARLY_BIRD_PERCENT = 10;
export const PROMO_CODES: Record<string, number> = { OLDAM5: 5, SAFETYFIRST: 7 };

export type Programme = {
  slug: string;
  title: string;
  short: string;
  tagline: string;
  image: string;
  gallery: string[];
  icon: "truck" | "crane" | "excavator" | "forklift";
  duration: string;
  tuition: number;
  certification: string;
  level: string;
  requirements: string[];
  outline: { module: string; detail: string }[];
  practical: string[];
  career: string[];
};

export const programmes: Programme[] = [
  {
    slug: "truck-driving",
    title: "Truck Driving",
    short:
      "Heavy goods vehicle licence preparation, defensive driving, load handling and long-haul safety on real routes.",
    tagline: "From first gear to long-haul confidence.",
    image: IMG.truck,
    gallery: [IMG.truck, IMG.crew, IMG.safety],
    icon: "truck",
    duration: "8 weeks",
    tuition: 285000,
    certification: "Heavy Goods Vehicle (HGV) Competency Certificate",
    level: "Beginner to Professional",
    requirements: [
      "Minimum age of 21 years",
      "Valid driver's licence (Class B or higher)",
      "Medical & eyesight fitness certificate",
      "Two passport photographs and a valid ID",
      "Basic literacy in English",
    ],
    outline: [
      { module: "Vehicle Systems & Pre-trip Inspection", detail: "Air brakes, drivetrain, tyres, lights and daily checks." },
      { module: "Road Rules & Defensive Driving", detail: "Hazard perception, following distances, night and wet-weather driving." },
      { module: "Load Securing & Cargo Handling", detail: "Weight distribution, restraint methods and hazardous-load basics." },
      { module: "Manoeuvring & Reversing", detail: "Articulated turns, docking, hill starts and tight-space control." },
      { module: "Route Planning & Fatigue Management", detail: "Logbooks, rest regulations and trip documentation." },
      { module: "Road Test & Assessment", detail: "Supervised route test with a certified examiner." },
    ],
    practical: ["60+ hours behind the wheel", "Articulated truck simulator sessions", "Supervised highway driving", "Loading-bay & reversing drills"],
    career: ["Long-haul driver", "Logistics fleet driver", "Tanker & container haulage"],
  },
  {
    slug: "crane-operations",
    title: "Crane Operations",
    short:
      "Mobile and tower crane operation, rigging, signalling and load-chart mastery with an uncompromising safety culture.",
    tagline: "Lift with precision. Operate with certainty.",
    image: IMG.crane,
    gallery: [IMG.crane, IMG.craneNight, IMG.engineers],
    icon: "crane",
    duration: "10 weeks",
    tuition: 420000,
    certification: "Certified Crane Operator (Mobile & Tower)",
    level: "Intermediate",
    requirements: [
      "Minimum age of 21 years",
      "Secondary school certificate (or equivalent)",
      "Medical fitness certificate, including height-work clearance",
      "Valid government ID and two passport photographs",
      "Basic numeracy for load calculations",
    ],
    outline: [
      { module: "Crane Types, Components & Controls", detail: "Mobile, crawler and tower cranes — structure and function." },
      { module: "Load Charts & Lift Planning", detail: "Radius, boom angle, capacity and safe-lift calculations." },
      { module: "Rigging & Hand Signals", detail: "Slings, shackles, hitches and standard signalling." },
      { module: "Site Safety & Risk Assessment", detail: "Ground conditions, exclusion zones and overhead hazards." },
      { module: "Practical Operation", detail: "Controlled lifts, placement accuracy and multi-lift sequences." },
      { module: "Theory & Practical Certification", detail: "Written exam and observed operational assessment." },
    ],
    practical: ["70+ hours of live crane time", "Rigging yard practice", "Mobile crane & tower crane simulators", "Real load placement drills"],
    career: ["Mobile crane operator", "Tower crane operator", "Port & yard crane operator"],
  },
  {
    slug: "heavy-equipment",
    title: "Heavy Equipment Operations",
    short:
      "Excavators, bulldozers, loaders and graders — earthmoving skills taught on live training ground with expert coaching.",
    tagline: "Move earth. Build the future.",
    image: IMG.excavator,
    gallery: [IMG.excavator, IMG.quarry, IMG.site],
    icon: "excavator",
    duration: "12 weeks",
    tuition: 360000,
    certification: "Heavy Equipment Operator Certificate",
    level: "Beginner to Intermediate",
    requirements: [
      "Minimum age of 20 years",
      "Primary or secondary school certificate",
      "Medical fitness certificate",
      "Valid ID and two passport photographs",
      "Willingness to train outdoors in all conditions",
    ],
    outline: [
      { module: "Machine Familiarisation & Daily Checks", detail: "Controls, hydraulics, fluids and maintenance routines." },
      { module: "Excavator Operation", detail: "Trenching, grading, loading trucks and precision digging." },
      { module: "Loader & Bulldozer Operation", detail: "Stockpiling, pushing, levelling and slope work." },
      { module: "Grader & Compaction Equipment", detail: "Road base shaping, finishing and compaction." },
      { module: "Reading Site Plans & Grade Stakes", detail: "Levels, gradients and survey markers." },
      { module: "Safety, Spotting & Assessment", detail: "Working near people and utilities, final practical test." },
    ],
    practical: ["80+ hours on live machines", "On-site excavation pit", "Grade-control exercises", "Maintenance workshop sessions"],
    career: ["Excavator operator", "Dozer / loader operator", "Road construction crew"],
  },
  {
    slug: "forklift-operations",
    title: "Forklift Operations",
    short:
      "Counterbalance and reach-truck certification for warehouses, ports and factories — quick to complete, hugely in demand.",
    tagline: "Fast certification. Immediate employability.",
    image: IMG.forklift,
    gallery: [IMG.forklift, IMG.forkliftCab, IMG.safety],
    icon: "forklift",
    duration: "3 weeks",
    tuition: 95000,
    certification: "Forklift Operator Licence (Counterbalance & Reach)",
    level: "Beginner",
    requirements: [
      "Minimum age of 18 years",
      "Ability to read and follow safety instructions",
      "Basic medical fitness declaration",
      "Valid ID and one passport photograph",
    ],
    outline: [
      { module: "Forklift Basics & Stability Principles", detail: "Centre of gravity, load capacity plates and stability triangle." },
      { module: "Pre-use Inspection & Battery/Fuel Safety", detail: "Daily checklist, LPG, diesel and electric trucks." },
      { module: "Operating Techniques", detail: "Travelling, stacking, racking and pallet handling." },
      { module: "Warehouse Safety & Pedestrian Awareness", detail: "Aisle rules, ramps, speed and visibility." },
      { module: "Reach Truck & Narrow-Aisle Operation", detail: "High-bay racking and precision placement." },
      { module: "Assessment & Licensing", detail: "Written test and observed practical." },
    ],
    practical: ["30+ hours on counterbalance & reach trucks", "Racking practice bay", "Pedestrian-safety scenarios", "Load-handling drills"],
    career: ["Warehouse operator", "Port & dock handler", "Factory materials handler"],
  },
];

export const getProgramme = (slug: string) => programmes.find((p) => p.slug === slug);

// ---------- Training batches ----------
export type Batch = {
  id: string;
  programme: string;
  start: string; // ISO date
  deadline: string; // registration deadline ISO
  seats: number;
  taken: number;
  mode: "Full-time" | "Weekend";
  campus: string;
  earlyBird: boolean;
};

const addDays = (n: number) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const batches: Batch[] = [
  { id: "TD-A", programme: "truck-driving", start: addDays(24), deadline: addDays(17), seats: 24, taken: 15, mode: "Full-time", campus: "Lagos Main Campus", earlyBird: true },
  { id: "TD-B", programme: "truck-driving", start: addDays(75), deadline: addDays(66), seats: 24, taken: 4, mode: "Weekend", campus: "Lagos Main Campus", earlyBird: true },
  { id: "CR-A", programme: "crane-operations", start: addDays(18), deadline: addDays(11), seats: 16, taken: 14, mode: "Full-time", campus: "Lagos Main Campus", earlyBird: false },
  { id: "CR-B", programme: "crane-operations", start: addDays(68), deadline: addDays(58), seats: 16, taken: 3, mode: "Full-time", campus: "Lagos Main Campus", earlyBird: true },
  { id: "HE-A", programme: "heavy-equipment", start: addDays(32), deadline: addDays(24), seats: 20, taken: 8, mode: "Full-time", campus: "Epe Practical Ground", earlyBird: true },
  { id: "HE-B", programme: "heavy-equipment", start: addDays(90), deadline: addDays(80), seats: 20, taken: 2, mode: "Weekend", campus: "Epe Practical Ground", earlyBird: true },
  { id: "FL-A", programme: "forklift-operations", start: addDays(10), deadline: addDays(5), seats: 30, taken: 22, mode: "Full-time", campus: "Lagos Main Campus", earlyBird: false },
  { id: "FL-B", programme: "forklift-operations", start: addDays(38), deadline: addDays(30), seats: 30, taken: 9, mode: "Full-time", campus: "Lagos Main Campus", earlyBird: true },
  { id: "FL-C", programme: "forklift-operations", start: addDays(52), deadline: addDays(45), seats: 30, taken: 0, mode: "Weekend", campus: "Lagos Main Campus", earlyBird: true },
];

export const fmtDate = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export const daysUntil = (iso: string) => Math.ceil((new Date(iso + "T12:00:00").getTime() - Date.now()) / 86400000);

export const getBatch = (id: string) => batches.find((b) => b.id === id);

// ---------- Static content ----------
export const sellingPoints = [
  { icon: "award", title: "Certified Programmes", text: "Industry-recognised certificates that employers across the region trust." },
  { icon: "wrench", title: "70% Hands-on Training", text: "Most of your time is spent on real machines, not in a classroom." },
  { icon: "users", title: "Veteran Instructors", text: "Learn from operators with 15+ years of on-site experience." },
  { icon: "briefcase", title: "Job Placement Support", text: "CV help, employer introductions and career guidance after graduation." },
  { icon: "shield", title: "Safety-first Culture", text: "Every session starts with a safety briefing and PPE check." },
  { icon: "shield", title: "PPE Available to Buy", text: "Purchase high-quality personal protective equipment at affordable prices." },
];

export const stats = [
  { value: "5,000+", label: "Operators trained" },
  { value: "15+", label: "Years of excellence" },
  { value: "92%", label: "Employed within 3 months" },
  { value: "40+", label: "Modern machines" },
];

export const safetyHighlights = [
  "Mandatory PPE and daily toolbox talks",
  "Instructor-to-student ratio of 1:6 on machines",
  "Dual-control training vehicles",
  "On-site first-aid and emergency response team",
  "Regular equipment inspection & maintenance logs",
  "Zero-incident training standards",
];

export const instructors = [
  { name: "Eng. Chidi Okafor", role: "Head of Crane Operations", exp: "18 yrs", image: IMG.instructorB, bio: "Former port crane supervisor, certified lift planner and appointed person." },
  { name: "Ngozi Adebayo", role: "Lead Safety Officer", exp: "12 yrs", image: IMG.instructorA, bio: "NEBOSH-certified safety professional enforcing our zero-incident standard." },
  { name: "Samuel Bello", role: "Senior Truck Driving Instructor", exp: "20 yrs", image: IMG.instructorC, bio: "Two decades of long-haul and tanker experience across West Africa." },
  { name: "Funmi Adeyemi", role: "Heavy Equipment Instructor", exp: "14 yrs", image: IMG.instructorD, bio: "Earthmoving specialist who has operated on major highway projects." },
];

export const facilities = [
  { title: "Practical Training Ground", text: "A 12-hectare yard with excavation pits, driving courses and lift zones.", image: IMG.quarry },
  { title: "Simulator & Theory Labs", text: "Air-conditioned classrooms and simulators for risk-free practice.", image: IMG.engineers },
  { title: "Machine Fleet", text: "Late-model trucks, cranes, excavators, loaders and forklifts.", image: IMG.excavator },
  { title: "Rigging & Warehouse Bay", text: "Dedicated racking and rigging areas for forklift and crane training.", image: IMG.forkliftCab },
];

export const testimonials = [
  { name: "Tunde Balogun", role: "Crane Operator, Apapa Port", image: IMG.person1, text: "I started with zero lift experience. Ten weeks later I had my certificate and a job offer. The instructors never rush you — safety always comes first." },
  { name: "Emeka Nwosu", role: "Long-haul Truck Driver", image: IMG.person2, text: "The simulator and real-road hours gave me real confidence. The online registration and payment took me about ten minutes from my phone." },
  { name: "Ibrahim Musa", role: "Excavator Operator", image: IMG.person3, text: "The practical ground is excellent. I got hundreds of hours on real machines and the academy helped me connect with a construction firm." },
];

export const faqs = [
  { q: "Do I need prior experience to enrol?", a: "No. Our beginner programmes (Truck Driving, Heavy Equipment, Forklift) assume no previous experience. Crane Operations is intermediate and recommends some site exposure, but it isn't compulsory." },
  { q: "How do I register and pay?", a: "Submit your application first. An administrator reviews and approves it, then sends a secure Paystack payment link to your email or WhatsApp. Your student account and portal credentials are issued only after Paystack verifies the payment." },
  { q: "Can I pay in instalments?", a: "Yes. Selected programmes allow a 60/40 split — contact admissions to arrange it. Early-bird discounts apply to eligible batches." },
  { q: "Can I buy personal protective equipment?", a: "Yes. High-quality personal protective equipment (PPE) is available to purchase from the academy at affordable prices. Contact us for details." },
  { q: "Will I receive a certificate?", a: "Yes. After passing the theory and practical assessments, you'll receive an accredited certificate, downloadable from your student portal." },
  { q: "What if I miss the registration deadline?", a: "Contact admissions on WhatsApp — if seats remain we may accept a late application, otherwise we will move you to the next intake." },
];

export const documents = [
  { key: "id", label: "Valid Government ID", hint: "National ID, passport or driver's licence", required: true },
  { key: "photo", label: "Passport Photograph", hint: "Clear, white background", required: true },
  { key: "cert", label: "Highest Education Certificate", hint: "PDF or image", required: true },
  { key: "medical", label: "Medical Fitness Certificate", hint: "Issued within the last 6 months", required: false },
];
