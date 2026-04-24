import { PageTransformerService } from "@/src/services/api/page-transformer.service";
import { FileCacheService } from "./file-cache.service";
import { InFlightRequestService } from "./in-flight-request.service";
import { ContentService } from "./content.service";
import type { InFlightRequestService as InFlightRequestServiceImpl } from "./in-flight-request.service";
import type { FileCacheService as FileCacheServiceImpl } from "./file-cache.service";
import type { ContentResponse, PagePathWithKey } from "@/src/types";

export class PartnersPageService {
  constructor(
    private readonly fileCache: FileCacheServiceImpl,
    private readonly inFlightRequest: InFlightRequestServiceImpl,
  ) {}

  async fetch(pathWithKey: PagePathWithKey): Promise<ContentResponse> {
    const cachedResult = await this.fileCache.get(pathWithKey);
    if (cachedResult) {
      this.inFlightRequest.fetch(pathWithKey, cachedResult); // @IMPORTANT: No await!
      return cachedResult;
    }
    return await this.inFlightRequest.fetch(pathWithKey);
  }
}

const globalForServices = globalThis as typeof globalThis & {
  partnerPageService?: PartnersPageService;
};

// singleton
export const partnersPageService =
  globalForServices.partnerPageService ??
  (() => {
    const cacheService = new FileCacheService();
    const pageTransformerService = new PageTransformerService();
    const contentService = new ContentService(pageTransformerService);
    const inFlightRequestService = new InFlightRequestService(cacheService, contentService);
    const service = new PartnersPageService(cacheService, inFlightRequestService);

    globalForServices.partnerPageService = service;
    return service;
  })();
