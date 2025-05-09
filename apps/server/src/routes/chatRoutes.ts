import express from 'express';
import { getChatMessages, getChatMessageById, createChatMessage, updateChatMessage, deleteChatMessage } from '../controllers/chatController';

const router = express.Router();

router.get('/', getChatMessages);
router.get('/:id', getChatMessageById);
router.post('/', createChatMessage);
router.put('/:id', updateChatMessage);
router.delete('/:id', deleteChatMessage);

export default router; 