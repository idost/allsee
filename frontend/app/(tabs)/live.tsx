import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { apiPost } from "../../src/utils/api";
import PermissionModal from "../../src/components/PermissionModal";

const PRIVACY_OPTIONS = [
  { key: "exact", label: "Exact location" },
  { key: "masked_100m", label: "Mask ~100m" },
  { key: "masked_1km", label: "Mask ~1km" },
] as const;

type PrivacyKey = typeof PRIVACY_OPTIONS[number]["key"];

type StreamResp = {
  id: string;
  event_id?: string | null;
  status: "live" | "ended";
  rtmp_ingest_url?: string;
  rtmp_stream_key?: string;
  whip_ingest_url?: string;
  livepeer_playback_id?: string;
};

export default function LiveScreen() {
  const [privacy, setPrivacy] = useState<PrivacyKey>("exact");
  const [camera, setCamera] = useState<"front" | "back">("back");
  const [activeStream, setActiveStream] = useState<StreamResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);

  const canEnd = useMemo(() => !!activeStream, [activeStream]);

  const requestLocationAsync = useCallback(async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") {
      setModal(true);
      return false;
    }
    return true;
  }, []);

  const reallyRequest = useCallback(async () => {
    setModal(false);
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  }, []);

  const handleGoLive = useCallback(async () => {
    try {
      setLoading(true);
      const ready = await requestLocationAsync();
      let granted = ready;
      if (!ready) granted = await reallyRequest();
      if (!granted) throw new Error("Permission denied");
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const payload = { user_id: "demo-user", lat: pos.coords.latitude, lng: pos.coords.longitude, privacy_mode: privacy, device_camera: camera };
      const data = await apiPost<StreamResp>("/api/streams", payload);
      setActiveStream(data);
      if (data.rtmp_ingest_url && data.rtmp_stream_key) {
        Alert.alert("Stream Created!", "Use a broadcasting app like Larix to go live with the RTMP credentials below.");
      } else {
        Alert.alert("Live!", `Stream started. ID: ${data.id}`);
      }
    } catch (e: any) {
      const msg = e?.message ? `Failed: ${e.message}` : "Failed to start stream";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  }, [privacy, camera, requestLocationAsync, reallyRequest]);

  const handleEnd = useCallback(async () => {
    if (!activeStream) return;
    try {
      setLoading(true);
      await apiPost(`/api/streams/${activeStream.id}/end`);
      setActiveStream(null);
      Alert.alert("Ended", "Stream ended successfully");
    } catch (e: any) {
      const msg = e?.message ? `Failed to end: ${e.message}` : "Failed to end stream";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  }, [activeStream]);

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied!", `${label} copied to clipboard`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <PermissionModal
        visible={modal}
        title="Allow Location"
        message="Allsee needs your location to tag your stream and show it on the live map."
        onAccept={reallyRequest}
        onCancel={() => setModal(false)}
      />
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={styles.header}>
          <Ionicons name="radio-outline" color="#4D9FFF" size={28} />
          <Text style={styles.headerText}>Go Live</Text>
        </View>

        {!activeStream ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location Privacy</Text>
              <View style={styles.row}>
                {PRIVACY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setPrivacy(opt.key)}
                    style={[styles.chip, privacy === opt.key && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, privacy === opt.key && styles.chipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Camera</Text>
              <View style={styles.row}>
                <TouchableOpacity onPress={() => setCamera("back")} style={[styles.chip, camera === "back" && styles.chipActive]}>
                  <Text style={[styles.chipText, camera === "back" && styles.chipTextActive]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setCamera("front")} style={[styles.chip, camera === "front" && styles.chipActive]}>
                  <Text style={[styles.chipText, camera === "front" && styles.chipTextActive]}>Front</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.streamActiveSection}>
            {/* Status Indicator */}
            <View style={styles.statusBanner}>
              <View style={styles.statusIndicator}>
                <View style={styles.pulsingDot} />
                <Text style={styles.statusText}>Stream Ready - Waiting for broadcast</Text>
              </View>
            </View>

            {/* Step-by-step Guide */}
            <View style={styles.guideSection}>
              <Text style={styles.guideTitle}>🎥 Start Broadcasting</Text>
              
              {/* Step 1 */}
              <View style={styles.stepCard}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>Install Larix Broadcaster</Text>
                  <Text style={styles.stepDesc}>Free app for iOS & Android</Text>
                  <TouchableOpacity style={styles.linkButton}>
                    <Text style={styles.linkText}>📲 Get Larix Broadcaster</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Step 2 */}
              <View style={styles.stepCard}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>Copy your credentials</Text>
                  <Text style={styles.stepDesc}>You'll need these in Larix</Text>
                  
                  <View style={styles.credCard}>
                    <View style={styles.credRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.credLabel}>RTMP Server</Text>
                        <Text style={styles.credValue} numberOfLines={1}>{activeStream.rtmp_ingest_url}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.copyBtn}
                        onPress={() => copyToClipboard(activeStream.rtmp_ingest_url!, "Server URL")}
                      >
                        <Ionicons name="copy-outline" size={18} color="#4D9FFF" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.credCard}>
                    <View style={styles.credRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.credLabel}>Stream Key</Text>
                        <Text style={styles.credValue} numberOfLines={1}>{activeStream.rtmp_stream_key}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.copyBtn}
                        onPress={() => copyToClipboard(activeStream.rtmp_stream_key!, "Stream Key")}
                      >
                        <Ionicons name="copy-outline" size={18} color="#4D9FFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Step 3 */}
              <View style={styles.stepCard}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>Configure Larix</Text>
                  <Text style={styles.stepDesc}>
                    • Open Larix{"\n"}
                    • Tap Settings → Connections{"\n"}
                    • Add new connection{"\n"}
                    • Paste Server URL & Stream Key{"\n"}
                    • Save connection
                  </Text>
                </View>
              </View>

              {/* Step 4 */}
              <View style={styles.stepCard}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>4</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>Go Live!</Text>
                  <Text style={styles.stepDesc}>
                    • Select your connection{"\n"}
                    • Tap the broadcast button{"\n"}
                    • Your stream will appear on the map{"\n"}
                    • Others can watch in real-time!
                  </Text>
                </View>
              </View>
            </View>

            {/* Map CTA */}
            <View style={styles.ctaBox}>
              <Ionicons name="map" size={24} color="#4D9FFF" />
              <Text style={styles.ctaText}>Once broadcasting, your pin will appear on the Map tab</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleGoLive}
          disabled={loading || !!activeStream}
          style={[styles.primaryBtn, (loading || !!activeStream) && styles.btnDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.btnText}>{activeStream ? "Stream Active" : "Create Stream"}</Text>
          )}
        </TouchableOpacity>

        {activeStream && (
          <TouchableOpacity
            onPress={handleEnd}
            disabled={loading}
            style={[styles.dangerBtn, loading && styles.btnDisabled]}
          >
            <Text style={styles.btnText}>End Stream</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  header: { flexDirection: "row", alignItems: "center", padding: 20, gap: 12 },
  headerText: { color: "#FFFFFF", fontSize: 24, fontWeight: "700", marginLeft: 4 },
  section: { paddingHorizontal: 16, paddingVertical: 12 },
  sectionTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "600", marginBottom: 12 },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: "#4D9FFF22", backgroundColor: "#1A1A1A" },
  chipActive: { borderColor: "#4D9FFF", backgroundColor: "#162335" },
  chipText: { color: "#A0A0A0", fontSize: 13 },
  chipTextActive: { color: "#FFFFFF", fontWeight: "600" },
  
  // Stream Active Section
  streamActiveSection: { paddingHorizontal: 16, paddingTop: 8 },
  statusBanner: { backgroundColor: "#162335", borderRadius: 12, padding: 16, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: "#4D9FFF" },
  statusIndicator: { flexDirection: "row", alignItems: "center", gap: 12 },
  pulsingDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#4D9FFF" },
  statusText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  
  // Guide Section
  guideSection: { marginBottom: 20 },
  guideTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", marginBottom: 16 },
  
  // Step Card
  stepCard: { flexDirection: "row", backgroundColor: "#1A1A1A", borderRadius: 12, padding: 16, marginBottom: 16, gap: 12, borderWidth: 1, borderColor: "#4D9FFF11" },
  stepNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#4D9FFF", alignItems: "center", justifyContent: "center" },
  stepNumberText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  stepTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "600", marginBottom: 4 },
  stepDesc: { color: "#A0A0A0", fontSize: 13, lineHeight: 20 },
  linkButton: { marginTop: 8, alignSelf: "flex-start" },
  linkText: { color: "#4D9FFF", fontSize: 14, fontWeight: "600" },
  
  // Credentials
  credCard: { backgroundColor: "#0F0F0F", borderRadius: 10, padding: 12, marginTop: 12, borderWidth: 1, borderColor: "#4D9FFF22" },
  credRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  credLabel: { color: "#A0A0A0", fontSize: 11, marginBottom: 4, textTransform: "uppercase", fontWeight: "600" },
  credValue: { color: "#FFFFFF", fontSize: 12, fontFamily: "monospace" },
  copyBtn: { padding: 8, backgroundColor: "#162335", borderRadius: 8, borderWidth: 1, borderColor: "#4D9FFF44" },
  
  // CTA Box
  ctaBox: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#162335", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#4D9FFF22" },
  ctaText: { flex: 1, color: "#A0A0A0", fontSize: 14, lineHeight: 20 },
  
  // Footer
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, gap: 12, backgroundColor: "#0A0A0A", borderTopWidth: 1, borderTopColor: "#1A1A1A" },
  primaryBtn: { backgroundColor: "#4D9FFF", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  dangerBtn: { backgroundColor: "#FF4D4D", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
});
