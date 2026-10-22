import { AlertIcon, XIcon } from "./Icons.jsx";

export function ErrorBanner({ message, onDismiss }) {
  return (
    <div className="error-banner" role="alert">
      <span className="error-banner__icon" aria-hidden="true">
        <AlertIcon size={19} />
      </span>
      <div className="error-banner__content">
        <strong>That didn&apos;t go through.</strong>
        <p>{message}</p>
      </div>
      <button
        className="icon-button error-banner__dismiss"
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error"
      >
        <XIcon size={16} />
      </button>
    </div>
  );
}
