/**
 * All HTTP communication with the backend lives in this module.
 *
 * Locally, requests go to http://localhost:5000/api. In production, set
 * NEXT_PUBLIC_API_URL to the deployed backend's URL, including /api, for
 * example https://my-api.onrender.com/api.
 *
 * NEXT_PUBLIC_ variables are embedded at build time, so redeploy the
 * frontend after changing this value.
 */
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, { status = 0, code = "REQUEST_FAILED", details } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(path, { method = "GET", body, signal } = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      "Could not reach the server. Check that the backend is running and try again.",
      { code: "NETWORK_ERROR" },
    );
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    throw new ApiError(
      data?.error?.message || `The request failed with status ${response.status}.`,
      {
        status: response.status,
        code: data?.error?.code || "REQUEST_FAILED",
        details: data?.error?.details,
      },
    );
  }

  return data;
}

export async function getTodos({ signal } = {}) {
  const data = await request("/todos", { signal });
  return data;
}

export async function createTodo(title) {
  const data = await request("/todos", {
    method: "POST",
    body: { title },
  });
  return data.todo;
}

export async function updateTodo(id, updates) {
  const data = await request(`/todos/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: updates,
  });
  return data.todo;
}

export async function deleteTodo(id) {
  await request(`/todos/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function getHealth({ signal } = {}) {
  return request("/health", { signal });
}
