import { FullMapView } from "@/components/FullMapView";
import React from "react";
import { useLocalSearchParams } from "expo-router";

export default function MapScreen() {
  const params = useLocalSearchParams<{
    focusSiteId?: string;
    focusLat?: string;
    focusLng?: string;
  }>();
  return (
    <FullMapView
      focusSiteId={params.focusSiteId}
      focusLat={params.focusLat}
      focusLng={params.focusLng}
    />
  );
}
