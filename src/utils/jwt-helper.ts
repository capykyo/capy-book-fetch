import dotenv from 'dotenv';
import jwt, { SignOptions } from 'jsonwebtoken';

dotenv.config();

/**
 * 生成 JWT token（用于脚本工具）
 * @param payload JWT 载荷数据
 * @param expiresIn 过期时间（默认 7 天，如 "7d", "1h", 3600）
 * @returns JWT token 字符串
 */
export function generateToken(
  payload: Record<string, any> = {},
  expiresIn: string | number = '7d'
): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  
  // jsonwebtoken 接受字符串（如 "7d"）或数字（秒数），但类型定义较严格
  // 使用类型断言来兼容实际使用场景
  const options: SignOptions = {
    expiresIn: expiresIn as any,
  };
  
  return jwt.sign(payload, secret, options);
}

/**
 * 验证 JWT token（用于脚本工具）
 * @param token JWT token 字符串
 * @returns 解码后的载荷数据
 */
export function verifyToken(token: string): any {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  
  return jwt.verify(token, secret);
}

