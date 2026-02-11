import { BaseElement, GridSettings, AlignmentGuide, Point, SnappingSettings } from "./types";

export interface SnapResult {
  readonly point: Point;
  readonly guides: readonly AlignmentGuide[];
}

const elementEdges = (element: BaseElement): { x: number[]; y: number[] } => ({
  x: [element.x, element.x + element.width / 2, element.x + element.width],
  y: [element.y, element.y + element.height / 2, element.y + element.height],
});

export class SnappingEngine {
  constructor(
    private readonly settings: SnappingSettings,
    private readonly grid: GridSettings,
  ) {}

  snapPoint(
    point: Point,
    movingElement: BaseElement,
    allElements: readonly BaseElement[],
  ): SnapResult {
    if (!this.settings.enabled) {
      return { point, guides: [] };
    }

    const guides: AlignmentGuide[] = [];
    let snappedX = point.x;
    let snappedY = point.y;

    if (this.settings.snapToGrid && this.grid.enabled && this.grid.snapToGrid && this.grid.size > 0) {
      snappedX = Math.round(snappedX / this.grid.size) * this.grid.size;
      snappedY = Math.round(snappedY / this.grid.size) * this.grid.size;
    }

    if (this.settings.snapToElements) {
      const movingEdges = elementEdges({ ...movingElement, x: point.x, y: point.y });
      const candidates = allElements.filter((element) => element.id !== movingElement.id);

      let bestX: { delta: number; value: number; sourceId: string } | undefined;
      let bestY: { delta: number; value: number; sourceId: string } | undefined;

      for (const candidate of candidates) {
        const edges = elementEdges(candidate);

        for (const value of movingEdges.x) {
          for (const candidateValue of edges.x) {
            const delta = Math.abs(candidateValue - value);
            if (delta <= this.settings.threshold && (!bestX || delta < bestX.delta)) {
              bestX = { delta, value: candidateValue, sourceId: candidate.id };
            }
          }
        }

        for (const value of movingEdges.y) {
          for (const candidateValue of edges.y) {
            const delta = Math.abs(candidateValue - value);
            if (delta <= this.settings.threshold && (!bestY || delta < bestY.delta)) {
              bestY = { delta, value: candidateValue, sourceId: candidate.id };
            }
          }
        }
      }

      if (bestX) {
        const offset = bestX.value - movingEdges.x[1];
        snappedX += offset;
        guides.push({ orientation: "vertical", worldValue: bestX.value, sourceId: bestX.sourceId });
      }

      if (bestY) {
        const offset = bestY.value - movingEdges.y[1];
        snappedY += offset;
        guides.push({ orientation: "horizontal", worldValue: bestY.value, sourceId: bestY.sourceId });
      }
    }

    return {
      point: { x: snappedX, y: snappedY },
      guides,
    };
  }
}
