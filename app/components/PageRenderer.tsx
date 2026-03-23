import { notFound } from "next/navigation";
import { AppSafeContent } from "@/app/components/content";
import { fetchPageData } from "@/app/lib/page-data";

interface PageRendererProps {
  path: string;
}

export const PageRenderer = async ({ path }: PageRendererProps) => {
  const { content, links, scripts } = await fetchPageData(path);

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
};
