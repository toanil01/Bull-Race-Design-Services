import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
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
    // Build URL with query parameters if provided
    let url = queryKey[0] as string;
    if (queryKey.length > 1 && queryKey[1]) {
      const params = new URLSearchParams();
      if (typeof queryKey[1] === "string" && queryKey[1] !== "all") {
        // Check if this is a categoryId for leaderboard/history
        if (url.includes("leaderboard")) {
          params.set("categoryId", queryKey[1]);
        } else if (url.includes("history")) {
          params.set("year", queryKey[1]);
          if (queryKey[2] && queryKey[2] !== "all") {
            params.set("categoryId", queryKey[2] as string);
          }
        }
      }
      const paramString = params.toString();
      if (paramString) {
        url = `${url}?${paramString}`;
      }
    }

    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
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
