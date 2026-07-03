import { BaseCommand } from "./base.js";
export declare function makeListCommand(listPath: string, description: string): {
    new (...args: any[]): BaseCommand;
};
export declare function makeGetCommand(getPathFor: (id: string) => string, description: string): {
    new (...args: any[]): BaseCommand;
};
export declare function makeDeleteCommand(delPathFor: (id: string) => string, description: string): {
    new (...args: any[]): BaseCommand;
};
