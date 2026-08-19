import type {
  ExternalObject,
  ExternalValue,
  GraphQLVariableObject,
  GraphQLVariableValue,
  JsonArray,
  JsonObject,
  JsonValue,
} from './json_value'

const OBJECT_TAG = '[object Object]'
const STRING_TAG = '[object String]'
const NUMBER_TAG = '[object Number]'

export function is_external_object(value: ExternalValue): value is ExternalObject {
  return (
    value !== null && !Array.isArray(value) && Object.prototype.toString.call(value) === OBJECT_TAG
  )
}

export function is_json_object(value: JsonValue): value is JsonObject {
  return (
    value !== null && !Array.isArray(value) && Object.prototype.toString.call(value) === OBJECT_TAG
  )
}

export function is_string_value(value: ExternalValue | JsonValue | null): value is string {
  return Object.prototype.toString.call(value) === STRING_TAG
}

export function is_boolean_value(value: ExternalValue | JsonValue): value is boolean {
  return value === true || value === false
}

export function is_number_value(value: ExternalValue | JsonValue): value is number {
  return Object.prototype.toString.call(value) === NUMBER_TAG && Number.isFinite(value)
}

export function has_browser_navigator(): boolean {
  // SAFETY: Workers lib has no DOM Navigator; optional presence is checked without assuming the DOM type.
  return (globalThis as { navigator?: unknown }).navigator !== undefined
}

export function has_browser_local_storage(): boolean {
  // SAFETY: Workers lib has no DOM Storage; optional presence is checked without assuming the DOM type.
  return (globalThis as { localStorage?: unknown }).localStorage !== undefined
}

export function has_intl(): boolean {
  return globalThis.Intl !== undefined
}

export function external_object_array(values: ExternalValue[]): JsonObject[] {
  const rows: JsonObject[] = []
  for (const value of values) {
    if (is_external_object(value)) {
      rows.push(external_object_to_json(value))
    }
  }
  return rows
}

export function external_object_to_json(value: ExternalObject): JsonObject {
  const row: JsonObject = {}
  for (const [key, field] of Object.entries(value)) {
    row[key] = external_value_to_json(field)
  }
  return row
}

function external_value_to_json(value: ExternalValue): JsonValue {
  if (value === null) return null
  if (Array.isArray(value)) return value.map(external_value_to_json)
  if (is_external_object(value)) return external_object_to_json(value)
  return value
}

export function pick_json_object(value: JsonValue | undefined): JsonObject {
  if (value !== undefined && is_json_object(value)) return value
  return {}
}

export function json_string_array(value: JsonValue | undefined): string[] {
  if (!Array.isArray(value)) return []
  const strings: string[] = []
  for (const item of value) {
    if (is_string_value(item)) strings.push(item)
  }
  return strings
}

export function json_number_array(value: JsonValue | undefined): number[] {
  if (!Array.isArray(value)) return []
  const numbers: number[] = []
  for (const item of value) {
    if (is_number_value(item)) numbers.push(item)
  }
  return numbers
}

export function json_string_field(
  row: JsonObject,
  snake: string,
  camel: string,
  fallback = '',
): string {
  const raw = row[snake] ?? row[camel]
  if (raw === undefined || raw === null) return fallback
  if (is_string_value(raw)) return raw
  return String(raw)
}

export function json_nullable_string_field(
  row: JsonObject,
  snake: string,
  camel: string,
): string | null {
  const raw = row[snake] ?? row[camel]
  if (raw === null || raw === undefined) return null
  if (is_string_value(raw)) return raw
  return String(raw)
}

export function parse_external_object(raw: ExternalValue): ExternalObject | null {
  if (!is_external_object(raw)) return null
  return raw
}

export function parse_graphql_variables(raw: GraphQLVariableObject): GraphQLVariableObject {
  return raw
}

export function graphql_variable_object(): GraphQLVariableObject {
  return {}
}

export function is_graphql_variable_value(value: ExternalValue): value is GraphQLVariableValue {
  if (value === null) return true
  if (is_string_value(value) || is_number_value(value) || is_boolean_value(value)) return true
  if (Array.isArray(value)) return value.every(is_graphql_variable_value)
  if (is_external_object(value)) {
    return Object.values(value).every(is_graphql_variable_value)
  }
  return false
}

export function parse_json_array(value: JsonValue | undefined): JsonArray {
  return Array.isArray(value) ? value : []
}

export function optional_json_string(value: JsonValue | undefined): string | undefined {
  if (value === undefined || value === null) return undefined
  if (is_string_value(value)) return value
  return undefined
}

export function parse_string_record(
  value: JsonValue | undefined,
): Record<string, string> | undefined {
  if (value === undefined || !is_json_object(value)) return undefined
  const record: Record<string, string> = {}
  for (const [key, field] of Object.entries(value)) {
    if (is_string_value(field)) record[key] = field
  }
  return Object.keys(record).length > 0 ? record : undefined
}
