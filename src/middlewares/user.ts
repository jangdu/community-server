import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../entities/User';

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;
    console.log(req.cookies);

    if (!token) return next();

    const { username }: any = jwt.verify(token, process.env.JWTSECRET);

    const user = await User.findOne({ where: { username } });

    res.locals.user = user;

    return next();
  } catch (error) {
    console.log(error);

    return res.status(400).json({ error: 'server errror' });
  }
};
