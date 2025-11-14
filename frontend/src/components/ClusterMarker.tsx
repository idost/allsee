import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

export default function ClusterMarker({ count, color, baseSize = 40 }: { count: number; color: string; baseSize?: number }) {
  const scale = useRef(new Animated.Value(0.95)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.05, duration: 850, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.95, duration: 850, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);

  const outer = Math.min(56, baseSize + Math.min(12, Math.max(0, count - 2) * 2));
  const inner = outer - 10;

  return (
    <Animated.View style={[styles.cluster, { borderColor: color, width: outer, height: outer, borderRadius: outer / 2, transform: [{ scale }] }]}> 
      <View style={[styles.clusterInner, { backgroundColor: color, width: inner, height: inner, borderRadius: inner / 2 }]}> 
        <Text style={styles.clusterText}>{count}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cluster: { borderWidth: 3, alignItems: "center", justifyContent: "center", backgroundColor: "#00000099" },
  clusterInner: { alignItems: "center", justifyContent: "center" },
  clusterText: { color: "#fff", fontWeight: "700" },
});
