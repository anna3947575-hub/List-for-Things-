import { RetryIcon } from "./Icons.jsx";

export function LoadErrorState({ message, onRetry }) {
  return (
    <div className="load-error" role="alert">
      <span className="load-error__icon" aria-hidden="true">
        !
      </span>
      <h3>We couldn&apos;t load your tasks.</h3>
      <p>{message}</p>
      <p className="load-error__hint">
        Make sure the backend is running, then try again.
      </p>
      <button className="button button--secondary" type="button" onClick={onRetry}>
        <RetryIcon size={16} />
        <span>Try again</span>
      </button>
    </div>
  );
}
