import { FileCacheService } from "./FileCacheService/file-cache.service";
import { InFlightStylesService } from "./in-flight-styles.service";
import type { FileCacheService as FileCacheServiceImpl } from "./FileCacheService/file-cache.service";
import type { InFlightStylesService as InFlightStylesServiceImpl } from "./in-flight-styles.service";

class PartnersStylesService {
  constructor(
    private readonly fileCache: FileCacheServiceImpl,
    private readonly inFlightRequest: InFlightStylesServiceImpl,
  ) {}

  isNotGlobalStylesCheck(pathFromBody: string) {
    return !/style\.bundle\.css/.test(pathFromBody);
  }

  fetch(pathFromBody: string): Promise<void> {
    return this.inFlightRequest.fetch(pathFromBody);
  }
}

const globalForServices = globalThis as typeof globalThis & {
  partnersStylesService?: PartnersStylesService;
};

// singleton
export const partnersStylesService =
  globalForServices.partnersStylesService ??
  (() => {
    const cacheService = new FileCacheService();
    const inFlightRequestService = new InFlightStylesService(cacheService);
    const service = new PartnersStylesService(cacheService, inFlightRequestService);

    globalForServices.partnersStylesService = service;
    return service;
  })();
