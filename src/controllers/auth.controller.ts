import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { isEmpty, validate } from 'class-validator';
import User from '../entities/user.entity';
import { AppError } from '../utils/error';
import { AuthResponse } from '../types/response-type';

export class AuthController {
  private createToken(username: string): string {
    return jwt.sign({ username }, process.env.JWT_SECRET);
  }

  private setCookie(res: Response, token: string, remove: boolean = false) {
    res.set(
      'Set-Cookie',
      cookie.serialize('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: remove ? 0 : 60 * 60 * 24 * 7,
        path: '/',
      }),
    );
  }

  async register(req: Request, res: Response<AuthResponse>) {
    try {
      const { email, username, password } = req.body;

      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        throw new AppError('이미 사용중인 이메일입니다.', 400);
      }

      const existingUsername = await User.findOne({ where: { username } });
      if (existingUsername) {
        throw new AppError('이미 사용중인 이름입니다.', 400);
      }

      const user = new User();
      user.email = email;
      user.username = username;
      user.password = password;

      const errors = await validate(user);
      if (errors.length > 0) {
        const validationErrors = errors.map((error) => ({
          property: error.property,
          constraints: error.constraints,
        }));
        throw new AppError('유효성 검사 실패', 400, validationErrors);
      }

      await user.save();

      const { password: _, ...userResponse } = user;
      return res.status(201).json({
        success: true,
        data: userResponse,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('회원가입 처리 중 오류가 발생했습니다.', 500);
    }
  }

  async signin(req: Request, res: Response<AuthResponse>) {
    const { username, password } = req.body;

    if (isEmpty(username) || isEmpty(password)) {
      throw new AppError('사용자명과 비밀번호를 입력해주세요.', 400);
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      throw new AppError('등록되지 않은 이름입니다.', 404);
    }

    const matchedPassword = await bcrypt.compare(password, user.password);
    if (!matchedPassword) {
      throw new AppError('비밀번호가 일치하지 않습니다.', 401);
    }

    const token = this.createToken(username);
    this.setCookie(res, token);

    return res.json({ success: true, data: { user, token } });
  }

  async signout(_: Request, res: Response<AuthResponse>) {
    this.setCookie(res, '', true);
    return res.json({ success: true });
  }

  async me(_: Request, res: Response<AuthResponse>) {
    return res.json({ success: true, data: res.locals.user });
  }
}
