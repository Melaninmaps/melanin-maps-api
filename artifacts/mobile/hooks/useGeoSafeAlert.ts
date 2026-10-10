import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useRef, useState } from "react";

const ALERT_CACHE_KEY = "@melanin_geo_alert_";
const ALERT_COOLDOWN_MS = 60 * 60 * 1000;
const LOW_SAFETY_THRESHOLD = 45;

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

export interface GeoAlert {
  city: string;
  avgSafetyScore: number;
  approvedSurveyCount: number;
  confidence: "minimum_sample" | "larger_sample";
}

interface SafetyHeatmapPoint {
  city: string;
  avgScore: number;
  approvedSurveyCount: number;
  evidence: {
    confidence: "minimum_sample" | "larger_sample";
  };
}

export function useGeoSafeAlert() {
  const [alert, setAlert] = useState<GeoAlert | null>(null);
  const [checking, setChecking] = useState(false);
  const checkedRef = useRef(false);

  const dismissAlert = useCallback(() => setAlert(null), []);

  const checkCurrentLocation = useCallback(async () => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    setChecking(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("location timeout")), 8_000)
        ),
      ]);
      const { latitude, longitude } = loc.coords;

      const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
      if (!GOOGLE_KEY) return;
      const geoRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&result_type=locality&key=${GOOGLE_KEY}`
      );
      const geoData = await geoRes.json() as { results: { address_components: { long_name: string; types: string[] }[] }[] };
      let city = "";
      for (const result of geoData.results ?? []) {
        for (const comp of result.address_components) {
          if (comp.types.includes("locality") && !city) city = comp.long_name;
        }
        if (city) break;
      }
      if (!city) return;

      const cacheKey = ALERT_CACHE_KEY + city.toLowerCase().replace(/\s/g, "_");
      const lastAlerted = await AsyncStorage.getItem(cacheKey);
      if (lastAlerted && Date.now() - parseInt(lastAlerted, 10) < ALERT_COOLDOWN_MS) return;

      const token = await SecureStore.getItemAsync("auth_session_token");
      // The Safety Heat API receives only a city and returns no raw surveys,
      // reporter identity, reporter location, or device coordinates.
      const heatmapRes = await fetch(
        `${getApiBase()}/api/safety/heatmap?city=${encodeURIComponent(city)}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      if (!heatmapRes.ok) return;
      const heatmapData = await heatmapRes.json() as {
        dataStatus?: "sufficient_evidence" | "insufficient_evidence";
        points?: SafetyHeatmapPoint[];
      };
      if (heatmapData.dataStatus !== "sufficient_evidence") return;
      const point = heatmapData.points?.find(
        (candidate) => candidate.city.toLocaleLowerCase() === city.toLocaleLowerCase(),
      );
      if (!point) return;

      if (point.avgScore < LOW_SAFETY_THRESHOLD) {
        setAlert({
          city: point.city,
          avgSafetyScore: Math.round(point.avgScore),
          approvedSurveyCount: point.approvedSurveyCount,
          confidence: point.evidence.confidence,
        });
        await AsyncStorage.setItem(cacheKey, String(Date.now()));
      }
    } catch { /* silent */ } finally {
      setChecking(false);
    }
  }, []);

  return { alert, checking, dismissAlert, recheck: checkCurrentLocation };
}
