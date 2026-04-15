const buildId = process.env.BUILD_ID;

const isDev = process.env.NODE_ENV !== "production";
const revalidationFrequency = isDev ? 30 : 3600;

export const fetchStyles = async (pathToFetch: string): Promise<void> => {
  const body = JSON.stringify({ path: pathToFetch });
  const options = { method: "PUT", body, next: { revalidate: revalidationFrequency } };
  const ending = buildId ? `?build-id=${buildId}` : "";
  await fetch(`/api/ab-styles${ending}`, options);
};
