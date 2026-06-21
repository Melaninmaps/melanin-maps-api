import { getUncachableRevenueCatClient } from "./revenueCatClient";

import {
  listProjects,
  createProject,
  listApps,
  createApp,
  listAppPublicApiKeys,
  listProducts,
  createProduct,
  listEntitlements,
  createEntitlement,
  attachProductsToEntitlement,
  listOfferings,
  createOffering,
  updateOffering,
  listPackages,
  createPackages,
  attachProductsToPackage,
  type App,
  type Product,
  type Project,
  type Entitlement,
  type Offering,
  type Package,
  type CreateProductData,
} from "@replit/revenuecat-sdk";

const PROJECT_NAME = "Mapping With Melanin";

const APP_STORE_APP_NAME = "Mapping With Melanin iOS";
const APP_STORE_BUNDLE_ID = "com.melaninmaps.app";
const PLAY_STORE_APP_NAME = "Mapping With Melanin Android";
const PLAY_STORE_PACKAGE_NAME = "com.melaninmaps.app";

const ENTITLEMENT_IDENTIFIER = "premium";
const ENTITLEMENT_DISPLAY_NAME = "Premium Access";

type TierConfig = {
  id: string;
  displayName: string;
  offeringDisplayName: string;
  isCurrent: boolean;
  monthly: {
    identifier: string;
    displayName: string;
    priceUsdMicros: number;
    priceEurMicros: number;
  };
  annual: {
    identifier: string;
    displayName: string;
    priceUsdMicros: number;
    priceEurMicros: number;
  };
};

const TIERS: TierConfig[] = [
  {
    id: "navigator",
    displayName: "Navigator",
    offeringDisplayName: "Navigator Tier",
    isCurrent: true,
    monthly: {
      identifier: "mwm_navigator_monthly",
      displayName: "Navigator Monthly",
      priceUsdMicros: 7990000,
      priceEurMicros: 7490000,
    },
    annual: {
      identifier: "mwm_navigator_annual",
      displayName: "Navigator Annual",
      priceUsdMicros: 79990000,
      priceEurMicros: 74990000,
    },
  },
  {
    id: "trailblazer",
    displayName: "Trailblazer",
    offeringDisplayName: "Trailblazer Tier",
    isCurrent: false,
    monthly: {
      identifier: "mwm_trailblazer_monthly",
      displayName: "Trailblazer Monthly",
      priceUsdMicros: 14990000,
      priceEurMicros: 13990000,
    },
    annual: {
      identifier: "mwm_trailblazer_annual",
      displayName: "Trailblazer Annual",
      priceUsdMicros: 149990000,
      priceEurMicros: 139990000,
    },
  },
  {
    id: "growth_partner",
    displayName: "Growth Partner",
    offeringDisplayName: "Growth Partner Tier",
    isCurrent: false,
    monthly: {
      identifier: "mwm_growth_partner_monthly",
      displayName: "Growth Partner Monthly",
      priceUsdMicros: 24990000,
      priceEurMicros: 22990000,
    },
    annual: {
      identifier: "mwm_growth_partner_annual",
      displayName: "Growth Partner Annual",
      priceUsdMicros: 249990000,
      priceEurMicros: 229990000,
    },
  },
  {
    id: "community_leader",
    displayName: "Community Leader",
    offeringDisplayName: "Community Leader Tier",
    isCurrent: false,
    monthly: {
      identifier: "mwm_community_leader_monthly",
      displayName: "Community Leader Monthly",
      priceUsdMicros: 69990000,
      priceEurMicros: 64990000,
    },
    annual: {
      identifier: "mwm_community_leader_annual",
      displayName: "Community Leader Annual",
      priceUsdMicros: 699990000,
      priceEurMicros: 649990000,
    },
  },
  {
    id: "legacy_partner",
    displayName: "Legacy Partner",
    offeringDisplayName: "Legacy Partner Tier",
    isCurrent: false,
    monthly: {
      identifier: "mwm_legacy_partner_monthly",
      displayName: "Legacy Partner Monthly",
      priceUsdMicros: 199990000,
      priceEurMicros: 184990000,
    },
    annual: {
      identifier: "mwm_legacy_partner_annual",
      displayName: "Legacy Partner Annual",
      priceUsdMicros: 1999990000,
      priceEurMicros: 1849990000,
    },
  },
];

