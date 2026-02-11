import { CommandBus } from "./command-bus";
import { ElementStore } from "./element-store";
import { ShortcutRegistry } from "./shortcut-registry";

export interface EditorTool {
  readonly id: string;
  onActivate?(): void;
  onDeactivate?(): void;
}

export interface EditorPluginContext {
  readonly commandBus: CommandBus;
  readonly elementStore: ElementStore;
  readonly shortcutRegistry: ShortcutRegistry;
  registerTool(tool: EditorTool): void;
}

export interface EditorPlugin {
  readonly id: string;
  setup(context: EditorPluginContext): void;
  teardown?(): void;
}

export class ToolRegistry {
  private readonly tools = new Map<string, EditorTool>();
  private activeToolId?: string;

  register(tool: EditorTool): void {
    this.tools.set(tool.id, tool);
  }

  activate(toolId: string): void {
    const next = this.tools.get(toolId);
    if (!next) {
      throw new Error(`Tool ${toolId} is not registered`);
    }

    if (this.activeToolId) {
      this.tools.get(this.activeToolId)?.onDeactivate?.();
    }

    this.activeToolId = toolId;
    next.onActivate?.();
  }

  getActiveTool(): EditorTool | undefined {
    return this.activeToolId ? this.tools.get(this.activeToolId) : undefined;
  }
}
