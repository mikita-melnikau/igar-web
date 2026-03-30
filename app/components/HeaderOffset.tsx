"use client";

import { useEffect } from "react";

export const HeaderOffset = () => {
  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector<HTMLElement>(".header");
      const main = document.querySelector<HTMLElement>(".main");

      if (!header) return;
      if (!main) return;

      const height = header.offsetHeight;
      main.style.setProperty("padding-top", `${height}px`, "important");
    };

    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);

    return () => {
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, []);

  return null;
};
