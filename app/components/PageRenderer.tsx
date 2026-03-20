import Script from "next/script";
import { notFound } from "next/navigation";
import { AppSafeContent } from "@/app/components/content";
import { fetchPageData } from "@/app/lib/page-data";

export const PageRenderer = async () => {
  const { content, links, scripts } = await fetchPageData("/");

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
          <Script key={index} src={script.src} strategy="afterInteractive" />
        ) : (
          <Script
            key={index}
            id={`inline-script-${index}`}
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: script.innerHTML || "" }}
          />
        ),
      )}
    </>
  );
};
