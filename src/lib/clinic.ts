export const SERVICES = [
  {
    slug: "general-eye-health",
    name: "General Eye Health and Vision Care",
    short: "Comprehensive eye exams, vision testing, and prescription eyewear.",
    description:
      "Our general eye health service includes a complete eye examination, refraction, intraocular pressure measurement, and ocular health assessment. We diagnose and manage refractive errors, dry eyes, allergies, and common eye conditions. Ideal for adults and children seeking routine eye care or new prescription glasses.",
    image: "/services/general-eye.jpg",
  },
  {
    slug: "contact-lens",
    name: "Contact Lens Services",
    short: "Fitting, training, and follow-up for soft and specialty contact lenses.",
    description:
      "We offer professional contact lens fitting for daily, monthly, toric, multifocal, and specialty lenses. Our optometrists guide you through insertion, removal, and proper care to ensure comfort and eye health. Suitable for first-time wearers and patients who need an updated fit.",
    image: "/services/contact-lens-services.jpg",
  },
  {
    slug: "binocular-vision",
    name: "Binocular Vision Services",
    short: "Diagnosis and therapy for eye coordination and focusing problems.",
    description:
      "This service evaluates how your eyes work together. We assess and treat issues like convergence insufficiency, strabismus, amblyopia, and reading difficulties through vision therapy. Beneficial for children with learning challenges and adults with eye strain or double vision.",
    image: "/services/binocular-vision-services.jpg",
  },
  {
    slug: "low-vision",
    name: "Low Vision and Vision Rehabilitation",
    short: "Specialized care and devices for people with reduced vision.",
    description:
      "We help patients with permanent visual impairment maximize their remaining sight using magnifiers, telescopes, and adaptive techniques. Our rehabilitation plans support independence in reading, mobility, and daily activities. Recommended for patients with macular degeneration, diabetic retinopathy, or congenital low vision.",
    image: "/services/low-vision-rehabilitation.jpg",
  },
  {
    slug: "corporate-eye-health",
    name: "Corporate Eye Health Services",
    short: "On-site and in-clinic eye care packages for organizations.",
    description:
      "We partner with companies to provide screening, full eye exams, and digital eye strain management for employees. Packages include on-site visits, group reports, and discounted eyewear. Ideal for organizations that want to safeguard staff productivity and well-being.",
    image: "/services/corporate-eye-health-services.jpg",
  },
  {
    slug: "public-eye-health",
    name: "Public Eye Health Surveillance and Research",
    short: "Community outreach, screenings, and population-level eye health studies.",
    description:
      "We conduct community eye-health screenings, surveillance programs, and collaborative research to reduce avoidable blindness. Our team partners with NGOs, schools, and government agencies on outreach campaigns. Beneficial to communities and institutions advancing public eye health in Ghana.",
    image: "/services/public-eye-health.jpg",
  },
  {
    slug: "dvla",
    name: "DVLA Eye Testing",
    short: "Official DVLA-compliant eye tests for drivers.",
    description:
      "We provide DVLA-compliant visual acuity and field-of-vision tests required for driver's license applications and renewals. Results are documented on the official DVLA form for submission. Required for new drivers, license renewals, and commercial vehicle operators.",
    image: "/services/dvla-eye-testing.jpg",
  },
] as const;

export type Service = (typeof SERVICES)[number];

export const TIME_SLOTS_WEEKDAY = [
  "8:00 am", "8:30 am", "9:00 am", "9:30 am", "10:00 am", "10:30 am",
  "11:00 am", "11:30 am", "12:00 pm", "12:30 pm", "1:00 pm", "1:30 pm",
  "2:00 pm", "2:30 pm", "3:00 pm", "3:30 pm", "4:00 pm", "4:30 pm",
];

export const TIME_SLOTS_SATURDAY = [
  "9:00 am", "9:30 am", "10:00 am", "10:30 am", "11:00 am", "11:30 am",
  "12:00 pm", "12:30 pm", "1:00 pm", "1:30 pm",
];

export const CLINIC = {
  name: "NOVA Eye Care Services",
  tagline: "See Better! Live Brighter!",
  phones: ["+233544172089", "+233246613184"],
  email: "info@novaeyecareservice.com",
  address: "GE20 Dolores St, AH-1192-8485, Kan Royal Filling Station, Abuakwa. GPS address: AH-1192-7988",
  hours: {
    weekdays: "Mon–Fri: 8:00 am – 5:00 pm",
    saturday: "Saturday: 9:00 am – 2:00 pm",
    sunday: "Sunday: Closed",
  },
};
