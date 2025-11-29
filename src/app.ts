import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { extractRoutes } from './routes/extract';
import { authRoutes } from './routes/auth';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 创建 Fastify 应用实例
 * 用于 Vercel serverless function 和本地开发
 */
export function createApp(): FastifyInstance {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      } : undefined,
    },
    // 配置 body 解析，确保正确处理 JSON
    bodyLimit: 1048576, // 1MB
    disableRequestLogging: false,
  });

  // 注册 CORS 插件（应在其他插件之前注册）
  fastify.register(cors, {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
      : true, // 开发环境允许所有来源，生产环境应配置具体域名
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Type'],
    maxAge: 86400, // 24小时，减少预检请求
  });

  // 注册 JWT 插件
  fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    // 确保解码后的 payload 正确设置到 request.user
    decode: { complete: false },
  });

  // 注册路由
  fastify.register(authRoutes);
  fastify.register(extractRoutes);

  // 健康检查路由
  fastify.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // 404 处理 - 确保返回正确的 CORS 头
  fastify.setNotFoundHandler(async (request, reply) => {
    return reply.status(404).send({
      success: false,
      error: '路由不存在',
      path: request.url,
    });
  });

  return fastify;
}

// 导出应用实例（用于 Vercel）
const app = createApp();

// 导出为默认导出（Vercel serverless function 格式）
export default app;

