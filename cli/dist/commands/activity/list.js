import { Flags } from "@oclif/core";
import { BaseCommand } from "../../lib/base.js";
import { api } from "../../lib/client.js";
export default class ActivityList extends BaseCommand {
    static description = "Listar actividad reciente del OS (auditoría)";
    static flags = {
        ...BaseCommand.baseFlags,
        since: Flags.string({ description: "ISO date - desde cuándo (por defecto últimos 7 días)" }),
        entity: Flags.string({ description: "filtrar por tipo de entidad (task, project, ...)" }),
        limit: Flags.integer({ default: 200 }),
    };
    async run() {
        const { flags } = await this.parse(ActivityList);
        const params = new URLSearchParams();
        if (flags.since)
            params.set("since", flags.since);
        if (flags.entity)
            params.set("entity", flags.entity);
        if (flags.limit && flags.limit !== 200)
            params.set("limit", String(flags.limit));
        const qs = params.toString() ? `?${params}` : "";
        const data = await api("GET", `/api/v1/activity${qs}`, {
            profile: flags.profile,
            apiUrl: flags["api-url"],
        });
        this.print(data, flags.format, flags.json ?? false);
    }
}
