import { AssetItem, Slide, TextStyle } from "./types";
import { AssetPanel } from "./AssetPanel";
import { SlideManager } from "./SlideManager";
import { TextControls } from "./TextControls";

type EditorShellProps = {
  assets: AssetItem[];
  slides: Slide[];
  activeSlideId: string;
  onSelectSlide: (id: string) => void;
  onCreateSlide: () => void;
  onDuplicateSlide: (id: string) => void;
  onDeleteSlide: (id: string) => void;
  onReorderSlides: (fromIndex: number, toIndex: number) => void;
  onUpdateSlideTextStyle: (slideId: string, style: TextStyle) => void;
};

export function EditorShell({
  assets,
  slides,
  activeSlideId,
  onSelectSlide,
  onCreateSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onReorderSlides,
  onUpdateSlideTextStyle,
}: EditorShellProps) {
  const activeSlide = slides.find((slide) => slide.id === activeSlideId) ?? slides[0];

  return (
    <div className="editor-shell">
      <header className="editor-toolbar">
        <strong>Canva Clone</strong>
        <nav>
          <button type="button">Undo</button>
          <button type="button">Redo</button>
          <button type="button">Share</button>
          <a href="/present">Present</a>
        </nav>
      </header>

      <div className="editor-main">
        <div className="editor-left-column">
          <AssetPanel assets={assets} />
          <SlideManager
            slides={slides}
            activeSlideId={activeSlide.id}
            onSelectSlide={onSelectSlide}
            onCreateSlide={onCreateSlide}
            onDuplicateSlide={onDuplicateSlide}
            onDeleteSlide={onDeleteSlide}
            onReorderSlides={onReorderSlides}
          />
        </div>

        <main className="editor-canvas" aria-label="Slide canvas">
          <article
            className="slide-card"
            style={{
              fontFamily: activeSlide.textStyle.fontFamily,
              fontSize: `${activeSlide.textStyle.fontSize}px`,
              fontWeight: activeSlide.textStyle.fontWeight,
              color: activeSlide.textStyle.color,
              textAlign: activeSlide.textStyle.alignment,
              lineHeight: String(activeSlide.textStyle.lineHeight),
            }}
          >
            <h1>{activeSlide.title}</h1>
            <p>{activeSlide.textContent}</p>
          </article>
        </main>

        <aside className="editor-right-panel">
          <TextControls
            value={activeSlide.textStyle}
            onChange={(style) => onUpdateSlideTextStyle(activeSlide.id, style)}
          />
        </aside>
      </div>
    </div>
  );
}
