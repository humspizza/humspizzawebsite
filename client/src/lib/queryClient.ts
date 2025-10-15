import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Global logout function to handle session expiry
let globalLogoutHandler: (() => void) | null = null;

export function setGlobalLogoutHandler(handler: () => void) {
  globalLogoutHandler = handler;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Handle 401 unauthorized - session expired
    if (res.status === 401 && globalLogoutHandler) {
      globalLogoutHandler();
      return; // Don't throw error, let logout handler take care of it
    }

    let errorMessage = res.statusText;
    try {
      const text = await res.text();
      const parsed = JSON.parse(text);
      errorMessage = parsed.message || text || res.statusText;
    } catch {
      errorMessage = res.statusText;
    }
    const error = new Error(errorMessage) as Error & { status: number };
    error.status = res.status;
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (res.status === 401) {
      // Handle session expiry with global logout
      if (globalLogoutHandler) {
        globalLogoutHandler();
        return null; // Return null to prevent further processing
      }

      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
    }

    if (!res.ok) {
      let errorMessage = res.statusText;
      try {
        const text = await res.text();
        const parsed = JSON.parse(text);
        errorMessage = parsed.message || text || res.statusText;
      } catch {
        errorMessage = res.statusText;
      }
      const error = new Error(errorMessage) as Error & { status: number };
      error.status = res.status;
      throw error;
    }

    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
