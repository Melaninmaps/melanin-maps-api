/**
 * Recurring events extracted from MWM East Coast Tour Cultural Guide (Parts 1–2).
 * Every recurring event from "Weekly Recurring Events" and "Best Times/Days" sections.
 * Source: Tour PDFs — August 2026.
 */
export interface RecurringEventSeed {
  name: string;
  city: string;
  state: string;
  venue: string | null;
  address: string | null;
  description: string;
  frequency: "weekly" | "biweekly" | "monthly" | "other";
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
  category: "market" | "open_mic" | "art_walk" | "festival" | "community_gathering" | "farmers_market" | "other";
}

export const RECURRING_EVENTS_SEED: RecurringEventSeed[] = [
  // ── Philadelphia ──────────────────────────────────────────────────────────
  { name: "African American Market at FDR Park", city: "Philadelphia", state: "PA", venue: "FDR Park", address: null, description: "Community market and hub for Black-owned businesses celebrating Black culture, food, and creativity. Exclusively on Saturdays — the heart of Black Philly's weekend gathering.", frequency: "weekly", day_of_week: "Saturday", start_time: "10:00 AM", end_time: "5:00 PM", category: "market" },
  { name: "Open Mic Meetup at The Fire", city: "Philadelphia", state: "PA", venue: "The Fire", address: null, description: "Monthly open mic meetup featuring guest speakers and networking opportunities.", frequency: "monthly", day_of_week: "First Monday of month", start_time: null, end_time: null, category: "open_mic" },
  { name: "First Friday Art Walks", city: "Philadelphia", state: "PA", venue: "Old City and various neighborhoods", address: null, description: "Gallery openings and art walks throughout Philadelphia neighborhoods on the first Friday of every month.", frequency: "monthly", day_of_week: "First Friday of month", start_time: null, end_time: null, category: "art_walk" },
  // ── Washington DC ─────────────────────────────────────────────────────────
  { name: "Eastern Market Saturday Flea Market", city: "Washington", state: "DC", venue: "Eastern Market", address: "225 7th St SE, Washington, DC 20003", description: "Weekend farmers market and flea market featuring local vendors, produce, arts, and crafts.", frequency: "weekly", day_of_week: "Saturday", start_time: null, end_time: null, category: "market" },
  { name: "Dupont Circle Farmers Market", city: "Washington", state: "DC", venue: "Dupont Circle", address: null, description: "Popular Saturday morning farmers market in the Dupont Circle neighborhood.", frequency: "weekly", day_of_week: "Saturday", start_time: null, end_time: null, category: "farmers_market" },
  { name: "Cleveland Park Night Market", city: "Washington", state: "DC", venue: "Cleveland Park", address: null, description: "Monthly evening market in the Cleveland Park neighborhood featuring local vendors and community gathering.", frequency: "monthly", day_of_week: "Fourth Thursday of month", start_time: null, end_time: null, category: "market" },
  { name: "Open Mic Nights — DC Spoken Word Scene", city: "Washington", state: "DC", venue: "Various venues", address: null, description: "DC has a thriving open mic scene, particularly for spoken word, poetry, and music, with weekly events at multiple venues.", frequency: "weekly", day_of_week: "Various", start_time: null, end_time: null, category: "open_mic" },
  // ── Richmond ──────────────────────────────────────────────────────────────
  { name: "RVA First Fridays Art Walk", city: "Richmond", state: "VA", venue: "Arts District, Downtown Richmond", address: null, description: "Monthly art walk through Richmond's Arts District featuring gallery openings and pop-up markets. Runs 6 PM – 9 PM on the first Friday of every month.", frequency: "monthly", day_of_week: "First Friday of month", start_time: "6:00 PM", end_time: "9:00 PM", category: "art_walk" },
  { name: "First Friday Pop Up Market", city: "Richmond", state: "VA", venue: "Richmond Arts District", address: null, description: "Pop-up market held in Richmond's Arts District during the RVA First Fridays art walk.", frequency: "monthly", day_of_week: "First Friday of month", start_time: null, end_time: null, category: "market" },
  { name: "Community Open Mic at Black Iris", city: "Richmond", state: "VA", venue: "Black Iris", address: null, description: "Monthly community open mic night at Black Iris.", frequency: "monthly", day_of_week: "Third Thursday of month", start_time: "7:00 PM", end_time: null, category: "open_mic" },
  { name: "Weekend Farmers Markets", city: "Richmond", state: "VA", venue: "Multiple locations", address: null, description: "Multiple markets operate simultaneously on Saturdays, making weekends highly active for local shopping and community gathering.", frequency: "weekly", day_of_week: "Saturday", start_time: null, end_time: null, category: "farmers_market" },
  // ── Raleigh / Durham ──────────────────────────────────────────────────────
  { name: "Open Mic Night at Slim's Dive Bar", city: "Raleigh", state: "NC", venue: "Slim's Dive Bar", address: "Downtown Raleigh", description: "Weekly open mic night at Slim's Dive Bar in Downtown Raleigh.", frequency: "weekly", day_of_week: "Tuesday", start_time: null, end_time: null, category: "open_mic" },
  { name: "First Thursdays Open Mic at Unity of the Triangle", city: "Raleigh", state: "NC", venue: "Unity of the Triangle", address: "Raleigh, NC", description: "Monthly open mic night at Unity of the Triangle, first Thursday of each month.", frequency: "monthly", day_of_week: "First Thursday of month", start_time: null, end_time: null, category: "open_mic" },
  // ── Charlotte ─────────────────────────────────────────────────────────────
  { name: "Tosco Music Open Mic Night at Evening Muse", city: "Charlotte", state: "NC", venue: "Evening Muse", address: null, description: "Open mic night hosted by Evening Muse, featuring Tosco Music's community showcase.", frequency: "weekly", day_of_week: "Tuesday", start_time: "6:30 PM", end_time: null, category: "open_mic" },
  { name: "Jambox Open Mic Night", city: "Charlotte", state: "NC", venue: "Jambox", address: null, description: "Monthly open mic night at Jambox, typically on the third Wednesday of each month.", frequency: "monthly", day_of_week: "Third Wednesday of month", start_time: null, end_time: null, category: "open_mic" },
  // ── Columbia, SC ─────────────────────────────────────────────────────────
  { name: "Soda City Market on Main Street", city: "Columbia", state: "SC", venue: "Main Street", address: "Columbia, SC", description: "Saturday morning market on Main Street — the heart of Columbia's weekend community gathering.", frequency: "weekly", day_of_week: "Saturday", start_time: "9:00 AM", end_time: "1:00 PM", category: "market" },
  { name: "Meeting Street Artisan Market", city: "Columbia", state: "SC", venue: "West Columbia", address: null, description: "Saturday artisan market in West Columbia, making weekends especially active.", frequency: "weekly", day_of_week: "Saturday", start_time: "11:00 AM", end_time: "3:00 PM", category: "market" },
  { name: "Open Mic at Hazelwood", city: "Columbia", state: "SC", venue: "Hazelwood", address: null, description: "Local open mic nights at Hazelwood and other venues throughout Columbia.", frequency: "other", day_of_week: "Various", start_time: null, end_time: null, category: "open_mic" },
  // ── Atlanta ───────────────────────────────────────────────────────────────
  { name: "Atlanta Indie Market", city: "Atlanta", state: "GA", venue: "Various locations", address: null, description: "Indie market featuring local artisans and makers. Check Instagram @atlantaindiemarket for specific dates in August/September.", frequency: "other", day_of_week: null, start_time: null, end_time: null, category: "market" },
  { name: "Open Mic Nights — Atlanta Spoken Word Scene", city: "Atlanta", state: "GA", venue: "Various venues", address: null, description: "Atlanta has a thriving spoken word and indie music scene with multiple venues hosting weekly open mic nights.", frequency: "weekly", day_of_week: "Various", start_time: null, end_time: null, category: "open_mic" },
  { name: "First Fridays Art Walks — Atlanta Neighborhoods", city: "Atlanta", state: "GA", venue: "Various neighborhoods", address: null, description: "Many Atlanta neighborhoods host art walks on the first Friday of each month.", frequency: "monthly", day_of_week: "First Friday of month", start_time: null, end_time: null, category: "art_walk" },
  // ── Montgomery ────────────────────────────────────────────────────────────
  { name: "Weekly Open Mic Night — Montgomery", city: "Montgomery", state: "AL", venue: "Local venue", address: null, description: "Popular weekly open mic night with sign-up around 6:30 PM and performance starting around 7:15 PM.", frequency: "weekly", day_of_week: "Various", start_time: "7:15 PM", end_time: null, category: "open_mic" },
  // ── Birmingham ────────────────────────────────────────────────────────────
  { name: "Powerful Voices Open Mic Show", city: "Birmingham", state: "AL", venue: "Local venue", address: null, description: "Weekly open mic night featuring live music, comedy, and poetry.", frequency: "weekly", day_of_week: "Thursday", start_time: "7:00 PM", end_time: null, category: "open_mic" },
  { name: "Birmingham Poetic Readings and Open Mic at Seeds", city: "Birmingham", state: "AL", venue: "Seeds", address: null, description: "Monthly poetry readings and open mic night at Seeds.", frequency: "monthly", day_of_week: "Fourth Saturday of month", start_time: null, end_time: null, category: "open_mic" },
  { name: "Stardome Open Mic Nights", city: "Birmingham", state: "AL", venue: "Stardome", address: null, description: "Select Wednesday night open mic events at the Stardome comedy club.", frequency: "other", day_of_week: "Wednesday (select)", start_time: null, end_time: null, category: "open_mic" },
  // ── Mobile ────────────────────────────────────────────────────────────────
  { name: "2nd Weekend in Mobile", city: "Mobile", state: "AL", venue: "Downtown Mobile", address: null, description: "Every second weekend of the month, Downtown Mobile comes alive with festivals, live music, and community events.", frequency: "monthly", day_of_week: "Second weekend of month", start_time: "6:00 PM", end_time: "9:00 PM", category: "community_gathering" },
  { name: "Powerful Voices Open Mic Show — Mobile", city: "Mobile", state: "AL", venue: "Local venue", address: null, description: "Thursday open mic night featuring live music, comedy, and poetry.", frequency: "weekly", day_of_week: "Thursday", start_time: null, end_time: null, category: "open_mic" },
  { name: "Stand-Up Mobile Open Mic Night", city: "Mobile", state: "AL", venue: "Local venue", address: null, description: "Wednesday evening stand-up comedy open mic night.", frequency: "weekly", day_of_week: "Wednesday (occasional)", start_time: null, end_time: null, category: "open_mic" },
  // ── Baton Rouge ───────────────────────────────────────────────────────────
  { name: "Comedy Open Mic at The Station", city: "Baton Rouge", state: "LA", venue: "The Station", address: null, description: "Weekly comedy open mic night at The Station.", frequency: "weekly", day_of_week: "Wednesday", start_time: "8:30 PM", end_time: null, category: "open_mic" },
  { name: "City Mic Comedy Open Mic at The Basin Music Hall", city: "Baton Rouge", state: "LA", venue: "The Basin Music Hall", address: null, description: "Weekly comedy open mic night at The Basin Music Hall.", frequency: "weekly", day_of_week: "Wednesday", start_time: null, end_time: null, category: "open_mic" },
  // ── New Orleans ───────────────────────────────────────────────────────────
  { name: "Open Mic Nights — New Orleans", city: "New Orleans", state: "LA", venue: "Various venues", address: null, description: "New Orleans has a vibrant open mic scene across multiple venues, especially on weekends when the cultural fabric of the city is most alive.", frequency: "weekly", day_of_week: "Weekend evenings", start_time: null, end_time: null, category: "open_mic" },
  { name: "Pop-up Markets — Bywater and Marigny", city: "New Orleans", state: "LA", venue: "Bywater / Marigny neighborhoods", address: null, description: "Weekend pop-up markets in Bywater and Marigny featuring street art, eclectic vendors, and local makers.", frequency: "weekly", day_of_week: "Weekend", start_time: null, end_time: null, category: "market" },
];
