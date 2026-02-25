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

    // Формируем полный URL
    const videoUrl = `${WEBSITE}/upload/${path}`;

    try {
        const parsedUrl = new URL(videoUrl);
        if (!ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
            return NextResponse.json(
                { error: 'Domain not allowed' },
                { status: 403 }
            );
        }

        // Загрузка видео (потоково!)
        const response = await fetch(videoUrl, {
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
            // Разрешаем ключевые заголовки для видео
            if (['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag'].includes(key.toLowerCase())) {
                headers.set(key, value);
            }
        });
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Access-Control-Allow-Origin', '*'); // для CORS (настройте строгость)
        const contentType = response.headers.get('content-type');
        if (!contentType) {
            headers.set('Content-Type', 'application/octet-stream');
        }


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
