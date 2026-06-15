import { Args, Flags } from "@oclif/core";
import { BaseCommand } from "../../lib/base.js";
import { api } from "../../lib/client.js";

export default class TaskUpdate extends BaseCommand {
  static description = "Actualizar una tarea (PATCH)";
  static args = { id: Args.string({ required: true }) };
  static flags = {
    ...BaseCommand.baseFlags,
    title: Flags.string({}),
    priority: Flags.integer({}),
    assignee: Flags.string({}),
    state: Flags.string({}),
    due: Flags.string({ description: "ISO date" }),
    type: Flags.string({}),
  };

  async run() {
    const { args, flags } = await this.parse(TaskUpdate);
    const body: any = {
      title: flags.title,
      priority: flags.priority,
      assigneeId: flags.assignee,
      state: flags.state,
      dueDate: flags.due,
      taskType: flags.type,
    };
    // strip undefined
    for (const k of Object.keys(body)) if (body[k] === undefined) delete body[k];
    if (flags["dry-run"]) {
      this.print({ wouldPATCH: `/api/v1/tasks/${args.id}`, body }, flags.format, flags.json);
      return;
    }
    const data = await api("PATCH", `/api/v1/tasks/${args.id}`, {
      body,
      profile: flags.profile,
      apiUrl: flags["api-url"],
    });
    this.print(data, flags.format, flags.json);
  }
}
