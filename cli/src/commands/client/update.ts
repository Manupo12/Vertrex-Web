import { Args, Flags } from "@oclif/core";
import { BaseCommand } from "../../lib/base.js";
import { api } from "../../lib/client.js";

export default class ClientUpdate extends BaseCommand {
  static description = "Actualizar un cliente (PATCH)";
  static args = { id: Args.string({ required: true, description: "id o slug" }) };
  static flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({}),
    email: Flags.string({}),
    phone: Flags.string({}),
    status: Flags.string({}),
  };

  async run() {
    const { args, flags } = await this.parse(ClientUpdate);
    const body: any = { name: flags.name, email: flags.email, phone: flags.phone, status: flags.status };
    for (const k of Object.keys(body)) if (body[k] === undefined) delete body[k];
    if (flags["dry-run"]) {
      this.print({ wouldPATCH: `/api/v1/clients/${args.id}`, body }, flags.format, flags.json);
      return;
    }
    const data = await api("PATCH", `/api/v1/clients/${args.id}`, { body, profile: flags.profile, apiUrl: flags["api-url"] });
    this.print(data, flags.format, flags.json);
  }
}
