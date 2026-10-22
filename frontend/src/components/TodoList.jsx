import { EmptyState } from "./EmptyState.jsx";
import { TodoItem } from "./TodoItem.jsx";

export function TodoList({
  todos,
  filter,
  pendingIds,
  onToggle,
  onRename,
  onDelete,
}) {
  if (todos.length === 0) {
    return <EmptyState filter={filter} />;
  }

  return (
    <ul className="todo-list" aria-label="Tasks">
      {todos.map((todo, index) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          index={index}
          isBusy={pendingIds.has(todo.id)}
          onToggle={onToggle}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
