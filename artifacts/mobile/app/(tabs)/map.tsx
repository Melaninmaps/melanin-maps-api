import { FullMapView } from "@/components/FullMapView";
import React from "react";
import { useLocalSearchParams } from "expo-router";

export default function MapScreen() {
  const params = useLocalSearchParams<{
    focusSiteId?: string;
    focusCulturalSiteId?: string;
    focusLat?: string;
    focusLng?: string;
    city?: string;
    state?: string;
  }>();
  return (
    <FullMapView
      focusSiteId={params.focusSiteId}
      focusCulturalSiteId={params.focusCulturalSiteId}
      focusLat={params.focusLat}
      focusLng={params.focusLng}
      searchCity={params.city}
      searchState={params.state}
    />
  );
}
