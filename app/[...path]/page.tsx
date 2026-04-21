import { headers } from "next/headers";
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
  const { path } = await params;
  if (!path || !path[0] || path[0] === "api") {
    return notFound();
  }
  const sp = await searchParams;
  const isInstrumentation = Boolean(sp[AbQuery]);
  const h = await headers();
  const currentUrl = h.get("x-url") ?? "";
  return <PageRenderer path={currentUrl} isInstrumentation={isInstrumentation} />;
};

export default PageComponent;
