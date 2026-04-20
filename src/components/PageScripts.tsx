"use client";

import Script from "next/script";
import type { CachedScript } from "@/src/types";

export const AppPageScripts = ({ scripts }: { scripts: CachedScript[] }) => {
  if (!scripts?.length) return null;

  return (
    <>
      {scripts.map((script, index) =>
        script.innerHTML ? (
          <Script
            key={`inline-${index}`}
            id={`inline-${index}`}
            async={script.async}
            dangerouslySetInnerHTML={{ __html: script.innerHTML }}
            strategy="lazyOnload"
            onError={(e) => console.error("Inline script failed", e)}
          />
        ) : (
          <Script
            key={script.src ?? index}
            src={script.src}
            async={script.async}
            onError={(e) => console.error(`Script ${script.src.slice(0, 40)} failed`, e)}
            strategy={script.defer ? "lazyOnload" : "afterInteractive"}
          />
        ),
      )}
    </>
  );
};
