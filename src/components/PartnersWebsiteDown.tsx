import { formatPhoneBY } from "@/src/helpers/shared/contacts";
import type { PublicCmsData } from "@/src/types";

interface PartnersWebsiteDownProps {
  cms?: PublicCmsData;
}

export const PartnersWebsiteDown = ({ cms }: PartnersWebsiteDownProps) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
    <div className="max-w-xl">
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">На сайте проводятся технические работы</h1>
      <p className="text-gray-600 text-lg">Попробуйте зайти позже.</p>
    </div>

    {cms && (
      <div className="max-w-xl mt-10 p-6 bg-white rounded-2xl shadow-md">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-3">{cms.content.partnersSiteDeadTitle}</h2>
        <p className="text-gray-700 text-lg">
          Позвоните по номеру{" "}
          <a href={"tel:" + cms.contact.phone} className="text-blue-600 font-semibold underline hover:text-blue-700">
            {formatPhoneBY(cms.contact.phone)}
          </a>{" "}
          — мы вам поможем!
        </p>
      </div>
    )}
  </div>
);
