import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";

const COLORS = {
  blue: "#4D9FFF",
  violet: "#9D4DFF",
  amber: "#FFB84D",
};

export type MapEvent = {
  id: string;
  centroid_lat: number;
  centroid_lng: number;
  stream_count: number;
  created_at: string;
};

export type MapStream = {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
};

export default function NativeMap({
  events,
  streams,
  onRegionChangeComplete,
  initialRegion = { latitude: 41.0082, longitude: 28.9784, latitudeDelta: 0.05, longitudeDelta: 0.05 },
  loading,
  onPressEvent,
  onPressStream,
}: {
  events: MapEvent[];
  streams: MapStream[];
  onRegionChangeComplete: (r: Region) => void;
  initialRegion?: Region;
  loading?: boolean;
  onPressEvent?: (eventId: string) => void;
  onPressStream?: (streamId: string) => void;
}) {
  const [region, setRegion] = useState<Region>(initialRegion);
  const [locLoading, setLocLoading] = useState(false);
  const mounted = useRef(true);

  const locate = useCallback(async () => {
    try {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!mounted.current) return;
        setRegion((r) => ({ ...r, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
      }
    } catch {}
    finally { setLocLoading(false); }
  }, []);

  useEffect(() => {
    mounted.current = true;
    locate();
    return () => { mounted.current = false; };
  }, [locate]);

  const handleRegionChangeComplete = useCallback((r: Region) => {
    setRegion(r);
    onRegionChangeComplete(r);
  }, [onRegionChangeComplete]);

  return (
    <View style={{ flex: 1 }}>
      {(loading || locLoading) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#fff" />
        </View>
      )}
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
      >
        {streams.map((s) => (
          <Marker key={s.id} coordinate={{ latitude: s.lat, longitude: s.lng }} title={`@${s.user_id}`} description="Live stream" onPress={() => onPressStream && onPressStream(s.id)}>
            <View style={[styles.pin, { backgroundColor: COLORS.blue }]} />
          </Marker>
        ))}
        {events.map((e) => {
          const color = e.stream_count >= 5 ? COLORS.amber : COLORS.violet;
          return (
            <Marker key={e.id} coordinate={{ latitude: e.centroid_lat, longitude: e.centroid_lng }} title="Event" description={`${e.stream_count} POVs`} onPress={() => onPressEvent && onPressEvent(e.id)}>
              <View style={[styles.cluster, { borderColor: color }]}> 
                <View style={[styles.clusterInner, { backgroundColor: color }]}> 
                  <Text style={styles.clusterText}>{e.stream_count}</Text>
                </View>
              </View>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: { position: "absolute", top: 0, left: 0, right: 0, height: 48, alignItems: "center", justifyContent: "center", zIndex: 2 },
  pin: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: "#ffffff" },
  cluster: { width: 36, height: 36, borderRadius: 18, borderWidth: 3, alignItems: "center", justifyContent: "center", backgroundColor: "#00000099" },
  clusterInner: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  clusterText: { color: "#fff", fontWeight: "700" },
});
