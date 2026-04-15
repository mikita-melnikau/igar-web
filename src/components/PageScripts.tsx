"use client";

import Script from "next/script";
import type { CachedScript } from "@/src/types";

export const AppPageScripts = ({ scripts }: { scripts: CachedScript[] }) => {
  if (!scripts?.length) return null;

  return (
    <>
      {scripts.map((script, index) =>
        script.src ? (
          <Script key={script.src ?? index} src={script.src} async={script.async} defer={script.defer} />
        ) : (
          <script
            key={`inline-${index}`}
            async={script.async}
            defer={script.defer}
            dangerouslySetInnerHTML={{ __html: script.innerHTML }}
          />
        ),
      )}
    </>
  );
};
