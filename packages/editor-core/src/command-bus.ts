export interface CommandContext {
  readonly now: number;
}

export interface Command<TResult = void> {
  readonly id: string;
  execute(context: CommandContext): TResult;
  undo?(context: CommandContext): void;
  redo?(context: CommandContext): void;
}

export class CommandBus {
  private readonly undoStack: Command[] = [];
  private readonly redoStack: Command[] = [];

  execute<TResult>(command: Command<TResult>): TResult {
    const context = { now: Date.now() };
    const result = command.execute(context);
    this.undoStack.push(command);
    this.redoStack.length = 0;
    return result;
  }

  undo(): void {
    const command = this.undoStack.pop();
    if (!command) {
      return;
    }

    const context = { now: Date.now() };
    if (command.undo) {
      command.undo(context);
    }
    this.redoStack.push(command);
  }

  redo(): void {
    const command = this.redoStack.pop();
    if (!command) {
      return;
    }

    const context = { now: Date.now() };
    if (command.redo) {
      command.redo(context);
    } else {
      command.execute(context);
    }
    this.undoStack.push(command);
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}
