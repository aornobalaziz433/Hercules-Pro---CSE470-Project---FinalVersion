class ChatbotController {
    constructor(private chatbotService: ChatbotService) {}

    handleUserQuery(req: Request, res: Response): void {
        const userQuery: UserQuery = req.body;
        const response: BotResponse = this.chatbotService.getResponse(userQuery);
        res.json(response);
    }
}

export default ChatbotController;