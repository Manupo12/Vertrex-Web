import { Command, Flags } from "@oclif/core";
import { format } from "./output.js";
import { CliError } from "./client.js";
export class BaseCommand extends Command {
    static baseFlags = {
        format: Flags.string({
            options: ["table", "json", "yaml", "csv"],
            default: "table",
        }),
        json: Flags.boolean({ description: "atajo de --format json" }),
        profile: Flags.string({ description: "perfil de credenciales" }),
        "api-url": Flags.string({ description: "URL base de la API" }),
        yes: Flags.boolean({ char: "y", description: "confirmar operaciones destructivas" }),
        "dry-run": Flags.boolean({ description: "mostrar sin ejecutar" }),
    };
    print(data, fmt, json) {
        this.log(format(data, (json ? "json" : fmt)));
    }
    async catch(err) {
        if (err instanceof CliError) {
            this.error(err.message, { exit: err.exitCode ?? 1, code: err.code });
        }
        return super.catch(err);
    }
}
