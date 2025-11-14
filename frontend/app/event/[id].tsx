import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, FlatList, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import { apiGet } from "../../src/utils/api";

const COLORS = {
  bg: "#0A0A0A",
  surface: "#1A1A1A",
  blue: "#4D9FFF",
  violet: "#9D4EDD",
  amber: "#FFB800",
  text: "#FFFFFF",
  meta: "#A0A0A0",
  danger: "#FF4D4D",
};

const { width } = Dimensions.get("window");

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);
  const [active, setActive] = useState<number>(0);

  const streams = useMemo(() => (data?.streams ?? []), [data]);
  const activeStream = streams[active];
  const isLive = (data?.event?.status ?? "ended") === "live";

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      setLoading(true);
      const d = await apiGet<any>(`/api/events/${id}`);
      setData(d);
      setActive(0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const renderThumb = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      onPress={() => setActive(index)}
      style={[styles.thumb, index === active && styles.thumbActive]}
    >
      <Ionicons name="videocam" color={index === active ? COLORS.text : COLORS.meta} size={18} />
      <Text style={[styles.thumbText, index === active && styles.thumbTextActive]}>@{item.user_id}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.blue} /></View>
      ) : error ? (
        <View style={styles.center}><Text style={styles.error}>Error: {error}</Text></View>
      ) : data ? (
        <View style={{ flex: 1 }}>
          <View style={styles.metaBar}>
            <View style={styles.row}>
              <View style={[styles.badge, { backgroundColor: isLive ? "#D91E18" : COLORS.surface }]}>
                <Text style={styles.badgeText}>{isLive ? "LIVE" : "REPLAY"}</Text>
              </View>
              <Text style={styles.metaText}>{data.event.stream_count} POVs</Text>
            </View>
            <TouchableOpacity onPress={load}>
              <Ionicons name="refresh" color={COLORS.meta} size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.playerWrap}>
            {activeStream?.playback_url ? (
              <Video
                style={styles.player}
                source={{ uri: activeStream.playback_url }}
                useNativeControls
                resizeMode="cover"
                shouldPlay={false}
                isLooping={false}
              />
            ) : (
              <View style={[styles.player, styles.playerPlaceholder]}>
                <Ionicons name="image" color={COLORS.meta} size={48} />
                <Text style={styles.meta}>No playback available</Text>
              </View>
            )}
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>@{activeStream?.user_id ?? "unknown"}</Text>
              <Text style={styles.overlayMeta}>{isLive ? "Live" : "Replay"}</Text>
            </View>
          </View>

          <View style={styles.povBar}>
            <FlatList
              horizontal
              data={streams}
              keyExtractor={(item) => item.id}
              renderItem={renderThumb}
              ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
              contentContainerStyle={{ paddingHorizontal: 12 }}
              showsHorizontalScrollIndicator={false}
            />
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.title}>Event</Text>
            <Text style={styles.meta}>Centroid: {data.event.centroid_lat.toFixed(5)}, {data.event.centroid_lng.toFixed(5)}</Text>
            <Text style={styles.metaSmall}>Created: {new Date(data.event.created_at).toLocaleString()}</Text>
            <View style={{ height: 12 }} />
            <Text style={styles.title}>Streams</Text>
            {streams.map((s: any) => (
              <View key={s.id} style={styles.card}>
                <Text style={styles.meta}>@{s.user_id}</Text>
                <Text style={styles.metaSmall}>{s.status === 'live' ? 'Live' : 'Ended'}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.center}><Text style={styles.meta}>No data</Text></View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  metaBar: { paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: COLORS.text, fontWeight: "700", fontSize: 12 },
  metaText: { color: COLORS.meta },
  playerWrap: { width: "100%", height: Math.round(width * 9 / 16), backgroundColor: "#000" },
  player: { width: "100%", height: "100%", backgroundColor: "#000" },
  playerPlaceholder: { alignItems: "center", justifyContent: "center" },
  overlay: { position: "absolute", left: 12, bottom: 12, backgroundColor: "#00000066", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  overlayTitle: { color: COLORS.text, fontWeight: "700" },
  overlayMeta: { color: COLORS.meta, marginTop: 2 },
  povBar: { paddingVertical: 10, backgroundColor: "#00000066" },
  title: { color: COLORS.text, fontSize: 18, marginBottom: 8 },
  meta: { color: COLORS.meta, marginTop: 4 },
  metaSmall: { color: COLORS.meta, marginTop: 4, fontSize: 12 },
  error: { color: COLORS.danger },
  card: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, marginTop: 8 },
});
