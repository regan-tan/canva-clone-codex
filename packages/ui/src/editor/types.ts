export type AssetKind = "icons" | "shapes" | "images" | "text-templates";

export type AssetItem = {
  id: string;
  kind: AssetKind;
  label: string;
  keywords: string[];
  thumbnail?: string;
};

export type TextAlignment = "left" | "center" | "right" | "justify";

export type TextStyle = {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  alignment: TextAlignment;
  lineHeight: number;
};

export type Slide = {
  id: string;
  title: string;
  textContent: string;
  textStyle: TextStyle;
};
