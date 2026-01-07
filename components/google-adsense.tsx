import React, { useEffect } from "react";
import { Platform } from "react-native";

interface GoogleAdSenseProps {
  /**
   * AdSense client ID (e.g., "ca-pub-2991936078376292")
   */
  client: string;
  /**
   * Ad slot ID (optional)
   */
  slot?: string;
  /**
   * Ad format (default: "auto")
   */
  format?: string;
  /**
   * Whether the ad is responsive (default: true)
   */
  responsive?: boolean;
}

/**
 * Google AdSense component for web platform only.
 * This component will not render on native platforms (iOS/Android).
 */
export function GoogleAdSense({
  client,
  slot,
  format = "auto",
  responsive = true,
}: GoogleAdSenseProps): React.ReactElement | null {
  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error("AdSense error:", error);
      }
    }
  }, []);

  // Only render on web platform
  if (Platform.OS !== "web") {
    return null;
  }

  return (
    <ins
      className="adsbygoogle"
      style={{
        display: "block",
        textAlign: "center",
      }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}
