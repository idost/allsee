import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

export default function ClusterMarker({ count, color }: { count: number; color: string }) {
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

  return (
    <Animated.View style={[styles.cluster, { borderColor: color, transform: [{ scale }] }]}> 
      <View style={[styles.clusterInner, { backgroundColor: color }]}> 
        <Text style={styles.clusterText}>{count}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cluster: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, alignItems: "center", justifyContent: "center", backgroundColor: "#00000099" },
  clusterInner: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  clusterText: { color: "#fff", fontWeight: "700" },
});
