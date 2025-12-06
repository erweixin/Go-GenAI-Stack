/**
 * Test for removeTestId plugin
 * Verifies that data-test-id attributes are correctly removed in production builds
 */

import { describe, it, expect, beforeEach } from 'vitest'
import removeTestId from '../removeTestId.js'

describe('removeTestId plugin', () => {
  let plugin
  let transform

  beforeEach(() => {
    plugin = removeTestId()
    transform = plugin.transform.bind(plugin)

    // Set up production mode
    plugin.configResolved({ mode: 'production', command: 'build' })
  })

  it('should remove data-test-id with double quotes', () => {
    const code = '<div data-test-id="test-button">Click</div>'
    const result = transform(code, 'test.tsx')
    expect(result.code).toBe('<div>Click</div>')
  })

  it('should remove data-test-id with single quotes', () => {
    const code = "<div data-test-id='test-button'>Click</div>"
    const result = transform(code, 'test.tsx')
    expect(result.code).toBe('<div>Click</div>')
  })

  it('should remove data-test-id with simple template literal', () => {
    const code = '<div data-test-id={`test-button`}>Click</div>'
    const result = transform(code, 'test.tsx')
    expect(result.code).toBe('<div>Click</div>')
  })

  it('should remove data-test-id with template literal containing expression', () => {
    const code = '<div data-test-id={`task-${id}`}>Click</div>'
    const result = transform(code, 'test.tsx')
    expect(result.code).toBe('<div>Click</div>')
  })

  it('should remove data-test-id with variable expression', () => {
    const code = '<div data-test-id={testId}>Click</div>'
    const result = transform(code, 'test.tsx')
    expect(result.code).toBe('<div>Click</div>')
  })

  it('should remove data-test-id with string expression', () => {
    const code = '<div data-test-id={"test-button"}>Click</div>'
    const result = transform(code, 'test.tsx')
    expect(result.code).toBe('<div>Click</div>')
  })

  it('should remove data-test-id with complex template literal', () => {
    const code = '<div data-test-id={`task-${task.id}-${task.status}`}>Click</div>'
    const result = transform(code, 'test.tsx')
    expect(result.code).toBe('<div>Click</div>')
  })

  it('should remove data-test-id with nested braces', () => {
    const code = '<div data-test-id={`task-${obj.id || "default"}`}>Click</div>'
    const result = transform(code, 'test.tsx')
    expect(result.code).toBe('<div>Click</div>')
  })

  it('should handle multiple data-test-id attributes', () => {
    const code = `
      <div data-test-id="container">
        <button data-test-id="button-1">Click 1</button>
        <button data-test-id={\`button-2\`}>Click 2</button>
        <button data-test-id={\`button-\${id}\`}>Click 3</button>
      </div>
    `
    const result = transform(code, 'test.tsx')
    expect(result.code).not.toContain('data-test-id')
  })

  it('should not remove data-test-id in development mode', () => {
    plugin.configResolved({ mode: 'development', command: 'serve' })
    const code = '<div data-test-id="test-button">Click</div>'
    const result = transform(code, 'test.tsx')
    expect(result).toBeNull()
  })

  it('should not process non-JSX files', () => {
    const code = 'const test = "data-test-id=\\"test\\""'
    const result = transform(code, 'test.ts')
    expect(result).toBeNull()
  })

  it('should not process node_modules', () => {
    const code = '<div data-test-id="test">Click</div>'
    const result = transform(code, 'node_modules/test.tsx')
    expect(result).toBeNull()
  })

  it('should handle escaped characters in template literals', () => {
    const code = '<div data-test-id={`task-\\${id}`}>Click</div>'
    const result = transform(code, 'test.tsx')
    expect(result.code).toBe('<div>Click</div>')
  })

  it('should handle template literals with nested template expressions', () => {
    const code = '<div data-test-id={`task-${obj.id || "default-" + fallback}`}>Click</div>'
    const result = transform(code, 'test.tsx')
    expect(result.code).toBe('<div>Click</div>')
  })
})
