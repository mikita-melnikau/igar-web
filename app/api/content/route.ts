import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';
import { NextRequest, NextResponse } from "next/server";
import {ContentResponse} from "@/app/types";

const WEBSITE = "https://velvet-pro.ru"
const CACHE_DIR = join(process.cwd(), 'cache');
const linksFile = join(CACHE_DIR, '_links.json');

const _fetchContent = async (pathToFetch: string, cacheFilePath: string): Promise<ContentResponse> => {
    const res = await fetch(`${WEBSITE}${pathToFetch}`);
    if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.statusText}`);
    }
    const html = await res.text();
    const dom = new JSDOM(html);
    const { window } = dom;
    const { document } = window;

    const header = document.querySelector('header');
    if (header) {
        header.remove();
    }

    const links = document.querySelectorAll('link');
    const linksArray =  Array.from(links).map(link => ({
        rel: link.rel,
        href: link.href,
        type: link.type
    }));
    await writeFile(linksFile, JSON.stringify(linksArray), 'utf-8');

    const titleNode = document.querySelector('title');
    const title= titleNode?.textContent || "";
    const metaElements = document.querySelectorAll('meta');
    const meta = Array.from(metaElements).map(meta => ({
        name: meta.getAttribute('name') || '',
        content: meta.getAttribute('content') || '',
        property: meta.getAttribute('property') || '',
        httpEquiv: meta.getAttribute('http-equiv') || '',
        charset: meta.getAttribute('charset') || ''
    }));
    const pageMeta = JSON.stringify({ title, meta });
    await writeFile(cacheFilePath + ".json", pageMeta, 'utf-8');

    const head = document.querySelector('head');
    if (head) {
        console.log(head.textContent);
    }

    const cleanedHtml = dom.serialize();
    await writeFile(cacheFilePath + ".html", cleanedHtml, 'utf-8');

    return { content: cleanedHtml, links: linksArray, meta: { title, meta }}
}

export async function PUT(
  request: NextRequest,
) {
        const body = await request.json();
        console.log(body);
        await new Promise(resolve => {
            setTimeout(resolve, 3000);
        })
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
            _fetchContent(pathToFetch, cacheFilePath);
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
