import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TodoStore } from "./lib/todoStore.js";

const starterTodos = [
  {
    id: "8f14e45f-ceea-4a67-9b2b-0e6f6a1a7a01",
    title: "Read the project README",
    completed: true,
    createdAt: "2026-10-21T09:15:00.000Z",
    updatedAt: "2026-10-22T08:30:00.000Z",
  },
  {
    id: "8f14e45f-ceea-4a67-9b2b-0e6f6a1a7a02",
    title: "Add your first task",
    completed: false,
    createdAt: "2026-10-22T08:35:00.000Z",
    updatedAt: "2026-10-22T08:35:00.000Z",
  },
  {
    id: "8f14e45f-ceea-4a67-9b2b-0e6f6a1a7a03",
    title: "Explore the filters",
    completed: false,
    createdAt: "2026-10-22T08:40:00.000Z",
    updatedAt: "2026-10-22T08:40:00.000Z",
  },
];

const configuredDataFile = process.env.TODO_DATA_FILE?.trim();

export const todoStore = new TodoStore({
  // A mounted persistent disk can be used in production by setting
  // TODO_DATA_FILE to a path such as /var/data/todos.json.
  filePath: configuredDataFile
    ? path.resolve(configuredDataFile)
    : fileURLToPath(new URL("../data/todos.json", import.meta.url)),
  initialTodos: starterTodos,
});
