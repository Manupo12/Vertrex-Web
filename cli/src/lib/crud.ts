import { Args, Flags } from "@oclif/core";
import { BaseCommand } from "./base.js";
import { api, CliError } from "./client.js";

type FlagBag = Record<string, any>;

export function makeListCommand(listPath: string, description: string) {
  class ListCommand extends BaseCommand {
    static description = description;
    static flags = {
      ...BaseCommand.baseFlags,
      q: Flags.string({ description: "búsqueda (soportada por algunos recursos)" }),
      limit: Flags.integer({ default: 100 }),
    };

    async run() {
      const { flags } = (await this.parse(ListCommand)) as unknown as { flags: FlagBag };
      const params = new URLSearchParams();
      if (flags.q) params.set("q", flags.q);
      if (flags.limit && flags.limit !== 100) params.set("limit", String(flags.limit));
      const qs = params.toString() ? `?${params}` : "";
      const data = await api("GET", `${listPath}${qs}`, {
        profile: flags.profile,
        apiUrl: flags["api-url"],
      });
      this.print(data, flags.format, flags.json ?? false);
    }
  }
  return ListCommand as unknown as { new (...args: any[]): BaseCommand };
}

export function makeGetCommand(getPathFor: (id: string) => string, description: string) {
  class GetCommand extends BaseCommand {
    static description = description;
    static args = { id: Args.string({ required: true }) };
    static flags = { ...BaseCommand.baseFlags };

    async run() {
      const { args, flags } = (await this.parse(GetCommand)) as unknown as {
        args: { id: string };
        flags: FlagBag;
      };
      const data = await api("GET", getPathFor(args.id), {
        profile: flags.profile,
        apiUrl: flags["api-url"],
      });
      this.print(data, flags.format, flags.json ?? false);
    }
  }
  return GetCommand as unknown as { new (...args: any[]): BaseCommand };
}

export function makeDeleteCommand(delPathFor: (id: string) => string, description: string) {
  class DeleteCommand extends BaseCommand {
    static description = description;
    static args = { id: Args.string({ required: true }) };
    static flags = { ...BaseCommand.baseFlags };

    async run() {
      const { args, flags } = (await this.parse(DeleteCommand)) as unknown as {
        args: { id: string };
        flags: FlagBag;
      };
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
  return DeleteCommand as unknown as { new (...args: any[]): BaseCommand };
}
