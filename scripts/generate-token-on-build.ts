#!/usr/bin/env tsx
/**
 * 构建时生成 Token 脚本
 * 在 Vercel 部署时自动生成生产环境 token
 * 
 * 此脚本会在构建后执行，生成 token 并输出到控制台
 * Token 会显示在 Vercel 的构建日志中
 */

import { generateToken } from '../src/utils/jwt-helper';

// 从环境变量获取 JWT_SECRET
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error('❌ 错误: JWT_SECRET 环境变量未设置');
  console.error('请在 Vercel 项目设置中添加 JWT_SECRET 环境变量');
  process.exit(1);
}

// 生成生产环境 token（7天过期）
const payload = {
  userId: 'production-user',
  iat: Math.floor(Date.now() / 1000),
  env: 'production',
  generatedAt: new Date().toISOString(),
};

const token = generateToken(payload, '7d');

console.log('\n' + '='.repeat(80));
console.log('✅ 生产环境 Token 生成成功!');
console.log('='.repeat(80));
console.log('\n📋 Token 信息:');
console.log(`有效期: 7 天`);
console.log(`生成时间: ${new Date().toISOString()}`);
console.log(`过期时间: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}`);
console.log('\n🔑 Token:');
console.log(token);
console.log('\n📝 使用方式:');
console.log('Authorization: Bearer ' + token);
console.log('\n⚠️  重要提示:');
console.log('1. 请复制并安全保存此 token');
console.log('2. 将此 token 提供给 API 用户使用');
console.log('3. Token 有效期为 7 天，过期后需要重新部署生成新 token');
console.log('4. 不要将 token 提交到代码仓库');
console.log('\n' + '='.repeat(80) + '\n');

// 将 token 写入环境变量文件（用于后续可能的自动化流程）
// 注意：Vercel 构建环境中无法直接设置环境变量，所以只输出到日志

