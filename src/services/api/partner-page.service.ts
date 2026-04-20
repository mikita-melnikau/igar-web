import { FileCacheService } from "./FileCacheService/file-cache.service";
import { InFlightRequestService } from "./InFlightRequestService/in-flight-request.service";
import { ContentService } from "./ContentService/content.service";
import type { InFlightRequestService as InFlightRequestServiceImpl } from "./InFlightRequestService/in-flight-request.service";
import type { FileCacheService as FileCacheServiceImpl } from "./FileCacheService/file-cache.service";
import type { ContentResponse } from "@/src/types";

class PartnersPageService {
  constructor(
    private readonly fileCache: FileCacheServiceImpl,
    private readonly inFlightRequest: InFlightRequestServiceImpl,
  ) {}

  isNotPageCheck(pathFromBody: string) {
    if (!pathFromBody) {
      return false;
    }
    const parts = pathFromBody.split("/");
    return /\./.test(parts[parts.length - 1]);
  }

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
    return !path || path === "/" ? "/kovrolin/" : path;
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
