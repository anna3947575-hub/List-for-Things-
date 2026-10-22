import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createTodo,
  deleteTodo,
  getTodos,
  updateTodo,
} from "./api/todos.js";
import { AddTodoForm } from "./components/AddTodoForm.jsx";
import { ErrorBanner } from "./components/ErrorBanner.jsx";
import { FilterBar } from "./components/FilterBar.jsx";
import { CheckIcon } from "./components/Icons.jsx";
import { LoadErrorState } from "./components/LoadErrorState.jsx";
import { TodoList } from "./components/TodoList.jsx";
import { TodoListSkeleton } from "./components/TodoListSkeleton.jsx";

function describeError(error) {
  return (
    error?.message ||
    "Something went wrong. Please check your connection and try again."
  );
}

export default function App() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingIds, setPendingIds] = useState(() => new Set());

  const loadTodos = useCallback(async (signal) => {
    setIsLoading(true);
    setLoadError("");

    try {
      const data = await getTodos({ signal });
      setTodos(Array.isArray(data.todos) ? data.todos : []);
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }
      setLoadError(describeError(error));
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadTodos(controller.signal);
    return () => controller.abort();
  }, [loadTodos]);

  function setItemPending(id, isPending) {
    setPendingIds((current) => {
      const next = new Set(current);
      if (isPending) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  async function handleAdd(title) {
    const created = await createTodo(title);

    setTodos((current) => [created, ...current]);
    setActionError("");
    // A new task is never completed, so leave a completed-only view where the
    // user can actually see what they just created.
    setFilter((current) => (current === "completed" ? "all" : current));
  }

  async function handleToggle(todo) {
    if (pendingIds.has(todo.id)) {
      return;
    }

    setItemPending(todo.id, true);
    setActionError("");

    try {
      const updated = await updateTodo(todo.id, {
        completed: !todo.completed,
      });
      setTodos((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (error) {
      setActionError(describeError(error));
    } finally {
      setItemPending(todo.id, false);
    }
  }

  async function handleRename(id, title) {
    setItemPending(id, true);
    setActionError("");

    try {
      const updated = await updateTodo(id, { title });
      setTodos((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (error) {
      throw new Error(describeError(error));
    } finally {
      setItemPending(id, false);
    }
  }

  async function handleDelete(todo) {
    if (pendingIds.has(todo.id)) {
      return;
    }

    setItemPending(todo.id, true);
    setActionError("");

    try {
      await deleteTodo(todo.id);
      setTodos((current) => current.filter((item) => item.id !== todo.id));
    } catch (error) {
      setActionError(describeError(error));
    } finally {
      setItemPending(todo.id, false);
    }
  }

  const counts = useMemo(
    () => ({
      all: todos.length,
      active: todos.filter((todo) => !todo.completed).length,
      completed: todos.filter((todo) => todo.completed).length,
    }),
    [todos],
  );

  const visibleTodos = useMemo(() => {
    if (filter === "active") {
      return todos.filter((todo) => !todo.completed);
    }
    if (filter === "completed") {
      return todos.filter((todo) => todo.completed);
    }
    return todos;
  }, [filter, todos]);

  const percentComplete =
    counts.all === 0 ? 0 : Math.round((counts.completed / counts.all) * 100);

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(new Date()),
    [],
  );

  const isLoadingOrFailed = isLoading || Boolean(loadError);

  return (
    <div className="page">
      <div className="page__glow page__glow--sage" aria-hidden="true" />
      <div className="page__glow page__glow--clay" aria-hidden="true" />

      <a className="skip-link" href="#main-content">
        Skip to tasks
      </a>

      <div className="app">
        <header className="app-header">
          <div className="app-header__top">
            <div className="brand">
              <span className="brand__mark" aria-hidden="true">
                <CheckIcon size={17} />
              </span>
              <span className="brand__name">
                focus<span className="brand__dot">.</span>
              </span>
            </div>
            <p className="app-header__date">{today}</p>
          </div>

          <div className="hero">
            <div className="hero__copy">
              <p className="eyebrow">Your personal task list</p>
              <h1>
                Make today <em>lighter.</em>
              </h1>
              <p className="hero__lede">
                Capture what needs doing, keep it in one calm place, and enjoy
                the quiet satisfaction of checking it off.
              </p>
            </div>

            <div className="hero-stats" aria-label="Task summary">
              <div className="hero-stats__item">
                <strong>{isLoading ? "—" : counts.active}</strong>
                <span>to do</span>
              </div>
              <span className="hero-stats__divider" aria-hidden="true" />
              <div className="hero-stats__item">
                <strong>{isLoading ? "—" : counts.completed}</strong>
                <span>done</span>
              </div>
            </div>
          </div>
        </header>

        <main className="main" id="main-content">
          <section className="workspace" aria-labelledby="workspace-heading">
            <h2 className="sr-only" id="workspace-heading">
              Your tasks
            </h2>

            <AddTodoForm onAdd={handleAdd} disabled={isLoadingOrFailed} />

            {actionError ? (
              <ErrorBanner
                message={actionError}
                onDismiss={() => setActionError("")}
              />
            ) : null}

            <div className="workspace__toolbar">
              <FilterBar
                filter={filter}
                onChange={setFilter}
                counts={counts}
              />
              <p className="workspace__summary" aria-live="polite">
                {isLoading
                  ? "Loading tasks…"
                  : loadError
                    ? "Could not load tasks"
                    : counts.active === 1
                      ? "1 task open"
                      : `${counts.active} tasks open`}
              </p>
            </div>

            <div className="workspace__content">
              {isLoading ? <TodoListSkeleton /> : null}

              {!isLoading && loadError ? (
                <LoadErrorState
                  message={loadError}
                  onRetry={() => loadTodos()}
                />
              ) : null}

              {!isLoading && !loadError ? (
                <TodoList
                  todos={visibleTodos}
                  filter={filter}
                  pendingIds={pendingIds}
                  onToggle={handleToggle}
                  onRename={handleRename}
                  onDelete={handleDelete}
                />
              ) : null}
            </div>

            {!isLoading && !loadError && counts.all > 0 ? (
              <footer className="progress">
                <div className="progress__row">
                  <span>Daily progress</span>
                  <strong>{percentComplete}%</strong>
                </div>
                <div
                  className="progress__track"
                  role="progressbar"
                  aria-label="Tasks completed"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow={percentComplete}
                >
                  <span
                    className="progress__fill"
                    style={{ width: `${percentComplete}%` }}
                  />
                </div>
                <p className="progress__caption">
                  {counts.active === 0
                    ? "Everything is complete. Nicely done."
                    : counts.active === 1
                      ? "One task left — you've got this."
                      : `${counts.active} tasks left — one at a time.`}
                </p>
              </footer>
            ) : null}
          </section>

          <p className="save-note">
            <span className="save-note__dot" aria-hidden="true" />
            Your tasks are saved to the backend&apos;s JSON database.
          </p>
        </main>
      </div>
    </div>
  );
}
