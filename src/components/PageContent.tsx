import { notFound } from "next/navigation";
import { fetchPageData } from "@/src/lib/client/page-data";
import { PartnersCssLoader } from "@/src/components/PartnersCssLoader";
import { AppPageScripts } from "@/src/components/PageScripts";
import { AppFooter } from "@/src/components/Footer";
import { AppHeader } from "./Header/header";
import { AppSafeContent } from "./content";
import type { PublicCmsData } from "@/src/types";

interface PageRendererProps {
  path: string;
  cms?: PublicCmsData;
}

export const PageContent = async ({ path, cms }: PageRendererProps) => {
  const { content, links, scripts, headerNavbar } = await fetchPageData(path);

  if (!content) {
    return notFound();
  }

  return (
    <>
      {links?.map((link, index) =>
        /css\/style\.bundle\.css/.test(link.href) ? (
          <PartnersCssLoader key={index + link.href} href={link.href} />
        ) : (
          <link key={index + link.href} rel={link.rel} href={link.href} type={link.type} />
        ),
      )}

      <AppHeader headerNavbar={headerNavbar} cms={cms} />
      <AppSafeContent html={content} />
      <AppFooter cms={cms} />
      <AppPageScripts scripts={scripts} />
    </>
  );
};
