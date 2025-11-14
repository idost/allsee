import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function PermissionModal({ visible, title, message, onAccept, onCancel }: { visible: boolean; title: string; message: string; onAccept: () => void; onCancel: () => void; }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.msg}>{message}</Text>
          <View style={styles.row}>
            <TouchableOpacity onPress={onCancel} style={styles.secondary}><Text style={styles.secondaryText}>Not now</Text></TouchableOpacity>
            <TouchableOpacity onPress={onAccept} style={styles.primary}><Text style={styles.primaryText}>Allow</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "#00000088", alignItems: "center", justifyContent: "center", padding: 16 },
  card: { backgroundColor: "#1A1A1A", borderRadius: 14, padding: 16, width: "100%" },
  title: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
  msg: { color: "#A0A0A0", marginTop: 8 },
  row: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  primary: { backgroundColor: "#4D9FFF", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  primaryText: { color: "#FFFFFF", fontWeight: "700" },
  secondary: { borderColor: "#4D9FFF", borderWidth: 2, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  secondaryText: { color: "#4D9FFF", fontWeight: "700" },
});
