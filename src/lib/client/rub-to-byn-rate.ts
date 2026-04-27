export async function getRubToBynRate(): Promise<number> {
  const url = "https://api.nbrb.by/exrates/rates/RUB?parammode=2";
  const res = await fetch(url, {
    next: { revalidate: 60 * 60 }, // 1 hour
  });

  if (!res.ok) {
    throw new Error(`NBRB request failed: ${res.status}`);
  }

  const data: {
    Cur_ID: number;
    Cur_Abbreviation: string;
    Cur_Scale: number;
    Cur_OfficialRate: number;
  } = await res.json();

  if (!data.Cur_OfficialRate || !data.Cur_Scale) {
    throw new Error("Invalid NBRB response");
  }

  // Например, если 100 RUB = 3.7003 BYN,
  // то 1 RUB = 3.7003 / 100
  return data.Cur_OfficialRate / data.Cur_Scale;
}
