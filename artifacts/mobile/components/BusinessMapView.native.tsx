import React from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

interface Props {
  latitude: number;
  longitude: number;
  name: string;
}

export function BusinessMapView({ latitude, longitude }: Props) {
  return (
    <MapView
      style={styles.map}
      provider={PROVIDER_DEFAULT}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      scrollEnabled={false}
      zoomEnabled={false}
    >
      <Marker coordinate={{ latitude, longitude }} />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { height: 160, borderRadius: 14 },
});
