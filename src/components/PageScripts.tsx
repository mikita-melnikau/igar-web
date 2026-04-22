"use client";

import type { CachedScript } from "@/src/types";

export const AppPageScripts = ({ scripts }: { scripts: CachedScript[] }) => {
  if (!scripts?.length) return null;

  return scripts?.map((script, index) =>
    script.innerHTML ? (
      <script
        key={index}
        async={script.async}
        defer={script.defer}
        dangerouslySetInnerHTML={{ __html: script.innerHTML }}
      />
    ) : (
      <script key={index} src={script.src} async={script.async} defer={script.defer} />
    ),
  );
};
