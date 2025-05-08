import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Obter variáveis de ambiente
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'password';
const jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
const fixedToken = process.env.API_TOKEN;

/**
 * Login controller
 */
export const login = (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Verificar credenciais
    if (username !== adminUsername || password !== adminPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token JWT
    const token = jwt.sign({ username }, jwtSecret, { expiresIn: '24h' });

    // Retornar token
    return res.status(200).json({ token });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * Middleware para verificar token JWT ou token fixo
 */
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Verificar se o cabeçalho de autorização existe
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    // Extrair o token do cabeçalho
    const token = authHeader.split(' ')[1];
    
    // Verificar se é o token fixo da .env
    if (fixedToken && token === fixedToken) {
      // Se for o token fixo, permitir acesso
      return next();
    }
    
    // Se não for o token fixo, verificar JWT
    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
      }
      
      // Adicionar usuário decodificado à requisição
      (req as any).user = decoded;
      next();
    });
  } catch (error) {
    console.error('Erro na verificação do token:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
