import axios, { AxiosError } from 'axios';
import { AppError } from '../utils/errors';

/**
 * 获取目标网站的 HTML 内容
 * @param url 目标网站 URL
 * @returns HTML 字符串
 * @throws AppError 当 URL 无效、网络错误或超时时抛出
 */
export async function fetchHtml(url: string): Promise<string> {
  // 验证 URL 格式
  try {
    new URL(url);
  } catch (error) {
    throw new AppError('无效的 URL 格式', 400);
  }

  try {
    // 配置请求选项
    const response = await axios.get(url, {
      timeout: 30000, // 30 秒超时
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
        throw new AppError('请求超时，请稍后重试', 408);
      }

      if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNREFUSED') {
        throw new AppError('无法连接到目标服务器', 503);
      }

      if (axiosError.response) {
        const status = axiosError.response.status;
        if (status >= 400 && status < 500) {
          throw new AppError(`客户端错误: HTTP ${status}`, status);
        } else if (status >= 500) {
          throw new AppError(`服务器错误: HTTP ${status}`, status);
        }
      }

      throw new AppError(`网络错误: ${axiosError.message}`, 500);
    }

    throw new AppError('获取 HTML 内容时发生未知错误', 500);
  }
}

