export function locationResolutionErrorMessage(status: number): string | null {
  if (status === 404) {
    return "We could not find that area. Try a city and state, for example Philadelphia, PA.";
  }
  if (status === 409) {
    return "More than one area has that name. Add the state, for example Springfield, IL.";
  }
  if (status >= 400) {
    return "We could not search that area right now. Please try again.";
  }
  return null;
}
