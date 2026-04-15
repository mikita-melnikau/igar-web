"use client";

import { useEffect } from "react";
import { fetchStyles } from "@/src/lib/client/page-styles";

interface PartnersCssLoaderProps {
  href: string;
}

export const PartnersCssLoader = ({ href }: PartnersCssLoaderProps) => {
  useEffect(() => {
    async function run() {
      try {
        await fetchStyles(href);
      } catch (e) {
        console.error("CSS replace failed:", href, e);
      }
    }
    run();
  }, []);
  return null;
};
