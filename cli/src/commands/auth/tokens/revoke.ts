import { Args, Flags } from "@oclif/core";
import { BaseCommand } from "../../../lib/base.js";
import { api } from "../../../lib/client.js";

export default class AuthTokensRevoke extends BaseCommand {
  static description = "Revocar un PAT por id";
  static args = { id: Args.string({ required: true }) };
  static flags = {
    ...BaseCommand.baseFlags,
    yes: Flags.boolean({ char: "y" }),
  };

  async run() {
    const { args, flags } = await this.parse(AuthTokensRevoke);
    if (!flags.yes) {
      this.log("Operación destructiva: re-ejecuta con --yes");
      return;
    }
    const data = await api("DELETE", `/api/v1/auth/tokens/${args.id}`, {
      profile: flags.profile,
      apiUrl: flags["api-url"],
    });
    this.print(data, flags.format, flags.json ?? false);
  }
}
