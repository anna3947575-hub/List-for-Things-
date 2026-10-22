import { HttpError } from "./httpError.js";

const MAX_TITLE_LENGTH = 200;

function ensurePlainObject(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(
      400,
      "INVALID_BODY",
      "Request body must be a JSON object.",
    );
  }
}

function validateTitle(value, errors) {
  if (typeof value !== "string") {
    errors.push({ field: "title", message: "Title must be a string." });
    return undefined;
  }

  const title = value.trim();

  if (!title) {
    errors.push({ field: "title", message: "Title cannot be empty." });
  } else if (title.length > MAX_TITLE_LENGTH) {
    errors.push({
      field: "title",
      message: `Title cannot be longer than ${MAX_TITLE_LENGTH} characters.`,
    });
  }

  return title;
}

function validateCompleted(value, errors) {
  if (typeof value !== "boolean") {
    errors.push({
      field: "completed",
      message: "Completed must be a boolean (true or false).",
    });
    return undefined;
  }

  return value;
}

function throwIfInvalid(errors) {
  if (errors.length > 0) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "The request contains invalid data.",
      errors,
    );
  }
}

export function validateCreateTodo(body) {
  ensurePlainObject(body);

  const errors = [];

  if (body.title === undefined) {
    errors.push({ field: "title", message: "Title is required." });
  }

  const title = body.title === undefined ? undefined : validateTitle(body.title, errors);

  let completed = false;
  if (body.completed !== undefined) {
    completed = validateCompleted(body.completed, errors);
  }

  throwIfInvalid(errors);

  return { title, completed };
}

export function validateUpdateTodo(body) {
  ensurePlainObject(body);

  const errors = [];
  const updates = {};

  if (body.title === undefined && body.completed === undefined) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Provide at least a title or a completed value to update.",
      [{ field: "body", message: "No supported fields were provided." }],
    );
  }

  if (body.title !== undefined) {
    updates.title = validateTitle(body.title, errors);
  }

  if (body.completed !== undefined) {
    updates.completed = validateCompleted(body.completed, errors);
  }

  throwIfInvalid(errors);

  return updates;
}
