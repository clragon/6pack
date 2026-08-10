// One image side of the comparison: enough to display it and to fetch its bytes
// for the diff. `full` is the highest resolution the viewer may see (a signed
// replacement url, or a post's file url), and `thumb` is the always-available
// preview used as a fallback and as the low-cost first paint.
export interface CompareImage {
  key: string;
  label: string;
  full: string;
  thumb: string;
  width: number;
  height: number;
  ext: string;
  size: number | null;
  href: string | null;
  video: boolean;
}

export interface CompareData {
  postId: number;
  current: CompareImage;
  candidates: CompareImage[];
}
