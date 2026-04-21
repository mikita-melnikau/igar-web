import { existsSync } from "node:fs";
import { join } from "path";
import { readFile, writeFile } from "fs/promises";
import { logger } from "@/src/lib/api/logger";
import type { CachedScript, ContentResponse, HeadLink, PageMetadata } from "@/src/types";

export class FileCacheService {
  private CACHE_DIR = join(process.cwd(), "cache");
  private nextHeaderUpdateTs = 0;

  get headerFile(): string {
    return join(this.CACHE_DIR, "header.html");
  }

  private getCacheFilePath(path: string): string {
    const pathToFetch = path ?? "/";
    const fileName = !pathToFetch || pathToFetch === "/" ? "___" : pathToFetch;
    return join(this.CACHE_DIR, encodeURIComponent(fileName));
  }

  private generateFileMap(pathFromBody: string) {
    const cacheFilePath = this.getCacheFilePath(pathFromBody);
    return {
      html: cacheFilePath + ".html",
      meta: cacheFilePath + ".json",
      links: cacheFilePath + ".links.json",
      scripts: cacheFilePath + ".scripts.json",
    };
  }

  public async get(pathFromBody: string): Promise<ContentResponse | null> {
    const cacheFiles = this.generateFileMap(pathFromBody);
    const cacheFilesArray = Object.values(cacheFiles);
    const isCached = cacheFilesArray.every((cacheFile) => existsSync(cacheFile));
    if (!isCached) {
      return null;
    }
    if (existsSync(this.headerFile)) {
      cacheFilesArray.push(this.headerFile);
    }
    try {
      const readFileContent = cacheFilesArray.map((cacheFile) => readFile(cacheFile, "utf-8"));
      const [content, metaString, linksString, scriptsString, header] = await Promise.all(readFileContent);
      const meta = JSON.parse(metaString) as PageMetadata;
      const links = JSON.parse(linksString) as HeadLink[];
      const scripts = JSON.parse(scriptsString) as CachedScript[];
      const headerNavbar = header || "";
      return { content, meta, links, scripts, headerNavbar };
    } catch (error) {
      logger.error(`[Cache] Read cache error`, error);
      return null;
    }
  }

  public async store(pathFromBody: string, data: ContentResponse): Promise<void> {
    const cacheFiles = this.generateFileMap(pathFromBody);
    await Promise.all([
      writeFile(cacheFiles.html, data.content, "utf-8"),
      writeFile(cacheFiles.meta, JSON.stringify(data.meta), "utf-8"),
      writeFile(cacheFiles.links, JSON.stringify(data.links), "utf-8"),
      writeFile(cacheFiles.scripts, JSON.stringify(data.scripts), "utf-8"),
    ]);
    const now = Date.now();
    if (!existsSync(this.headerFile) || this.nextHeaderUpdateTs < now) {
      await writeFile(this.headerFile, data.headerNavbar, "utf-8");
      this.nextHeaderUpdateTs = 24 * 60 * 60 * 1000 + now;
    }
  }

  /* ======================
     CSS
  ====================== */

  private PUBLIC_DIR = join(process.cwd(), "public", "ab-market");

  get partnersStylesFile(): string {
    return join(this.PUBLIC_DIR, "partners.bundle.css");
  }

  public async savePartnersStyles(css: string): Promise<void> {
    await writeFile(this.partnersStylesFile, css, "utf-8");
  }
}
