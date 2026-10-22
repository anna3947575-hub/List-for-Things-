import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * A tiny JSON-file data store.
 *
 * All write operations are queued so two requests can never write the file at
 * the same time. Writes go to a temporary file first and are then renamed over
 * the real file, which prevents a half-written JSON file if the process stops.
 */
export class TodoStore {
  #filePath;
  #initialTodos;
  #todos = [];
  #queue = Promise.resolve();

  constructor({ filePath, initialTodos = [] }) {
    this.#filePath = filePath;
    this.#initialTodos = initialTodos;
  }

  async init() {
    const directory = path.dirname(this.#filePath);
    await mkdir(directory, { recursive: true });

    try {
      const contents = await readFile(this.#filePath, "utf8");
      const parsed = JSON.parse(contents);
      this.#todos = this.#normalizeStoredTodos(parsed);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw new Error(
          `Could not load the todo data file at ${this.#filePath}: ${error.message}`,
        );
      }

      // First run: create the data file with the starter tasks.
      this.#todos = this.#initialTodos.map((todo) => ({ ...todo }));
      await this.#persist();
    }
  }

  async list() {
    // Wait for any in-flight write, then return copies so callers cannot
    // accidentally mutate the in-memory database.
    await this.#queue;
    return this.#clone(this.#todos);
  }

  async findById(id) {
    await this.#queue;
    const todo = this.#todos.find((item) => item.id === id);
    return todo ? { ...todo } : null;
  }

  async create({ title, completed = false }) {
    return this.#enqueue(async () => {
      const now = new Date().toISOString();
      const todo = {
        id: randomUUID(),
        title,
        completed,
        createdAt: now,
        updatedAt: now,
      };

      this.#todos = [todo, ...this.#todos];

      try {
        await this.#persist();
      } catch (error) {
        this.#todos = this.#todos.filter((item) => item.id !== todo.id);
        throw error;
      }

      return { ...todo };
    });
  }

  async update(id, updates) {
    return this.#enqueue(async () => {
      const index = this.#todos.findIndex((item) => item.id === id);

      if (index === -1) {
        return null;
      }

      const previous = this.#todos[index];
      const updated = {
        ...previous,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      this.#todos[index] = updated;

      try {
        await this.#persist();
      } catch (error) {
        this.#todos[index] = previous;
        throw error;
      }

      return { ...updated };
    });
  }

  async remove(id) {
    return this.#enqueue(async () => {
      const index = this.#todos.findIndex((item) => item.id === id);

      if (index === -1) {
        return false;
      }

      const [removed] = this.#todos.splice(index, 1);

      try {
        await this.#persist();
      } catch (error) {
        this.#todos.splice(index, 0, removed);
        throw error;
      }

      return true;
    });
  }

  #enqueue(operation) {
    const result = this.#queue.then(operation, operation);

    // Keep the queue alive after a failed operation so later writes still run.
    this.#queue = result.then(
      () => undefined,
      () => undefined,
    );

    return result;
  }

  async #persist() {
    const temporaryPath = `${this.#filePath}.${process.pid}.${Date.now()}.tmp`;
    const contents = `${JSON.stringify(this.#todos, null, 2)}\n`;

    try {
      await writeFile(temporaryPath, contents, "utf8");
      await rename(temporaryPath, this.#filePath);
    } catch (error) {
      await rm(temporaryPath, { force: true }).catch(() => {});
      throw error;
    }
  }

  #normalizeStoredTodos(parsed) {
    if (!Array.isArray(parsed)) {
      throw new Error("The data file must contain a JSON array of todos.");
    }

    return parsed.map((todo, index) => {
      if (
        !todo ||
        typeof todo !== "object" ||
        typeof todo.id !== "string" ||
        typeof todo.title !== "string" ||
        typeof todo.completed !== "boolean"
      ) {
        throw new Error(`Todo at index ${index} has an invalid shape.`);
      }

      return {
        id: todo.id,
        title: todo.title,
        completed: todo.completed,
        createdAt: todo.createdAt ?? new Date().toISOString(),
        updatedAt: todo.updatedAt ?? todo.createdAt ?? new Date().toISOString(),
      };
    });
  }

  #clone(todos) {
    return todos.map((todo) => ({ ...todo }));
  }
}
