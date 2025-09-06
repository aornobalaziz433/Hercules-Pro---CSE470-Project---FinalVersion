export interface UserQuery {
    userId: string;
    query: string;
    timestamp: Date;
}

export interface BotResponse {
    responseId: string;
    message: string;
    timestamp: Date;
}