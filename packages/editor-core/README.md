# editor-core

Core canvas/editor primitives:

- Canvas abstraction (`CanvasAdapter`) with world/screen coordinates and viewport state.
- Element model + operations (`ElementStore`) for CRUD, z-ordering, grouping, and multi-select.
- Snapping/alignment and grid settings (`SnappingEngine`).
- Command bus (`CommandBus`) and keyboard shortcuts (`ShortcutRegistry`).
- Render optimization helpers (`RenderMemo`, `UpdateBatcher`, `ViewportCuller`).
- Extensible plugin/tool APIs (`EditorPlugin`, `EditorTool`, `EditorCore`).
