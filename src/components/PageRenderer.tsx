import { notFound } from "next/navigation";
import { fetchPageData } from "@/src/lib/client/page-data";
import { PartnersCssLoader } from "@/src/components/PartnersCssLoader";
import { AppPageScripts } from "./PageScripts";
import { AppHeader } from "./Header/header";
import { AppSafeContent } from "./content";

interface PageRendererProps {
  path: string;
}

export const PageRenderer = async ({ path }: PageRendererProps) => {
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

      <AppHeader headerNavbar={headerNavbar} />
      <AppSafeContent html={content} />
      <AppPageScripts scripts={scripts} />
    </>
  );
};
