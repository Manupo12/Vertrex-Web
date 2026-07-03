import { BaseCommand } from "../../lib/base.js";
export default class TaskAssign extends BaseCommand {
    static description: string;
    static args: {
        id: import("@oclif/core/interfaces").Arg<string, Record<string, unknown>>;
    };
    static flags: {
        to: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        format: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        json: import("@oclif/core/interfaces").BooleanFlag<boolean>;
        profile: import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
        "api-url": import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
        yes: import("@oclif/core/interfaces").BooleanFlag<boolean>;
        "dry-run": import("@oclif/core/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
}
