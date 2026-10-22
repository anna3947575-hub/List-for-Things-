import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { createApp } from "../src/app.js";
import { TodoStore } from "../src/lib/todoStore.js";

let server;
let baseUrl;
let store;
let dataDirectory;
let dataFile;

before(async () => {
  dataDirectory = await mkdtemp(path.join(tmpdir(), "focus-todos-"));
  dataFile = path.join(dataDirectory, "todos.json");
  store = new TodoStore({
    filePath: dataFile,
    initialTodos: [],
  });
  await store.init();

  const app = createApp({
    todoStore: store,
    allowedOrigins: ["http://localhost:3000"],
  });

  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });

  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await rm(dataDirectory, { recursive: true, force: true });
});

test("health check reports that the API is running", async () => {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(typeof body.timestamp, "string");
});

test("a task can be created, read, updated, and deleted", async () => {
  const createResponse = await fetch(`${baseUrl}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "  Write integration tests  " }),
  });
  const created = await createResponse.json();

  assert.equal(createResponse.status, 201);
  assert.equal(created.todo.title, "Write integration tests");
  assert.equal(created.todo.completed, false);
  assert.match(
    createResponse.headers.get("location"),
    new RegExp(`/api/todos/${created.todo.id}$`),
  );

  const listResponse = await fetch(`${baseUrl}/todos`);
  const listed = await listResponse.json();
  assert.equal(listed.count, 1);
  assert.equal(listed.todos[0].id, created.todo.id);

  const updateResponse = await fetch(`${baseUrl}/todos/${created.todo.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed: true }),
  });
  const updated = await updateResponse.json();
  assert.equal(updateResponse.status, 200);
  assert.equal(updated.todo.completed, true);

  const deleteResponse = await fetch(`${baseUrl}/todos/${created.todo.id}`, {
    method: "DELETE",
  });
  assert.equal(deleteResponse.status, 204);

  const missingResponse = await fetch(`${baseUrl}/todos/${created.todo.id}`, {
    method: "DELETE",
  });
  const missing = await missingResponse.json();
  assert.equal(missingResponse.status, 404);
  assert.equal(missing.error.code, "TODO_NOT_FOUND");
});

test("invalid request data returns consistent validation errors", async () => {
  const emptyTitle = await fetch(`${baseUrl}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "   " }),
  });
  const emptyTitleBody = await emptyTitle.json();

  assert.equal(emptyTitle.status, 400);
  assert.equal(emptyTitleBody.error.code, "VALIDATION_ERROR");
  assert.equal(emptyTitleBody.error.details[0].field, "title");

  const noFields = await fetch(`${baseUrl}/todos/some-id`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const noFieldsBody = await noFields.json();
  assert.equal(noFields.status, 400);
  assert.equal(noFieldsBody.error.code, "VALIDATION_ERROR");
});

test("malformed JSON and unknown routes return JSON errors", async () => {
  const badJson = await fetch(`${baseUrl}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"title":',
  });
  const badJsonBody = await badJson.json();
  assert.equal(badJson.status, 400);
  assert.equal(badJsonBody.error.code, "INVALID_JSON");

  const unknownRoute = await fetch(`${baseUrl}/not-a-route`);
  const unknownBody = await unknownRoute.json();
  assert.equal(unknownRoute.status, 404);
  assert.equal(unknownBody.error.code, "NOT_FOUND");
});

test("CORS allows configured origins and rejects others", async () => {
  const allowed = await fetch(`${baseUrl}/todos`, {
    headers: { Origin: "http://localhost:3000" },
  });
  assert.equal(allowed.status, 200);
  assert.equal(
    allowed.headers.get("access-control-allow-origin"),
    "http://localhost:3000",
  );

  const blocked = await fetch(`${baseUrl}/todos`, {
    headers: { Origin: "https://malicious.example" },
  });
  const blockedBody = await blocked.json();
  assert.equal(blocked.status, 403);
  assert.equal(blockedBody.error.code, "CORS_NOT_ALLOWED");
});

test("changes are persisted to the JSON file", async () => {
  const response = await fetch(`${baseUrl}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Persist me" }),
  });
  assert.equal(response.status, 201);

  const contents = await readFile(dataFile, "utf8");
  const fileTodos = JSON.parse(contents);
  assert.equal(Array.isArray(fileTodos), true);
  assert.equal(fileTodos.some((todo) => todo.title === "Persist me"), true);
});
