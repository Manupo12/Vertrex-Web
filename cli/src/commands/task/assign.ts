import { Args, Flags } from "@oclif/core";
import { BaseCommand } from "../../lib/base.js";
import { api } from "../../lib/client.js";

export default class TaskAssign extends BaseCommand {
  static description = "Asignar una tarea a un usuario (o 'none' para desasignar)";
  static args = { id: Args.string({ required: true }) };
  static flags = {
    ...BaseCommand.baseFlags,
    to: Flags.string({ required: true, description: "userId, 'me' o 'none'" }),
  };

  async run() {
    const { args, flags } = await this.parse(TaskAssign);
    const body: any = { assigneeId: flags.to === "none" ? null : flags.to };
    if (flags["dry-run"]) {
      this.print({ wouldPOST: `/api/v1/tasks/${args.id}/assign`, body }, flags.format, flags.json);
      return;
    }
    const data = await api("POST", `/api/v1/tasks/${args.id}/assign`, {
      body,
      profile: flags.profile,
      apiUrl: flags["api-url"],
    });
    this.print(data, flags.format, flags.json);
  }
}
