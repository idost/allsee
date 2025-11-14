import React from "react";
import { Redirect } from "expo-router";

// Native index route redirects to Map route without importing native modules here
export default function IndexNativeRedirect() {
  return <Redirect href="/(tabs)/map" />;
}
