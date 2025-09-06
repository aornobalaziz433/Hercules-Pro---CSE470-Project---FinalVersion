class ChatbotService {
    private healthResponses: { [key: string]: string };

    constructor() {
        this.healthResponses = {
            "What are the symptoms of flu?": "Common symptoms of flu include fever, cough, sore throat, body aches, and fatigue.",
            "How can I maintain a healthy diet?": "A healthy diet includes a variety of fruits, vegetables, whole grains, and lean proteins. It's important to limit processed foods and sugars.",
            "What should I do if I have a headache?": "If you have a headache, try resting in a quiet, dark room, staying hydrated, and taking over-the-counter pain relief if necessary. If headaches persist, consult a healthcare professional.",
            "How much water should I drink daily?": "It's generally recommended to drink at least 8 cups (64 ounces) of water a day, but individual needs may vary based on activity level and climate.",
            "What is a healthy exercise routine?": "A healthy exercise routine includes a mix of cardiovascular, strength training, and flexibility exercises. Aim for at least 150 minutes of moderate aerobic activity each week."
        };
    }

    public getResponse(query: string): string {
        const response = this.healthResponses[query];
        return response ? response : "I'm sorry, I don't have information on that. Please consult a healthcare professional.";
    }
}

export default ChatbotService;