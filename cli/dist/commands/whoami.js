import { BaseCommand } from "../lib/base.js";
import { api } from "../lib/client.js";
export default class Whoami extends BaseCommand {
    static description = "Mostrar el usuario autenticado y sus permisos";
    static flags = { ...BaseCommand.baseFlags };
    async run() {
        const { flags } = await this.parse(Whoami);
        const data = await api("GET", "/api/v1/auth/whoami", { profile: flags.profile });
        this.print(data, flags.format, flags.json);
    }
}
