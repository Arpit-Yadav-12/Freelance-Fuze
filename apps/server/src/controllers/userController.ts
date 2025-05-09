import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const { email, name, role } = req.body;
  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
      },
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, name, role } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        email,
        name,
        role,
      },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}; 