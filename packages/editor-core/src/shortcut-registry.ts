export interface KeyboardShortcut {
  readonly id: string;
  readonly key: string;
  readonly ctrlOrCmd?: boolean;
  readonly shift?: boolean;
  readonly alt?: boolean;
  readonly action: () => void;
}

export interface KeyboardLikeEvent {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  preventDefault(): void;
}

export class ShortcutRegistry {
  private readonly shortcuts = new Map<string, KeyboardShortcut>();

  register(shortcut: KeyboardShortcut): void {
    this.shortcuts.set(shortcut.id, shortcut);
  }

  unregister(id: string): void {
    this.shortcuts.delete(id);
  }

  handle(event: KeyboardLikeEvent): boolean {
    for (const shortcut of this.shortcuts.values()) {
      if (this.matches(shortcut, event)) {
        event.preventDefault();
        shortcut.action();
        return true;
      }
    }
    return false;
  }

  private matches(shortcut: KeyboardShortcut, event: KeyboardLikeEvent): boolean {
    const modifier = shortcut.ctrlOrCmd ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
    return (
      event.key.toLowerCase() === shortcut.key.toLowerCase() &&
      modifier &&
      Boolean(shortcut.shift) === event.shiftKey &&
      Boolean(shortcut.alt) === event.altKey
    );
  }
}
