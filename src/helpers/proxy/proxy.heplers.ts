export const removeDomain = (url: string) => {
  return url.trim().replace(/^https?:\/\/[^\/]+/, "");
};
