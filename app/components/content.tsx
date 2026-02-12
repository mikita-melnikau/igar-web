"use client";

import {marked} from 'marked';
import sanitizeHtml from 'sanitize-html';
import {useCallback, useEffect, useState} from "react";
import {ContentResponse} from "@/app/types";
import { AppLoader } from "./loader";
import { AppNotFound } from "./notFound";
import {usePathname, useSearchParams} from "next/navigation";

export const AppContent = () => {
    const [content, setContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const pathname = usePathname(); // Текущий путь (например, "/about")
    // const searchParams = useSearchParams();

    const _fetchContent  = useCallback(async (pathToFetch: string): Promise<ContentResponse>  => {
        const body = JSON.stringify({ path: pathToFetch });
        const options = { method: "PUT", body };
        const response = await fetch(`/api/content`, options);
        const resp: ContentResponse = await response.json();
        console.log(resp);
        return { content: "123" };
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoading(true);
        _fetchContent(pathname)
            .then((data) => setContent(data.content))
            .catch((error) => console.log(error))
            .finally(() => setIsLoading(false));
    }, [pathname, _fetchContent]);

    return   isLoading ? <AppLoader /> :
                content.length > 0 ?
                <div>{sanitizeHtml(marked(content) as string)}</div>
                    : <AppNotFound />
}