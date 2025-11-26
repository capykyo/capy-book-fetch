import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError, sendErrorResponse } from '../utils/errors';

/**
 * JWT 认证中间件
 * 验证请求头中的 Authorization token
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // 从请求头获取 token
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new AppError('缺少认证令牌', 401);
    }

    // 提取 Bearer token
    const token = authHeader.replace(/^Bearer\s+/i, '');

    if (!token) {
      throw new AppError('无效的认证令牌格式', 401);
    }

    // 验证 token（使用 Fastify JWT 插件）
    try {
      await request.jwtVerify();
    } catch (jwtError) {
      throw new AppError('无效或过期的认证令牌', 401);
    }
  } catch (error) {
    sendErrorResponse(reply, error, 401);
    throw error;
  }
}

