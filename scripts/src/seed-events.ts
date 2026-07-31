import { db, eventsTable } from "@workspace/db";

const EVENTS = [
  {
    id: "e1",
    title: "Juneteenth Freedom Festival",
    description:
      "Join us for Atlanta's biggest Juneteenth celebration featuring live music, local vendors, cultural performances, and community leaders. A family-friendly day honoring freedom and heritage.",
    date: "June 19, 2026",
    dateShort: "Jun 19",
    time: "12:00 PM – 8:00 PM",
    location: "Centennial Olympic Park",
    city: "Atlanta",
    state: "GA",
    category: "Cultural",
    attendees: 1240,
    organizer: "Atlanta Cultural Alliance",
    price: "Free",
    isFree: true,
    latitude: "33.7609000",
    longitude: "-84.3939000",
    featured: true,
    imageUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop",
  },
  {
    id: "e2",
    title: "Black Tech Founders Summit",
    description:
      "Connect with over 500 Black tech founders, investors, and innovators. Panels, pitch competitions, networking, and workshops on scaling your startup.",
    date: "July 12, 2026",
    dateShort: "Jul 12",
    time: "9:00 AM – 6:00 PM",
    location: "McCormick Place",
    city: "Chicago",
    state: "IL",
    category: "Business",
    attendees: 540,
    organizer: "Black Founders Network",
    price: "$45",
    isFree: false,
    latitude: "41.8527000",
    longitude: "-87.6158000",
    featured: true,
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop",
  },
  {
    id: "e3",
    title: "Harlem Jazz & Soul Food Night",
    description:
      "An evening of live jazz performances paired with the best soul food from Harlem's finest Black-owned restaurants. Celebrate our musical and culinary heritage.",
    date: "July 20, 2026",
    dateShort: "Jul 20",
    time: "6:00 PM – 11:00 PM",
    location: "Marcus Garvey Park",
    city: "New York",
    state: "NY",
    category: "Cultural",
    attendees: 380,
    organizer: "Harlem Cultural Society",
    price: "Free",
    isFree: true,
    latitude: "40.8004000",
    longitude: "-73.9464000",
    featured: false,
    imageUrl: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&h=600&fit=crop",
  },
  {
    id: "e4",
    title: "Melanin Beauty Expo",
    description:
      "The premier beauty expo celebrating melanin beauty, featuring 80+ Black-owned beauty brands, live demonstrations, masterclasses, and celebrity stylists.",
    date: "August 3, 2026",
    dateShort: "Aug 3",
    time: "10:00 AM – 6:00 PM",
    location: "DC Convention Center",
    city: "Washington",
    state: "DC",
    category: "Beauty",
    attendees: 1820,
    organizer: "Melanin Beauty Collective",
    price: "$25",
    isFree: false,
    latitude: "38.9017000",
    longitude: "-77.0229000",
    featured: true,
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop",
  },
  {
    id: "e5",
    title: "Community Wealth Building Workshop",
    description:
      "Free financial literacy workshop covering homeownership, investing, generational wealth, and business credit. Presented by Black financial advisors.",
    date: "August 15, 2026",
    dateShort: "Aug 15",
    time: "10:00 AM – 2:00 PM",
    location: "Third Ward Community Center",
    city: "Houston",
    state: "TX",
    category: "Finance",
    attendees: 212,
    organizer: "Black Wealth Alliance",
    price: "Free",
    isFree: true,
    latitude: "29.7355000",
    longitude: "-95.3615000",
    featured: false,
    imageUrl: "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800&h=600&fit=crop",
  },
];

async function main() {
  console.log("Seeding events...");

  for (const event of EVENTS) {
    await db
      .insert(eventsTable)
      .values(event)
      .onConflictDoNothing();
    console.log(`  ✓ ${event.title}`);
  }

  console.log(`Done. Seeded ${EVENTS.length} events.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
