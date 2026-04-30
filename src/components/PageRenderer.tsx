import { fetchCmsData, fetchHeartbeat } from "@/src/lib/client/page-data";
import { PageContent } from "@/src/components/PageContent";
import { PartnersWebsiteDown } from "@/src/components/PartnersWebsiteDown";
import { PriceObserver } from "@/src/components/PriceObserver";
import { getRubToBynRate } from "@/src/lib/client/rub-to-byn-rate";

interface PageRendererProps {
  path: string;
  isInstrumentation: boolean;
}

export const PageRenderer = async ({ path, isInstrumentation }: PageRendererProps) => {
  const cms = await fetchCmsData(isInstrumentation);
  const { ok } = await fetchHeartbeat();
  const rubToBynRate = await getRubToBynRate();
  return ok ? (
    <>
      <PageContent path={path} cms={cms} />
      <PriceObserver rubToBynRate={rubToBynRate} priceMultiplier={cms?.content.priceMultiplier} />
    </>
  ) : (
    <PartnersWebsiteDown cms={cms} />
  );
};
