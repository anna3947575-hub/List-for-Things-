export function TodoListSkeleton() {
  return (
    <div className="skeleton-list" role="status">
      <span className="sr-only">Loading your tasks…</span>
      {[0, 1, 2].map((row) => (
        <div className="skeleton-row" key={row} aria-hidden="true">
          <span className="skeleton skeleton--circle" />
          <span className="skeleton skeleton--text" style={{ width: `${68 - row * 11}%` }} />
          <span className="skeleton skeleton--action" />
        </div>
      ))}
    </div>
  );
}
