import { BaseCommand } from "../lib/base.js";
import { api } from "../lib/client.js";
export default class Commands extends BaseCommand {
    static description = "Catálogo de comandos y endpoints (descubrible para agentes)";
    static flags = { ...BaseCommand.baseFlags };
    async run() {
        const { flags } = await this.parse(Commands);
        if (flags.json) {
            const data = await api("GET", "/api/v1/commands", { profile: flags.profile });
            this.print(data, "json", true);
            return;
        }
        // también refleja el manifiesto oclif local
        const cmds = this.config.commands;
        const lines = ["Comandos del CLI (manifiesto local):"];
        for (const c of cmds)
            lines.push(`  ${c.id.padEnd(36)} ${c.description || ""}`);
        lines.push("");
        lines.push("Para el catálogo completo de la API (endpoints, contratos), usa --json.");
        this.log(lines.join("\n"));
    }
}
