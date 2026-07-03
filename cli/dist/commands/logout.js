import { BaseCommand } from "../lib/base.js";
import { deleteProfile } from "../lib/config.js";
export default class Logout extends BaseCommand {
    static description = "Borrar las credenciales locales";
    static flags = { profile: BaseCommand.baseFlags.profile };
    async run() {
        const { flags } = await this.parse(Logout);
        deleteProfile(flags.profile || "default");
        this.log("✓ Sesión cerrada.");
    }
}
