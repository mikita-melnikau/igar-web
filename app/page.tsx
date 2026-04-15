import { headers } from "next/headers";
import { PageRenderer } from "@/src/components/PageRenderer";
import { setPageMeta } from "@/src/lib/client/page-meta";
import type { PageProps } from "@/src/lib/client/page-meta";
import type { Metadata } from "next";

export async function generateMetadata(pageProps: PageProps): Promise<Metadata> {
  return setPageMeta(pageProps);
}

const PageComponent = async () => {
  const h = await headers();
  const currentUrl = h.get("x-url") ?? "";

  return <PageRenderer path={currentUrl} />;
};

export default PageComponent;
