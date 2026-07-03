export declare class CliError extends Error {
    exitCode: number;
    code?: string | undefined;
    constructor(message: string, exitCode?: number, code?: string | undefined);
}
export declare function api<T = unknown>(method: string, path: string, opts?: {
    body?: unknown;
    profile?: string;
    apiUrl?: string;
    token?: string;
}): Promise<T>;
