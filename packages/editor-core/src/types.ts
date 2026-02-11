export type Scalar = number;

export interface Point {
  readonly x: Scalar;
  readonly y: Scalar;
}

export interface Size {
  readonly width: Scalar;
  readonly height: Scalar;
}

export interface Rect extends Point, Size {}

export interface ViewportState {
  readonly zoom: Scalar;
  readonly panX: Scalar;
  readonly panY: Scalar;
  readonly width: Scalar;
  readonly height: Scalar;
}

export interface GridSettings {
  readonly enabled: boolean;
  readonly size: Scalar;
  readonly snapToGrid: boolean;
  readonly visible: boolean;
}

export interface AlignmentGuide {
  readonly orientation: "horizontal" | "vertical";
  readonly worldValue: Scalar;
  readonly sourceId: string;
}

export interface SnappingSettings {
  readonly enabled: boolean;
  readonly threshold: Scalar;
  readonly snapToElements: boolean;
  readonly snapToGrid: boolean;
}

export type ElementType = "shape" | "text" | "image" | "connector" | "group";

export interface BaseElement {
  readonly id: string;
  readonly type: ElementType;
  readonly x: Scalar;
  readonly y: Scalar;
  readonly width: Scalar;
  readonly height: Scalar;
  readonly rotation?: Scalar;
  readonly zIndex: number;
  readonly parentId?: string;
  readonly children?: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface WorldTransform {
  toScreen(point: Point): Point;
  toWorld(point: Point): Point;
}
