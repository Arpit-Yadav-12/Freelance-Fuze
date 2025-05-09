import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getTransactionById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createTransaction = async (req: Request, res: Response) => {
  const { amount, status } = req.body;
  try {
    const transaction = await prisma.transaction.create({
      data: {
        amount,
        status,
      },
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateTransaction = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        status,
      },
    });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.transaction.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}; 