type Props = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
};

const Select = ({ label, value, options, onChange }: Props) => {
  return (
    <label className="flex items-center justify-between gap-4 py-3">
      <p className="text-sm">{label}</p>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded bg-action-dark px-3 py-2 text-sm text-typography-light outline-none">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export default Select;
