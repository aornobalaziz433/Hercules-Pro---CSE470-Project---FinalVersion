export interface HealthQuery {
    question: string;
    userId: string;
    timestamp: Date;
}

export interface HealthResponse {
    answer: string;
    confidence: number;
    timestamp: Date;
}