export type SubCategory = { name: string };

export type CategoryGroup = {
  emoji: string;
  name: string;
  subcategories: SubCategory[];
  liveAtLaunch: boolean;
};

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    emoji: "🍽️",
    name: "Food & Beverage",
    liveAtLaunch: true,
    subcategories: [
      { name: "Restaurants" },
      { name: "Cafés & Coffee Shops" },
      { name: "Bakeries" },
      { name: "Food Trucks" },
      { name: "Juice & Smoothie Bars" },
      { name: "Caterers" },
      { name: "Dessert Shops" },
      { name: "Bars & Lounges" },
      { name: "Breweries & Wineries" },
    ],
  },
  {
    emoji: "🛍️",
    name: "Shopping & Retail",
    liveAtLaunch: true,
    subcategories: [
      { name: "Clothing & Fashion" },
      { name: "Shoes & Accessories" },
      { name: "Jewelry" },
      { name: "Beauty Supply" },
      { name: "Bookstores" },
      { name: "Gift Shops" },
      { name: "Home Décor" },
      { name: "Art Galleries" },
      { name: "Florists" },
      { name: "Cannabis Dispensaries" },
    ],
  },
  {
    emoji: "💇",
    name: "Beauty & Personal Care",
    liveAtLaunch: true,
    subcategories: [
      { name: "Hair Salons" },
      { name: "Barbershops" },
      { name: "Nail Salons" },
      { name: "Spas" },
      { name: "Estheticians" },
      { name: "Makeup Artists" },
      { name: "Massage Therapy" },
      { name: "Tattoo Studios" },
    ],
  },
  {
    emoji: "🏥",
    name: "Health & Wellness",
    liveAtLaunch: false,
    subcategories: [
      { name: "Physicians" },
      { name: "Dentists" },
      { name: "Mental Health Therapists" },
      { name: "Chiropractors" },
      { name: "Physical Therapy" },
      { name: "Optometrists" },
      { name: "Nutritionists" },
      { name: "Fitness Trainers" },
      { name: "Yoga Studios" },
      { name: "Wellness Centers" },
    ],
  },
  {
    emoji: "🏠",
    name: "Home & Real Estate",
    liveAtLaunch: false,
    subcategories: [
      { name: "Real Estate Agents" },
      { name: "Property Management" },
      { name: "Mortgage Lenders" },
      { name: "Home Inspectors" },
      { name: "Interior Designers" },
      { name: "Movers" },
      { name: "Home Cleaning" },
      { name: "Security Services" },
    ],
  },
  {
    emoji: "🔨",
    name: "Home Improvement",
    liveAtLaunch: false,
    subcategories: [
      { name: "Electricians" },
      { name: "Plumbers" },
      { name: "HVAC" },
      { name: "Roofing" },
      { name: "General Contractors" },
      { name: "Landscapers" },
      { name: "Painters" },
      { name: "Flooring" },
      { name: "Handyman Services" },
      { name: "Pest Control" },
    ],
  },
  {
    emoji: "🚗",
    name: "Automotive",
    liveAtLaunch: false,
    subcategories: [
      { name: "Auto Repair" },
      { name: "Tire Shops" },
      { name: "Car Washes" },
      { name: "Auto Detailing" },
      { name: "Towing" },
      { name: "Dealerships" },
      { name: "Auto Parts" },
      { name: "Mobile Mechanics" },
    ],
  },
  {
    emoji: "💼",
    name: "Professional Services",
    liveAtLaunch: false,
    subcategories: [
      { name: "Attorneys" },
      { name: "Accountants" },
      { name: "Financial Advisors" },
      { name: "Insurance Agents" },
      { name: "Tax Preparation" },
      { name: "Consultants" },
      { name: "Business Coaches" },
      { name: "Notaries" },
      { name: "Translation Services" },
    ],
  },
  {
    emoji: "💻",
    name: "Technology",
    liveAtLaunch: false,
    subcategories: [
      { name: "IT Services" },
      { name: "Software Development" },
      { name: "Web Design" },
      { name: "Cybersecurity" },
      { name: "Computer Repair" },
      { name: "Digital Marketing" },
      { name: "AI Consulting" },
    ],
  },
  {
    emoji: "📸",
    name: "Creative Services",
    liveAtLaunch: false,
    subcategories: [
      { name: "Photography" },
      { name: "Videography" },
      { name: "Graphic Design" },
      { name: "Printing" },
      { name: "Branding" },
      { name: "Marketing Agencies" },
      { name: "Music Production" },
    ],
  },
  {
    emoji: "🎉",
    name: "Events & Entertainment",
    liveAtLaunch: true,
    subcategories: [
      { name: "Event Venues" },
      { name: "DJs" },
      { name: "Bands" },
      { name: "Wedding Services" },
      { name: "Party Rentals" },
      { name: "Event Planners" },
      { name: "Photobooths" },
      { name: "Cultural Experiences" },
    ],
  },
  {
    emoji: "✈️",
    name: "Travel & Hospitality",
    liveAtLaunch: false,
    subcategories: [
      { name: "Hotels" },
      { name: "Bed & Breakfasts" },
      { name: "Vacation Rentals" },
      { name: "Travel Agencies" },
      { name: "Tour Guides" },
      { name: "Transportation" },
      { name: "Shuttle Services" },
      { name: "Limo Services" },
    ],
  },
  {
    emoji: "👶",
    name: "Family & Education",
    liveAtLaunch: false,
    subcategories: [
      { name: "Childcare" },
      { name: "Preschools" },
      { name: "Tutors" },
      { name: "Private Schools" },
      { name: "Colleges" },
      { name: "Driving Schools" },
      { name: "Music Lessons" },
      { name: "After-School Programs" },
    ],
  },
  {
    emoji: "🐾",
    name: "Pet Services",
    liveAtLaunch: false,
    subcategories: [
      { name: "Veterinarians" },
      { name: "Groomers" },
      { name: "Pet Boarding" },
      { name: "Pet Supplies" },
      { name: "Dog Trainers" },
      { name: "Pet Sitting" },
    ],
  },
  {
    emoji: "💒",
    name: "Community & Nonprofits",
    liveAtLaunch: false,
    subcategories: [
      { name: "Churches & Faith Organizations" },
      { name: "Community Centers" },
      { name: "Nonprofits" },
      { name: "Advocacy Organizations" },
      { name: "Chambers of Commerce" },
      { name: "Cultural Organizations" },
    ],
  },
  {
    emoji: "🏛️",
    name: "Government & Public Resources",
    liveAtLaunch: false,
    subcategories: [
      { name: "Libraries" },
      { name: "Public Parks" },
      { name: "Visitor Centers" },
      { name: "Workforce Development" },
      { name: "Small Business Resources" },
    ],
  },
  {
    emoji: "🎓",
    name: "Black Professionals",
    liveAtLaunch: false,
    subcategories: [
      { name: "Physicians" },
      { name: "Attorneys" },
      { name: "Therapists" },
      { name: "Financial Advisors" },
      { name: "CPAs" },
      { name: "Architects" },
      { name: "Engineers" },
      { name: "Educators" },
      { name: "Consultants" },
      { name: "Public Speakers" },
    ],
  },
  {
    emoji: "🌐",
    name: "Online & Mobile Businesses",
    liveAtLaunch: false,
    subcategories: [
      { name: "E-commerce Stores" },
      { name: "Subscription Businesses" },
      { name: "Mobile Food Vendors" },
      { name: "Mobile Detailing" },
      { name: "Mobile Grooming" },
      { name: "Mobile Beauty Services" },
      { name: "Freelancers" },
      { name: "Virtual Assistants" },
    ],
  },
];

export const LIVE_CATEGORY_NAMES = CATEGORY_GROUPS
  .filter((g) => g.liveAtLaunch)
  .map((g) => g.name);

export const ALL_PARENT_CATEGORY_NAMES = CATEGORY_GROUPS.map((g) => g.name);

export function getCategoryGroup(name: string): CategoryGroup | undefined {
  return CATEGORY_GROUPS.find((g) => g.name === name);
}

export function isLiveCategory(name: string): boolean {
  return CATEGORY_GROUPS.find((g) => g.name === name)?.liveAtLaunch ?? false;
}
