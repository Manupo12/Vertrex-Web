import { Args, Flags } from "@oclif/core";
import { BaseCommand } from "./base.js";
import { api, CliError } from "./client.js";
export function makeListCommand(listPath, description) {
    class ListCommand extends BaseCommand {
        static description = description;
        static flags = {
            ...BaseCommand.baseFlags,
            q: Flags.string({ description: "búsqueda (soportada por algunos recursos)" }),
            limit: Flags.integer({ default: 100 }),
        };
        async run() {
            const { flags } = (await this.parse(ListCommand));
            const params = new URLSearchParams();
            if (flags.q)
                params.set("q", flags.q);
            if (flags.limit && flags.limit !== 100)
                params.set("limit", String(flags.limit));
            const qs = params.toString() ? `?${params}` : "";
            const data = await api("GET", `${listPath}${qs}`, {
                profile: flags.profile,
                apiUrl: flags["api-url"],
            });
            this.print(data, flags.format, flags.json ?? false);
        }
    }
    return ListCommand;
}
export function makeGetCommand(getPathFor, description) {
    class GetCommand extends BaseCommand {
        static description = description;
        static args = { id: Args.string({ required: true }) };
        static flags = { ...BaseCommand.baseFlags };
        async run() {
            const { args, flags } = (await this.parse(GetCommand));
            const data = await api("GET", getPathFor(args.id), {
                profile: flags.profile,
                apiUrl: flags["api-url"],
            });
            this.print(data, flags.format, flags.json ?? false);
        }
    }
    return GetCommand;
}
export function makeDeleteCommand(delPathFor, description) {
    class DeleteCommand extends BaseCommand {
        static description = description;
        static args = { id: Args.string({ required: true }) };
        static flags = { ...BaseCommand.baseFlags };
        async run() {
            const { args, flags } = (await this.parse(DeleteCommand));
            if (!flags.yes && !flags["dry-run"]) {
                throw new CliError("Operación destructiva: re-ejecuta con --yes", 64);
            }
            if (flags["dry-run"]) {
                this.print({ wouldDELETE: delPathFor(args.id) }, flags.format, flags.json ?? false);
                return;
            }
            const data = await api("DELETE", delPathFor(args.id), {
                profile: flags.profile,
                apiUrl: flags["api-url"],
            });
            this.print(data, flags.format, flags.json ?? false);
        }
    }
    return DeleteCommand;
}
