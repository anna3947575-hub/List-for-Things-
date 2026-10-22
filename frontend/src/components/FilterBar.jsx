const FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

export function FilterBar({ filter, onChange, counts }) {
  return (
    <div className="filters" role="group" aria-label="Filter tasks">
      {FILTERS.map((item) => (
        <button
          key={item.value}
          className={`filters__button${filter === item.value ? " filters__button--active" : ""}`}
          type="button"
          onClick={() => onChange(item.value)}
          aria-pressed={filter === item.value}
        >
          <span>{item.label}</span>
          <span className="filters__count" aria-hidden="true">
            {counts[item.value]}
          </span>
        </button>
      ))}
    </div>
  );
}
