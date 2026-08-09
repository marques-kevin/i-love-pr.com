/**
 * Report English i18n keys that are never referenced in src/.
 *
 * Literal `id: '…'` / `id="…"` usages are detected via scan.
 * Dynamic keys (locale / period / widget helpers) are marked used via
 * DYNAMICALLY_REFERENCED_MESSAGE_KEYS.
 *
 * Usage: npm run i18n:check-unused
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DYNAMICALLY_REFERENCED_MESSAGE_KEYS } from '../src/lib/i18n/keys.ts'
import { en_messages, type MessageKey } from '../src/lib/i18n/messages/en.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC_ROOT = path.join(ROOT, 'src')

const SCAN_EXTENSIONS = new Set(['.ts', '.tsx'])
const IGNORE_DIR_NAMES = new Set(['messages', 'node_modules', 'dist', 'coverage'])

const LITERAL_ID_RE = /\bid\s*[:=]\s*(?:['"]([^'"]+)['"]|`([^`$]+)`)/g

/** Catches `id: cond ? 'a' : 'b'` style message ids. */
const TERNARY_ID_RE = /\bid\s*[:=]\s*[^?{\n]+\?\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g

async function list_source_files(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    if (IGNORE_DIR_NAMES.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await list_source_files(full)))
      continue
    }
    if (SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(full)
    }
  }
  return files
}

function collect_literal_ids(source: string): string[] {
  const ids: string[] = []
  for (const match of source.matchAll(LITERAL_ID_RE)) {
    const id = match[1] ?? match[2]
    if (id) ids.push(id)
  }
  for (const match of source.matchAll(TERNARY_ID_RE)) {
    if (match[1]) ids.push(match[1])
    if (match[2]) ids.push(match[2])
  }
  return ids
}

async function main(): Promise<void> {
  const used = new Set<string>(DYNAMICALLY_REFERENCED_MESSAGE_KEYS)
  const files = await list_source_files(SRC_ROOT)

  for (const file of files) {
    // Message catalogs themselves are definitions, not usages.
    if (file.includes(`${path.sep}i18n${path.sep}messages${path.sep}`)) continue
    if (file.endsWith(`${path.sep}i18n${path.sep}keys.ts`)) continue
    const source = await readFile(file, 'utf8')
    for (const id of collect_literal_ids(source)) {
      used.add(id)
    }
  }

  const all_keys = Object.keys(en_messages) as MessageKey[]
  const unused = all_keys.filter((key) => !used.has(key)).sort((a, b) => a.localeCompare(b))

  if (unused.length > 0) {
    console.error(`[i18n:unused] ${unused.length} unused key(s):`)
    for (const key of unused) console.error(`  - ${key}`)
    process.exitCode = 1
    return
  }

  console.log(`[i18n:unused] OK — all ${all_keys.length} English keys are referenced.`)
}

void main()
