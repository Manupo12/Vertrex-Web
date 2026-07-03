import { Flags } from "@oclif/core";
import { BaseCommand } from "../../lib/base.js";
import { api } from "../../lib/client.js";
export default class AuthTokens extends BaseCommand {
    static description = "Listar y crear Personal Access Tokens (PAT)";
    static flags = {
        ...BaseCommand.baseFlags,
        "create": Flags.string({ description: "crear un nuevo PAT con este nombre" }),
        expires: Flags.string({ description: "fecha ISO de expiración (solo con --create)" }),
    };
    async run() {
        const { flags } = await this.parse(AuthTokens);
        if (flags["create"]) {
            const data = await api("POST", "/api/v1/auth/tokens", {
                body: { name: flags["create"], expiresAt: flags.expires },
                profile: flags.profile,
                apiUrl: flags["api-url"],
            });
            this.print(data, flags.format, flags.json ?? false);
            return;
        }
        const data = await api("GET", "/api/v1/auth/tokens", {
            profile: flags.profile,
            apiUrl: flags["api-url"],
        });
        this.print(data, flags.format, flags.json ?? false);
    }
}
