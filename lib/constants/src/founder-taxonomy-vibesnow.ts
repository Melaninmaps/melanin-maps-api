/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 *
 * Generated from VIBESNOW.xlsx with
 * scripts/generate-founder-taxonomy-contract.py.
 *
 * This is the versioned, founder-controlled source for business category /
 * subcategory relationships, category-permitted VIBES, and quick-review
 * endorsement wording. It contains no database identifiers or member content.
 */

export const FOUNDER_TAXONOMY_VERSION = "vibesnow-2026-10-15";
export const FOUNDER_TAXONOMY_WORKBOOK_SHA256 = "5b46a5f9f18a69840a1ca2e164f30f1c11d93f70c1f966c441d7f9e499525d16";
export const FOUNDER_TAXONOMY_ENDORSEMENTS_ONLY_MARKER = "N/A — Use Endorsements, Not Vibes";

export type FounderVibeMode = "vibes" | "endorsements_only";

export interface FounderTaxonomyCategory {
  readonly id: string;
  readonly category: string;
  readonly subcategories: readonly string[];
  readonly vibeMode: FounderVibeMode;
  readonly vibeLabels: readonly string[];
  readonly quickReviewLabels: readonly string[];
}

export const FOUNDER_TAXONOMY_CONTRACT = [
  {
    "id": "food-and-drink",
    "category": "Food & Drink",
    "subcategories": [
      "Restaurants",
      "Cafés & Coffee",
      "Bakeries",
      "Desserts & Sweets",
      "Food Trucks & Mobile Food",
      "Catering",
      "Bars & Lounges",
      "Juice & Smoothies",
      "Specialty Foods",
      "Meal Prep",
      "Grocery & Markets",
      "Private Chefs"
    ],
    "vibeMode": "vibes",
    "vibeLabels": [
      "Date Night",
      "Hood Classic",
      "Bougie Treat",
      "Family Reunion Energy",
      "Sunday Best",
      "Late Night Vibes",
      "Turn Up",
      "Cookout Approved",
      "Like Home",
      "Auntie Energy",
      "Tía Energy",
      "Abuela Approved Energy",
      "Soft Life",
      "Take Somebody From Out of Town",
      "Locals Know",
      "Passport Energy",
      "Chill",
      "Comfy",
      "Pop Out Pics"
    ],
    "quickReviewLabels": [
      "Worth The Drive",
      "Portions With Love",
      "Clean & Cared For",
      "Grandma Approved",
      "Cooks Like Home",
      "They Speak My Language",
      "Seasoned Right",
      "Plate Came Correct",
      "They Don't Rush The Recipe",
      "Ask For The Special",
      "Recipe From The Motherland",
      "Fresh, Not Frozen",
      "Sweet, Not Too Sweet",
      "Book This Table",
      "Don't Sleep On This One",
      "I Sent The Group Chat"
    ]
  },
  {
    "id": "beauty-and-personal-care",
    "category": "Beauty & Personal Care",
    "subcategories": [
      "Hair Salons",
      "Barbershops",
      "Braiders & Natural Hair",
      "Nail Salons & Nail Artists",
      "Makeup Artists",
      "Estheticians & Skincare",
      "Spas",
      "Massage",
      "Lashes & Brows",
      "Beauty Supply",
      "Cosmetics & Beauty Brands",
      "Mobile Beauty Services"
    ],
    "vibeMode": "vibes",
    "vibeLabels": [
      "Soft Life",
      "Auntie Energy",
      "Tía Energy",
      "Main Character Energy",
      "Sunday Best",
      "Chill & Restore",
      "Come As You Are",
      "For The Culture",
      "Neighborhood Love",
      "Luxury Without The Attitude"
    ],
    "quickReviewLabels": [
      "On Time, Every Time",
      "Clean Station",
      "Worth The Price",
      "Blessed Hands",
      "They Know Our Hair",
      "Grandma Approved",
      "Sharpest Lineup",
      "Braids Didn't Hurt",
      "Edges Respected",
      "Style Lasted",
      "My Shade Was There",
      "Skin Cleared Up",
      "Didn't Overbook Me",
      "Patient With Kids",
      "Book Now",
      "Ask For Them By Name"
    ]
  },
  {
    "id": "health-and-wellness",
    "category": "Health & Wellness",
    "subcategories": [
      "Primary Care & Medical Practices",
      "Dental",
      "Mental Wellness & Therapy",
      "Physical Therapy",
      "Chiropractic",
      "Nutrition & Dietitians",
      "Fitness & Gyms",
      "Personal Trainers",
      "Yoga & Pilates",
      "Wellness Centers",
      "Doula & Birth Services",
      "Holistic Wellness",
      "Pharmacies",
      "Home Health & Caregiving"
    ],
    "vibeMode": "vibes",
    "vibeLabels": [
      "Chill & Restore",
      "Peaceful Energy",
      "Come As You Are",
      "Auntie Energy",
      "Family Care",
      "Wellness Reset"
    ],
    "quickReviewLabels": [
      "Didn't Rush Me",
      "Took Time To Explain",
      "Made Me Feel Heard",
      "Treated Me Like Family",
      "They Speak My Language",
      "Grandma Trusts Them",
      "This Doctor Listens",
      "Believed My Pain",
      "Culturally Competent Care",
      "Understands My Skin",
      "Understands My Hair",
      "Fought For My Coverage",
      "Front Desk Was Kind",
      "Therapist Gets The Culture",
      "Doula Held Me Down",
      "Prices Were Clear Up Front",
      "No Judgment About My Body"
    ]
  },
  {
    "id": "shopping-and-retail",
    "category": "Shopping & Retail",
    "subcategories": [
      "Clothing & Fashion",
      "Shoes & Accessories",
      "Jewelry",
      "Gifts",
      "Home Décor",
      "Furniture",
      "Books & Bookstores",
      "Art & Collectibles",
      "Specialty Retail",
      "Children's Retail",
      "Pet Products",
      "Online Shops"
    ],
    "vibeMode": "vibes",
    "vibeLabels": [
      "Hood Classic",
      "Locals Know",
      "Hidden Gem",
      "Bougie Treat",
      "Chill & Create",
      "Bring The Cousins",
      "For The Culture",
      "Take Somebody From Out of Town"
    ],
    "quickReviewLabels": [
      "Quality Held Up",
      "Fair Prices",
      "No Follow-Around",
      "Grandma Approved",
      "For The Culture",
      "Treated Me Like Family",
      "Found My Size",
      "Found My Shade",
      "Owner Remembers Me",
      "Shelves Reflect Us",
      "Wrapped With Care",
      "Supports Local Makers",
      "Shipped Fast & Right",
      "Take My Money",
      "Don't Leave Without It"
    ]
  },
  {
    "id": "travel-and-hospitality",
    "category": "Travel & Hospitality",
    "subcategories": [
      "Hotels & Resorts",
      "Bed & Breakfasts",
      "Vacation Rentals",
      "Travel Agencies & Advisors",
      "Tour Operators",
      "Tour Guides",
      "Transportation Services",
      "Luggage & Travel Products",
      "Travel Experiences"
    ],
    "vibeMode": "vibes",
    "vibeLabels": [
      "Romantic Escape",
      "Family Reunion Energy",
      "Solo Traveler Comfortable",
      "Bougie Treat",
      "Chill & Restore",
      "Girls Trip Ready",
      "Grand Rising",
      "Bring The Cousins",
      "Passport Energy",
      "Take Somebody From Out of Town",
      "Luxury Without The Attitude",
      "Locals Know"
    ],
    "quickReviewLabels": [
      "Exactly As Pictured",
      "Spotless",
      "Worth The Stay",
      "Treated Me Like Family",
      "They Speak My Language",
      "For The Culture",
      "Felt Safe The Whole Time",
      "Host Checked On Me",
      "Real Local Recommendations",
      "Hair-Friendly Water & Towels",
      "Breakfast Hit",
      "No Side-Eye At Check-In",
      "Took Us To The Real Places",
      "Driver Was Solid",
      "Book This Stay",
      "Add It To The Trip"
    ]
  },
  {
    "id": "arts-culture-and-entertainment",
    "category": "Arts, Culture & Entertainment",
    "subcategories": [
      "Museums",
      "Galleries",
      "Cultural Centers",
      "Performing Arts",
      "Theaters",
      "Music & Live Entertainment",
      "DJs",
      "Entertainment Venues",
      "Nightlife",
      "Festivals",
      "Attractions",
      "Gaming & Recreation",
      "Photography",
      "Videography"
    ],
    "vibeMode": "vibes",
    "vibeLabels": [
      "Date Night",
      "Turn Up",
      "Grown & Sexy",
      "Hood Classic",
      "Chill & Create",
      "Late Night Vibes",
      "Family Reunion Energy",
      "Sunday Best",
      "History Lives Here",
      "Culture On The Walls",
      "Teach The Kids",
      "Creative Scene"
    ],
    "quickReviewLabels": [
      "Worth The Ticket",
      "Staff Was Welcoming",
      "Bring A Friend",
      "For The Culture",
      "Grandma Approved",
      "Sunday Best Ready",
      "Our Story Told Right",
      "DJ Read The Room",
      "Artists Paid Fairly",
      "Kids Left Inspired",
      "Free Day Is Real",
      "No Bag Check Attitude",
      "Sound Was Clean",
      "Got My Angles",
      "Put This On The Calendar"
    ]
  },
  {
    "id": "professional-services",
    "category": "Professional Services",
    "subcategories": [
      "Accounting & Tax",
      "Legal Services",
      "Insurance",
      "Financial Services",
      "Business Consulting",
      "Marketing & Advertising",
      "Public Relations",
      "Graphic Design & Branding",
      "Web & App Development",
      "IT & Technology Services",
      "Printing",
      "Translation & Language Services",
      "Staffing & Recruiting",
      "Virtual Assistants"
    ],
    "vibeMode": "endorsements_only",
    "vibeLabels": [],
    "quickReviewLabels": [
      "Straight With Me",
      "Delivered On Time",
      "Answered The Phone",
      "Treated Me Like Family",
      "They Speak My Language",
      "For The Culture",
      "Explained It Plain",
      "No Surprise Fees",
      "Fought For Me",
      "Saved Me Money",
      "Took My Small Business Seriously",
      "Taught Me While They Worked",
      "Kept Me In The Loop",
      "Didn't Talk Down To Me",
      "Hire Them"
    ]
  },
  {
    "id": "home-and-property-services",
    "category": "Home & Property Services",
    "subcategories": [
      "Real Estate Agents & Brokers",
      "Property Management",
      "Contractors",
      "Construction",
      "Electricians",
      "Plumbing",
      "HVAC",
      "Landscaping & Lawn Care",
      "Cleaning Services",
      "Interior Design",
      "Moving Services",
      "Handyman Services",
      "Home Inspection",
      "Roofing",
      "Pest Control"
    ],
    "vibeMode": "endorsements_only",
    "vibeLabels": [],
    "quickReviewLabels": [
      "Showed Up When They Said",
      "Cleaned Up After",
      "Quote Matched The Bill",
      "Treated Me Like Family",
      "Grandma Approved",
      "They Speak My Language",
      "Didn't Talk Down To Me",
      "Fixed It Right The First Time",
      "Respected My Home",
      "Honest About What I Didn't Need",
      "Warranty Was Real",
      "Good With My Elders",
      "Emergency And They Came",
      "Helped Me Buy My First Home",
      "Actually Fixes Things",
      "Save Their Number"
    ]
  },
  {
    "id": "automotive-and-transportation",
    "category": "Automotive & Transportation",
    "subcategories": [
      "Auto Repair",
      "Auto Detailing",
      "Car Wash",
      "Tire Services",
      "Auto Dealers",
      "Auto Body & Collision",
      "Towing & Roadside Assistance",
      "Car Rental",
      "Chauffeur & Private Driver",
      "Transportation Companies"
    ],
    "vibeMode": "endorsements_only",
    "vibeLabels": [],
    "quickReviewLabels": [
      "Fair Price",
      "Fast Turnaround",
      "Explained The Repair",
      "Unc Trusts This Shop",
      "Treated Me Like Family",
      "They Speak My Language",
      "Didn't Upsell Me",
      "Showed Me The Old Part",
      "Safe For Women Coming Alone",
      "Loaner Or Ride Home Offered",
      "Detail Was Immaculate",
      "Towed Me With Care",
      "Financing Was Honest",
      "Driver Was Professional",
      "Save This Shop"
    ]
  },
  {
    "id": "events-and-celebrations",
    "category": "Events & Celebrations",
    "subcategories": [
      "Event Planning",
      "Wedding Planning",
      "Event Venues",
      "Party Rentals",
      "Decorators",
      "Florists",
      "Balloon Artists",
      "DJs & Entertainment",
      "Photographers",
      "Videographers",
      "Caterers",
      "Cakes & Desserts",
      "Invitations & Stationery",
      "Photo Booths"
    ],
    "vibeMode": "vibes",
    "vibeLabels": [
      "Family Reunion Energy",
      "Sunday Best",
      "Turn Up",
      "Grown & Sexy",
      "Bougie Treat",
      "Kid Chaos Friendly",
      "Late Night Vibes",
      "Cookout Approved",
      "Made For Memories",
      "Bring The Cousins",
      "Luxury Without The Attitude"
    ],
    "quickReviewLabels": [
      "Delivered Exactly What I Asked",
      "On Time Setup",
      "Worth Every Dollar",
      "Sunday Best Ready",
      "Treated Me Like Family",
      "For The Culture",
      "Handled My Whole Day",
      "Vendor Team Was Smooth",
      "Florals Were Fresh",
      "Cake Tasted As Good As It Looked",
      "Captured The Real Moments",
      "Grandma Had A Seat & Shade",
      "Honored Our Traditions",
      "No Day-Of Drama",
      "Book Them"
    ]
  },
  {
    "id": "education-and-learning",
    "category": "Education & Learning",
    "subcategories": [
      "Childcare & Daycare",
      "Preschools",
      "Tutoring",
      "Test Preparation",
      "Colleges & Universities",
      "HBCUs",
      "Trade & Vocational Schools",
      "Professional Training",
      "Music Lessons",
      "Dance Schools",
      "Art Classes",
      "Language Instruction",
      "Educational Programs"
    ],
    "vibeMode": "vibes",
    "vibeLabels": [
      "Teach The Kids",
      "Come As You Are",
      "Creative Energy",
      "Community Classroom"
    ],
    "quickReviewLabels": [
      "My Child Improved",
      "Teachers Actually Care",
      "Communication Was Clear",
      "Grandma Approved",
      "For The Culture",
      "They Speak My Language",
      "My Kids See Themselves",
      "Taught Our History Right",
      "Didn't Give Up On My Child",
      "Discipline Without Disrespect",
      "Financial Aid Help Was Real",
      "Job Ready After",
      "Small Enough To Be Seen",
      "Culturally Affirming Curriculum",
      "Send Your People Here"
    ]
  },
  {
    "id": "children-and-family",
    "category": "Children & Family",
    "subcategories": [
      "Childcare",
      "Children's Activities",
      "Indoor Play",
      "Camps",
      "Family Entertainment",
      "Parenting Services",
      "Children's Parties",
      "Youth Programs",
      "Children's Retail",
      "Maternity & Baby Services"
    ],
    "vibeMode": "vibes",
    "vibeLabels": [
      "Kid Chaos Friendly",
      "Family Reunion Energy",
      "Rainy Day Rescue",
      "Toddler Safe",
      "Big Kid Approved",
      "Parents Can Breathe",
      "Birthday Party Ready",
      "Bring The Cousins",
      "Teach The Kids",
      "Like Home"
    ],
    "quickReviewLabels": [
      "Clean & Safe",
      "Staff Was Patient",
      "Fair Price For Families",
      "Grandma Approved",
      "For The Culture",
      "They Get Our Hair",
      "My Kids See Themselves",
      "Culturally Affirming",
      "Safe For My Baby",
      "Diverse Staff",
      "My Child Wants To Go Back",
      "Meals Were Real Food",
      "They Told Me The Truth About My Kid",
      "Never Pushed My Child Out",
      "Parents Put This On The List"
    ]
  },
  {
    "id": "community-and-nonprofit",
    "category": "Community & Nonprofit",
    "subcategories": [
      "Nonprofits",
      "Community Organizations",
      "Foundations",
      "Mutual Aid",
      "Advocacy Organizations",
      "Youth Organizations",
      "Senior Services",
      "Community Centers",
      "Cultural Organizations",
      "Professional Associations",
      "Chambers & Business Organizations"
    ],
    "vibeMode": "vibes",
    "vibeLabels": [
      "Neighborhood Love",
      "For The Culture",
      "Come As You Are",
      "Everybody Knows Somebody",
      "Family Reunion Energy",
      "History Lives Here"
    ],
    "quickReviewLabels": [
      "Help Was Real",
      "No Judgment",
      "Answered When I Called",
      "Treated Me Like Family",
      "For The Culture",
      "Elders Are Honored",
      "Showed Up For The Block",
      "Hires From The Neighborhood",
      "No Hoops To Jump Through",
      "Youth Are Valued",
      "Money Reached The People",
      "Volunteers Treated Well",
      "Doors Actually Open",
      "Advocated At City Hall",
      "Share This Resource"
    ]
  },
  {
    "id": "faith-and-spirituality",
    "category": "Faith & Spirituality",
    "subcategories": [
      "Churches",
      "Mosques",
      "Synagogues",
      "Temples",
      "Spiritual Centers",
      "Faith-Based Organizations",
      "Religious Bookstores & Retail",
      "Faith-Based Community Services"
    ],
    "vibeMode": "vibes",
    "vibeLabels": [
      "Sunday Best",
      "Come As You Are",
      "Quiet & Prayerful",
      "Praise Break Energy",
      "Family Worship",
      "Young Adult Friendly",
      "Auntie Energy",
      "Everybody Knows Somebody"
    ],
    "quickReviewLabels": [
      "All Are Welcome (And Mean It)",
      "Visitors Feel At Home",
      "No Pressure, Just Peace",
      "Mothers Of The Church Approve",
      "They Speak My Language",
      "For The Culture",
      "The Spirit Lives Here",
      "Felt The Ancestors",
      "Community Not Just Congregation",
      "Leadership Knows Your Name",
      "Youth Are Valued",
      "Fed The Neighborhood",
      "Sermon Met Me Where I Was",
      "Choir Sent Me",
      "Leader Made Time For Me",
      "Bring Somebody With You"
    ]
  },
  {
    "id": "media-and-creative-services",
    "category": "Media & Creative Services",
    "subcategories": [
      "Content Creators",
      "Influencers / Cultural Ambassadors",
      "Podcasts",
      "Radio",
      "Publications & Magazines",
      "Writers & Authors",
      "Photography",
      "Videography",
      "Production Companies",
      "Recording Studios",
      "Music Production",
      "Creative Studios"
    ],
    "vibeMode": "vibes",
    "vibeLabels": [
      "Creative Scene",
      "Chill & Create",
      "Main Character Energy",
      "For The Culture",
      "Grown & Sexy"
    ],
    "quickReviewLabels": [
      "Delivered On Deadline",
      "Easy To Work With",
      "Worth The Investment",
      "For The Culture",
      "Blessed Hands",
      "Treated Me Like Family",
      "Told My Story Right",
      "Lit My Skin Correctly",
      "Sound Was Crisp",
      "Didn't Steal My Vision",
      "Paid Their Team",
      "Gave Me The Raw Files",
      "Booth Time Was Respected",
      "Made Me Look Like Me",
      "Book Them"
    ]
  },
  {
    "id": "sports-and-recreation",
    "category": "Sports & Recreation",
    "subcategories": [
      "Sports Clubs",
      "Recreational Centers",
      "Coaches & Training",
      "Youth Sports",
      "Golf",
      "Swimming",
      "Martial Arts",
      "Dance & Movement",
      "Outdoor Recreation",
      "Adventure Experiences"
    ],
    "vibeMode": "vibes",
    "vibeLabels": [
      "Family Reunion Energy",
      "Chill & Move",
      "Early Bird Energy",
      "Kid Chaos Friendly",
      "Adventure Ready",
      "Bring The Cousins"
    ],
    "quickReviewLabels": [
      "Well Kept Facility",
      "Coaches Show Up",
      "Fair Fees",
      "For The Culture",
      "Grandma Approved",
      "Treated Me Like Family",
      "Coach Builds Character",
      "Every Kid Plays",
      "Safe Space For Girls",
      "Beginners Welcome",
      "No Ego In Here",
      "Scholarships Are Real",
      "Water & Shade Provided",
      "Discipline With Love",
      "Taught Me To Swim At Any Age",
      "Sign Up"
    ]
  },
  {
    "id": "pets-and-animal-services",
    "category": "Pets & Animal Services",
    "subcategories": [
      "Veterinarians",
      "Pet Grooming",
      "Pet Boarding",
      "Dog Walking & Pet Sitting",
      "Pet Training",
      "Pet Daycare",
      "Pet Stores & Supplies"
    ],
    "vibeMode": "endorsements_only",
    "vibeLabels": [],
    "quickReviewLabels": [
      "Gentle Hands",
      "Fair Price",
      "Clean Facility",
      "Treated Me Like Family",
      "Blessed Hands",
      "They Speak My Language",
      "My Dog Wasn't Scared",
      "Honest About Treatment Cost",
      "Payment Plan Offered",
      "Groom Was Exactly Right",
      "Sent Photos While I Was Gone",
      "Emergency And They Stayed",
      "No Breed Judgment",
      "Save This Vet / Groomer"
    ]
  },
  {
    "id": "technology-and-digital-services",
    "category": "Technology & Digital Services",
    "subcategories": [
      "Software Companies",
      "App Developers",
      "Web Developers",
      "IT Support",
      "Cybersecurity",
      "AI & Automation",
      "SaaS",
      "Digital Products",
      "Technology Consulting"
    ],
    "vibeMode": "endorsements_only",
    "vibeLabels": [],
    "quickReviewLabels": [
      "Delivered What Was Promised",
      "Responsive",
      "Fair Scope & Price",
      "For The Culture",
      "Treated Me Like Family",
      "They Speak My Language",
      "Explained It Without The Jargon",
      "Didn't Talk Down To Me",
      "Handed Over The Passwords",
      "Site Actually Loads Fast",
      "Fixed It Same Day",
      "Taught My Team",
      "Built For Our Community",
      "Hire Them"
    ]
  },
  {
    "id": "financial-and-business-services",
    "category": "Financial & Business Services",
    "subcategories": [
      "Banks & Credit Unions",
      "Financial Advisors",
      "Bookkeeping",
      "Tax Preparation",
      "Lending & Financing",
      "Mortgage Services",
      "Credit Services",
      "Business Funding",
      "Investment Services"
    ],
    "vibeMode": "endorsements_only",
    "vibeLabels": [],
    "quickReviewLabels": [
      "Straight With Me",
      "No Hidden Fees",
      "Answered The Phone",
      "Grandma Trusts Them",
      "Treated Me Like Family",
      "They Speak My Language",
      "Said Yes When Others Said No",
      "Explained My Credit Plain",
      "No Predatory Terms",
      "Got Me Funded",
      "Taught Me To Build Wealth",
      "Respected My Small Numbers",
      "Walked Me Through The Paperwork",
      "Free Consult Was Actually Free",
      "Send Your People Here"
    ]
  },
  {
    "id": "legal-and-government-services",
    "category": "Legal & Government Services",
    "subcategories": [
      "Attorneys & Law Firms",
      "Mediation",
      "Notary Services",
      "Immigration Services",
      "Legal Document Services",
      "Government Offices",
      "Public Services"
    ],
    "vibeMode": "endorsements_only",
    "vibeLabels": [],
    "quickReviewLabels": [
      "Answered The Phone",
      "Clear About Cost",
      "On Time & Prepared",
      "They Speak My Language",
      "Treated Me Like Family",
      "For The Culture",
      "Fought For Me",
      "Explained My Rights",
      "Didn't Take My Money And Ghost",
      "Payment Plan Offered",
      "Handled My Immigration Case With Care",
      "Treated Me With Dignity",
      "Same-Day Notary",
      "Kept My Family Together",
      "Call Them"
    ]
  },
  {
    "id": "agriculture-and-specialty-producers",
    "category": "Agriculture & Specialty Producers",
    "subcategories": [
      "Farms",
      "Farmers Markets",
      "Urban Farms",
      "Specialty Growers",
      "Floriculture",
      "Food Producers",
      "Beverage Producers",
      "Agricultural Products"
    ],
    "vibeMode": "vibes",
    "vibeLabels": [
      "Grand Rising",
      "Family Reunion Energy",
      "Chill & Create",
      "Bring The Cousins",
      "Hood Classic",
      "Cookout Approved",
      "Locals Know",
      "Teach The Kids"
    ],
    "quickReviewLabels": [
      "Fresh & Honest",
      "Fair Prices",
      "Friendly Growers",
      "Grandma Approved",
      "Grows What We Cook",
      "For The Culture",
      "Picked This Morning",
      "Seeds From Home",
      "Takes EBT / SNAP",
      "Land Back In Our Hands",
      "Teaches While Selling",
      "Chemical-Free & Says So",
      "Feeds The Block",
      "Shop Here Before The Cookout"
    ]
  },
  {
    "id": "other-services",
    "category": "Other Services",
    "subcategories": [
      "Laundry & Dry Cleaning",
      "Tailoring & Alterations",
      "Shoe Repair",
      "Locksmiths",
      "Shipping & Mailing",
      "Storage",
      "Funeral & Memorial Services",
      "Personal Concierge",
      "Other"
    ],
    "vibeMode": "endorsements_only",
    "vibeLabels": [],
    "quickReviewLabels": [
      "Fast & Reliable",
      "Fair Price",
      "Careful With My Things",
      "Treated Me Like Family",
      "Grandma Approved",
      "Blessed Hands",
      "Nothing Lost, Nothing Damaged",
      "Alterations Were Perfect",
      "Brought My Shoes Back To Life",
      "Came Out At 2AM",
      "Handled Our Loss With Grace",
      "Honored Our Traditions",
      "Same-Day When I Needed It",
      "Dry & Secure",
      "Save Their Number"
    ]
  }
] as const satisfies readonly FounderTaxonomyCategory[];

export const FOUNDER_TAXONOMY_BY_CATEGORY: Readonly<Record<string, FounderTaxonomyCategory>> =
  Object.freeze(Object.fromEntries(
    FOUNDER_TAXONOMY_CONTRACT.map((entry) => [entry.category, entry]),
  ));

export const FOUNDER_QUICK_REVIEW_LABELS_BY_CATEGORY: Readonly<Record<string, readonly string[]>> =
  Object.freeze(Object.fromEntries(
    FOUNDER_TAXONOMY_CONTRACT.map((entry) => [entry.category, entry.quickReviewLabels]),
  ));
