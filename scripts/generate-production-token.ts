#!/usr/bin/env tsx
/**
 * 生产环境 Token 生成脚本
 * 用于部署时生成 token
 * 
 * 使用方法:
 *   pnpm generate-production-token
 * 
 * 输出: 将 token 输出到控制台，可以保存到环境变量或配置文件中
 */

import { generateToken } from '../src/utils/jwt-helper';
import dotenv from 'dotenv';

dotenv.config();

// 生成生产环境 token（7天过期）
const payload = {
  userId: 'production-user',
  iat: Math.floor(Date.now() / 1000),
  env: 'production',
};

const token = generateToken(payload, '7d');

console.log('\n✅ 生产环境 Token 生成成功!\n');
console.log('Token:');
console.log(token);
console.log('\n📋 使用说明:');
console.log('1. 将此 token 安全保存');
console.log('2. 提供给 API 用户使用');
console.log('3. Token 有效期为 7 天，过期后需要重新生成');
console.log('4. 在请求头中使用: Authorization: Bearer <token>');
console.log('\n⚠️  重要提示:');
console.log('- 不要将 token 提交到代码仓库');
console.log('- Token 过期后需要重新运行此脚本生成新 token');
console.log('- 确保 JWT_SECRET 环境变量与生产环境一致\n');

