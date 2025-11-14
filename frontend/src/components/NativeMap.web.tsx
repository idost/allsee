import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { MapEvent, MapStream } from "./NativeMap.native";

export default function NativeMapWeb({
  events,
  streams,
  onPressEvent,
  onPressStream,
}: {
  events: MapEvent[];
  streams: MapStream[];
  onPressEvent?: (id: string) => void;
  onPressStream?: (id: string) => void;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.header}>Live Events & Streams</Text>
        
        {events.map((e) => (
          <TouchableOpacity 
            key={e.id} 
            onPress={() => onPressEvent?.(e.id)} 
            style={styles.card}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconBadge}>
                <Ionicons name="people" size={18} color="#4D9FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Event • {e.stream_count} POVs</Text>
                <Text style={styles.metaSmall}>
                  {new Date(e.created_at).toLocaleString()}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
            </View>
          </TouchableOpacity>
        ))}
        
        {streams.map((s) => (
          <TouchableOpacity 
            key={s.id} 
            onPress={() => onPressStream?.(s.id)} 
            style={styles.card}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconBadge}>
                <Ionicons name="radio" size={18} color="#4D9FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>@{s.user_id}</Text>
                <Text style={styles.metaSmall}>Solo stream</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
            </View>
          </TouchableOpacity>
        ))}
        
        {events.length === 0 && streams.length === 0 && (
          <View style={styles.center}>
            <Ionicons name="map-outline" size={48} color="#4D9FFF" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No live streams yet</Text>
            <Text style={styles.meta}>Create a stream from the Go Live tab</Text>
          </View>
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
