import { logger } from "@/src/lib/api/logger";
import type { FileCacheService as FileCacheServiceImpl } from "../FileCacheService/file-cache.service";

export class InFlightStylesService {
  private inFlight: Promise<void> | null = null;
  private nextFetchIn: number = Date.now();

  constructor(private readonly fileCache: FileCacheServiceImpl) {}

  /**
   * Function to fetch and store data
   * @param pathFromBody
   */
  public async fetch(pathFromBody: string): Promise<void> {
    const now = Date.now();
    if (now < this.nextFetchIn) {
      return;
    }
    const logInfo = `[Fetch][Partners_Css]`;
    try {
      if (this.inFlight) {
        return await this.inFlight;
      }
      const composition = async () => {
        logger.info(`${logInfo} Request has started`);
        const styles = await this.fetchContent(pathFromBody);
        const sanitized = this.sanitizeCss(styles);
        await this.fileCache.savePartnersStyles(sanitized);
      };
      const promise = composition();
      this.inFlight = promise;
      this.nextFetchIn = now + 24 * 60 * 1000;

      await promise.finally(() => {
        this.inFlight = null;
      });
    } catch (error: unknown) {
      logger.error(`${logInfo} Failed`, error);
    }
  }

  private async fetchContent(pathToFetch: string): Promise<string> {
    const result = await fetch(pathToFetch, {
      headers: {
        accept: "text/css,*/*;q=0.1",
        "accept-language": "en-US,en;q=0.9,ru;q=0.8,pl;q=0.7,uk;q=0.6,de;q=0.5",
        "cache-control": "no-cache",
        pragma: "no-cache",
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

  private sanitizeCss(css: string) {
    return css
      .replace(/@font-face\s*{[\s\S]*?}\s*/gi, "")
      .replace(/font-family\s*:\s*['"]Roboto['"]/gi, "font-family: var(--font-roboto)")
      .replace(/font-family\s*:\s*['"]Montserrat['"]/gi, "font-family: var(--font-montserrat)");
  }
}
