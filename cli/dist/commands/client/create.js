import { Flags } from "@oclif/core";
import { BaseCommand } from "../../lib/base.js";
import { api } from "../../lib/client.js";
export default class ClientCreate extends BaseCommand {
    static description = "Crear un cliente";
    static flags = {
        ...BaseCommand.baseFlags,
        name: Flags.string({ required: true }),
        slug: Flags.string({}),
        email: Flags.string({}),
        phone: Flags.string({}),
        status: Flags.string({}),
    };
    async run() {
        const { flags } = await this.parse(ClientCreate);
        const body = { name: flags.name, slug: flags.slug, email: flags.email, phone: flags.phone, status: flags.status };
        for (const k of Object.keys(body))
            if (body[k] === undefined)
                delete body[k];
        if (flags["dry-run"]) {
            this.print({ wouldPOST: "/api/v1/clients", body }, flags.format, flags.json);
            return;
        }
        const data = await api("POST", "/api/v1/clients", { body, profile: flags.profile, apiUrl: flags["api-url"] });
        this.print(data, flags.format, flags.json);
    }
}
