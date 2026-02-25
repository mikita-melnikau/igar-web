import { NextRequest, NextResponse } from 'next/server';
import { URL } from 'url';

const WEBSITE = "https://velvet-pro.ru"
const websiteStaticPath = `${WEBSITE}/uploads`;

const ALLOWED_DOMAINS = [
    WEBSITE,
];

export async function GET(request: NextRequest) {
    const path = request.nextUrl.searchParams.get('path');

    if (!path) {
        return NextResponse.json(
            { error: 'Missing "path" parameter' },
            { status: 400 }
        );
    }

    const staticFileUrl = `${WEBSITE}/local/templates/${path}`;

    try {
        const parsedUrl = new URL(staticFileUrl);
        if (!ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
            return NextResponse.json(
                { error: 'Domain not allowed' },
                { status: 403 }
            );
        }

        // Загрузка видео (потоково!)
        const response = await fetch(staticFileUrl, {
            method: 'GET',
            headers: {
                // Передаём заголовки из запроса (например, Range для чанков)
                ...request.headers,
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch video: ${response.statusText}` },
                { status: response.status }
            );
        }

        const headers = new Headers();
        response.headers.forEach((value, key) => {
            if (['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag'].includes(key.toLowerCase())) {
                headers.set(key, value);
            }
        });
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Access-Control-Allow-Origin', '*'); // для CORS (настройте строгость)

        return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });

    } catch (error) {
        console.error('Video proxy error:', error);
        return NextResponse.json(
            { error: 'Proxy error' },
            { status: 500 }
        );
    }
}
