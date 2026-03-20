import { fetchPageData } from "@/app/lib/page-data";
import type { Metadata } from "next";

export type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const setPageMeta = async ({ searchParams }: PageProps): Promise<Metadata> => {
  const sp = await searchParams;
  const pathname = "/";

  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(sp || {})) {
    if (typeof value === "string") {
      filtered[key] = value;
    } else if (Array.isArray(value)) {
      filtered[key] = value.join(",");
    }
  }

  const queryString = new URLSearchParams(filtered).toString();
  const fullUrl = `${pathname}${queryString ? "?" + queryString : ""}`;

  const { meta } = await fetchPageData(fullUrl);

  return {
    title: meta?.title,
    description: meta?.description,
    keywords: meta?.keywords,
  };
};
