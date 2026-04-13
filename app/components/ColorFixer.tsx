"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { config } from "@/config";

/**
 * Component to collect all nuxt css styles
 * NOTE: You must set "?ab=15" in page address
 */
export const ColorFixer = () => {
  const sentRef = useRef(false);

  const redirectDelaySec = useMemo(() => {
    if (typeof window === "undefined") return null;
    const url = new URL(window.location.href);
    const rawDelay = url.searchParams.get("ab");
    const parsed = Number(rawDelay);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return parsed;
  }, []);

  const [secondsLeft, setSecondsLeft] = useState<number | null>(redirectDelaySec);

  useEffect(() => {
    if (typeof window === "undefined" || sentRef.current || !redirectDelaySec) {
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        const baseUrl = config.SOURCE_WEBSITE;
        const scripts = Array.from(document.querySelectorAll("script"));
        const nextCssSet = new Set<string>();
        scripts.forEach((script) => {
          const content = script.textContent || "";
          const normalized = content.replace(/\\\//g, "/");
          const matches = normalized.match(/\/_next\/static\/css\/[^"'\\\s)]+\.css/g) || [];
          matches.forEach((m) => nextCssSet.add(baseUrl + m.split("?")[0]));
        });
        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
        links
          .map((link) => link.href)
          .filter((href) => href.includes("/_next/static/css") || href.includes("local/templates"))
          .forEach((link) => nextCssSet.add(link.split("?")[0]));
        const nextCss = [...nextCssSet];
        if (!nextCss.length) {
          window.alert(`Css Collector: CSS не найдены`);
          return;
        }
        await fetch("/api/css-collect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            hrefs: nextCss,
            pageUrl: window.location.href,
          }),
        });

        const url = new URL(window.location.href);
        const params = url.searchParams;
        params.delete("ab");
        const newUrl = url.pathname + (params.toString() ? `?${params.toString()}` : "");
        window.location.replace(newUrl);
      } catch (error) {
        console.error("Failed to collect partner css", error);
      }
    }, redirectDelaySec * 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [redirectDelaySec]);

  useEffect(() => {
    if (redirectDelaySec == null) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev == null) return null;
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [redirectDelaySec]);

  return secondsLeft ? <div style={bannerStyle}>Сборка CSS. Перезагрузка через {secondsLeft} сек.</div> : null;
};

const bannerStyle: React.CSSProperties = {
  position: "fixed",
  right: 16,
  bottom: 16,
  zIndex: 9999,
  padding: "12px 16px",
  borderRadius: 12,
  background: "#111",
  color: "#fff",
  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
  fontSize: 14,
};
