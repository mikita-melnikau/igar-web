import { FileCacheService } from "./file-cache.service";
import { InFlightStylesService } from "./in-flight-styles.service";
import type { InFlightStylesService as InFlightStylesServiceImpl } from "./in-flight-styles.service";

export class PartnersStylesService {
  constructor(private readonly inFlightRequest: InFlightStylesServiceImpl) {}

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
    const service = new PartnersStylesService(inFlightRequestService);

    globalForServices.partnersStylesService = service;
    return service;
  })();
