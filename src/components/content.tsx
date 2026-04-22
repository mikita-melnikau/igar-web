import React from "react";
import DOMPurify from "isomorphic-dompurify";

export const AppSafeContent = ({ html }: { html: string }) => {
  const clean = DOMPurify.sanitize(html);
  return <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: clean }} />;
};
