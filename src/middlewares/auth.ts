import { NextFunction, Request, Response } from 'express';
import User from '../entities/user.entity';

export default async (_: Request, res: Response, next: NextFunction) => {
  try {
    const user: User | undefined = res.locals.user;

    if (!user) {
      throw new Error('Unathenticated');
    }

    return next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ error: 'Unauthenticated' });
  }
};
