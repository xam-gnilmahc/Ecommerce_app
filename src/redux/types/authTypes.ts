export type User = {
    [key: string]: any;
};

export type DecodedToken = {
    [key: string]: any;
};

export type AuthState = {
    user: User | null;
    loading: boolean;
    response: { success: boolean; message: string } | null;
};
