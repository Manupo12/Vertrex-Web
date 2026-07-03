import { Args, Flags } from "@oclif/core";
import { BaseCommand } from "../../lib/base.js";
import { api } from "../../lib/client.js";
export default class TaskSubtask extends BaseCommand {
    static description = "Crear una subtarea bajo la tarea padre";
    static args = { parentId: Args.string({ required: true }) };
    static flags = {
        ...BaseCommand.baseFlags,
        title: Flags.string({ required: true }),
    };
    async run() {
        const { args, flags } = await this.parse(TaskSubtask);
        if (flags["dry-run"]) {
            this.print({ wouldPOST: `/api/v1/tasks/${args.parentId}/subtasks`, body: { title: flags.title } }, flags.format, flags.json);
            return;
        }
        const data = await api("POST", `/api/v1/tasks/${args.parentId}/subtasks`, {
            body: { title: flags.title },
            profile: flags.profile,
            apiUrl: flags["api-url"],
        });
        this.print(data, flags.format, flags.json);
    }
}
