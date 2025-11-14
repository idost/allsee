import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function MapNativePlaceholder() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="map-outline" color="#FFFFFF" size={22} />
        <Text style={styles.headerText}>Live Map (Native)</Text>
      </View>
      <View style={styles.center}>
        <Text style={styles.text}>Native map preview is temporarily disabled in this build.</Text>
        <Text style={styles.textSmall}>We’ll enable the full native map in a dev build without affecting web.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  header: { padding: 16, flexDirection: "row", alignItems: "center", gap: 8 },
  headerText: { color: "#FFFFFF", fontSize: 18, marginLeft: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  text: { color: "#A0A0A0", textAlign: "center", marginBottom: 8 },
  textSmall: { color: "#6f6f6f", textAlign: "center", fontSize: 12 },
});
