import { headers } from "next/headers";
import { PageRenderer } from "@/src/components/PageRenderer";
import { setPageMeta } from "@/src/lib/client/page-meta";
import { AbQuery } from "@/src/constants";
import type { AbMarketPageParams } from "@/src/types";
import type { PageProps } from "@/src/lib/client/page-meta";
import type { Metadata } from "next";

export async function generateMetadata(pageProps: PageProps): Promise<Metadata> {
  return setPageMeta(pageProps);
}

const PageComponent = async ({ searchParams }: AbMarketPageParams) => {
  const query = await searchParams;
  const isInstrumentation = Boolean(query[AbQuery]);
  const h = await headers();
  const currentUrl = h.get("x-url") ?? "";
  return <PageRenderer path={currentUrl} isInstrumentation={isInstrumentation} />;
};

export default PageComponent;
