/**
 * 版本管理工具
 *
 * 功能：
 * - 读取 package.json 版本号
 * - 获取 Git 信息（commit hash, branch）
 * - 生成 Release 名称
 */

import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// 获取当前文件所在目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')

/**
 * 读取 package.json 版本号
 */
export function getPackageVersion() {
  try {
    const packagePath = resolve(rootDir, 'package.json')
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))
    return packageJson.version
  } catch (error) {
    console.error('Failed to read package.json:', error.message)
    return '0.0.0'
  }
}

/**
 * 获取 Git 信息
 *
 * @returns {{ commitHash: string, branch: string, hasGit: boolean }}
 */
export function getGitInfo() {
  try {
    const commitHash = execSync('git rev-parse --short HEAD', {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()

    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()

    return {
      commitHash,
      branch,
      hasGit: true,
    }
  } catch (error) {
    // Git 不可用或不在仓库中
    return {
      commitHash: 'unknown',
      branch: 'unknown',
      hasGit: false,
    }
  }
}

/**
 * 生成 Release 名称
 *
 * @param {Object} options
 * @param {string} options.version - 版本号
 * @param {string} options.commitHash - Git commit hash
 * @param {boolean} options.isDev - 是否为开发环境
 * @param {boolean} options.useGitHash - 是否包含 Git Hash
 * @returns {string} Release 名称
 */
export function generateReleaseName({ version, commitHash, isDev, useGitHash }) {
  // 开发环境：1.0.0-dev-abc123
  if (isDev) {
    return `${version}-dev-${commitHash}`
  }

  // 生产环境（包含 Git Hash）：1.0.0-abc123
  if (useGitHash) {
    return `${version}-${commitHash}`
  }

  // 生产环境（纯版本号）：1.0.0
  return version
}

/**
 * 获取完整的版本信息
 *
 * @param {Object} env - 环境变量
 * @returns {Object} 版本信息对象
 */
export function getVersionInfo(env = {}) {
  const version = getPackageVersion()
  const gitInfo = getGitInfo()

  const isDev = env.NODE_ENV !== 'production'
  const useGitHash = env.VITE_USE_GIT_HASH !== 'false'

  const releaseName = generateReleaseName({
    version,
    commitHash: gitInfo.commitHash,
    isDev,
    useGitHash,
  })

  return {
    version,
    releaseName,
    gitCommitHash: gitInfo.commitHash,
    gitBranch: gitInfo.branch,
    hasGit: gitInfo.hasGit,
    isDev,
  }
}

/**
 * 打印版本信息到控制台
 *
 * @param {Object} versionInfo - 版本信息对象
 */
export function logVersionInfo(versionInfo) {
  console.log(`[Version] Package: ${versionInfo.version}`)
  console.log(`[Version] Release: ${versionInfo.releaseName}`)

  if (versionInfo.hasGit) {
    console.log(`[Version] Git: ${versionInfo.gitBranch}@${versionInfo.gitCommitHash}`)
  } else {
    console.warn('[Version] Git information not available')
  }

  console.log(`[Version] Environment: ${versionInfo.isDev ? 'development' : 'production'}`)
}

/**
 * 获取用于 Vite define 的版本变量
 *
 * @param {Object} versionInfo - 版本信息对象
 * @returns {Object} Vite define 对象
 */
export function getVersionDefines(versionInfo) {
  return {
    'import.meta.env.VITE_RELEASE_NAME': JSON.stringify(versionInfo.releaseName),
    'import.meta.env.VITE_GIT_COMMIT_HASH': JSON.stringify(versionInfo.gitCommitHash),
    'import.meta.env.VITE_GIT_BRANCH': JSON.stringify(versionInfo.gitBranch),
    'import.meta.env.VITE_PACKAGE_VERSION': JSON.stringify(versionInfo.version),
  }
}
