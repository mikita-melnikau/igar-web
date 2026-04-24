import { config } from "@/config";
import { logger } from "@/src/lib/api/logger";
import type { ContentResponse, PagePathWithKey } from "@/src/types";
import type { FileCacheService as FileCacheServiceImpl } from "./file-cache.service";
import type { ContentService as ContentServiceImpl } from "./content.service";

export class InFlightRequestService {
  private readonly inFlight = new Map<string, Promise<ContentResponse>>();
  private readonly nextFetchTsMap: Map<string, number> = new Map();
  private nextFetchInterval = process.env.NODE_ENV === "production" ? 5 * 60 * 1000 : 0;
  private headerUpdateInterval = process.env.NODE_ENV === "production" ? 24 * 60 * 60 * 1000 : 0;
  private nextHeaderUpdateTs = 0;

  constructor(
    private readonly fileCache: FileCacheServiceImpl,
    private readonly contentService: ContentServiceImpl,
  ) {}

  private getCachedHeader(cachedHeader?: string) {
    if (!cachedHeader) {
      return cachedHeader;
    }
    const now = Date.now();
    if (this.nextHeaderUpdateTs < now) {
      this.nextHeaderUpdateTs = this.headerUpdateInterval + now;
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
   * @param pathWithKey
   * @param cachedValue - is analogue of "can skip"
   */
  public async fetch(pathWithKey: PagePathWithKey, cachedValue?: ContentResponse): Promise<ContentResponse> {
    const now = Date.now();
    const nextFetchTs = this.nextFetchTsMap.get(pathWithKey.cacheKey);
    if (cachedValue && nextFetchTs && nextFetchTs > now) {
      return cachedValue;
    }
    const existing = this.inFlight.get(pathWithKey.cacheKey);
    if (existing && cachedValue) {
      return cachedValue;
    }
    const logIsCached = cachedValue ? "Cached" : "New_Endpoint";
    const logInfo = `[Fetch][Content][${logIsCached}] Endpoint: "${pathWithKey.realPath}".`;
    try {
      if (existing) {
        return await existing;
      }
      const composition = async () => {
        const html = await this.fetchContent(pathWithKey.realPath);
        // next logic only for successful fetches
        logger.info(`${logInfo} Successful response > ${pathWithKey.realPath}`, { pathWithKey });
        this.nextFetchTsMap.set(pathWithKey.cacheKey, this.nextFetchInterval + now);
        const cachedHeader = this.getCachedHeader(cachedValue?.headerNavbar);
        const data = this.contentService.parseHtml(html, pathWithKey.realPath, cachedHeader);

        await this.fileCache.store({
          pathWithKey,
          data,
          isNewCache: !cachedValue,
          isHeaderUpdate: !cachedHeader,
        });
        return data;
      };
      const promise = composition();
      this.inFlight.set(pathWithKey.cacheKey, promise);
      return await promise.finally(() => this.inFlight.delete(pathWithKey.cacheKey));
    } catch (error: unknown) {
      logger.error(`${logInfo} Fetch error`, error);
      if (cachedValue) {
        return cachedValue;
      }
      throw error;
    }
  }

  /* ======================
     Unit tests
  ====================== */

  public _unitTests() {
    if (process.env.NODE_ENV !== "test") {
      throw new Error("Unit tests only = available in test environment");
    }
    return {
      getCachedHeader: this.getCachedHeader.bind(this),
      // params:
      nextHeaderUpdateTs: {
        get: () => this.nextHeaderUpdateTs,
        set: (val: number) => (this.nextHeaderUpdateTs = val),
      },
      headerUpdateInterval: {
        set: (val: number) => (this.headerUpdateInterval = val),
      },
    };
  }
}
