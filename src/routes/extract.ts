import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ExtractRequest, ApiSuccessResponse } from '../types';
import { fetchHtml } from '../services/html-fetcher';
import { extractContent } from '../services/content-extractor';
import { sendErrorResponse } from '../utils/errors';
import { authenticate } from '../middleware/auth';

/**
 * 提取文章内容路由
 */
export async function extractRoutes(fastify: FastifyInstance) {
  // POST /api/extract - 提取文章内容
  fastify.post<{ Body: ExtractRequest }>(
    '/api/extract',
    {
      preHandler: [authenticate],
      schema: {
        description: '从指定 URL 提取文章内容',
        tags: ['extract'],
        body: {
          type: 'object',
          required: ['url'],
          properties: {
            url: {
              type: 'string',
              format: 'uri',
              description: '目标网站的 URL',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  content: { type: 'string' },
                  author: { type: 'string' },
                  prevLink: { type: ['string', 'null'] },
                  nextLink: { type: ['string', 'null'] },
                },
              },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
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
    async (request: FastifyRequest<{ Body: ExtractRequest }>, reply: FastifyReply) => {
      try {
        const { url } = request.body;

        if (!url) {
          return reply.status(400).send({
            success: false,
            error: '缺少必需的参数: url',
          });
        }

        // 获取 HTML 内容
        const html = await fetchHtml(url);

        // 提取文章内容
        const extractedData = await extractContent(html, url);

        // 返回成功响应
        const response: ApiSuccessResponse = {
          success: true,
          data: extractedData,
        };

        return reply.status(200).send(response);
      } catch (error) {
        sendErrorResponse(reply, error);
        return;
      }
    }
  );
}

