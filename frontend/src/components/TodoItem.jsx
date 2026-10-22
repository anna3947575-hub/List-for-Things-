import { useEffect, useRef, useState } from "react";
import { CheckIcon, PencilIcon, TrashIcon, XIcon } from "./Icons.jsx";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

function getMeta(todo) {
  const date = new Date(todo.completed ? todo.updatedAt : todo.createdAt);

  if (Number.isNaN(date.getTime())) {
    return todo.completed ? "Completed" : "Added";
  }

  return `${todo.completed ? "Completed" : "Added"} ${dateFormatter.format(date)}`;
}

export function TodoItem({
  todo,
  index = 0,
  isBusy = false,
  onToggle,
  onRename,
  onDelete,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);
  const [editError, setEditError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  function startEditing() {
    if (isBusy || isSaving) {
      return;
    }

    setDraft(todo.title);
    setEditError("");
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setDraft(todo.title);
    setEditError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedTitle = draft.trim();

    if (!trimmedTitle) {
      setEditError("A task needs a title.");
      inputRef.current?.focus();
      return;
    }

    if (trimmedTitle === todo.title) {
      cancelEditing();
      return;
    }

    setEditError("");
    setIsSaving(true);

    try {
      await onRename(todo.id, trimmedTitle);
      setIsEditing(false);
    } catch (error) {
      setEditError(error.message || "Could not save this change.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleEditKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing();
    }
  }

  const itemIsBusy = isBusy || isSaving;

  return (
    <li
      className={`todo-item${todo.completed ? " todo-item--completed" : ""}${
        itemIsBusy ? " todo-item--busy" : ""
      }`}
      style={{ "--enter-delay": `${Math.min(index, 8) * 45}ms` }}
      aria-busy={itemIsBusy}
    >
      <label className="todo-check">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo)}
          disabled={itemIsBusy}
          aria-label={
            todo.completed
              ? `Mark "${todo.title}" as incomplete`
              : `Mark "${todo.title}" as complete`
          }
        />
        <span className="todo-check__box" aria-hidden="true">
          <CheckIcon size={13} />
        </span>
      </label>

      {isEditing ? (
        <form className="todo-edit" onSubmit={handleSubmit} noValidate>
          <div className="todo-edit__row">
            <label className="sr-only" htmlFor={`edit-${todo.id}`}>
              Edit task title
            </label>
            <input
              ref={inputRef}
              id={`edit-${todo.id}`}
              className="todo-edit__input"
              type="text"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                if (editError) {
                  setEditError("");
                }
              }}
              onKeyDown={handleEditKeyDown}
              maxLength={200}
              disabled={isSaving}
            />
            <button
              className="icon-button icon-button--confirm"
              type="submit"
              disabled={isSaving || !draft.trim()}
              aria-label="Save task title"
              title="Save"
            >
              {isSaving ? (
                <span className="spinner spinner--small" aria-hidden="true" />
              ) : (
                <CheckIcon size={16} />
              )}
            </button>
            <button
              className="icon-button"
              type="button"
              onClick={cancelEditing}
              disabled={isSaving}
              aria-label="Cancel editing"
              title="Cancel"
            >
              <XIcon size={16} />
            </button>
          </div>
          {editError ? (
            <p className="todo-edit__error" role="alert">
              {editError}
            </p>
          ) : null}
        </form>
      ) : (
        <>
          <div className="todo-item__content">
            <p className="todo-item__title" onDoubleClick={startEditing}>
              {todo.title}
            </p>
            <p className="todo-item__meta">{getMeta(todo)}</p>
          </div>

          <div className="todo-item__actions">
            {isBusy ? (
              <span className="spinner spinner--small" aria-hidden="true" />
            ) : (
              <>
                <button
                  className="icon-button"
                  type="button"
                  onClick={startEditing}
                  aria-label={`Edit "${todo.title}"`}
                  title="Edit task"
                >
                  <PencilIcon size={16} />
                </button>
                <button
                  className="icon-button icon-button--danger"
                  type="button"
                  onClick={() => onDelete(todo)}
                  aria-label={`Delete "${todo.title}"`}
                  title="Delete task"
                >
                  <TrashIcon size={16} />
                </button>
              </>
            )}
          </div>
        </>
      )}
    </li>
  );
}
