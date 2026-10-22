import { CheckIcon } from "./Icons.jsx";

const COPY = {
  all: {
    title: "A clean slate.",
    body: "Add your first task above and give your day a little direction.",
  },
  active: {
    title: "Nothing left to do.",
    body: "Every task is complete. Take a moment to enjoy the quiet.",
  },
  completed: {
    title: "No completed tasks yet.",
    body: "Check off a task and it will show up here.",
  },
};

export function EmptyState({ filter }) {
  const copy = COPY[filter] ?? COPY.all;

  return (
    <div className="empty-state">
      <div className="empty-state__art" aria-hidden="true">
        <svg viewBox="0 0 120 120" role="presentation">
          <circle cx="60" cy="60" r="43" className="empty-state__ring" />
          <circle cx="96" cy="29" r="4" className="empty-state__dot" />
          <circle cx="21" cy="79" r="3" className="empty-state__dot" />
          <path
            d="M42 60.5 53 71l25-27"
            className="empty-state__check"
          />
          <path d="M89 50c5 6 7 13 6 20" className="empty-state__spark" />
        </svg>
        <span className="empty-state__badge">
          <CheckIcon size={14} />
        </span>
      </div>
      <h3>{copy.title}</h3>
      <p>{copy.body}</p>
    </div>
  );
}
