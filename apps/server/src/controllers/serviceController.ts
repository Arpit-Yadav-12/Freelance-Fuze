import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CATEGORIES, isValidCategory } from '../constants/categories';

const prisma = new PrismaClient();

export const getServices = async (req: Request, res: Response) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12
    } = req.query;

    console.log('Query params:', { search, category, minPrice, maxPrice, sortBy, sortOrder, page, limit });

    const skip = (Number(page) - 1) * Number(limit);

    // Build the where clause
    const where: any = {};
    
    // Search in title and description
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Category filter - simple exact match
    if (category && category !== 'All Categories') {
      where.category = category;
    }

    // Price filter
    if (minPrice || maxPrice) {
      where.packages = {
        some: {
          AND: [
            ...(minPrice ? [{ price: { gte: Number(minPrice) } }] : []),
            ...(maxPrice ? [{ price: { lte: Number(maxPrice) } }] : [])
          ]
        }
      };
    }

    // Build the orderBy clause
    const orderBy: any = {};
    if (sortBy === 'price') {
      orderBy.packages = {
        price: sortOrder
      };
    } else if (sortBy === 'averageRating') {
      orderBy.reviews = {
        _avg: {
          rating: sortOrder
        }
      };
    } else {
      orderBy[sortBy as string] = sortOrder;
    }

    // Get total count for pagination
    const total = await prisma.service.count({ where });

    // Get services with related data
    const services = await prisma.service.findMany({
      where,
      orderBy,
      skip,
      take: Number(limit),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                location: true
              }
            }
          }
        },
        packages: true,
        reviews: {
          select: {
            rating: true
          }
        }
      }
    });

    // Calculate average rating for each service
    const servicesWithRating = services.map(service => {
      const averageRating = service.reviews.length > 0
        ? service.reviews.reduce((acc, review) => acc + review.rating, 0) / service.reviews.length
        : 0;
      
      return {
        ...service,
        averageRating: Number(averageRating.toFixed(1))
      };
    });

    res.json({
      services: servicesWithRating,
      pagination: {
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error in getServices:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getServiceById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                bio: true,
                location: true
              }
            }
          }
        },
        packages: true,
        reviews: {
          select: {
            rating: true
          }
        }
      }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Calculate average rating
    const averageRating = service.reviews.length > 0
      ? service.reviews.reduce((acc, review) => acc + review.rating, 0) / service.reviews.length
      : 0;

    const serviceWithRating = {
      ...service,
      averageRating: Number(averageRating.toFixed(1))
    };

    res.json(serviceWithRating);
  } catch (error) {
    console.error('Error in getServiceById:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createService = async (req: Request, res: Response) => {
  try {
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    
    const { title, description, category, images, packages } = req.body;
    const userId = (req as any).user?.id; // Get user ID from the authenticated request
    
    if (!userId) {
      console.log('No user ID found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (!isValidCategory(category)) {
      console.log('Invalid category:', category);
      return res.status(400).json({ error: 'Invalid category' });
    }

    // Validate required fields
    if (!title || !description) {
      console.log('Missing required fields:', { title, description });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate packages
    if (!Array.isArray(packages) || packages.length === 0) {
      console.log('Invalid packages:', packages);
      return res.status(400).json({ error: 'At least one package is required' });
    }

    // Validate each package
    for (const pkg of packages) {
      if (!pkg.name || !pkg.description || typeof pkg.price !== 'number' || typeof pkg.deliveryTime !== 'number') {
        console.log('Invalid package:', pkg);
        return res.status(400).json({ error: 'Invalid package data' });
      }
    }

    const service = await prisma.service.create({
      data: {
        title,
        description,
        category,
        images: images || [],
        userId, // Use the user ID from our database
        packages: {
          create: packages.map((pkg) => ({
            name: pkg.name,
            description: pkg.description,
            price: Number(pkg.price),
            deliveryTime: Number(pkg.deliveryTime),
            features: pkg.features
          }))
        }
      },
      include: {
        packages: true
      }
    });

    console.log('Successfully created service:', service);
    res.status(201).json(service);
  } catch (error) {
    console.error('Detailed error in createService:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateService = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, category, images } = req.body;

  if (!isValidCategory(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  try {
    const service = await prisma.service.update({
      where: { id },
      data: {
        title,
        description,
        category,
        images: images || [],
      },
    });
    res.json(service);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.service.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Add a function to fix existing services
export const fixServiceCategories = async (req: Request, res: Response) => {
  try {
    // Get all services
    const services = await prisma.service.findMany();
    
    // Update each service with normalized category
    const updates = await Promise.all(
      services.map(async (service) => {
        if (!isValidCategory(service.category)) {
          return prisma.service.update({
            where: { id: service.id },
            data: { category: service.category }
          });
        }
        return null;
      })
    );

    const updatedServices = updates.filter(Boolean);
    res.json({ 
      message: `Updated ${updatedServices.length} services with normalized categories`,
      services: updatedServices 
    });
  } catch (error) {
    console.error('Error fixing service categories:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}; 