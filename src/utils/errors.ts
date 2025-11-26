import { FastifyReply } from 'fastify';
import { ApiErrorResponse } from '../types';

/**
 * 自定义错误类
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * 格式化错误响应
 */
export function formatErrorResponse(error: unknown): ApiErrorResponse {
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: false,
    error: '未知错误',
  };
}

/**
 * 发送错误响应
 */
export function sendErrorResponse(
  reply: FastifyReply,
  error: unknown,
  statusCode: number = 500
): void {
  const errorResponse = formatErrorResponse(error);
  
  if (error instanceof AppError) {
    reply.status(error.statusCode).send(errorResponse);
  } else {
    reply.status(statusCode).send(errorResponse);
  }
}

