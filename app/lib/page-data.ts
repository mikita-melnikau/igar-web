import { getSsrBaseUrl } from "@/app/helpers/request.helpers";
import type { ContentResponse } from "@/app/types";

const isDev = process.env.NODE_ENV !== "production";
const revalidationFrequency = isDev ? 30 : 3600;

export const fetchPageData = async (pathToFetch: string): Promise<ContentResponse> => {
  const body = JSON.stringify({ path: pathToFetch });
  const options = { method: "PUT", body, next: { revalidate: revalidationFrequency } };
  const baseUrl = await getSsrBaseUrl();
  const response = await fetch(`${baseUrl}/api/content`, options);
  return response.json();
};
