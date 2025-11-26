import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import { extractRoutes } from './routes/extract';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 创建 Fastify 实例
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
});

// 注册 JWT 插件
fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
});

// 注册路由
fastify.register(extractRoutes);

// 健康检查路由
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// 启动服务器
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    console.log(`服务器运行在 http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// 处理优雅关闭
process.on('SIGINT', async () => {
  try {
    await fastify.close();
    console.log('服务器已关闭');
    process.exit(0);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});

start();

