import { createApp } from './app';

// 创建 Fastify 实例
const fastify = createApp();

// 启动服务器（仅用于本地开发）
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

// 仅在非 Vercel 环境中启动服务器
if (!process.env.VERCEL) {
  start();
}

