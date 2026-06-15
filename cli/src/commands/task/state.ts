import { Args } from "@oclif/core";
import { BaseCommand } from "../../lib/base.js";
import { api } from "../../lib/client.js";

export default class TaskState extends BaseCommand {
  static description = "Cambiar el estado de una tarea";
  static args = {
    id: Args.string({ required: true }),
    state: Args.string({ required: true, description: "backlog|todo|in_progress|in_review|done|cancelled" }),
  };
  static flags = { ...BaseCommand.baseFlags };

  async run() {
    const { args, flags } = await this.parse(TaskState);
    if (flags["dry-run"]) {
      this.print({ wouldPOST: `/api/v1/tasks/${args.id}/state`, body: { state: args.state } }, flags.format, flags.json);
      return;
    }
    const data = await api("POST", `/api/v1/tasks/${args.id}/state`, {
      body: { state: args.state },
      profile: flags.profile,
      apiUrl: flags["api-url"],
    });
    this.print(data, flags.format, flags.json);
  }
}
