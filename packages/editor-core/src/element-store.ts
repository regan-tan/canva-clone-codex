import { BaseElement } from "./types";

export interface ElementStoreState {
  readonly elements: ReadonlyMap<string, BaseElement>;
  readonly selection: ReadonlySet<string>;
}

const sortByZIndex = (elements: Iterable<BaseElement>): BaseElement[] =>
  [...elements].sort((a, b) => a.zIndex - b.zIndex);

export class ElementStore {
  private readonly elements = new Map<string, BaseElement>();
  private readonly selection = new Set<string>();

  getState(): ElementStoreState {
    return {
      elements: new Map(this.elements),
      selection: new Set(this.selection),
    };
  }

  list(): readonly BaseElement[] {
    return sortByZIndex(this.elements.values());
  }

  create(element: BaseElement): void {
    if (this.elements.has(element.id)) {
      throw new Error(`Element ${element.id} already exists`);
    }
    this.elements.set(element.id, element);
  }

  update(id: string, patch: Partial<BaseElement>): BaseElement {
    const current = this.requireElement(id);
    const updated: BaseElement = {
      ...current,
      ...patch,
      id: current.id,
    };
    this.elements.set(id, updated);
    return updated;
  }

  delete(id: string): BaseElement {
    const deleted = this.requireElement(id);
    this.elements.delete(id);
    this.selection.delete(id);

    if (deleted.children?.length) {
      for (const childId of deleted.children) {
        this.update(childId, { parentId: undefined });
      }
    }

    return deleted;
  }

  select(ids: readonly string[], mode: "replace" | "add" | "toggle" = "replace"): ReadonlySet<string> {
    if (mode === "replace") {
      this.selection.clear();
    }

    for (const id of ids) {
      this.requireElement(id);
      if (mode === "toggle") {
        if (this.selection.has(id)) {
          this.selection.delete(id);
        } else {
          this.selection.add(id);
        }
      } else {
        this.selection.add(id);
      }
    }

    return new Set(this.selection);
  }

  clearSelection(): void {
    this.selection.clear();
  }

  reorder(ids: readonly string[], target: "front" | "back" | "forward" | "backward"): void {
    const list = [...this.list()];
    const idSet = new Set(ids);
    const selected = list.filter((element) => idSet.has(element.id));
    const unselected = list.filter((element) => !idSet.has(element.id));

    let ordered: BaseElement[];
    switch (target) {
      case "front":
        ordered = [...unselected, ...selected];
        break;
      case "back":
        ordered = [...selected, ...unselected];
        break;
      case "forward": {
        ordered = [...list];
        for (let index = ordered.length - 2; index >= 0; index -= 1) {
          if (idSet.has(ordered[index].id) && !idSet.has(ordered[index + 1].id)) {
            [ordered[index], ordered[index + 1]] = [ordered[index + 1], ordered[index]];
          }
        }
        break;
      }
      case "backward": {
        ordered = [...list];
        for (let index = 1; index < ordered.length; index += 1) {
          if (idSet.has(ordered[index].id) && !idSet.has(ordered[index - 1].id)) {
            [ordered[index], ordered[index - 1]] = [ordered[index - 1], ordered[index]];
          }
        }
        break;
      }
      default:
        ordered = list;
    }

    ordered.forEach((element, index) => {
      this.elements.set(element.id, {
        ...element,
        zIndex: index,
      });
    });
  }

  group(groupId: string, childIds: readonly string[]): BaseElement {
    const children = childIds.map((childId) => this.requireElement(childId));
    if (children.length === 0) {
      throw new Error("Cannot create empty group");
    }

    const minX = Math.min(...children.map((child) => child.x));
    const minY = Math.min(...children.map((child) => child.y));
    const maxX = Math.max(...children.map((child) => child.x + child.width));
    const maxY = Math.max(...children.map((child) => child.y + child.height));

    const group: BaseElement = {
      id: groupId,
      type: "group",
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      zIndex: Math.max(...children.map((child) => child.zIndex)) + 1,
      children: [...childIds],
    };

    this.create(group);
    for (const child of children) {
      this.update(child.id, { parentId: groupId });
    }

    this.select([groupId], "replace");
    return group;
  }

  ungroup(groupId: string): readonly BaseElement[] {
    const group = this.requireElement(groupId);
    if (group.type !== "group" || !group.children?.length) {
      throw new Error(`Element ${groupId} is not a group`);
    }

    const children: BaseElement[] = [];
    for (const childId of group.children) {
      children.push(this.update(childId, { parentId: undefined }));
    }

    this.delete(groupId);
    this.select(group.children, "replace");
    return children;
  }

  private requireElement(id: string): BaseElement {
    const element = this.elements.get(id);
    if (!element) {
      throw new Error(`Element ${id} not found`);
    }
    return element;
  }
}
