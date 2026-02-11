import { TextStyle } from "./types";

type TextControlsProps = {
  value: TextStyle;
  onChange: (next: TextStyle) => void;
};

const FONT_FAMILIES = ["Inter", "Arial", "Georgia", "Poppins", "Merriweather"];

function update<T extends keyof TextStyle>(current: TextStyle, key: T, value: TextStyle[T]): TextStyle {
  return { ...current, [key]: value };
}

export function TextControls({ value, onChange }: TextControlsProps) {
  return (
    <section className="text-controls">
      <h3>Text</h3>
      <label>
        Font family
        <select
          value={value.fontFamily}
          onChange={(event) => onChange(update(value, "fontFamily", event.target.value))}
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
      </label>
      <label>
        Font size
        <input
          type="number"
          min={8}
          max={200}
          value={value.fontSize}
          onChange={(event) => onChange(update(value, "fontSize", Number(event.target.value)))}
        />
      </label>
      <label>
        Font weight
        <input
          type="number"
          min={100}
          max={900}
          step={100}
          value={value.fontWeight}
          onChange={(event) => onChange(update(value, "fontWeight", Number(event.target.value)))}
        />
      </label>
      <label>
        Color
        <input
          type="color"
          value={value.color}
          onChange={(event) => onChange(update(value, "color", event.target.value))}
        />
      </label>
      <label>
        Alignment
        <select
          value={value.alignment}
          onChange={(event) => onChange(update(value, "alignment", event.target.value as TextStyle["alignment"]))}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
          <option value="justify">Justify</option>
        </select>
      </label>
      <label>
        Line-height
        <input
          type="number"
          min={0.8}
          max={3}
          step={0.1}
          value={value.lineHeight}
          onChange={(event) => onChange(update(value, "lineHeight", Number(event.target.value)))}
        />
      </label>
    </section>
  );
}
