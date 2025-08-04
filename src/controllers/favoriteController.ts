import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { Slugify, toBoolean } from '../utils/formatter.js';

export const getRecords = async (req: Request, res: Response) => {
  try {
    const data = await prisma.favorite.findMany({
      include: {
        product: {
          select: {
            name: true,
            image: true,
            price: true
          }
        }
      }
    });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const createRecord = async (req: Request, res: Response) => {
  const userId = req.user?.id
  const { productId } = req.body;

  if (!userId) {
    res.status(400).json({ error: 'You need to login to add a favorite' });
  }

  if (!productId) {
    res.status(400).json({ error: 'Product id is required' });
  }

  try {
    const favorite = await prisma.favorite.create({
      data: {
        productId: Number(productId),
        userId
      },
    });
    res.status(201).json(favorite);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create favorite' });
  }
};

export const deleteRecord = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id

  try {
    await prisma.favorite.delete({
      where: { 
        id: Number(id)
      },
    });
    res.status(200).json({ message: 'Favorite deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete favorite' });
  }
};
