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
