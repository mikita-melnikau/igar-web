import { config } from "@/config";
import type { ContentResponse } from "@/src/types";
import type { FileCacheService as FileCacheServiceImpl } from "./file-cache.service";
import type { ContentService as ContentServiceImpl } from "./content.service";

export class InFlightRequestService {
  private readonly inFlight = new Map<string, Promise<ContentResponse>>();

  constructor(
    private readonly fileCache: FileCacheServiceImpl,
    private readonly contentService: ContentServiceImpl,
  ) {}

  private getCacheKey(path: string): string {
    const pathToFetch = path ?? "/";
    return !pathToFetch || pathToFetch === "/" ? "___" : pathToFetch;
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
      console.log(`[Error] ${pageAddress} - ${result.status}`);
      throw new Error("Page not found");
    }
    if (!result.ok) {
      console.log(`[Error] ${pageAddress} - ${result.statusText}`);
      throw new Error(`Failed to fetch: ${result.statusText}`);
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
    if (existing) {
      return await existing;
    }
    const composition = async () => {
      const html = await this.fetchContent(pathFromBody);
      const content = this.contentService.parseHtml(html, cachedValue?.headerNavbar);
      await this.fileCache.store(pathFromBody, content);
      return content;
    };
    const promise = composition();
    this.inFlight.set(key, promise);
    return await promise.finally(() => this.inFlight.delete(key));
  }
}
