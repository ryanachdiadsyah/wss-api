import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import md5 from 'md5';
const prisma = new PrismaClient();

dotenv.config();

const jwtSecret = process.env.JWT_SECRET || 'default-secret-key';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Cari user di database
    const user = await prisma.users.findUnique({
      where: { username }
    });    

    // Jika user tidak ditemukan atau tidak aktif
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    // Bandingkan password dengan md5
    const hashedPassword = user.password;
    if (hashedPassword !== md5(password)) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    // Perisksa Valid_until di db apakah sudah expired
    const currentDate = new Date();
    if (user.valid_until && user.valid_until < currentDate) {
      return res.status(401).json({ error: 'Akun sudah expired, hubungi admin untuk memperpanjang masa' });
    }
    
    // Buat token JWT
    const token = jwt.sign({ userId: user.id, username: user.username }, jwtSecret, { expiresIn: '24h' });

    return res.status(200).json({ token, user: { id: user.id, username: user.username, apiKey: user.api_key, validDate: user.valid_until } });
  } catch (error) {
    console.error('Error saat login:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

export const verifyApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token tidak di temukan' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Cek di database apakah api_key valid
    const user = await prisma.users.findUnique({
      where: { api_key: token }
    });

    if (!user) {
      return res.status(401).json({ error: 'Token tidak valid' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Akun tidak aktif' });
    }

    // Perisksa Valid_until di db apakah sudah expired
    const currentDate = new Date();
    if (user.valid_until && user.valid_until < currentDate) {
      return res.status(401).json({ error: 'Akun sudah expired, hubungi admin untuk memperpanjang masa' });
    }

    // Jika valid, lanjutkan ke middleware berikutnya
    (req as any).user = user;
    next();

  } catch (error) {
      console.error('Erro na verificação do token:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
