import { Args, Flags } from "@oclif/core";
import { BaseCommand } from "../../lib/base.js";
import { api } from "../../lib/client.js";

export default class AgendaUpdate extends BaseCommand {
  static description = "Actualizar un evento de agenda (PATCH)";
  static args = { id: Args.string({ required: true }) };
  static flags = {
    ...BaseCommand.baseFlags,
    title: Flags.string({}),
    description: Flags.string({}),
    start: Flags.string({ description: "ISO datetime" }),
    end: Flags.string({ description: "ISO datetime" }),
    "meet-link": Flags.string({}),
    reminder: Flags.integer({}),
  };

  async run() {
    const { args, flags } = await this.parse(AgendaUpdate);
    const body: any = {
      title: flags.title,
      description: flags.description,
      startsAt: flags.start,
      endsAt: flags.end,
      meetLink: flags["meet-link"],
      reminderMinutes: flags.reminder,
    };
    for (const k of Object.keys(body)) if (body[k] === undefined) delete body[k];
    if (flags["dry-run"]) {
      this.print({ wouldPATCH: `/api/v1/agenda/${args.id}`, body }, flags.format, flags.json);
      return;
    }
    const data = await api("PATCH", `/api/v1/agenda/${args.id}`, { body, profile: flags.profile, apiUrl: flags["api-url"] });
    this.print(data, flags.format, flags.json);
  }
}
