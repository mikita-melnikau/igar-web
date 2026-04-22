import { config } from "@/config";
import { logger } from "@/src/lib/api/logger";
import type { ContentResponse } from "@/src/types";
import type { FileCacheService as FileCacheServiceImpl } from "./file-cache.service";
import type { ContentService as ContentServiceImpl } from "./content.service";

export class InFlightRequestService {
  private readonly inFlight = new Map<string, Promise<ContentResponse>>();
  private nextHeaderUpdateTs = 0;

  constructor(
    private readonly fileCache: FileCacheServiceImpl,
    private readonly contentService: ContentServiceImpl,
  ) {}

  private getCacheKey(path: string): string {
    const pathToFetch = path ?? "/";
    return !pathToFetch || pathToFetch === "/" ? "___" : pathToFetch;
  }

  private getCachedHeader(cachedHeader?: string) {
    if (!cachedHeader) {
      return cachedHeader;
    }
    const now = Date.now();
    if (this.nextHeaderUpdateTs < now) {
      this.nextHeaderUpdateTs = 24 * 60 * 60 * 1000 + now;
      return;
    }
    return cachedHeader;
  }

  private async fetchContent(pathToFetch: string): Promise<string> {
    const p = pathToFetch || "";
    const pageAddress = config.SOURCE_WEBSITE + p;
    const result = await fetch(pageAddress, {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      },
    });
    if (result.status === 404) {
      throw new Error("Page not found (404 response)");
    }
    if (!result.ok) {
      throw new Error(`Failed to fetch (result !== ok): ${result.statusText}`);
    }
    return await result.text();
  }

  /**
   * Function to fetch and store data
   * @param pathFromBody
   * @param cachedValue - is analogue of "can skip"
   */
  public async fetch(pathFromBody: string, cachedValue?: ContentResponse): Promise<ContentResponse> {
    const key = this.getCacheKey(pathFromBody);
    const existing = this.inFlight.get(key);
    if (existing && cachedValue) {
      return cachedValue;
    }
    const logEndpoint = !pathFromBody || pathFromBody === "/" ? "Главная страница" : pathFromBody;
    const logIsCached = cachedValue ? "Cached" : "New_Endpoint";
    const logInfo = `[Fetch][Content][${logIsCached}] Endpoint: "${logEndpoint}".`;
    try {
      if (existing) {
        return await existing;
      }
      const composition = async () => {
        logger.info(`${logInfo} Request started`, { endpoint: logEndpoint, cache: logIsCached });
        const html = await this.fetchContent(pathFromBody);
        const cachedHeader = this.getCachedHeader(cachedValue?.headerNavbar);
        const content = this.contentService.parseHtml(html, cachedHeader);
        await this.fileCache.store(pathFromBody, content, !cachedHeader);
        return content;
      };
      const promise = composition();
      this.inFlight.set(key, promise);
      return await promise.finally(() => this.inFlight.delete(key));
    } catch (error: unknown) {
      logger.error(`${logInfo} Fetch error`, error);
      if (cachedValue) {
        return cachedValue;
      }
      throw error;
    }
  }
}
