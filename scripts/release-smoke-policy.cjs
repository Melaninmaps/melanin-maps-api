"use strict";

function isPhiladelphiaLocation(value) {
  const location = typeof value === "string" ? value : "";
  const hasPhiladelphia = /\bphiladelphia\b/i.test(location);
  const hasPennsylvania = /\bpa\b|\bpennsylvania\b/i.test(location);
  return hasPhiladelphia && hasPennsylvania;
}

module.exports = { isPhiladelphiaLocation };
