export type Profile = {
    apiUrl: string;
    token: string;
    user?: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
};
export declare function saveProfile(name: string, p: Profile): void;
export declare function getProfile(name?: string): Profile | null;
export declare function deleteProfile(name?: string): void;
export declare const defaultApiUrl: string;
