export function shouldLoadKinfolkHomeCatalog(input: {
  broadCatalogAllowed: boolean;
  decisionRoute: string | null | undefined;
}): boolean {
  if (!input.broadCatalogAllowed) return false;

  return (
    input.decisionRoute === "business_discovery" ||
    input.decisionRoute === "travel_planning"
  );
}
