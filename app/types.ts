type Metadata = {
    name: string;
    content: string;
    property: string;
    httpEquiv: string;
    charset: string;
}
export type PageMetadata = { title: string; meta: Metadata[] };
type HeadLink = {
    rel: string;
    href: string;
    type: string;
}
export type ContentResponse = { content: string, meta: PageMetadata, links: HeadLink[] };
