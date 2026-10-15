import { FullMapView } from "@/components/FullMapView";
import React from "react";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { DEVICE_FARM_TEST_IDS } from "@/lib/deviceFarmSelectors";

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
    <View
      testID={DEVICE_FARM_TEST_IDS.mapScreen}
      accessibilityLabel="Map screen"
      style={{ flex: 1 }}
    >
      <FullMapView
        focusSiteId={params.focusSiteId}
        focusCulturalSiteId={params.focusCulturalSiteId}
        focusLat={params.focusLat}
        focusLng={params.focusLng}
        searchCity={params.city}
        searchState={params.state}
      />
    </View>
  );
}
