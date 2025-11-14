import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { Camera } from "expo-camera";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const SLIDES = [
  { title: "Witness Together", text: "Map-first social where presence connects us." },
  { title: "Truth through POVs", text: "Multiple camera angles make the moment real." },
  { title: "Go Live in 2 taps", text: "Be seen. Be here. Be now." },
] as const;

export default function Onboarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [locStatus, setLocStatus] = useState<string>("unknown");
  const [camStatus, setCamStatus] = useState<string>("unknown");

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, SLIDES.length - 1)), []);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  const requestLocation = useCallback(async () => {
    if (Platform.OS === "web") { setLocStatus("granted"); return; }
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocStatus(status);
  }, []);
  const requestCamera = useCallback(async () => {
    if (Platform.OS === "web") { setCamStatus("granted"); return; }
    const { status } = await Camera.requestCameraPermissionsAsync();
    setCamStatus(status);
  }, []);

  const finish = useCallback(async () => {
    await AsyncStorage.setItem("onboarded_v1", "1");
    router.replace("/(tabs)");
  }, [router]);

  const s = SLIDES[index];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroBox} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{s.title}</Text>
        <Text style={styles.text}>{s.text}</Text>
        {index === SLIDES.length - 1 && (
          <View style={styles.perms}>
            <View style={styles.row}><Text style={styles.text}>Location: {locStatus}</Text><TouchableOpacity onPress={requestLocation} style={styles.secondary}><Text style={styles.secondaryText}>Allow</Text></TouchableOpacity></View>
            <View style={{ height: 8 }} />
            <View style={styles.row}><Text style={styles.text}>Camera: {camStatus}</Text><TouchableOpacity onPress={requestCamera} style={styles.secondary}><Text style={styles.secondaryText}>Allow</Text></TouchableOpacity></View>
          </View>
        )}
      </View>
      <View style={styles.footer}>
        {index > 0 ? (
          <TouchableOpacity onPress={prev} style={styles.secondary}><Text style={styles.secondaryText}>Back</Text></TouchableOpacity>
        ) : <View style={{ width: 96 }} />}
        {index < SLIDES.length - 1 ? (
          <TouchableOpacity onPress={next} style={styles.primary}><Text style={styles.primaryText}>Next</Text></TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={finish} style={styles.primary}><Text style={styles.primaryText}>Get Started</Text></TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  hero: { flex: 1, alignItems: "center", justifyContent: "center" },
  heroBox: { width: width * 0.7, height: width * 0.7, borderRadius: 24, backgroundColor: "#1A1A1A" },
  content: { paddingHorizontal: 24, paddingBottom: 12, alignItems: "center" },
  title: { color: "#FFFFFF", fontSize: 24, fontWeight: "700", textAlign: "center", marginTop: 24 },
  text: { color: "#A0A0A0", textAlign: "center", marginTop: 8 },
  perms: { width: "100%", marginTop: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footer: { flexDirection: "row", justifyContent: "space-between", padding: 24 },
  primary: { backgroundColor: "#4D9FFF", paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  primaryText: { color: "#FFFFFF", fontWeight: "700" },
  secondary: { borderColor: "#4D9FFF", borderWidth: 2, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  secondaryText: { color: "#4D9FFF", fontWeight: "700" },
});
