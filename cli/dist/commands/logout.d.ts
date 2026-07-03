import { BaseCommand } from "../lib/base.js";
export default class Logout extends BaseCommand {
    static description: string;
    static flags: {
        profile: import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
    };
    run(): Promise<void>;
}
