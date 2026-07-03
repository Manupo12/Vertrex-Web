import { Flags } from "@oclif/core";
import { BaseCommand } from "../../lib/base.js";
import { api } from "../../lib/client.js";
export default class TaskCreate extends BaseCommand {
    static description = "Crear una tarea";
    static flags = {
        ...BaseCommand.baseFlags,
        title: Flags.string({ required: true }),
        project: Flags.string({ description: "projectId" }),
        assignee: Flags.string({ description: "assigneeId" }),
        priority: Flags.integer({ description: "0..4" }),
        due: Flags.string({ description: "fecha límite ISO" }),
        parent: Flags.string({ description: "parentTaskId" }),
        type: Flags.string({ description: "taskType (code, design, ...)" }),
        state: Flags.string({ description: "estado inicial" }),
    };
    async run() {
        const { flags } = await this.parse(TaskCreate);
        const body = {
            title: flags.title,
            projectId: flags.project,
            assigneeId: flags.assignee,
            priority: flags.priority,
            dueDate: flags.due,
            parentTaskId: flags.parent,
            taskType: flags.type,
            state: flags.state,
        };
        if (flags["dry-run"]) {
            this.print({ wouldPOST: "/api/v1/tasks", body }, flags.format, flags.json);
            return;
        }
        const data = await api("POST", "/api/v1/tasks", {
            body,
            profile: flags.profile,
            apiUrl: flags["api-url"],
        });
        this.print(data, flags.format, flags.json);
    }
}
