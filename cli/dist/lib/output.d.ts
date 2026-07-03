export type Fmt = "table" | "json" | "yaml" | "csv";
export declare function format(data: unknown, fmt: Fmt): string;
