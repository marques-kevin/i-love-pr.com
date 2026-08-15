/** Parsed JSON-compatible value after an I/O boundary decode. */
export type JsonObject = { [key: string]: JsonValue }
export type JsonArray = JsonValue[]
export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonObject | JsonArray

/** Unparsed value from IndexedDB, fetch, or other external I/O. */
export type ExternalObject = { [key: string]: ExternalValue }
export type ExternalArray = ExternalValue[]
export type ExternalPrimitive = string | number | boolean | null
export type ExternalValue = ExternalPrimitive | ExternalObject | ExternalArray

/** GraphQL variables sent to the GitHub API. */
export type GraphQLVariableValue =
  string | number | boolean | null | GraphQLVariableValue[] | GraphQLVariableObject
export type GraphQLVariableObject = { [key: string]: GraphQLVariableValue }
