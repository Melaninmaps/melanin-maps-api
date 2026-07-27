export interface CategoryQuestion {
  label: string;
  key: string;
}

export function getCategoryRatingQuestions(category?: string): CategoryQuestion[] {
  const cat = (category ?? "").toLowerCase();

  if (
    cat.includes("health") || cat.includes("physician") || cat.includes("dentist") ||
    cat.includes("doctor") || cat.includes("medical") || cat.includes("mental") ||
    cat.includes("therapy") || cat.includes("chiropractor") || cat.includes("optometrist") ||
    cat.includes("nutrition") || cat.includes("wellness") || cat.includes("physical therapy") ||
    cat.includes("fitness") || cat.includes("yoga")
  ) {
    return [
      { label: "Easy to talk to", key: "easyToTalkTo" },
      { label: "Listened to my concerns", key: "listenedToConcerns" },
      { label: "Clean & professional environment", key: "cleanEnvironment" },
      { label: "Respectful of my time", key: "respectfulOfTime" },
    ];
  }

  if (
    cat.includes("beauty") || cat.includes("salon") || cat.includes("barber") ||
    cat.includes("nail") || cat.includes("spa") || cat.includes("massage") ||
    cat.includes("tattoo") || cat.includes("esthetician") || cat.includes("makeup")
  ) {
    return [
      { label: "Quality of service", key: "serviceQuality" },
      { label: "Clean tools & workspace", key: "cleanTools" },
      { label: "Skilled & knowledgeable", key: "skilled" },
      { label: "On time & organized", key: "onTime" },
    ];
  }

  if (
    cat.includes("food") || cat.includes("restaurant") || cat.includes("café") ||
    cat.includes("cafe") || cat.includes("bakery") || cat.includes("bar") ||
    cat.includes("lounge") || cat.includes("brewery") || cat.includes("catering") ||
    cat.includes("juice") || cat.includes("dessert") || cat.includes("truck") ||
    cat.includes("smoothie") || cat.includes("beverage")
  ) {
    return [
      { label: "Food quality & freshness", key: "foodQuality" },
      { label: "Service speed", key: "serviceSpeed" },
      { label: "Clean dining area", key: "cleanDining" },
      { label: "Value for money", key: "valueForMoney" },
    ];
  }

  if (
    cat.includes("attorney") || cat.includes("legal") || cat.includes("accountant") ||
    cat.includes("financial") || cat.includes("insurance") || cat.includes("tax") ||
    cat.includes("professional") || cat.includes("consultant") || cat.includes("coach") ||
    cat.includes("notary") || cat.includes("translation")
  ) {
    return [
      { label: "Clear communication", key: "clearCommunication" },
      { label: "Knowledgeable & competent", key: "knowledgeable" },
      { label: "Responded in a timely manner", key: "timeliness" },
      { label: "Worth the cost", key: "worthCost" },
    ];
  }

  if (
    cat.includes("retail") || cat.includes("shopping") || cat.includes("clothing") ||
    cat.includes("fashion") || cat.includes("boutique") || cat.includes("bookstore") ||
    cat.includes("gift") || cat.includes("jewelry") || cat.includes("decor") ||
    cat.includes("florist") || cat.includes("cannabis") || cat.includes("shoe") ||
    cat.includes("accessory") || cat.includes("beauty supply")
  ) {
    return [
      { label: "Product selection", key: "productSelection" },
      { label: "Helpful & knowledgeable staff", key: "helpfulStaff" },
      { label: "Fair pricing", key: "fairPricing" },
      { label: "Easy to navigate", key: "easyToNavigate" },
    ];
  }

  if (
    cat.includes("event") || cat.includes("entertainment") || cat.includes("dj") ||
    cat.includes("venue") || cat.includes("wedding") || cat.includes("party") ||
    cat.includes("experience") || cat.includes("band") || cat.includes("photobooth") ||
    cat.includes("cultural")
  ) {
    return [
      { label: "Experience quality", key: "experienceQuality" },
      { label: "Staff attentiveness", key: "staffAttentiveness" },
      { label: "Clean & safe venue", key: "cleanVenue" },
      { label: "Worth the price", key: "worthPrice" },
    ];
  }

  if (
    cat.includes("auto") || cat.includes("car") || cat.includes("tire") ||
    cat.includes("mechanic") || cat.includes("contractor") || cat.includes("plumber") ||
    cat.includes("electric") || cat.includes("hvac") || cat.includes("roof") ||
    cat.includes("handyman") || cat.includes("landscap") || cat.includes("painter") ||
    cat.includes("flooring") || cat.includes("pest") || cat.includes("towing") ||
    cat.includes("repair") || cat.includes("cleaning") || cat.includes("mover")
  ) {
    return [
      { label: "Quality of work", key: "workQuality" },
      { label: "Honest & transparent", key: "honesty" },
      { label: "Completed on time", key: "completedOnTime" },
      { label: "Fair pricing", key: "fairPricing" },
    ];
  }

  if (
    cat.includes("travel") || cat.includes("hotel") || cat.includes("bed") ||
    cat.includes("vacation") || cat.includes("tour") || cat.includes("transportation") ||
    cat.includes("shuttle") || cat.includes("limo")
  ) {
    return [
      { label: "Comfortable accommodations", key: "comfort" },
      { label: "Friendly & helpful staff", key: "friendlyStaff" },
      { label: "Clean & well-maintained", key: "cleanliness" },
      { label: "Worth the price", key: "worthPrice" },
    ];
  }

  if (
    cat.includes("tech") || cat.includes("software") || cat.includes("web") ||
    cat.includes("it ") || cat.includes("cyber") || cat.includes("digital") ||
    cat.includes("ai ") || cat.includes("computer")
  ) {
    return [
      { label: "Technical expertise", key: "technicalExpertise" },
      { label: "Clear communication", key: "clearCommunication" },
      { label: "Problem solved effectively", key: "problemSolved" },
      { label: "Worth the cost", key: "worthCost" },
    ];
  }

  if (
    cat.includes("education") || cat.includes("school") || cat.includes("tutor") ||
    cat.includes("childcare") || cat.includes("daycare") || cat.includes("family")
  ) {
    return [
      { label: "Supportive & encouraging", key: "supportive" },
      { label: "Safe & nurturing environment", key: "safeEnvironment" },
      { label: "Qualified & prepared", key: "qualified" },
      { label: "Good communication with families", key: "familyCommunication" },
    ];
  }

  // Default fallback
  return [
    { label: "Quality of service", key: "serviceQuality" },
    { label: "Professionalism", key: "professionalism" },
    { label: "Customer care", key: "customerCare" },
    { label: "Value for money", key: "valueForMoney" },
  ];
}

