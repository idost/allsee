import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

export default function GlowPin({ color = "#00D1FF", size = 16, intensity = 1 }: { color?: string; size?: number; intensity?: number }) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const amp = Math.max(0.6, Math.min(1.4, 0.8 + (intensity || 1) * 0.2));
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: amp, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.35, duration: 800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 0.9, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, scale, intensity]);

  const glowSize = size * 2.4;

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: glowSize,
          height: glowSize,
          borderRadius: glowSize / 2,
          backgroundColor: color,
          opacity,
          transform: [{ scale }],
        }}
      />
      <View style={[styles.core, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  core: { borderWidth: 2, borderColor: "#fff" },
});
