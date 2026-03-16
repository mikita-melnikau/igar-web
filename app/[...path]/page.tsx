import { notFound } from "next/navigation";
import { AppSafeContent } from "@/app/components/content";
import { getSsrBaseUrl } from "@/app/helpers/request.helpers";
import type { ContentResponse } from "@/app/types";
import type { Metadata, ResolvingMetadata } from "next";

type Props = {
  params: Promise<{ path: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};
const fetchPageData = async (pathToFetch: string): Promise<ContentResponse> => {
  const body = JSON.stringify({ path: pathToFetch });
  const options = { method: "PUT", body };
  const baseUrl = await getSsrBaseUrl();
  const response = await fetch(`${baseUrl}/api/content`, options);
  return response.json();
};

export async function generateMetadata({ params, searchParams }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { path } = await params;
  const sp = await searchParams;

  const pathname = path ? `/${Object.values(path).join("/")}` : "/";
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

export default async function Pages({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const normalizedPaths = path.join("/");
  const { content, links, scripts } = await fetchPageData(`/${normalizedPaths}`);

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
          <script key={index} src={script.src} async={script.async} defer={script.defer} />
        ) : (
          <script
            key={index}
            async={script.async}
            defer={script.defer}
            dangerouslySetInnerHTML={{ __html: script.innerHTML }}
          />
        ),
      )}
    </>
  );
}
