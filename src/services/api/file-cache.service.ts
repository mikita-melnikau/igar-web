import { existsSync } from "node:fs";
import { join } from "path";
import { readFile, writeFile } from "fs/promises";
import { logger } from "@/src/lib/api/logger";
import type { CachedScript, ContentResponse, HeadLink, PageMetadata } from "@/src/types";

type FileCacheStorePayload = {
  pathFromBody: string;
  data: ContentResponse;
  isNewCache?: boolean;
  isHeaderUpdate?: boolean;
};

export class FileCacheService {
  private CACHE_DIR = join(process.cwd(), "cache");

  get headerFile(): string {
    return join(this.CACHE_DIR, "header.html");
  }

  private getCacheFilePath(path: string): string {
    const [pagePath, pageQuery] = path.split("?");
    const [pagePathNoHast] = pagePath.split("#");
    const pagePathNoSlashes = pagePathNoHast.replace(/^\/|\/$/g, "");
    if (!pagePathNoSlashes) {
      return join(this.CACHE_DIR, "HOMEPAGE");
    }
    const p = pagePathNoSlashes.replaceAll("/", "___");
    if (!pageQuery) {
      return join(this.CACHE_DIR, encodeURIComponent(p));
    }
    const pagination = pageQuery.split("&").find((p) => p.startsWith("p="));
    if (!pagination) {
      return join(this.CACHE_DIR, encodeURIComponent(p));
    }
    const paginationValue = pagination.replace("p=", "");
    if (!/^\d+$/.test(paginationValue)) {
      return join(this.CACHE_DIR, encodeURIComponent(p));
    }
    return join(this.CACHE_DIR, encodeURIComponent(`${p}_-_-_query-page---${paginationValue}`));
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

  public async store({ data, pathFromBody, isNewCache, isHeaderUpdate }: FileCacheStorePayload): Promise<void> {
    const cacheFiles = this.generateFileMap(pathFromBody);
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
      logger.info(`💾 Files for: "${pathFromBody}"`);
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

  /* ======================
     Unit tests
  ====================== */

  public _unitTests() {
    if (process.env.NODE_ENV !== "test") {
      throw new Error("Unit tests only = available in test environment");
    }
    return {
      getCacheFilePath: this.getCacheFilePath.bind(this),
    };
  }
}
