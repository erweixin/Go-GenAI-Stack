/**
 * Vite plugin to remove data-test-id attributes in production builds
 * Uses regex to remove data-test-id from JSX/TSX source files before compilation
 */

export default function removeTestId() {
  let isProduction = false

  return {
    name: 'remove-data-test-id',
    enforce: 'pre', // Run before other plugins to process source files

    configResolved(config) {
      // Check mode from Vite config
      isProduction = config.mode === 'production' || config.command === 'build'
    },

    transform(code, id) {
      // Only process in production builds
      if (!isProduction) {
        return null
      }

      // Only process JSX/TSX files
      if (!id.endsWith('.tsx') && !id.endsWith('.jsx')) {
        return null
      }

      // Skip node_modules
      if (id.includes('node_modules')) {
        return null
      }

      // Remove data-test-id attributes using regex
      // Pattern 1: data-test-id="value" or data-test-id='value'
      // Pattern 2: data-test-id={expression} - handles all JSX expression forms including:
      //   - data-test-id={`value`}
      //   - data-test-id={`task-${id}`}
      //   - data-test-id={variable}
      //   - data-test-id={"string"}
      let cleanedCode = code

      // Remove data-test-id="value" or data-test-id='value'
      cleanedCode = cleanedCode.replace(/\s+data-test-id=["'][^"']*["']/g, '')

      // Remove data-test-id={anyExpression} - handles all JSX expression forms
      // This includes template literals with expressions like data-test-id={`task-${id}`}
      // We use a loop to find and remove all occurrences
      let changed = true
      while (changed) {
        const before = cleanedCode
        const regex = /\s+data-test-id=\{/g
        let match

        // Process matches in reverse order to maintain correct indices
        const matches = []
        while ((match = regex.exec(cleanedCode)) !== null) {
          matches.push(match)
        }

        // Process from end to start to maintain indices
        for (let j = matches.length - 1; j >= 0; j--) {
          const match = matches[j]
          const startOffset = match.index
          const afterMatch = startOffset + match[0].length

          // Find the matching closing brace by counting brace depth
          let depth = 1
          let i = afterMatch
          let inTemplateLiteral = false
          let inString = false
          let stringChar = null

          while (i < cleanedCode.length && depth > 0) {
            const char = cleanedCode[i]
            const prevChar = i > 0 ? cleanedCode[i - 1] : ''
            const isEscaped = prevChar === '\\' && (inTemplateLiteral || inString)

            // Handle escaped characters - skip processing but continue
            if (isEscaped) {
              i++
              continue
            }

            // Handle template literals: track backticks
            if (char === '`' && !inTemplateLiteral && !inString) {
              inTemplateLiteral = true
            } else if (char === '`' && inTemplateLiteral) {
              inTemplateLiteral = false
            }

            // Handle string literals inside expressions
            if (!inTemplateLiteral && !inString) {
              if (char === '"' || char === "'") {
                inString = true
                stringChar = char
              }
            } else if (inString && char === stringChar) {
              inString = false
              stringChar = null
            }

            // Count braces only when not inside a string/template literal
            if (!inTemplateLiteral && !inString) {
              if (char === '{') {
                depth++
              } else if (char === '}') {
                depth--
              }
            }

            i++
          }

          // If we found the matching brace, remove the entire attribute
          if (depth === 0) {
            const endOffset = i
            cleanedCode = cleanedCode.slice(0, startOffset) + cleanedCode.slice(endOffset)
          }
        }

        changed = cleanedCode !== before
      }

      // Only return if code was modified
      if (cleanedCode !== code) {
        return {
          code: cleanedCode,
          map: null, // No source map for this transformation
        }
      }

      return null
    },
  }
}
