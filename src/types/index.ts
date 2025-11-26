// 提取请求类型
export interface ExtractRequest {
  url: string;
}

// 提取结果类型
export interface ExtractResult {
  title: string;
  content: string;
  author: string;
  prevLink: string | null;
  nextLink: string | null;
  bookName?: string;
  description?: string;
}

// API 成功响应类型
export interface ApiSuccessResponse {
  success: true;
  data: ExtractResult;
}

// API 错误响应类型
export interface ApiErrorResponse {
  success: false;
  error: string;
}

// API 响应类型（联合类型）
export type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

// JWT 载荷类型
export interface JWTPayload {
  userId?: string;
  [key: string]: any;
}

