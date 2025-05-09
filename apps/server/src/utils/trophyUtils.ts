import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const TROPHY_LEVELS = {
  NONE: 'none',
  WOODEN: 'wooden',
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
  DIAMOND: 'diamond'
} as const;

export const TROPHY_THRESHOLDS = {
  [TROPHY_LEVELS.WOODEN]: 1,
  [TROPHY_LEVELS.BRONZE]: 10,
  [TROPHY_LEVELS.SILVER]: 20,
  [TROPHY_LEVELS.GOLD]: 30,
  [TROPHY_LEVELS.PLATINUM]: 40,
  [TROPHY_LEVELS.DIAMOND]: 50
} as const;

export const calculateTrophyLevel = (completedGigs: number): string => {
  if (completedGigs >= TROPHY_THRESHOLDS[TROPHY_LEVELS.DIAMOND]) {
    return TROPHY_LEVELS.DIAMOND;
  } else if (completedGigs >= TROPHY_THRESHOLDS[TROPHY_LEVELS.PLATINUM]) {
    return TROPHY_LEVELS.PLATINUM;
  } else if (completedGigs >= TROPHY_THRESHOLDS[TROPHY_LEVELS.GOLD]) {
    return TROPHY_LEVELS.GOLD;
  } else if (completedGigs >= TROPHY_THRESHOLDS[TROPHY_LEVELS.SILVER]) {
    return TROPHY_LEVELS.SILVER;
  } else if (completedGigs >= TROPHY_THRESHOLDS[TROPHY_LEVELS.BRONZE]) {
    return TROPHY_LEVELS.BRONZE;
  } else if (completedGigs >= TROPHY_THRESHOLDS[TROPHY_LEVELS.WOODEN]) {
    return TROPHY_LEVELS.WOODEN;
  }
  return TROPHY_LEVELS.NONE;
};

export const updateSellerTrophy = async (sellerId: string) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: sellerId },
      select: { completedGigs: true }
    });

    if (!profile) return;

    const { completedGigs } = profile;
    let trophyLevel = 'none';

    if (completedGigs >= 50) {
      trophyLevel = 'diamond';
    } else if (completedGigs >= 40) {
      trophyLevel = 'platinum';
    } else if (completedGigs >= 30) {
      trophyLevel = 'gold';
    } else if (completedGigs >= 20) {
      trophyLevel = 'silver';
    } else if (completedGigs >= 10) {
      trophyLevel = 'bronze';
    } else if (completedGigs >= 1) {
      trophyLevel = 'wooden';
    }

    await prisma.profile.update({
      where: { userId: sellerId },
      data: { trophyLevel }
    });
  } catch (error) {
    console.error('Error updating seller trophy:', error);
  }
}; 