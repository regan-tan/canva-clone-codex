import { CanvasAdapter } from "./canvas-adapter";
import { CommandBus } from "./command-bus";
import { ElementStore } from "./element-store";
import { EditorPlugin, EditorPluginContext, EditorTool, ToolRegistry } from "./plugins";
import { RenderMemo, UpdateBatcher, ViewportCuller } from "./render-optimizer";
import { ShortcutRegistry } from "./shortcut-registry";
import { SnappingEngine } from "./snapping";
import { BaseElement, GridSettings, Point, SnappingSettings, ViewportState } from "./types";

export interface EditorCoreOptions {
  readonly canvasAdapter: CanvasAdapter;
  readonly viewport?: Partial<ViewportState>;
  readonly grid?: GridSettings;
  readonly snapping?: SnappingSettings;
}

export class EditorCore {
  readonly commandBus = new CommandBus();
  readonly elementStore = new ElementStore();
  readonly shortcutRegistry = new ShortcutRegistry();
  readonly toolRegistry = new ToolRegistry();

  private readonly renderMemo = new RenderMemo();
  private readonly batcher = new UpdateBatcher();
  private readonly culler = new ViewportCuller();
  private readonly plugins = new Map<string, EditorPlugin>();
  private readonly canvasAdapter: CanvasAdapter;

  private viewport: ViewportState;
  private grid: GridSettings;
  private snapping: SnappingSettings;

  constructor(options: EditorCoreOptions) {
    this.canvasAdapter = options.canvasAdapter;
    this.viewport = {
      zoom: 1,
      panX: 0,
      panY: 0,
      width: 1280,
      height: 720,
      ...options.viewport,
    };

    this.grid =
      options.grid ??
      ({
        enabled: true,
        size: 8,
        snapToGrid: false,
        visible: true,
      } satisfies GridSettings);

    this.snapping =
      options.snapping ??
      ({
        enabled: true,
        threshold: 6,
        snapToElements: true,
        snapToGrid: false,
      } satisfies SnappingSettings);

    this.canvasAdapter.applyViewport(this.viewport);
  }

  setViewport(nextViewport: Partial<ViewportState>): void {
    this.viewport = { ...this.viewport, ...nextViewport };
    this.canvasAdapter.applyViewport(this.viewport);
    this.requestRender();
  }

  getViewport(): ViewportState {
    return this.viewport;
  }

  getWorldPoint(screenPoint: Point): Point {
    return this.canvasAdapter.toWorld(screenPoint);
  }

  getScreenPoint(worldPoint: Point): Point {
    return this.canvasAdapter.toScreen(worldPoint);
  }

  setGridSettings(settings: Partial<GridSettings>): void {
    this.grid = { ...this.grid, ...settings };
  }

  setSnappingSettings(settings: Partial<SnappingSettings>): void {
    this.snapping = { ...this.snapping, ...settings };
  }

  moveElementWithSnapping(id: string, nextPosition: Point): void {
    const element = this.elementStore.getState().elements.get(id);
    if (!element) {
      throw new Error(`Element ${id} not found`);
    }

    const snapper = new SnappingEngine(this.snapping, this.grid);
    const snapshot = this.elementStore.list();
    const result = snapper.snapPoint(nextPosition, element, snapshot);
    this.elementStore.update(id, { x: result.point.x, y: result.point.y });
    this.requestRender();
  }

  createElement(element: BaseElement): void {
    this.elementStore.create(element);
    this.requestRender();
  }

  updateElement(id: string, patch: Partial<BaseElement>): void {
    this.elementStore.update(id, patch);
    this.requestRender();
  }

  deleteElement(id: string): void {
    this.elementStore.delete(id);
    this.requestRender();
  }

  registerPlugin(plugin: EditorPlugin): void {
    const context: EditorPluginContext = {
      commandBus: this.commandBus,
      elementStore: this.elementStore,
      shortcutRegistry: this.shortcutRegistry,
      registerTool: (tool: EditorTool) => this.toolRegistry.register(tool),
    };

    plugin.setup(context);
    this.plugins.set(plugin.id, plugin);
  }

  unregisterPlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return;
    }
    plugin.teardown?.();
    this.plugins.delete(pluginId);
  }

  requestRender(): void {
    this.batcher.schedule(() => {
      this.canvasAdapter.batchRender(() => {
        const all = this.elementStore.list();
        const visible = this.culler.cull(all, {
          x: -this.viewport.panX / this.viewport.zoom,
          y: -this.viewport.panY / this.viewport.zoom,
          width: this.viewport.width / this.viewport.zoom,
          height: this.viewport.height / this.viewport.zoom,
        });
        const renderables = this.renderMemo.materialize(visible);
        this.canvasAdapter.render(renderables);
      });
    });
  }
}