export function getCategoryExperienceLabel(category?: string): string {
  const cat = (category ?? "").toLowerCase();
  if (cat.includes("health") || cat.includes("physician") || cat.includes("dentist") || cat.includes("mental") || cat.includes("wellness")) return "Healthcare Experience";
  if (cat.includes("beauty") || cat.includes("salon") || cat.includes("barber") || cat.includes("spa") || cat.includes("nail")) return "Service Experience";
  if (cat.includes("food") || cat.includes("restaurant") || cat.includes("café") || cat.includes("cafe") || cat.includes("bar") || cat.includes("bakery")) return "Dining Experience";
  if (cat.includes("legal") || cat.includes("professional") || cat.includes("financial") || cat.includes("attorney") || cat.includes("accountant")) return "Professional Experience";
  if (cat.includes("retail") || cat.includes("shopping") || cat.includes("clothing") || cat.includes("boutique")) return "Shopping Experience";
  if (cat.includes("event") || cat.includes("entertainment") || cat.includes("venue")) return "Event Experience";
  if (cat.includes("auto") || cat.includes("contractor") || cat.includes("repair")) return "Service Experience";
  if (cat.includes("travel") || cat.includes("hotel") || cat.includes("hospitality")) return "Hospitality Experience";
  if (cat.includes("tech") || cat.includes("software") || cat.includes("digital")) return "Tech Experience";
  if (cat.includes("education") || cat.includes("school") || cat.includes("family")) return "Education Experience";
  return "Service Experience";
}
