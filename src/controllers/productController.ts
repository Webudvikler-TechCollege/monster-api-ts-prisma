import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { Slugify, toBoolean } from '../utils/formatter.js';

export const getRecords = async (req: Request, res: Response) => {
  try {
    const data = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        price: true,
        stock: true
      }
    });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getRecord = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const data = await prisma.product.findUnique({
      where: { id: Number(id) },
    });
    if (!data) res.status(404).json({ error: 'Product not found' });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const createRecord = async (req: Request, res: Response) => {
  const { name, image, description, price, stock, isActive } = req.body;

  if (!name || !image || !description || !price || !stock || !isActive) {
    res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        slug: Slugify(name),
        image,
        description,
        price: Number(price) ?? 0,
        stock: Number(stock),
        isActive: toBoolean(isActive),
      },
    });
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateRecord = async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, image, description, price, stock, isActive } = req.body;

  if (!name || !image || !description || !price || !stock || !isActive) {
    res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const dataToUpdate: any = {
      name,
      slug: Slugify(name),
      image,
      description,
      price: Number(price) ?? 0,
      stock: Number(stock),
      isActive: toBoolean(isActive),
    }

    const product = await prisma.product.update({
      where: { id: Number(id) },
      data: dataToUpdate,
    });
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteRecord = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.product.delete({
      where: { id: Number(id) },
    });
    res.status(200).json({ message: 'Product deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
