import Script from "next/script";
import { notFound } from "next/navigation";
import { AppSafeContent } from "@/app/components/content";
import { getSsrBaseUrl } from "@/app/helpers/request.helpers";
import type { ContentResponse } from "@/app/types";
import type { Metadata, ResolvingMetadata } from "next";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const isDev = process.env.NODE_ENV !== "production";
const revalidationFrequency = isDev ? 30 : 3600;

const fetchPageData = async (pathToFetch: string): Promise<ContentResponse> => {
  const body = JSON.stringify({ path: pathToFetch });
  const options = { method: "PUT", body, next: { revalidate: revalidationFrequency } };
  const baseUrl = await getSsrBaseUrl();
  const response = await fetch(`${baseUrl}/api/content`, options);
  return response.json();
};

export async function generateMetadata({ searchParams }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const sp = await searchParams;
  const pathname = "/";

  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(sp)) {
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
}

export const PageRenderer = async () => {
  const { content, links, scripts } = await fetchPageData("/");

  if (!content) {
    return notFound();
  }

  return (
    <>
      {links?.map((link, index) => (
        <link key={index} rel={link.rel} href={link.href} type={link.type} />
      ))}

      <AppSafeContent html={content} />

      {scripts?.map((script, index) =>
        script.src ? (
          <Script key={index} src={script.src} strategy="afterInteractive" />
        ) : (
          <Script
            key={index}
            id={`inline-script-${index}`}
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: script.innerHTML || "" }}
          />
        ),
      )}
    </>
  );
};
