import { Args, Flags } from "@oclif/core";
import { BaseCommand } from "../lib/base.js";
import { api } from "../lib/client.js";

export default class Search extends BaseCommand {
  static description = "Búsqueda global en el OS";
  static args = { query: Args.string({ required: true }) };
  static flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({ default: 25 }),
  };

  async run() {
    const { args, flags } = await this.parse(Search);
    const qs = `?q=${encodeURIComponent(args.query)}&limit=${flags.limit ?? 25}`;
    const data = await api("GET", `/api/v1/search${qs}`, {
      profile: flags.profile,
      apiUrl: flags["api-url"],
    });
    this.print(data, flags.format, flags.json ?? false);
  }
}
