import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { apiPost } from "../../src/utils/api";
import PermissionModal from "../../src/components/PermissionModal";
import LiveBroadcaster from "../../src/components/LiveBroadcaster";

type PrivacyMode = "exact" | "area" | "city";
type CameraMode = "front" | "back";

type StreamResp = {
  id: string;
  event_id?: string | null;
  status: "live" | "ended";
  whip_ingest_url?: string;
  livepeer_playback_id?: string;
};

const PRIVACY_OPTIONS: { key: PrivacyMode; label: string }[] = [
  { key: "exact", label: "Exact" },
  { key: "area", label: "Area" },
  { key: "city", label: "City" },
];

export default function LiveScreen() {
  const [privacy, setPrivacy] = useState<PrivacyMode>("exact");
  const [camera, setCamera] = useState<CameraMode>("back");
  const [activeStream, setActiveStream] = useState<StreamResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const [locationStatus] = Location.useForegroundPermissions();
  const canAsk = locationStatus?.canAskAgain ?? true;
  const granted = locationStatus?.granted ?? false;

  const requestLocationAsync = useCallback(async () => {
    if (granted) return true;
    if (!canAsk) return false;
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  }, [granted, canAsk]);

  const reallyRequest = useCallback(async () => {
    const ok = await requestLocationAsync();
    setModal(false);
    return ok;
  }, [requestLocationAsync]);

  const handleCreateStream = useCallback(async () => {
    try {
      setLoading(true);
      
      // Request location permission
      const ready = await requestLocationAsync();
      let hasPermission = ready;
      if (!ready && canAsk) {
        setModal(true);
        return;
      }
      if (!hasPermission) {
        throw new Error("Location permission denied");
      }

      // Get location
      const pos = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Balanced 
      });

      // Create stream via backend
      const payload = {
        user_id: "demo-user",
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        privacy_mode: privacy,
        device_camera: camera,
      };

      const data = await apiPost<StreamResp>("/api/streams", payload);
      
      if (!data.whip_ingest_url) {
        throw new Error("No WHIP URL received from server");
      }

      setActiveStream(data);
      Alert.alert("Stream Created!", "You can now start broadcasting");
    } catch (e: any) {
      const msg = e?.message ? `Failed: ${e.message}` : "Failed to create stream";
      Alert.alert("Error", msg);
      console.error("Create stream error:", e);
    } finally {
      setLoading(false);
    }
  }, [privacy, camera, requestLocationAsync, canAsk]);

  const handleEndStream = useCallback(async () => {
    if (!activeStream) return;
    
    try {
      setLoading(true);
      // End stream via backend
      await apiPost(`/api/streams/${activeStream.id}/end`, {});
      setActiveStream(null);
      setIsBroadcasting(false);
      Alert.alert("Stream Ended", "Your stream has been ended successfully");
    } catch (e: any) {
      Alert.alert("Error", "Failed to end stream");
      console.error("End stream error:", e);
    } finally {
      setLoading(false);
    }
  }, [activeStream]);

  return (
    <SafeAreaView style={styles.container}>
      <PermissionModal
        visible={modal}
        title="Allow Location"
        message="Allsee needs your location to tag your stream and show it on the live map."
        onAccept={reallyRequest}
        onCancel={() => setModal(false)}
      />

      {!activeStream ? (
        /* Setup Screen */
        <>
          <View style={styles.header}>
            <Ionicons name="radio-outline" color="#4D9FFF" size={28} />
            <Text style={styles.headerText}>Go Live</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color="#4D9FFF" />
              <Text style={styles.infoText}>
                Start a live stream that appears instantly on the map. Others can watch in real-time!
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location Privacy</Text>
              <View style={styles.row}>
                {PRIVACY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setPrivacy(opt.key)}
                    style={[styles.chip, privacy === opt.key && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, privacy === opt.key && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Camera</Text>
              <View style={styles.row}>
                <TouchableOpacity
                  onPress={() => setCamera("back")}
                  style={[styles.chip, camera === "back" && styles.chipActive]}
                >
                  <Text style={[styles.chipText, camera === "back" && styles.chipTextActive]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setCamera("front")}
                  style={[styles.chip, camera === "front" && styles.chipActive]}
                >
                  <Text style={[styles.chipText, camera === "front" && styles.chipTextActive]}>Front</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleCreateStream}
              disabled={loading}
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="videocam" size={24} color="#FFFFFF" />
                  <Text style={styles.btnText}>Create Stream</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        /* Broadcasting Screen */
        <>
          <LiveBroadcaster
            whipUrl={activeStream.whip_ingest_url!}
            cameraPreference={camera}
            onStreamingChange={setIsBroadcasting}
          />
          
          <View style={styles.broadcastFooter}>
            <TouchableOpacity
              onPress={handleEndStream}
              disabled={loading}
              style={[styles.endBtn, loading && styles.btnDisabled]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="stop-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.btnText}>End Stream</Text>
                </>
              )}
            </TouchableOpacity>
            
            {!isBroadcasting && (
              <Text style={styles.waitingText}>
                Tap "Go Live" in the camera view to start broadcasting
              </Text>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  header: { flexDirection: "row", alignItems: "center", padding: 20, gap: 12 },
  headerText: { color: "#FFFFFF", fontSize: 24, fontWeight: "700", marginLeft: 4 },
  content: { flex: 1, paddingHorizontal: 16 },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#162335",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#4D9FFF",
  },
  infoText: { flex: 1, color: "#A0A0A0", fontSize: 14, lineHeight: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "600", marginBottom: 12 },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4D9FFF22",
    backgroundColor: "#1A1A1A",
  },
  chipActive: { borderColor: "#4D9FFF", backgroundColor: "#162335" },
  chipText: { color: "#A0A0A0", fontSize: 14 },
  chipTextActive: { color: "#FFFFFF", fontWeight: "600" },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: "#1A1A1A" },
  primaryBtn: {
    flexDirection: "row",
    backgroundColor: "#4D9FFF",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 18 },
  broadcastFooter: { padding: 16, backgroundColor: "#0A0A0A", borderTopWidth: 1, borderTopColor: "#1A1A1A" },
  endBtn: {
    flexDirection: "row",
    backgroundColor: "#FF4D4D",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  waitingText: { color: "#A0A0A0", fontSize: 14, textAlign: "center", marginTop: 12 },
});
