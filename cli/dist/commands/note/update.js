import { Args, Flags } from "@oclif/core";
import { BaseCommand } from "../../lib/base.js";
import { api } from "../../lib/client.js";
export default class NoteUpdate extends BaseCommand {
    static description = "Actualizar una nota (PATCH)";
    static args = { id: Args.string({ required: true }) };
    static flags = {
        ...BaseCommand.baseFlags,
        title: Flags.string({}),
        objective: Flags.string({}),
        "next-step": Flags.string({}),
        "related-project": Flags.string({}),
    };
    async run() {
        const { args, flags } = await this.parse(NoteUpdate);
        const body = {
            title: flags.title,
            objective: flags.objective,
            nextStep: flags["next-step"],
            relatedProjectId: flags["related-project"],
        };
        for (const k of Object.keys(body))
            if (body[k] === undefined)
                delete body[k];
        if (flags["dry-run"]) {
            this.print({ wouldPATCH: `/api/v1/notes/${args.id}`, body }, flags.format, flags.json);
            return;
        }
        const data = await api("PATCH", `/api/v1/notes/${args.id}`, { body, profile: flags.profile, apiUrl: flags["api-url"] });
        this.print(data, flags.format, flags.json);
    }
}
