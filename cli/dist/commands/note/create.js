import { Flags } from "@oclif/core";
import { BaseCommand } from "../../lib/base.js";
import { api } from "../../lib/client.js";
export default class NoteCreate extends BaseCommand {
    static description = "Crear una nota de knowledge";
    static flags = {
        ...BaseCommand.baseFlags,
        title: Flags.string({ required: true }),
        type: Flags.string({ description: "note|idea|..." }),
        objective: Flags.string({}),
        "next-step": Flags.string({}),
        "related-project": Flags.string({ description: "relatedProjectId" }),
    };
    async run() {
        const { flags } = await this.parse(NoteCreate);
        const body = {
            title: flags.title,
            type: flags.type,
            objective: flags.objective,
            nextStep: flags["next-step"],
            relatedProjectId: flags["related-project"],
        };
        for (const k of Object.keys(body))
            if (body[k] === undefined)
                delete body[k];
        if (flags["dry-run"]) {
            this.print({ wouldPOST: "/api/v1/notes", body }, flags.format, flags.json);
            return;
        }
        const data = await api("POST", "/api/v1/notes", { body, profile: flags.profile, apiUrl: flags["api-url"] });
        this.print(data, flags.format, flags.json);
    }
}
