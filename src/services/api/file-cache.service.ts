import { existsSync } from "node:fs";
import { join } from "path";
import { readFile, writeFile } from "fs/promises";
import { logger } from "@/src/lib/api/logger";
import type { CachedScript, ContentResponse, HeadLink, PageMetadata, PagePathWithKey } from "@/src/types";

type FileCacheStorePayload = {
  pathWithKey: PagePathWithKey;
  data: ContentResponse;
  isNewCache?: boolean;
  isHeaderUpdate?: boolean;
};

export class FileCacheService {
  private CACHE_DIR = join(process.cwd(), "cache");

  get headerFile(): string {
    return join(this.CACHE_DIR, "__header.html");
  }

  private generateFileMap(pathWithKey: PagePathWithKey) {
    const cacheFilePath = join(this.CACHE_DIR, pathWithKey.cacheKey);
    return {
      html: cacheFilePath + ".html",
      meta: cacheFilePath + ".json",
      links: cacheFilePath + ".links.json",
      scripts: cacheFilePath + ".scripts.json",
    };
  }

  public async get(pathFromBody: PagePathWithKey): Promise<ContentResponse | null> {
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

  public async store({ data, pathWithKey, isNewCache, isHeaderUpdate }: FileCacheStorePayload): Promise<void> {
    const cacheFiles = this.generateFileMap(pathWithKey);
    await Promise.all([
      writeFile(cacheFiles.html, data.content, "utf-8"),
      writeFile(cacheFiles.meta, JSON.stringify(data.meta), "utf-8"),
      writeFile(cacheFiles.links, JSON.stringify(data.links), "utf-8"),
      writeFile(cacheFiles.scripts, JSON.stringify(data.scripts), "utf-8"),
    ]);
    if (isHeaderUpdate || !existsSync(this.headerFile)) {
      await writeFile(this.headerFile, data.headerNavbar, "utf-8");
      logger.info("🚧 New header has been saved.");
    }
    if (isNewCache) {
      logger.info(`💾 Files for: "${pathWithKey.initialPath}"`, { pathWithKey });
    }
  }

  /* ======================
     CSS
  ====================== */

  private PUBLIC_DIR = join(process.cwd(), "public", "ab-market");

  private get partnersStylesFile(): string {
    return join(this.PUBLIC_DIR, "partners.bundle.css");
  }

  public async savePartnersStyles(css: string): Promise<void> {
    await writeFile(this.partnersStylesFile, css, "utf-8");
  }
}
