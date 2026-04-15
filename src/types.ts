export type PageMetadata = { title: string; description: string; keywords: string };

export type HeadLink = {
  rel: string;
  href: string;
  type: string;
};

export type CachedScript = {
  src: string;
  innerHTML: string;
  type: string;
  defer: boolean;
  async: boolean;
};

export type ContentResponse = {
  content: string;
  meta: PageMetadata;
  links: HeadLink[];
  scripts: CachedScript[];
  headerNavbar: string;
};
