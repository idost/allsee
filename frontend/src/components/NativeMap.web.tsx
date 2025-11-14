import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import type { MapEvent, MapStream } from "./NativeMap.native";

export default function NativeMapWeb({ events, streams }: { events: MapEvent[]; streams: MapStream[] }) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {events.map((e) => (
          <View key={e.id} style={styles.card}>
            <Text style={styles.title}>Event • {e.stream_count} POVs</Text>
            <Text style={styles.metaSmall}>Created: {new Date(e.created_at).toLocaleString()}</Text>
          </View>
        ))}
        {streams.filter((s) => !s.id.includes("_event"))?.map((s) => (
          <View key={s.id} style={styles.card}>
            <Text style={styles.title}>Single Stream • @{s.user_id}</Text>
          </View>
        ))}
        {events.length === 0 && streams.length === 0 && (
          <View style={styles.center}><Text style={styles.meta}>No live data yet</Text></View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#1A1A1A", borderRadius: 12, padding: 16, marginBottom: 12 },
  title: { color: "#FFFFFF", fontSize: 16 },
  meta: { color: "#A0A0A0" },
  metaSmall: { color: "#A0A0A0", fontSize: 12, marginTop: 6 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
