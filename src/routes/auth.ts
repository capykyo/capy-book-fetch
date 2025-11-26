import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

/**
 * 认证相关路由
 */
export async function authRoutes(fastify: FastifyInstance) {
  // POST /api/auth/login - 生成 JWT token（仅开发环境可用）
  if (process.env.NODE_ENV === 'development') {
    fastify.post<{ Body: { userId?: string; expiresIn?: string } }>(
      '/api/auth/login',
      {
        schema: {
          body: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: '用户 ID（可选）',
              },
              expiresIn: {
                type: 'string',
                description: '过期时间，如 7d, 1h, 30m（可选，默认 7d）',
              },
            },
          },
          response: {
            200: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                token: { type: 'string' },
                expiresIn: { type: 'string' },
              },
            },
          },
        },
      },
      async (request: FastifyRequest<{ Body: { userId?: string; expiresIn?: string } }>, reply: FastifyReply) => {
        const { userId, expiresIn = '7d' } = request.body || {};

        // 生成 token 载荷
        const payload: Record<string, any> = {
          userId: userId || 'default-user',
          iat: Math.floor(Date.now() / 1000),
        };

        // 使用 Fastify JWT 插件生成 token
        const token = fastify.jwt.sign(payload, { expiresIn });

        return reply.status(200).send({
          success: true,
          token,
          expiresIn,
        });
      }
    );
  }

  // GET /api/auth/verify - 验证当前 token
  fastify.get(
    '/api/auth/verify',
    {
      preHandler: [async (request, reply) => {
        // 开发环境跳过验证
        if (process.env.NODE_ENV === 'development') {
          return reply.status(200).send({
            success: true,
            payload: { message: '开发环境：跳过验证' },
          });
        }

        try {
          await request.jwtVerify();
        } catch (err) {
          return reply.status(401).send({
            success: false,
            error: '无效或过期的 token',
          });
        }
      }],
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              payload: { type: 'object' },
            },
          },
          401: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // 如果到达这里，说明 token 验证成功
      // @ts-ignore - Fastify JWT 插件会在 request 上添加 user 属性
      const decoded = (request as any).user;

      return reply.status(200).send({
        success: true,
        payload: decoded,
      });
    }
  );
}

