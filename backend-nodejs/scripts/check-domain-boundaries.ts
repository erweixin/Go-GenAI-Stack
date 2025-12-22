#!/usr/bin/env tsx
/**
 * Domain Boundary Checker
 * 
 * 检查 domain 之间的引用是否符合"分布式友好但不分布式"原则
 * 
 * 允许的引用：
 * 1. ✅ QueryService（只读查询接口）
 * 2. ✅ Repository Interface（如 Auth 依赖 User Repository）
 * 3. ✅ Events（事件定义）
 * 4. ✅ Shared（共享代码）
 * 
 * 禁止的引用：
 * 1. ❌ Service（业务逻辑层）
 * 2. ❌ Model（领域模型，除了特殊情况）
 * 3. ❌ Repository Implementation（实现细节）
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const domainsRoot = join(__dirname, '../domains');

interface Violation {
  file: string;
  line: number;
  importPath: string;
  reason: string;
}

const violations: Violation[] = [];

// 获取所有 domain 目录
function getDomains(): string[] {
  return readdirSync(domainsRoot)
    .filter((item) => {
      const path = join(domainsRoot, item);
      return statSync(path).isDirectory() && item !== 'shared';
    });
}

// 检查 import 是否违反规则
function checkImport(
  filePath: string,
  importPath: string,
  lineNumber: number
): void {
  // 跳过测试文件和 shared
  if (filePath.includes('/tests/') || filePath.includes('/__tests__/')) {
    return;
  }
  if (importPath.includes('/shared/')) {
    return;
  }

  // 检查是否是跨 domain 引用
  const fileDomain = extractDomain(filePath);
  const importDomain = extractDomainFromImport(filePath, importPath);

  if (!fileDomain || !importDomain || fileDomain === importDomain) {
    return;
  }

  // 检查是否引用了禁止的内容
  const relativePath = resolveImportPath(filePath, importPath);

  // ❌ 禁止：Service
  if (
    relativePath.includes('/service/') &&
    !relativePath.includes('_query_service') &&
    !relativePath.includes('QueryService')
  ) {
    violations.push({
      file: relative(domainsRoot, filePath),
      line: lineNumber,
      importPath,
      reason:
        '❌ 禁止直接引用其他 domain 的 Service。请使用 QueryService（同步查询）或 EventBus（异步通信）。',
    });
  }

  // ❌ 禁止：Model（除了 Auth 依赖 User）
  if (
    relativePath.includes('/model/') &&
    !(fileDomain === 'auth' && importDomain === 'user')
  ) {
    violations.push({
      file: relative(domainsRoot, filePath),
      line: lineNumber,
      importPath,
      reason:
        '❌ 禁止直接引用其他 domain 的 Model。请通过 Repository 或 QueryService 访问。',
    });
  }

  // ❌ 禁止：Repository Implementation
  if (
    relativePath.includes('/repository/') &&
    (relativePath.includes('_repo.js') ||
      relativePath.includes('_repository.js') ||
      relativePath.includes('RepositoryImpl'))
  ) {
    violations.push({
      file: relative(domainsRoot, filePath),
      line: lineNumber,
      importPath,
      reason:
        '❌ 禁止直接引用其他 domain 的 Repository 实现。请使用 Repository Interface。',
    });
  }
}

// 从文件路径提取 domain 名称
function extractDomain(filePath: string): string | null {
  const match = filePath.match(/domains\/([^/]+)/);
  return match ? match[1] : null;
}

// 从 import 路径提取 domain 名称
function extractDomainFromImport(
  filePath: string,
  importPath: string
): string | null {
  // 处理相对路径
  if (importPath.startsWith('../../') || importPath.startsWith('../')) {
    const resolved = resolveImportPath(filePath, importPath);
    return extractDomain(resolved);
  }
  return null;
}

// 解析 import 路径为绝对路径
function resolveImportPath(filePath: string, importPath: string): string {
  const fileDir = dirname(filePath);
  let resolved = join(fileDir, importPath);

  // 移除 .js 扩展名（如果存在）
  if (resolved.endsWith('.js')) {
    resolved = resolved.slice(0, -3);
  }

  // 如果路径不存在，尝试添加 .ts
  if (!resolved.endsWith('.ts')) {
    resolved += '.ts';
  }

  return resolved;
}

// 检查文件
function checkFile(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // 匹配 import 语句
    const importMatch =
      /^import\s+(?:.*\s+from\s+)?['"]([^'"]+)['"]/.exec(line);
    if (importMatch) {
      checkImport(filePath, importMatch[1], index + 1);
    }
  });
}

// 递归检查目录
function checkDirectory(dirPath: string): void {
  const entries = readdirSync(dirPath);

  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // 跳过 node_modules 和 dist
      if (entry === 'node_modules' || entry === 'dist') {
        continue;
      }
      checkDirectory(fullPath);
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      checkFile(fullPath);
    }
  }
}

// 主函数
function main(): void {
  console.log('🔍 检查 domain 边界...\n');

  const domains = getDomains();
  console.log(`发现 ${domains.length} 个 domain: ${domains.join(', ')}\n`);

  // 检查每个 domain
  for (const domain of domains) {
    const domainPath = join(domainsRoot, domain);
    checkDirectory(domainPath);
  }

  // 输出结果
  if (violations.length === 0) {
    console.log('✅ 所有 domain 边界检查通过！');
    process.exit(0);
  } else {
    console.log(`❌ 发现 ${violations.length} 个违规引用：\n`);
    violations.forEach((v) => {
      console.log(`📄 ${v.file}:${v.line}`);
      console.log(`   import: ${v.importPath}`);
      console.log(`   ${v.reason}\n`);
    });
    console.log(
      '\n💡 解决方案：\n' +
        '  1. 使用 QueryService 进行同步查询\n' +
        '  2. 使用 EventBus 进行异步通信\n' +
        '  3. 使用 Repository Interface（而非实现）\n'
    );
    process.exit(1);
  }
}

main();

