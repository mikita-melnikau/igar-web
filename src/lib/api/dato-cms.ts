type DatoResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export async function fetchDato<T>(query: string): Promise<T> {
  const token = process.env.DATO_CMS_API_TOKEN;

  if (!token) {
    throw new Error("DATO_CMS_API_TOKEN is not set");
  }

  const res = await fetch("https://graphql.datocms.com/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`DatoCMS request failed: ${res.status}`);
  }

  const json = (await res.json()) as DatoResponse<T>;

  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join(", "));
  }

  if (!json.data) {
    throw new Error("DatoCMS returned no data");
  }

  return json.data;
}
