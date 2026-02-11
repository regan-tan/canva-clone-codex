export type ToolKind = 'select' | 'draw' | 'text' | 'shape';

export interface Command {
  id: string;
  tool: ToolKind;
}

export function createCommand(id: string, tool: ToolKind): Command {
  return { id, tool };
}
