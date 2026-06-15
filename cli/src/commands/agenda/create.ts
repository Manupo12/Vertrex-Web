import { Flags } from "@oclif/core";
import { BaseCommand } from "../../lib/base.js";
import { api } from "../../lib/client.js";

export default class AgendaCreate extends BaseCommand {
  static description = "Crear un evento de agenda";
  static flags = {
    ...BaseCommand.baseFlags,
    title: Flags.string({ required: true }),
    description: Flags.string({}),
    start: Flags.string({ required: true, description: "ISO datetime" }),
    end: Flags.string({ required: true, description: "ISO datetime" }),
    "meet-link": Flags.string({}),
    reminder: Flags.integer({ description: "minutos antes" }),
    timezone: Flags.string({}),
  };

  async run() {
    const { flags } = await this.parse(AgendaCreate);
    const body: any = {
      title: flags.title,
      description: flags.description,
      startsAt: flags.start,
      endsAt: flags.end,
      meetLink: flags["meet-link"],
      reminderMinutes: flags.reminder,
      timezone: flags.timezone,
    };
    for (const k of Object.keys(body)) if (body[k] === undefined) delete body[k];
    if (flags["dry-run"]) {
      this.print({ wouldPOST: "/api/v1/agenda", body }, flags.format, flags.json);
      return;
    }
    const data = await api("POST", "/api/v1/agenda", { body, profile: flags.profile, apiUrl: flags["api-url"] });
    this.print(data, flags.format, flags.json);
  }
}
