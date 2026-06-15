import { Args, Flags } from "@oclif/core";
import { BaseCommand } from "../lib/base.js";
import { api } from "../lib/client.js";

export default class Do extends BaseCommand {
  static description =
    "Ejecutar una intención en lenguaje natural. Por defecto muestra un plan (dry-run); con --yes ejecuta.";

  static args = { intent: Args.string({ required: true }) };
  static flags = {
    ...BaseCommand.baseFlags,
    yes: Flags.boolean({ char: "y", description: "ejecutar el plan (sin esto solo muestra el plan)" }),
  };

  async run() {
    const { args, flags } = await this.parse(Do);
    const data = await api("POST", "/api/v1/intent", {
      body: { intent: args.intent, execute: flags.yes === true },
      profile: flags.profile,
      apiUrl: flags["api-url"],
    });
    this.print(data, flags.format, flags.json ?? false);
  }
}
