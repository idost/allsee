import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { Camera } from "expo-camera";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const SLIDES = [
  { title: "Witness Together", text: "Map-first social where presence connects us.", img: null },
  { title: "Truth through POVs", text: "Multiple camera angles make the moment real.", img: null },
  { title: "Go Live in 2 taps", text: "Be seen. Be here. Be now.", img: null },
] as const;

export default function Onboarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const next = useCallback(() => setIndex((i) => Math.min(i + 1, SLIDES.length - 1)), []);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  const requestPermissions = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        const loc = await Location.requestForegroundPermissionsAsync();
        await Camera.requestCameraPermissionsAsync();
      }
    } catch {}
  }, []);

  const finish = useCallback(async () => {
    await requestPermissions();
    await AsyncStorage.setItem("onboarded_v1", "1");
    router.replace("/(tabs)");
  }, [requestPermissions, router]);

  const dots = useMemo(() => (
    <View style={styles.dots}>
      {SLIDES.map((_, i) => (
        <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
      ))}
    </View>
  ), [index]);

  const s = SLIDES[index];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        {/* Placeholder image area (could be Lottie/animated later) */}
        <View style={styles.heroBox} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{s.title}</Text>
        <Text style={styles.text}>{s.text}</Text>
        {dots}
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
  dots: { flexDirection: "row", gap: 8, marginTop: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#333" },
  dotActive: { backgroundColor: "#4D9FFF" },
  footer: { flexDirection: "row", justifyContent: "space-between", padding: 24 },
  primary: { backgroundColor: "#4D9FFF", paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  primaryText: { color: "#FFFFFF", fontWeight: "700" },
  secondary: { borderColor: "#4D9FFF", borderWidth: 2, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  secondaryText: { color: "#4D9FFF", fontWeight: "700" },
});
