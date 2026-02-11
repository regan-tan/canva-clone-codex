import { useEffect, useMemo, useState } from "react";
import { EditorShell } from "./EditorShell";
import { getAssetCatalog } from "./mockAssets";
import { Slide, TextStyle } from "./types";

const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: "Inter",
  fontSize: 28,
  fontWeight: 500,
  color: "#111827",
  alignment: "left",
  lineHeight: 1.4,
};

function createSlide(seed: number): Slide {
  return {
    id: `slide-${seed}`,
    title: `Slide ${seed}`,
    textContent: "Click into the controls on the right to customize typography.",
    textStyle: DEFAULT_TEXT_STYLE,
  };
}

function reorder<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }

  const copy = [...items];
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved);
  return copy;
}

export function PresentationRouter() {
  const [slides, setSlides] = useState<Slide[]>([createSlide(1), createSlide(2)]);
  const [activeSlideId, setActiveSlideId] = useState(slides[0].id);
  const [isPresentMode, setIsPresentMode] = useState(() => window.location.pathname.startsWith("/present"));

  const activeIndex = useMemo(
    () => Math.max(0, slides.findIndex((slide) => slide.id === activeSlideId)),
    [activeSlideId, slides],
  );
  const activeSlide = slides[activeIndex] ?? slides[0];

  useEffect(() => {
    const onPopState = () => setIsPresentMode(window.location.pathname.startsWith("/present"));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!isPresentMode) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        setActiveSlideId(slides[Math.min(slides.length - 1, activeIndex + 1)].id);
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        setActiveSlideId(slides[Math.max(0, activeIndex - 1)].id);
      }
      if (event.key === "Escape") {
        window.history.pushState({}, "", "/edit");
        setIsPresentMode(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, isPresentMode, slides]);

  const goToMode = (path: "/edit" | "/present") => {
    window.history.pushState({}, "", path);
    setIsPresentMode(path === "/present");
  };

  if (isPresentMode) {
    return (
      <section className="presentation-mode" aria-label="Presentation mode">
        <button type="button" onClick={() => goToMode("/edit")}>
          Exit presentation
        </button>
        <article
          className="slide-card presentation"
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
        <footer>
          <span>
            Slide {activeIndex + 1} / {slides.length}
          </span>
          <small>Use ← / → keys to navigate.</small>
        </footer>
      </section>
    );
  }

  return (
    <EditorShell
      assets={getAssetCatalog()}
      slides={slides}
      activeSlideId={activeSlide.id}
      onSelectSlide={setActiveSlideId}
      onCreateSlide={() => {
        const next = createSlide(slides.length + 1);
        setSlides((current) => [...current, next]);
        setActiveSlideId(next.id);
      }}
      onDuplicateSlide={(slideId) => {
        setSlides((current) => {
          const index = current.findIndex((slide) => slide.id === slideId);
          if (index < 0) return current;

          const source = current[index];
          const duplicate: Slide = {
            ...source,
            id: `slide-${Date.now()}`,
            title: `${source.title} (copy)`,
          };

          const next = [...current];
          next.splice(index + 1, 0, duplicate);
          setActiveSlideId(duplicate.id);
          return next;
        });
      }}
      onDeleteSlide={(slideId) => {
        setSlides((current) => {
          if (current.length <= 1) return current;

          const index = current.findIndex((slide) => slide.id === slideId);
          if (index < 0) return current;

          const next = current.filter((slide) => slide.id !== slideId);
          const replacement = next[Math.max(0, index - 1)] ?? next[0];
          setActiveSlideId(replacement.id);
          return next;
        });
      }}
      onReorderSlides={(fromIndex, toIndex) => {
        setSlides((current) => reorder(current, fromIndex, toIndex));
      }}
      onUpdateSlideTextStyle={(slideId, style) => {
        setSlides((current) =>
          current.map((slide) => (slide.id === slideId ? { ...slide, textStyle: style } : slide)),
        );
      }}
    />
  );
}
