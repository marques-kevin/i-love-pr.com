export const DEFAULT_TEST_FILE_GLOBS = [
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/__tests__/**',
  '**/__test__/**',
  '**/*.test.js',
  '**/*.test.jsx',
  '**/*.spec.js',
  '**/*.spec.jsx',
]

function glob_to_regexp(glob: string): RegExp {
  let pattern = '^'
  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i]
    if (char === '*') {
      if (glob[i + 1] === '*') {
        if (glob[i + 2] === '/') {
          pattern += '(?:.*/)?'
          i += 2
        } else {
          pattern += '.*'
          i += 1
        }
      } else {
        pattern += '[^/]*'
      }
      continue
    }
    if (char === '?') {
      pattern += '[^/]'
      continue
    }
    if ('.+^${}()|[]\\'.includes(char)) {
      pattern += `\\${char}`
      continue
    }
    pattern += char
  }
  pattern += '$'
  return new RegExp(pattern)
}

export function matches_test_file(path: string, globs: string[]): boolean {
  const normalized = path.replace(/\\/g, '/')
  return globs.some((glob) => {
    const trimmed = glob.trim()
    if (!trimmed) return false
    return glob_to_regexp(trimmed).test(normalized)
  })
}

export function parse_test_file_globs(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter(Boolean)
}
