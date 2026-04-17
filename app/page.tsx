import { PageRenderer } from "@/src/components/PageRenderer";
import { setPageMeta } from "@/src/lib/client/page-meta";
import type { PageProps } from "@/src/lib/client/page-meta";
import type { Metadata } from "next";

export async function generateMetadata(pageProps: PageProps): Promise<Metadata> {
  return setPageMeta(pageProps);
}

const PageComponent = async () => {
  return <PageRenderer path={"/kovrolin"} />;
};

export default PageComponent;
