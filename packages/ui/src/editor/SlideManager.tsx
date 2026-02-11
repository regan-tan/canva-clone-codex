import { Slide } from "./types";

type SlideManagerProps = {
  slides: Slide[];
  activeSlideId: string;
  onSelectSlide: (slideId: string) => void;
  onCreateSlide: () => void;
  onDuplicateSlide: (slideId: string) => void;
  onDeleteSlide: (slideId: string) => void;
  onReorderSlides: (fromIndex: number, toIndex: number) => void;
};

export function SlideManager({
  slides,
  activeSlideId,
  onSelectSlide,
  onCreateSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onReorderSlides,
}: SlideManagerProps) {
  return (
    <section className="slide-manager">
      <div className="slide-manager-header">
        <h3>Pages</h3>
        <button type="button" onClick={onCreateSlide}>
          + New page
        </button>
      </div>
      <ol>
        {slides.map((slide, index) => (
          <li
            key={slide.id}
            draggable
            onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const fromIndex = Number(event.dataTransfer.getData("text/plain"));
              onReorderSlides(fromIndex, index);
            }}
          >
            <button
              type="button"
              className={slide.id === activeSlideId ? "active" : ""}
              onClick={() => onSelectSlide(slide.id)}
            >
              {index + 1}. {slide.title}
            </button>
            <div>
              <button type="button" onClick={() => onDuplicateSlide(slide.id)}>
                Duplicate
              </button>
              <button type="button" onClick={() => onDeleteSlide(slide.id)} disabled={slides.length === 1}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
