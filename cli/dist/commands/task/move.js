import { Args, Flags } from "@oclif/core";
import { BaseCommand } from "../../lib/base.js";
import { api } from "../../lib/client.js";
export default class TaskMove extends BaseCommand {
    static description = "Mover una tarea a otro proyecto (opcionalmente a un cycle/milestone)";
    static args = { id: Args.string({ required: true }) };
    static flags = {
        ...BaseCommand.baseFlags,
        project: Flags.string({ required: true }),
        cycle: Flags.string({}),
        milestone: Flags.string({}),
    };
    async run() {
        const { args, flags } = await this.parse(TaskMove);
        const body = { projectId: flags.project, cycleId: flags.cycle, milestoneId: flags.milestone };
        for (const k of Object.keys(body))
            if (body[k] === undefined)
                delete body[k];
        if (flags["dry-run"]) {
            this.print({ wouldPOST: `/api/v1/tasks/${args.id}/move`, body }, flags.format, flags.json);
            return;
        }
        const data = await api("POST", `/api/v1/tasks/${args.id}/move`, {
            body,
            profile: flags.profile,
            apiUrl: flags["api-url"],
        });
        this.print(data, flags.format, flags.json);
    }
}
