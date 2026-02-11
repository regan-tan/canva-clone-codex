import { Point, ViewportState, WorldTransform } from "./types";

export interface CanvasRenderable {
  readonly id: string;
  readonly zIndex: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rotation?: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface CanvasAdapter {
  initialize(container: unknown): void;
  destroy(): void;
  applyViewport(viewport: ViewportState): void;
  render(renderables: readonly CanvasRenderable[]): void;
  batchRender(fn: () => void): void;
  toScreen(worldPoint: Point): Point;
  toWorld(screenPoint: Point): Point;
}

export abstract class BaseCanvasAdapter implements CanvasAdapter, WorldTransform {
  private viewport: ViewportState = {
    zoom: 1,
    panX: 0,
    panY: 0,
    width: 0,
    height: 0,
  };

  initialize(_container: unknown): void {
    // implemented by concrete adapters as needed.
  }

  destroy(): void {
    // implemented by concrete adapters as needed.
  }

  applyViewport(viewport: ViewportState): void {
    this.viewport = viewport;
  }

  abstract render(renderables: readonly CanvasRenderable[]): void;

  batchRender(fn: () => void): void {
    fn();
  }

  toScreen(worldPoint: Point): Point {
    return {
      x: worldPoint.x * this.viewport.zoom + this.viewport.panX,
      y: worldPoint.y * this.viewport.zoom + this.viewport.panY,
    };
  }

  toWorld(screenPoint: Point): Point {
    return {
      x: (screenPoint.x - this.viewport.panX) / this.viewport.zoom,
      y: (screenPoint.y - this.viewport.panY) / this.viewport.zoom,
    };
  }

  protected getViewport(): ViewportState {
    return this.viewport;
  }
}

export class KonvaAdapter extends BaseCanvasAdapter {
  private readonly rendered = new Map<string, CanvasRenderable>();

  render(renderables: readonly CanvasRenderable[]): void {
    this.rendered.clear();
    for (const renderable of renderables) {
      this.rendered.set(renderable.id, renderable);
    }
  }
}

export class FabricAdapter extends BaseCanvasAdapter {
  private readonly rendered = new Map<string, CanvasRenderable>();

  render(renderables: readonly CanvasRenderable[]): void {
    this.rendered.clear();
    for (const renderable of renderables) {
      this.rendered.set(renderable.id, renderable);
    }
  }
}
