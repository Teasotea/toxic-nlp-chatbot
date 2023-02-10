export enum ActionType {
    NOTHING = 'NOTHING',
    DELETE = 'DELETE',
    BAN = 'BAN',
    POLL = 'POLL',
}

export interface StartSettings {
    chatID: string;
    chatType: string;
    action: ActionType;
    isConfigured: boolean;
    usersStats: Map<string, number>;
}
