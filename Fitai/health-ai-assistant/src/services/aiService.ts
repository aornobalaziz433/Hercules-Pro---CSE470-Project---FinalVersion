export class AIService {
    processQuery(query: string): string {
        // Logic to process the health-related query
        return `Processed query: ${query}`;
    }

    fetchResponse(query: string): Promise<string> {
        return new Promise((resolve) => {
            // Simulate an AI response generation
            setTimeout(() => {
                resolve(`AI response for: ${query}`);
            }, 1000);
        });
    }
}