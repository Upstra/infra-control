export interface Release {
  name: string;
  tagName: string;
  publishedAt: string;
  author: string | null;
  body: string;
  htmlUrl: string;
}
