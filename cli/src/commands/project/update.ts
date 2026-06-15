import { Args, Flags } from "@oclif/core";
import { BaseCommand } from "../../lib/base.js";
import { api } from "../../lib/client.js";

export default class ProjectUpdate extends BaseCommand {
  static description = "Actualizar un proyecto (PATCH)";
  static args = { id: Args.string({ required: true }) };
  static flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({}),
    status: Flags.string({}),
    progress: Flags.integer({}),
    "current-version": Flags.string({}),
  };

  async run() {
    const { args, flags } = await this.parse(ProjectUpdate);
    const body: any = {
      name: flags.name,
      status: flags.status,
      progress: flags.progress,
      currentVersion: flags["current-version"],
    };
    for (const k of Object.keys(body)) if (body[k] === undefined) delete body[k];
    if (flags["dry-run"]) {
      this.print({ wouldPATCH: `/api/v1/projects/${args.id}`, body }, flags.format, flags.json);
      return;
    }
    const data = await api("PATCH", `/api/v1/projects/${args.id}`, {
      body,
      profile: flags.profile,
      apiUrl: flags["api-url"],
    });
    this.print(data, flags.format, flags.json);
  }
}
