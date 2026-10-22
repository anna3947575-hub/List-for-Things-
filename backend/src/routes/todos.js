import { Router } from "express";
import { HttpError } from "../lib/httpError.js";
import {
  validateCreateTodo,
  validateUpdateTodo,
} from "../lib/validation.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export function createTodosRouter(store) {
  const router = Router();

  // GET /api/todos
  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const todos = await store.list();
      res.json({ todos, count: todos.length });
    }),
  );

  // POST /api/todos
  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const input = validateCreateTodo(req.body);
      const todo = await store.create(input);

      res
        .status(201)
        .location(`/api/todos/${todo.id}`)
        .json({ todo });
    }),
  );

  // PATCH /api/todos/:id
  router.patch(
    "/:id",
    asyncHandler(async (req, res) => {
      const updates = validateUpdateTodo(req.body);
      const todo = await store.update(req.params.id, updates);

      if (!todo) {
        throw new HttpError(
          404,
          "TODO_NOT_FOUND",
          "The task you tried to update does not exist.",
        );
      }

      res.json({ todo });
    }),
  );

  // DELETE /api/todos/:id
  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const removed = await store.remove(req.params.id);

      if (!removed) {
        throw new HttpError(
          404,
          "TODO_NOT_FOUND",
          "The task you tried to delete does not exist.",
        );
      }

      res.status(204).end();
    }),
  );

  return router;
}
