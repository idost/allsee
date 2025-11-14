import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// WebRTC WHIP types and functions
type WhipClient = any;

// Platform-specific imports
let createWhipClient: any;
let connectWhipClient: any;
let disconnectWhipClient: any;
let getCameras: any;
let selectCamera: any;
let WhipClientView: any;

if (Platform.OS !== "web") {
  try {
    const whipModule = require("react-native-whip-whep");
    createWhipClient = whipModule.createWhipClient;
    connectWhipClient = whipModule.connectWhipClient;
    disconnectWhipClient = whipModule.disconnectWhipClient;
    getCameras = whipModule.getCameras;
    selectCamera = whipModule.selectCamera;
    WhipClientView = whipModule.WhipClientView;
  } catch (e) {
    console.log("react-native-whip-whep not available:", e);
  }
}

type LiveBroadcasterProps = {
  whipUrl: string;
  onStreamingChange?: (isStreaming: boolean) => void;
  cameraPreference?: "front" | "back";
};

export default function LiveBroadcaster({
  whipUrl,
  onStreamingChange,
  cameraPreference = "back",
}: LiveBroadcasterProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const whipClientRef = useRef<WhipClient | null>(null);

  // Check if WebRTC is available
  const isWebRTCAvailable = Platform.OS !== "web" && !!createWhipClient;

  useEffect(() => {
    if (!isWebRTCAvailable) return;

    // Fetch available cameras
    const fetchCameras = async () => {
      try {
        const cameraList = await getCameras();
        setCameras(cameraList);
        
        // Select preferred camera
        if (cameraList.length > 0) {
          const preferredCam = cameraList.find((c: any) => 
            cameraPreference === "front" 
              ? c.facing === "front" || c.position === "front"
              : c.facing === "back" || c.position === "back"
          );
          setSelectedCamera((preferredCam || cameraList[0]).id);
        }
      } catch (error) {
        console.error("Failed to get cameras:", error);
      }
    };

    fetchCameras();
  }, [cameraPreference, isWebRTCAvailable]);

  const startStreaming = async () => {
    if (!selectedCamera || !whipUrl) {
      Alert.alert("Error", "No camera selected or WHIP URL missing");
      return;
    }

    try {
      setIsConnecting(true);

      // Create WHIP client
      const client = await createWhipClient(whipUrl, {
        audio: true,
        video: true,
        cameraId: selectedCamera,
      });

      whipClientRef.current = client;

      // Connect to WHIP endpoint
      await connectWhipClient(client);
      setIsStreaming(true);
      onStreamingChange?.(true);
    } catch (error: any) {
      console.error("Failed to start streaming:", error);
      Alert.alert("Streaming Error", error.message || "Failed to start stream");
    } finally {
      setIsConnecting(false);
    }
  };

  const stopStreaming = async () => {
    if (whipClientRef.current) {
      try {
        await disconnectWhipClient(whipClientRef.current);
        setIsStreaming(false);
        onStreamingChange?.(false);
        whipClientRef.current = null;
      } catch (error) {
        console.error("Failed to stop streaming:", error);
      }
    }
  };

  const switchCamera = async () => {
    if (!whipClientRef.current || cameras.length < 2) return;

    const currentIndex = cameras.findIndex((c) => c.id === selectedCamera);
    const nextCamera = cameras[(currentIndex + 1) % cameras.length];
    setSelectedCamera(nextCamera.id);
    
    try {
      await selectCamera(whipClientRef.current, nextCamera.id);
    } catch (error) {
      console.error("Failed to switch camera:", error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (whipClientRef.current) {
        disconnectWhipClient(whipClientRef.current).catch(console.error);
      }
    };
  }, []);

  if (!isWebRTCAvailable) {
    return (
      <View style={styles.fallback}>
        <Ionicons name="warning-outline" size={48} color="#FF4D4D" />
        <Text style={styles.fallbackText}>
          Live streaming requires a native device.{"\n"}
          Please use Expo Go or a dev build on iOS/Android.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera Preview */}
      <View style={styles.previewContainer}>
        {WhipClientView && isStreaming ? (
          <WhipClientView style={styles.preview} />
        ) : (
          <View style={[styles.preview, styles.previewPlaceholder]}>
            <Ionicons name="videocam-outline" size={64} color="#4D9FFF" />
            <Text style={styles.previewText}>Camera will appear here</Text>
          </View>
        )}

        {/* Live Indicator */}
        {isStreaming && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}

        {/* Camera Controls Overlay */}
        {isStreaming && cameras.length > 1 && (
          <TouchableOpacity style={styles.flipButton} onPress={switchCamera}>
            <Ionicons name="camera-reverse-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Streaming Controls */}
      <View style={styles.controls}>
        {!isStreaming ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={startStreaming}
            disabled={isConnecting || !selectedCamera}
          >
            {isConnecting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="radio" size={24} color="#FFFFFF" />
                <Text style={styles.startButtonText}>Go Live</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopButton} onPress={stopStreaming}>
            <Ionicons name="stop" size={24} color="#FFFFFF" />
            <Text style={styles.stopButtonText}>End Stream</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#0A0A0A",
  },
  fallbackText: {
    color: "#A0A0A0",
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 24,
  },
  previewContainer: {
    flex: 1,
    position: "relative",
  },
  preview: {
    flex: 1,
    backgroundColor: "#000000",
  },
  previewPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  previewText: {
    color: "#A0A0A0",
    fontSize: 16,
    marginTop: 16,
  },
  liveIndicator: {
    position: "absolute",
    top: 20,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF0000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  liveText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  flipButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#00000088",
    justifyContent: "center",
    alignItems: "center",
  },
  controls: {
    padding: 20,
    backgroundColor: "#0A0A0A",
  },
  startButton: {
    flexDirection: "row",
    backgroundColor: "#4D9FFF",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  stopButton: {
    flexDirection: "row",
    backgroundColor: "#FF4D4D",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  stopButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
