import { notFound } from "next/navigation";
import { PageRenderer } from "@/src/components/PageRenderer";
import { setPageMeta } from "@/src/lib/client/page-meta";
import { AbQuery } from "@/src/constants";
import type { PageProps } from "@/src/lib/client/page-meta";
import type { Metadata } from "next";
import type { AbMarketPageParams } from "@/src/types";

export async function generateMetadata(pageProps: PageProps): Promise<Metadata> {
  return setPageMeta(pageProps);
}

const PageComponent = async ({ searchParams, params }: AbMarketPageParams) => {
  const sp = await searchParams;
  const { path } = await params;
  if (!path || !path[0] || path[0] === "api") {
    notFound();
  }
  let currentUrl = path.join("/");
  if (Object.keys(sp).length > 0) {
    const query = new URLSearchParams();
    for (const key in searchParams) {
      const value = searchParams[key];
      if (Array.isArray(value)) {
        value.forEach((v) => query.append(key, v));
      } else if (value !== undefined) {
        query.set(key, value);
      }
    }
    currentUrl += "?" + query;
  }
  const isInstrumentation = Boolean(sp[AbQuery]);
  return <PageRenderer path={currentUrl} isInstrumentation={isInstrumentation} />;
};

export default PageComponent;
