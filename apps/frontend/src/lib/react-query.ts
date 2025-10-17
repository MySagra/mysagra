import { QueryClient, isServer } from "@tanstack/react-query";

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000 * 5, // 5 minutes
            }
        }
    });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
    if (isServer) {
        return makeQueryClient();
    }
    if (!browserQueryClient) {
        browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
}