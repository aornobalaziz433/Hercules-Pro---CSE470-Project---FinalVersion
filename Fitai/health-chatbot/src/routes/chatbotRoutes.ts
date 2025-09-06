import { Router } from 'express';
import ChatbotController from '../controllers/chatbotController';

const router = Router();
const chatbotController = new ChatbotController();

export const setRoutes = () => {
    router.post('/chat', chatbotController.handleUserQuery.bind(chatbotController));
    return router;
};