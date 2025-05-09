import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getChatMessages = async (req: Request, res: Response) => {
  try {
    const messages = await prisma.message.findMany();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getChatMessageById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const message = await prisma.message.findUnique({
      where: { id },
    });
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createChatMessage = async (req: Request, res: Response) => {
  const { content, userId } = req.body;
  try {
    const message = await prisma.message.create({
      data: {
        content,
        userId,
      },
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateChatMessage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  try {
    const message = await prisma.message.update({
      where: { id },
      data: {
        content,
      },
    });
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteChatMessage = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.message.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}; 