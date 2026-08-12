import { API_BASE_URL } from "../constants.js";

export type QueryParams = Record<string, string | number | boolean | undefined>;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function buildUrl(path: string, query?: QueryParams): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function request<T>(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: unknown,
  query?: QueryParams,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new ApiError(0, `Could not reach the SIPOC backend at ${API_BASE_URL} (${error instanceof Error ? error.message : String(error)})`);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new ApiError(response.status, detail || response.statusText);
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

/** Fetches the raw response for endpoints that don't return JSON (e.g. zip exports). */
async function requestBinary(path: string, query?: QueryParams): Promise<ArrayBuffer> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), { headers: { Accept: "application/zip" } });
  } catch (error) {
    throw new ApiError(0, `Could not reach the SIPOC backend at ${API_BASE_URL} (${error instanceof Error ? error.message : String(error)})`);
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new ApiError(response.status, detail || response.statusText);
  }
  return response.arrayBuffer();
}

export const apiGet = <T>(path: string, query?: QueryParams): Promise<T> => request<T>(path, "GET", undefined, query);
export const apiPost = <T>(path: string, body?: unknown, query?: QueryParams): Promise<T> => request<T>(path, "POST", body, query);
export const apiPatch = <T>(path: string, body?: unknown): Promise<T> => request<T>(path, "PATCH", body);
export const apiDelete = <T>(path: string): Promise<T> => request<T>(path, "DELETE");
export const apiGetBinary = (path: string, query?: QueryParams): Promise<ArrayBuffer> => requestBinary(path, query);

export function handleApiError(error: unknown, entityHint = "resource"): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 0:
        return `Error: ${error.message}. Is the backend running (./sipoc.sh start)?`;
      case 404:
        return `Error: ${entityHint} not found. Double-check the id you passed.`;
      case 400:
        return `Error: invalid request — ${error.message}`;
      case 409:
        return `Error: conflict — ${error.message}. This often means a referenced entity isn't attached to the same Lipok yet.`;
      default:
        return `Error: API request failed with status ${error.status}. ${error.message}`;
    }
  }
  return `Error: unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`;
}
