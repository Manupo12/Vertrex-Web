import { Flags } from "@oclif/core";
import { BaseCommand } from "../../lib/base.js";
import { api } from "../../lib/client.js";

export default class ProjectCreate extends BaseCommand {
  static description = "Crear un proyecto";
  static flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({ required: true }),
    key: Flags.string({ description: "projectKey (ej. ACME)" }),
    budget: Flags.integer({ description: "presupuesto en COP" }),
    status: Flags.string({}),
  };

  async run() {
    const { flags } = await this.parse(ProjectCreate);
    const body: any = {
      name: flags.name,
      projectKey: flags.key,
      budgetCop: flags.budget,
      status: flags.status,
    };
    for (const k of Object.keys(body)) if (body[k] === undefined) delete body[k];
    if (flags["dry-run"]) {
      this.print({ wouldPOST: "/api/v1/projects", body }, flags.format, flags.json);
      return;
    }
    const data = await api("POST", "/api/v1/projects", {
      body,
      profile: flags.profile,
      apiUrl: flags["api-url"],
    });
    this.print(data, flags.format, flags.json);
  }
}
