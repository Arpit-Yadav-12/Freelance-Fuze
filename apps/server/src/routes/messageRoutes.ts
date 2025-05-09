import express from 'express';
import { getMessages, getMessageById, createMessage, updateMessage, deleteMessage } from '../controllers/messageController';

const router = express.Router();

router.get('/', getMessages);
router.get('/:id', getMessageById);
router.post('/', createMessage);
router.put('/:id', updateMessage);
router.delete('/:id', deleteMessage);

export default router; 