import { describe, expect, it } from "vitest";
import {
  highConfidenceBusinessDuplicateReasons,
  normalizeOfficialWebsiteDomain,
} from "../businessDuplicateIdentity";

const samePlace = {
  name: "Amina’s Kitchen",
  address: "123 Walnut Street, Suite 4",
  city: "Philadelphia",
  state: "PA",
};

describe("high-confidence business identity policy", () => {
  it("never treats a shared name, city, or different address as a duplicate", () => {
    expect(highConfidenceBusinessDuplicateReasons(samePlace, {
      name: "Aminas Kitchen",
      address: "555 Market Street",
      city: "Philadelphia",
      state: "PA",
    })).toEqual([]);

    expect(highConfidenceBusinessDuplicateReasons({
      name: "Amina's Kitchen",
      city: "Philadelphia",
      state: "PA",
    }, {
      name: "Amina's Kitchen",
      city: "Philadelphia",
      state: "PA",
    })).toEqual([]);
  });

  it("recognizes the same normalized name plus the same normalized complete address", () => {
    expect(highConfidenceBusinessDuplicateReasons(samePlace, {
      name: "AMINAS KITCHEN",
      address: "123 Walnut St Ste 4",
      city: "Philadelphia",
      state: "PA",
    })).toEqual(["same_name_and_address"]);
  });

  it("recognizes exact official domain, social profile, and phone independently", () => {
    expect(highConfidenceBusinessDuplicateReasons({ website: "https://www.aminaskitchen.com/menu" }, {
      website: "https://aminaskitchen.com/contact",
    })).toEqual(["same_official_domain"]);

    expect(highConfidenceBusinessDuplicateReasons({ instagram: "@aminaskitchen" }, {
      instagram: "https://www.instagram.com/aminaskitchen/",
    })).toEqual(["same_official_social"]);

    expect(highConfidenceBusinessDuplicateReasons({ phone: "+1 (215) 555-0199" }, {
      phone: "215-555-0199",
    })).toEqual(["same_phone"]);
    expect(highConfidenceBusinessDuplicateReasons({ phone: "555-1212" }, {
      phone: "555-1212",
    })).toEqual([]);
  });

  it("never accepts directories, marketplaces, or maps as an official identity source", () => {
    expect(normalizeOfficialWebsiteDomain("https://www.yelp.com/biz/aminas-kitchen")).toBeNull();
    expect(normalizeOfficialWebsiteDomain("https://maps.google.com/?cid=123")).toBeNull();
    expect(highConfidenceBusinessDuplicateReasons({ website: "https://www.yelp.com/biz/aminas-kitchen" }, {
      website: "https://www.yelp.com/biz/aminas-kitchen-philadelphia",
    })).toEqual([]);
  });
});
