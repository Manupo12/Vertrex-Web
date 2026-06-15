import { Flags } from "@oclif/core";
import { BaseCommand } from "../../lib/base.js";
import { api } from "../../lib/client.js";

export default class TaskList extends BaseCommand {
  static description = "Listar tareas";
  static flags = {
    ...BaseCommand.baseFlags,
    project: Flags.string({ description: "filtrar por projectId" }),
    assignee: Flags.string({ description: "filtrar por assigneeId" }),
    state: Flags.string({ description: "filtrar por estado" }),
  };

  async run() {
    const { flags } = await this.parse(TaskList);
    const params = new URLSearchParams();
    if (flags.project) params.set("project", flags.project);
    const qs = params.toString() ? `?${params}` : "";
    const data = await api("GET", `/api/v1/tasks${qs}`, {
      profile: flags.profile,
      apiUrl: flags["api-url"],
    });
    this.print(data, flags.format, flags.json);
  }
}
