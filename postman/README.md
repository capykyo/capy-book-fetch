# Postman 测试文档

本目录包含 BookFetch API 的 Postman 测试集合和环境配置。

## 文件说明

- `BookFetch-JWT-API.postman_collection.json` - Postman 测试集合
- `BookFetch-Environment.postman_environment.json` - Postman 环境配置

## 导入步骤

### 1. 导入测试集合

1. 打开 Postman
2. 点击左上角的 **Import** 按钮
3. 选择 `BookFetch-JWT-API.postman_collection.json` 文件
4. 点击 **Import**

### 2. 导入环境配置（可选）

1. 点击右上角的环境选择器（齿轮图标）
2. 点击 **Import**
3. 选择 `BookFetch-Environment.postman_environment.json` 文件
4. 点击 **Import**
5. 在环境选择器中选择 **BookFetch Local**

## 使用说明

### 快速开始

1. **确保服务器运行**
   ```bash
   pnpm dev
   ```

2. **生成 Token**
   - 在 Postman 中找到 **认证相关** → **1. 生成 JWT Token**
   - 点击 **Send** 发送请求
   - Token 会自动保存到环境变量 `jwt_token` 中

3. **测试受保护的 API**
   - 在 **文章提取** 文件夹中选择任意请求
   - 这些请求会自动使用保存的 token
   - 点击 **Send** 发送请求

### 测试集合结构

#### 认证相关
- **1. 生成 JWT Token** - 生成新的 token（会自动保存）
- **2. 验证 JWT Token** - 验证 token 是否有效
- **3. 生成 Token（仅用户ID）** - 仅指定用户 ID
- **4. 生成 Token（自定义过期时间）** - 自定义过期时间

#### 文章提取
- **1. 提取文章内容（需要认证）** - 正常提取（需要 token）
- **2. 提取文章内容（无 Token - 应失败）** - 测试未认证的错误
- **3. 提取文章内容（无效 Token - 应失败）** - 测试无效 token 的错误

#### 健康检查
- **健康检查** - 检查服务器状态（无需认证）

### 环境变量

集合包含以下环境变量：

- `base_url` - API 基础 URL（默认：`http://localhost:3000`）
- `jwt_token` - JWT token（自动保存，无需手动设置）

### 修改服务器地址

如果需要测试不同环境的服务器：

1. 在环境变量中修改 `base_url`
2. 或者直接在请求 URL 中修改

### 测试流程建议

1. ✅ 健康检查 - 确认服务器运行正常
2. ✅ 生成 JWT Token - 获取认证 token
3. ✅ 验证 JWT Token - 确认 token 有效
4. ✅ 提取文章内容 - 测试主要功能
5. ✅ 测试错误场景 - 验证错误处理

## 注意事项

1. **Token 自动保存**：生成 token 的请求会自动将 token 保存到环境变量
2. **Token 过期**：如果 token 过期，重新运行"生成 JWT Token"请求
3. **服务器地址**：确保 `base_url` 指向正确的服务器地址
4. **环境选择**：如果导入了环境配置，记得选择正确的环境

## 故障排查

### Token 无效错误

如果收到 401 错误：
1. 检查是否已运行"生成 JWT Token"请求
2. 检查环境变量 `jwt_token` 是否有值
3. 重新生成 token

### 连接错误

如果无法连接到服务器：
1. 确认服务器正在运行（`pnpm dev`）
2. 检查 `base_url` 是否正确
3. 检查防火墙设置

## 扩展测试

你可以根据需要添加更多测试用例：

1. 测试不同的 URL
2. 测试边界情况
3. 测试性能
4. 添加更多断言

