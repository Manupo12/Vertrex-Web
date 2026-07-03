import { createInterface } from "node:readline";
export async function prompt(question, opts = {}) {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: opts.hide });
    if (opts.hide)
        process.stdout.write("\u001B[?25l");
    return new Promise((res) => {
        rl.question(question + (opts.hide ? "" : " "), (answer) => {
            rl.close();
            if (opts.hide)
                process.stdout.write("\n\u001B[?25h");
            res(answer);
        });
    });
}
