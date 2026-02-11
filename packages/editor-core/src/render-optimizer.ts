import { CanvasRenderable } from "./canvas-adapter";
import { BaseElement, Rect } from "./types";

const intersects = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

const hashElement = (element: BaseElement): string =>
  [
    element.id,
    element.x,
    element.y,
    element.width,
    element.height,
    element.rotation ?? 0,
    element.zIndex,
    element.parentId ?? "",
    element.children?.join(",") ?? "",
  ].join("|");

export class RenderMemo {
  private readonly cache = new Map<string, CanvasRenderable>();
  private readonly signatures = new Map<string, string>();

  materialize(elements: readonly BaseElement[]): readonly CanvasRenderable[] {
    const renderables: CanvasRenderable[] = [];

    for (const element of elements) {
      const signature = hashElement(element);
      const cachedSignature = this.signatures.get(element.id);
      if (cachedSignature === signature) {
        const cached = this.cache.get(element.id);
        if (cached) {
          renderables.push(cached);
          continue;
        }
      }

      const renderable: CanvasRenderable = {
        id: element.id,
        zIndex: element.zIndex,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        rotation: element.rotation,
        metadata: element.metadata,
      };

      this.signatures.set(element.id, signature);
      this.cache.set(element.id, renderable);
      renderables.push(renderable);
    }

    return renderables;
  }
}

export class UpdateBatcher {
  private queued = false;
  private readonly queue: Array<() => void> = [];

  schedule(fn: () => void): void {
    this.queue.push(fn);

    if (this.queued) {
      return;
    }

    this.queued = true;
    queueMicrotask(() => {
      this.queued = false;
      const work = [...this.queue];
      this.queue.length = 0;
      work.forEach((item) => item());
    });
  }
}

export class ViewportCuller {
  cull(elements: readonly BaseElement[], viewportRect: Rect, margin = 256): readonly BaseElement[] {
    const expanded = {
      x: viewportRect.x - margin,
      y: viewportRect.y - margin,
      width: viewportRect.width + margin * 2,
      height: viewportRect.height + margin * 2,
    };

    return elements.filter((element) =>
      intersects(expanded, {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
      }),
    );
  }
}
