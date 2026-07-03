import { homedir } from "node:os";
import { join } from "node:path";
import { mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
const dir = process.env.VERTREX_CONFIG_DIR ||
    join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "vertrex");
const file = join(dir, "credentials.json");
function read() {
    try {
        return JSON.parse(readFileSync(file, "utf8"));
    }
    catch {
        return { profiles: {} };
    }
}
function write(s) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, JSON.stringify(s, null, 2));
    try {
        chmodSync(file, 0o600);
    }
    catch {
        // best-effort
    }
}
export function saveProfile(name, p) {
    const s = read();
    s.profiles[name] = p;
    write(s);
}
export function getProfile(name = process.env.VERTREX_PROFILE || "default") {
    return read().profiles[name] ?? null;
}
export function deleteProfile(name = "default") {
    const s = read();
    delete s.profiles[name];
    write(s);
}
export const defaultApiUrl = process.env.VERTREX_API_URL || "http://localhost:3000";
