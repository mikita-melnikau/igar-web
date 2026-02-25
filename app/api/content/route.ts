import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';
import { NextRequest, NextResponse } from "next/server";
import {ContentResponse} from "@/app/types";

const WEBSITE = "https://velvet-pro.ru"
const CACHE_DIR = join(process.cwd(), 'cache');
const linksFile = join(CACHE_DIR, '_links.json');


const contentFix = (content?: string): string => {
    if (!content) {
        return '';
    }
    return content
        .replace("/россии/gi", "Беларуси")
        .replace("/россия/gi", "Беларусь")
}

const _fetchContent = async (pathToFetch: string, cacheFilePath: string): Promise<ContentResponse> => {
    const res = await fetch(`${WEBSITE}${pathToFetch}`);
    if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.statusText}`);
    }
    const html = await res.text();
    const dom = new JSDOM(html);
    const { window } = dom;
    const { document } = window;

    // links
    const links = document.querySelectorAll('link');
    const linksArray =  Array.from(links).map(link => ({
        rel: link.rel,
        href: WEBSITE + link.href,
        type: link.type
    }))
    .filter(l => l.rel);
    await writeFile(linksFile, JSON.stringify(linksArray), 'utf-8');

    // meta
    const titleNode = document.querySelector('title');
    const title= contentFix(titleNode?.textContent);
    const metaElements = document.querySelectorAll('meta');
    const metaData = Array.from(metaElements)
        .map(meta => ({
        name: meta.getAttribute('name') || '',
        content: meta.getAttribute('content') || '',
        property: meta.getAttribute('property') || '',
        httpEquiv: meta.getAttribute('http-equiv') || '',
        charset: meta.getAttribute('charset') || ''
    }));
    const description = contentFix(metaData.find(m => m.name === 'description')?.content);
    const keywords = contentFix(metaData.find(m => m.name === 'keywords')?.content);
    const pageMeta = { title, description, keywords };
    await writeFile(cacheFilePath + ".json", JSON.stringify(pageMeta), 'utf-8');

    // content
    const header = document.querySelector('header');
    if (header) {
        header.remove();
    }

    const body = document.querySelector('body');
    const serializedBody = body?.innerHTML ?? "<h1>Body is empty</h1>";
    const fixedContent = contentFix(serializedBody);
    const bodyFinal = fixedContent
        .replace(/(<(img|video)[^>]*\ssrc=")\/upload/g,'$1/api/assets')
        .replace(/(<(img|video)[^>]*\ssrc=")\/local\/templates/g,'$1/api/static')
    await writeFile(cacheFilePath + ".html", bodyFinal, 'utf-8');

    return { content: bodyFinal, links: linksArray, meta: pageMeta }
}

export async function PUT(
  request: NextRequest,
) {
        const body = await request.json();
        console.log(body);
        // await new Promise(resolve => {
        //     setTimeout(resolve, 3000);
        // })
        // if (!url) {
        //     return new Response(
        //         JSON.stringify({ error: 'URL is required' }),
        //         { status: 400 }
        //     );
        // }

        const pathToFetch = "/";

        const fileName = !pathToFetch || pathToFetch === "/" ? "___" : pathToFetch;

        const cacheFilePath = join(CACHE_DIR, encodeURIComponent(fileName));

        try {
            const isCached = existsSync(cacheFilePath + ".html");

            if (!isCached) {
                const content = await _fetchContent(pathToFetch, cacheFilePath);
                return NextResponse.json({ content }, { status: 200 });
            }

            // @TODO: Prevent content fetching too often
            _fetchContent(pathToFetch, cacheFilePath).catch(console.error);
            const [content, metaString, linksString] = await Promise.all([
                readFile(cacheFilePath + ".html", 'utf-8'),
                readFile(cacheFilePath + ".json", 'utf-8'),
                readFile(linksFile, 'utf-8'),
            ]);
            const meta = JSON.parse(metaString);
            const links = JSON.parse(linksString);
            const result: ContentResponse  = { content, meta, links };
            return NextResponse.json(result, { status: 200 });
        } catch (reason) {
            console.log(reason);
            const message =
                reason instanceof Error ? reason.message : 'Unexpected exception'
            return new Response(message, { status: 500 })
        }
}
