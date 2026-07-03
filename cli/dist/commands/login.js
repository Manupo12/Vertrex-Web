import { Flags } from "@oclif/core";
import { BaseCommand } from "../lib/base.js";
import { api } from "../lib/client.js";
import { saveProfile, defaultApiUrl } from "../lib/config.js";
import { prompt } from "../lib/prompt.js";
export default class Login extends BaseCommand {
    static description = "Iniciar sesión y guardar un token personal";
    static flags = {
        email: Flags.string({}),
        "api-url": Flags.string({}),
        profile: Flags.string({ default: "default" }),
    };
    async run() {
        const { flags } = await this.parse(Login);
        const apiUrl = flags["api-url"] || defaultApiUrl;
        const email = flags.email || (await prompt("Email:"));
        const password = await prompt("Password:", { hide: true });
        let res = await api("POST", "/api/v1/auth/login", {
            apiUrl,
            token: "",
            body: { email, password },
        });
        if (res?.twoFactorRequired) {
            const otp = await prompt("Código 2FA:");
            res = await api("POST", "/api/v1/auth/login", {
                apiUrl,
                token: "",
                body: { email, password, otp },
            });
        }
        saveProfile(flags.profile, { apiUrl, token: res.token, user: res.user });
        this.log(`✓ Sesión iniciada como ${res.user.email} (${res.user.role}). Token guardado en perfil "${flags.profile}".`);
    }
}
