export interface HealthCheckResult {
  ok: boolean;
  responseTimeMs: number;
  isMock: boolean;
  error?: string;
}

const TIMEOUT_MS = 5000;

/**
 * Checks if the configured endpoint is empty or undefined, which triggers Mock Mode.
 */
export function isMockModeConfigured(): boolean {
  const url = import.meta.env.VITE_API_URL;
  return !url || url.trim().length === 0;
}

/**
 * Safely extracts the boolean `ok` from either a direct payload `{ ok: boolean }`
 * or an AWS Lambda proxy integration response `{ statusCode: number, body: string }`.
 * Returns null if the payload does not match the expected schema.
 */
function extractHealthOk(data: unknown): boolean | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }

  // Handle direct payload { ok: boolean }
  if ("ok" in data && typeof (data as { ok: unknown }).ok === "boolean") {
    return (data as { ok: boolean }).ok;
  }

  // Handle AWS Lambda proxy integration response { body: string }
  if ("body" in data && typeof (data as { body: unknown }).body === "string") {
    try {
      const parsed = JSON.parse((data as { body: string }).body) as unknown;
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "ok" in parsed &&
        typeof (parsed as { ok: unknown }).ok === "boolean"
      ) {
        return (parsed as { ok: boolean }).ok;
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Checks the Lambda health endpoint with strict timeout and response validation.
 * Never leaks raw server traces or unvetted error strings.
 */
export async function checkLambdaHealth(): Promise<HealthCheckResult> {
  const apiUrl = import.meta.env.VITE_API_URL?.trim();
  const startTime = performance.now();

  // MOCK MODE: simulated network response when no endpoint is configured
  if (!apiUrl) {
    // Simulate realistic cloud network latency (between 120ms and 240ms)
    const simulatedLatency = Math.floor(Math.random() * 120) + 120;
    await new Promise((resolve) => setTimeout(resolve, simulatedLatency));
    const elapsed = Math.round(performance.now() - startTime);

    return {
      ok: true,
      responseTimeMs: elapsed,
      isMock: true,
    };
  }

  // REAL API MODE: fetch with AbortController and strict 5-second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        ok: false,
        responseTimeMs: Math.round(performance.now() - startTime),
        isMock: false,
        error: "Endpoint returned an unhealthy response status.",
      };
    }

    const json = (await response.json()) as unknown;
    const isOk = extractHealthOk(json);

    if (isOk === null) {
      return {
        ok: false,
        responseTimeMs: Math.round(performance.now() - startTime),
        isMock: false,
        error: "Endpoint response did not match the expected schema.",
      };
    }

    return {
      ok: isOk,
      responseTimeMs: Math.round(performance.now() - startTime),
      isMock: false,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    const elapsed = Math.round(performance.now() - startTime);

    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        ok: false,
        responseTimeMs: elapsed,
        isMock: false,
        error: "Request timed out after 5 seconds.",
      };
    }

    // Generic safe error message: never display raw internal server errors
    return {
      ok: false,
      responseTimeMs: elapsed,
      isMock: false,
      error: "Unable to connect to the health check endpoint.",
    };
  }
}
