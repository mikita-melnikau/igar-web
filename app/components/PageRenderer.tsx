import { notFound } from "next/navigation";
import { AppSafeContent } from "@/app/components/content";
import { fetchPageData } from "@/app/lib/page-data";
import { AppHeader } from "@/app/components/Header/header";

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
      {links?.map((link, index) => (
        <link key={index} rel={link.rel} href={link.href} type={link.type} />
      ))}

      <AppHeader headerNavbar={headerNavbar} />
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
};
