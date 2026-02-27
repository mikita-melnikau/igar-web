import type { ContentResponse } from "@/app/types";
import type { Metadata, ResolvingMetadata } from "next";
import { AppSafeContent } from "@/app/components/content";

type Props = {
  paramsPromise: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const fetchPageData = async (pathToFetch: string): Promise<ContentResponse> => {
  const body = JSON.stringify({ path: pathToFetch });
  const options = { method: "PUT", body };
  const response = await fetch("http://localhost:3000/api/content", options);
  return response.json();
};

export async function generateMetadata(
  { paramsPromise, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const params = await paramsPromise;
  const sp = await searchParams;

  const pathname = params ? `/${Object.values(params).join("/")}` : "/";

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
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
  };
}

export default async function Pages({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const normalizedPaths = path.join("/");
  const { content, links, scripts } = await fetchPageData(`/${normalizedPaths}`);

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
          <script key={index} async={script.async} defer={script.defer}>
            {script.innerHTML}
          </script>
        ),
      )}
    </>
  );
}
