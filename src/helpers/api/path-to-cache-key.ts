export function pathToCacheKey(requestPath: string): string {
  const [pagePath, pageQuery] = requestPath.split("?");
  const pagePathNoSlashes = pagePath.replace(/^\/|\/$/g, "");
  if (!pagePathNoSlashes) {
    return "HOMEPAGE";
  }
  const p = pagePathNoSlashes.replaceAll("/", "___");
  if (!pageQuery) {
    return encodeURIComponent(p);
  }
  const pagination = pageQuery.split("&").find((p) => p.startsWith("p="));
  if (!pagination) {
    return encodeURIComponent(p);
  }
  const paginationValue = pagination.replace("p=", "");
  if (!/^\d+$/.test(paginationValue)) {
    return encodeURIComponent(p);
  }
  return encodeURIComponent(`${p}_-_-_query-page---${paginationValue}`);
}