type TestStorePricesResponse = {
  object: string;
  prices: { amount_micros: number; currency: string }[];
};

async function seedRevenueCat() {
  const client = await getUncachableRevenueCatClient();

  let project: Project;
  const { data: existingProjects, error: listProjectsError } = await listProjects({
    client,
    query: { limit: 20 },
  });

  if (listProjectsError) throw new Error("Failed to list projects");

  const existingProject = existingProjects.items?.find((p) => p.name === PROJECT_NAME);

  if (existingProject) {
    console.log("Project already exists:", existingProject.id);
    project = existingProject;
  } else {
    const { data: newProject, error: createProjectError } = await createProject({
      client,
      body: { name: PROJECT_NAME },
    });
    if (createProjectError) throw new Error("Failed to create project");
    console.log("Created project:", newProject.id);
    project = newProject;
  }

  const { data: apps, error: listAppsError } = await listApps({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });

  if (listAppsError || !apps || apps.items.length === 0) {
    throw new Error("No apps found in project");
  }

  let testStoreApp: App | undefined = apps.items.find((a) => a.type === "test_store");
  let appStoreApp: App | undefined = apps.items.find((a) => a.type === "app_store");
  let playStoreApp: App | undefined = apps.items.find((a) => a.type === "play_store");

  if (!testStoreApp) throw new Error("No test store app found in project");
  console.log("Test store app:", testStoreApp.id);

  if (!appStoreApp) {
    const { data: newApp, error } = await createApp({
      client,
      path: { project_id: project.id },
      body: {
        name: APP_STORE_APP_NAME,
        type: "app_store",
        app_store: { bundle_id: APP_STORE_BUNDLE_ID },
      },
    });
    if (error) throw new Error("Failed to create App Store app");
    appStoreApp = newApp;
    console.log("Created App Store app:", appStoreApp.id);
  } else {
    console.log("App Store app:", appStoreApp.id);
  }

  if (!playStoreApp) {
    const { data: newApp, error } = await createApp({
      client,
      path: { project_id: project.id },
      body: {
        name: PLAY_STORE_APP_NAME,
        type: "play_store",
        play_store: { package_name: PLAY_STORE_PACKAGE_NAME },
      },
    });
    if (error) throw new Error("Failed to create Play Store app");
    playStoreApp = newApp;
    console.log("Created Play Store app:", playStoreApp.id);
  } else {
    console.log("Play Store app:", playStoreApp.id);
  }

  const { data: existingProductsList, error: listProductsError } = await listProducts({
    client,
    path: { project_id: project.id },
    query: { limit: 100 },
  });

  if (listProductsError) throw new Error("Failed to list products");

  const ensureProduct = async (
    targetApp: App,
    label: string,
    storeIdentifier: string,
    displayName: string,
    isTestStore: boolean,
    duration: "P1M" | "P1Y"
  ): Promise<Product> => {
    const existing = existingProductsList.items?.find(
      (p) => p.store_identifier === storeIdentifier && p.app_id === targetApp.id
    );
    if (existing) {
      console.log(`${label} already exists:`, existing.id);
      return existing;
    }

    const body: CreateProductData["body"] = {
      store_identifier: storeIdentifier,
      app_id: targetApp.id,
      type: "subscription",
      display_name: displayName,
    };

    if (isTestStore) {
      body.subscription = { duration };
      body.title = displayName;
    }

    const { data: created, error } = await createProduct({
      client,
      path: { project_id: project.id },
      body,
    });

    if (error) throw new Error(`Failed to create ${label}: ${JSON.stringify(error)}`);
    console.log(`Created ${label}:`, created.id);
    return created;
  };

  const addTestStorePrices = async (
    product: Product,
    prices: { amount_micros: number; currency: string }[]
  ) => {
    const { error } = await client.post<TestStorePricesResponse>({
      url: "/projects/{project_id}/products/{product_id}/test_store_prices",
      path: { project_id: project.id, product_id: product.id },
      body: { prices },
    });

    if (error) {
      if (typeof error === "object" && "type" in error && error["type"] === "resource_already_exists") {
        console.log("Test store prices already set for:", product.id);
      } else {
        throw new Error(`Failed to add test store prices for ${product.id}`);
      }
    } else {
      console.log("Added test store prices for:", product.id);
    }
  };

  const allProductIds: string[] = [];
  type TierProducts = { monthly: Product; annual: Product };
  const tierProducts: Record<string, TierProducts> = {};

  for (const tier of TIERS) {
    const playMonthlyId = `${tier.id}:monthly`;
    const playAnnualId = `${tier.id}:annual`;

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const testMonthly = await ensureProduct(testStoreApp, `TestStore ${tier.displayName} Monthly`, tier.monthly.identifier, tier.monthly.displayName, true, "P1M");
    await delay(300);
    const testAnnual = await ensureProduct(testStoreApp, `TestStore ${tier.displayName} Annual`, tier.annual.identifier, tier.annual.displayName, true, "P1Y");
    await delay(300);
    const appMonthly = await ensureProduct(appStoreApp, `AppStore ${tier.displayName} Monthly`, tier.monthly.identifier, tier.monthly.displayName, false, "P1M");
    await delay(300);
    const appAnnual = await ensureProduct(appStoreApp, `AppStore ${tier.displayName} Annual`, tier.annual.identifier, tier.annual.displayName, false, "P1Y");
    await delay(300);
    const playMonthly = await ensureProduct(playStoreApp, `PlayStore ${tier.displayName} Monthly`, playMonthlyId, tier.monthly.displayName, false, "P1M");
    await delay(300);
    const playAnnual = await ensureProduct(playStoreApp, `PlayStore ${tier.displayName} Annual`, playAnnualId, tier.annual.displayName, false, "P1Y");
    await delay(300);

    await Promise.all([
      addTestStorePrices(testMonthly, [
        { amount_micros: tier.monthly.priceUsdMicros, currency: "USD" },
        { amount_micros: tier.monthly.priceEurMicros, currency: "EUR" },
      ]),
      addTestStorePrices(testAnnual, [
        { amount_micros: tier.annual.priceUsdMicros, currency: "USD" },
        { amount_micros: tier.annual.priceEurMicros, currency: "EUR" },
      ]),
    ]);

    allProductIds.push(testMonthly.id, testAnnual.id, appMonthly.id, appAnnual.id, playMonthly.id, playAnnual.id);
    tierProducts[tier.id] = { monthly: testMonthly, annual: testAnnual };
  }

  let entitlement: Entitlement | undefined;
  const { data: existingEntitlements, error: listEntitlementsError } = await listEntitlements({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });

  if (listEntitlementsError) throw new Error("Failed to list entitlements");

  const existingEntitlement = existingEntitlements.items?.find(
    (e) => e.lookup_key === ENTITLEMENT_IDENTIFIER
  );

  if (existingEntitlement) {
    console.log("Entitlement already exists:", existingEntitlement.id);
    entitlement = existingEntitlement;
  } else {
    const { data: newEntitlement, error } = await createEntitlement({
      client,
      path: { project_id: project.id },
      body: {
        lookup_key: ENTITLEMENT_IDENTIFIER,
        display_name: ENTITLEMENT_DISPLAY_NAME,
      },
    });
    if (error) throw new Error("Failed to create entitlement");
    console.log("Created entitlement:", newEntitlement.id);
    entitlement = newEntitlement;
  }

  const { error: attachEntitlementError } = await attachProductsToEntitlement({
    client,
    path: { project_id: project.id, entitlement_id: entitlement.id },
    body: { product_ids: allProductIds },
  });

  if (attachEntitlementError) {
    if (attachEntitlementError.type === "unprocessable_entity_error") {
      console.log("Products already attached to entitlement (or partial)");
    } else {
      throw new Error("Failed to attach products to entitlement");
    }
  } else {
    console.log("Attached all products to premium entitlement");
  }

  const { data: existingOfferings, error: listOfferingsError } = await listOfferings({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });

  if (listOfferingsError) throw new Error("Failed to list offerings");

  for (const tier of TIERS) {
    let offering: Offering | undefined;

    const existingOffering = existingOfferings.items?.find((o) => o.lookup_key === tier.id);

    if (existingOffering) {
      console.log(`Offering ${tier.id} already exists:`, existingOffering.id);
      offering = existingOffering;
    } else {
      const { data: newOffering, error } = await createOffering({
        client,
        path: { project_id: project.id },
        body: {
          lookup_key: tier.id,
          display_name: tier.offeringDisplayName,
        },
      });
      if (error) throw new Error(`Failed to create offering ${tier.id}`);
      console.log(`Created offering ${tier.id}:`, newOffering.id);
      offering = newOffering;
    }

    if (tier.isCurrent && !offering.is_current) {
      const { error } = await updateOffering({
        client,
        path: { project_id: project.id, offering_id: offering.id },
        body: { is_current: true },
      });
      if (error) throw new Error("Failed to set navigator as current offering");
      console.log("Set navigator as current offering");
    }

    const { data: existingPkgs, error: listPkgsError } = await listPackages({
      client,
      path: { project_id: project.id, offering_id: offering.id },
      query: { limit: 20 },
    });

    if (listPkgsError) throw new Error(`Failed to list packages for ${tier.id}`);

    const tierProds = tierProducts[tier.id]!;

    for (const pkgConfig of [
      { key: "$rc_monthly", displayName: "Monthly", product: tierProds.monthly },
      { key: "$rc_annual", displayName: "Annual", product: tierProds.annual },
    ]) {
      let pkg: Package;
      const existingPkg = existingPkgs.items?.find((p) => p.lookup_key === pkgConfig.key);

      if (existingPkg) {
        console.log(`Package ${pkgConfig.key} for ${tier.id} already exists:`, existingPkg.id);
        pkg = existingPkg;
      } else {
        const { data: newPkg, error } = await createPackages({
          client,
          path: { project_id: project.id, offering_id: offering.id },
          body: {
            lookup_key: pkgConfig.key,
            display_name: `${tier.displayName} ${pkgConfig.displayName}`,
          },
        });
        if (error) throw new Error(`Failed to create package ${pkgConfig.key} for ${tier.id}`);
        console.log(`Created package ${pkgConfig.key} for ${tier.id}:`, newPkg.id);
        pkg = newPkg;
      }

      const { error: attachPkgError } = await attachProductsToPackage({
        client,
        path: { project_id: project.id, package_id: pkg.id },
        body: {
          products: [{ product_id: pkgConfig.product.id, eligibility_criteria: "all" }],
        },
      });

      if (attachPkgError) {
        if (
          attachPkgError.type === "unprocessable_entity_error" &&
          attachPkgError.message?.includes("Cannot attach product")
        ) {
          console.log(`Package ${pkgConfig.key} for ${tier.id} already has product attached`);
        } else {
          throw new Error(`Failed to attach product to package ${pkgConfig.key} for ${tier.id}`);
        }
      } else {
        console.log(`Attached product to package ${pkgConfig.key} for ${tier.id}`);
      }
    }
  }

  const { data: testStoreApiKeys } = await listAppPublicApiKeys({
    client,
    path: { project_id: project.id, app_id: testStoreApp.id },
  });
  const { data: appStoreApiKeys } = await listAppPublicApiKeys({
    client,
    path: { project_id: project.id, app_id: appStoreApp.id },
  });
  const { data: playStoreApiKeys } = await listAppPublicApiKeys({
    client,
    path: { project_id: project.id, app_id: playStoreApp.id },
  });

  console.log("\n====================");
  console.log("RevenueCat setup complete for Mapping With Melanin!");
  console.log("Project ID:", project.id, "  →  REVENUECAT_PROJECT_ID");
  console.log("Test Store App ID:", testStoreApp.id, "  →  REVENUECAT_TEST_STORE_APP_ID");
  console.log("App Store App ID:", appStoreApp.id, "  →  REVENUECAT_APPLE_APP_STORE_APP_ID");
  console.log("Play Store App ID:", playStoreApp.id, "  →  REVENUECAT_GOOGLE_PLAY_STORE_APP_ID");
  console.log(
    "EXPO_PUBLIC_REVENUECAT_TEST_API_KEY =",
    testStoreApiKeys?.items.map((i) => i.key).join(", ") ?? "N/A"
  );
  console.log(
    "EXPO_PUBLIC_REVENUECAT_IOS_API_KEY =",
    appStoreApiKeys?.items.map((i) => i.key).join(", ") ?? "N/A"
  );
  console.log(
    "EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY =",
    playStoreApiKeys?.items.map((i) => i.key).join(", ") ?? "N/A"
  );
  console.log("Entitlement identifier: premium");
  console.log("Tiers seeded: navigator (current), trailblazer, growth_partner, community_leader, legacy_partner");
  console.log("====================\n");
}

seedRevenueCat().catch(console.error);
