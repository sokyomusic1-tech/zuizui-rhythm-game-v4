import { useEffect } from "react";
import { Platform } from "react-native";

/**
 * Component to inject Google AdSense script into the HTML head.
 * Only works on web platform.
 */
export function AdSenseHead() {
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      // Check if script already exists
      const existingScript = document.querySelector(
        'script[src*="adsbygoogle.js"]'
      );

      if (!existingScript) {
        const script = document.createElement("script");
        script.src =
          "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2991936078376292";
        script.async = true;
        script.crossOrigin = "anonymous";
        document.head.appendChild(script);
      }
    }
  }, []);

  return null;
}
