#!/usr/bin/env tsx
/**
 * JWT Token 生成工具
 * 用于生成开发测试用的 JWT token
 * 
 * 使用方法:
 *   pnpm tsx scripts/generate-token.ts
 *   pnpm tsx scripts/generate-token.ts --userId=user123 --expiresIn=30d
 */

import { generateToken } from '../src/utils/jwt-helper';

// 解析命令行参数
const args = process.argv.slice(2);
const params: Record<string, string> = {};

args.forEach((arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.substring(2).split('=');
    params[key] = value || '';
  }
});

// 生成 token 载荷
const payload: Record<string, any> = {
  userId: params.userId || 'test-user',
  iat: Math.floor(Date.now() / 1000),
};

// 生成 token
const expiresIn = params.expiresIn || '7d';
const token = generateToken(payload, expiresIn);

console.log('\n✅ JWT Token 生成成功!\n');
console.log('Token:');
console.log(token);
console.log('\n使用方式:');
console.log(`Authorization: Bearer ${token}`);
console.log('\n测试命令 (curl):');
console.log(`curl -X POST http://localhost:3000/api/extract \\`);
console.log(`  -H "Authorization: Bearer ${token}" \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -d '{"url":"https://example.com"}'`);
console.log('');

