type Metadata = {
  name: string;
  content: string;
  property: string;
  httpEquiv: string;
  charset: string;
};
export type PageMetadata = { title: string; description: string; keywords: string };

type HeadLink = {
  rel: string;
  href: string;
  type: string;
};
type Script = {
  src: string;
  innerHTML: string;
  type: string;
  defer: boolean;
  async: boolean;
};

export type ContentResponse = { content: string; meta: PageMetadata; links: HeadLink[]; scripts: Script[] };
