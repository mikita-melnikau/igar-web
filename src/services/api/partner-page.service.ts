import { headlessCms } from "@/src/services/api/headless-cms.service";
import { FileCacheService } from "./file-cache.service";
import { InFlightRequestService } from "./in-flight-request.service";
import { ContentService } from "./content.service";
import type { InFlightRequestService as InFlightRequestServiceImpl } from "./in-flight-request.service";
import type { FileCacheService as FileCacheServiceImpl } from "./file-cache.service";
import type { ContentResponse } from "@/src/types";

export class PartnersPageService {
  constructor(
    private readonly fileCache: FileCacheServiceImpl,
    private readonly inFlightRequest: InFlightRequestServiceImpl,
  ) {}

  async fetch(pathFromBody: string): Promise<ContentResponse> {
    const transformedPath = this.pathTransformer(pathFromBody);
    const cachedResult = await this.fileCache.get(transformedPath);
    if (cachedResult) {
      this.inFlightRequest.fetch(transformedPath, cachedResult); // @IMPORTANT: No await!
      return cachedResult;
    }
    return await this.inFlightRequest.fetch(transformedPath);
  }

  private pathTransformer(path: string) {
    const isHomepage = !path || path === "/";
    if (headlessCms.data.settings.homepageLink && isHomepage) {
      return headlessCms.data.settings.homepageLink.url;
    }
    if (isHomepage) {
      return "/";
    }
    return path.split("?")[0];
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
    const contentService = new ContentService();
    const inFlightRequestService = new InFlightRequestService(cacheService, contentService);
    const service = new PartnersPageService(cacheService, inFlightRequestService);

    globalForServices.partnerPageService = service;
    return service;
  })();
