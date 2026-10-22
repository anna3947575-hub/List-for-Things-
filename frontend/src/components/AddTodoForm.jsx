import { useRef, useState } from "react";
import { PlusIcon } from "./Icons.jsx";

export function AddTodoForm({ onAdd, disabled = false }) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Write a task before adding it.");
      inputRef.current?.focus();
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await onAdd(trimmedTitle);
      setTitle("");
      inputRef.current?.focus();
    } catch (submitError) {
      setError(submitError.message || "Could not add this task.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChange(event) {
    setTitle(event.target.value);
    if (error) {
      setError("");
    }
  }

  return (
    <form className="composer" onSubmit={handleSubmit} noValidate>
      <div className="composer__row">
        <div className={`composer__field${error ? " composer__field--error" : ""}`}>
          <span className="composer__icon" aria-hidden="true">
            <PlusIcon size={20} />
          </span>
          <label className="sr-only" htmlFor="new-todo-title">
            New task
          </label>
          <input
            ref={inputRef}
            id="new-todo-title"
            className="composer__input"
            type="text"
            value={title}
            onChange={handleChange}
            placeholder="What needs doing?"
            maxLength={200}
            autoComplete="off"
            disabled={disabled || isSubmitting}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "composer-error" : undefined}
          />
        </div>

        <button
          className="button button--primary composer__submit"
          type="submit"
          disabled={disabled || isSubmitting || !title.trim()}
        >
          {isSubmitting ? (
            <span className="spinner spinner--light" aria-hidden="true" />
          ) : (
            <PlusIcon size={18} />
          )}
          <span>{isSubmitting ? "Adding" : "Add task"}</span>
        </button>
      </div>

      {error ? (
        <p className="composer__error" id="composer-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
