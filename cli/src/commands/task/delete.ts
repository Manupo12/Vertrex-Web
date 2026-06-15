import { Args } from "@oclif/core";
import { BaseCommand } from "../../lib/base.js";
import { api, CliError } from "../../lib/client.js";

export default class TaskDelete extends BaseCommand {
  static description = "Borrar una tarea (destructivo, requiere --yes)";
  static args = { id: Args.string({ required: true }) };
  static flags = { ...BaseCommand.baseFlags };

  async run() {
    const { args, flags } = await this.parse(TaskDelete);
    if (!flags.yes && !flags["dry-run"]) {
      throw new CliError("Operación destructiva: re-ejecuta con --yes", 64);
    }
    if (flags["dry-run"]) {
      this.print({ wouldDELETE: `/api/v1/tasks/${args.id}` }, flags.format, flags.json);
      return;
    }
    const data = await api("DELETE", `/api/v1/tasks/${args.id}`, {
      profile: flags.profile,
      apiUrl: flags["api-url"],
    });
    this.print(data, flags.format, flags.json);
  }
}
