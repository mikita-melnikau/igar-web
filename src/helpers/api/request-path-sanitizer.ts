const addSlashIfMissing = (line: string): string => {
  return line.startsWith("/") ? line : "/" + line;
};

export const requestPathSanitizer = (path: string) => {
  const [pagePathNoHash] = path.split("#");
  if (!pagePathNoHash.includes("?")) {
    return addSlashIfMissing(pagePathNoHash);
  }
  const [pagePath, pageQuery] = pagePathNoHash.split("?");
  const pagination = pageQuery.split("&").find((p) => p.startsWith("p=") || p.startsWith("page="));
  if (!pagination) {
    return addSlashIfMissing(pagePath);
  }
  return `${addSlashIfMissing(pagePath)}?${pagination}`;
};
