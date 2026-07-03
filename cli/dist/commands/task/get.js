import { Args } from "@oclif/core";
import { BaseCommand } from "../../lib/base.js";
import { api } from "../../lib/client.js";
export default class TaskGet extends BaseCommand {
    static description = "Obtener detalle de una tarea";
    static args = { id: Args.string({ required: true, description: "ID o identifier de la tarea" }) };
    static flags = { ...BaseCommand.baseFlags };
    async run() {
        const { args, flags } = await this.parse(TaskGet);
        const data = await api("GET", `/api/v1/tasks/${args.id}`, {
            profile: flags.profile,
            apiUrl: flags["api-url"],
        });
        this.print(data, flags.format, flags.json);
    }
}
