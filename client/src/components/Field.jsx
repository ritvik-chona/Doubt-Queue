// Label + control + error/hint. Wrapping in <label> ties the text to the input.
export default function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {error ? (
        <span className="field-error">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-muted">{hint}</span>
      )}
    </label>
  );
}

export const inputClass = (error) => `input ${error ? 'input-invalid' : ''}`;
