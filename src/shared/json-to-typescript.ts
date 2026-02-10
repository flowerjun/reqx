interface TypeNode {
  kind: 'primitive' | 'literal' | 'array' | 'tuple' | 'object' | 'union' | 'record' | 'ref' | 'branded'
  value?: string
  items?: TypeNode[]
  fields?: Map<string, { type: TypeNode; optional: boolean }>
  name?: string
  brand?: string
}

export type EmitMode = 'type' | 'interface'

// String pattern detectors
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const URL_RE = /^https?:\/\/.+/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type StringFormat = 'ISODateString' | 'UUID' | 'URLString' | 'EmailString'

function detectStringFormat(value: string): StringFormat | null {
  if (ISO_DATE_RE.test(value)) return 'ISODateString'
  if (UUID_RE.test(value)) return 'UUID'
  if (URL_RE.test(value)) return 'URLString'
  if (EMAIL_RE.test(value)) return 'EmailString'
  return null
}

const formatComments: Record<StringFormat, string> = {
  ISODateString: 'ISO 8601 date string',
  UUID: 'UUID',
  URLString: 'URL',
  EmailString: 'email',
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function singularize(s: string): string {
  if (s.endsWith('ies')) return s.slice(0, -3) + 'y'
  if (s.endsWith('ses') || s.endsWith('xes') || s.endsWith('zes')) return s.slice(0, -2)
  if (s.endsWith('s') && !s.endsWith('ss')) return s.slice(0, -1)
  return s
}

function toSafeKey(key: string): string {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`
}

function toTypeName(name: string): string {
  return name
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^./, (c) => c.toUpperCase())
}

function isIdLikeField(key: string): boolean {
  const lower = key.toLowerCase()
  return lower === 'id' || lower.endsWith('id') || lower.endsWith('_id')
}

function isTimestampField(key: string): boolean {
  const lower = key.toLowerCase()
  return lower.endsWith('at') || lower.endsWith('date') || lower.endsWith('time')
    || lower === 'created' || lower === 'updated' || lower === 'timestamp'
}

function typeNodeToString(node: TypeNode, mode: EmitMode): string {
  switch (node.kind) {
    case 'primitive':
    case 'ref':
      return node.value!
    case 'branded':
      return node.brand!
    case 'literal':
      return typeof node.value === 'string' ? `"${node.value}"` : String(node.value)
    case 'array':
      if (!node.items || node.items.length === 0) return 'unknown[]'
      if (node.items.length === 1) {
        const inner = typeNodeToString(node.items[0], mode)
        if (mode === 'type') {
          return `ReadonlyArray<${inner}>`
        }
        return inner.includes('|') || inner.includes(' ') ? `(${inner})[]` : `${inner}[]`
      }
      if (mode === 'type') {
        return `ReadonlyArray<${node.items.map((i) => typeNodeToString(i, mode)).join(' | ')}>`
      }
      return `(${node.items.map((i) => typeNodeToString(i, mode)).join(' | ')})[]`
    case 'tuple':
      if (mode === 'type') {
        return `readonly [${(node.items ?? []).map((i) => typeNodeToString(i, mode)).join(', ')}]`
      }
      return `[${(node.items ?? []).map((i) => typeNodeToString(i, mode)).join(', ')}]`
    case 'union':
      return (node.items ?? []).map((i) => typeNodeToString(i, mode)).join(' | ')
    case 'record':
      if (node.items && node.items.length === 1) {
        if (mode === 'type') {
          return `Readonly<Record<string, ${typeNodeToString(node.items[0], mode)}>>`
        }
        return `Record<string, ${typeNodeToString(node.items[0], mode)}>`
      }
      return 'Record<string, unknown>'
    case 'object':
      return node.name ?? 'unknown'
    default:
      return 'unknown'
  }
}

export function jsonToTypeScript(
  json: unknown,
  rootName = 'Root',
  mode: EmitMode = 'type',
): string {
  const definitions: string[] = []
  const typeAliases: string[] = []
  const comments = new Map<string, Map<string, string>>()
  const signatureMap = new Map<string, string>()
  const usedBrandedTypes = new Set<StringFormat>()
  const extractedUnions = new Map<string, string[]>() // name -> literal values

  function analyze(value: unknown, name: string, depth: number): TypeNode {
    if (value === null) return { kind: 'primitive', value: 'null' }
    if (value === undefined) return { kind: 'primitive', value: 'undefined' }

    switch (typeof value) {
      case 'string': {
        const format = detectStringFormat(value)
        if (format) {
          if (mode === 'type') {
            usedBrandedTypes.add(format)
            return { kind: 'branded', brand: format, value: 'string', name: formatComments[format] }
          }
          return { kind: 'primitive', value: 'string', name: formatComments[format] }
        }
        return { kind: 'primitive', value: 'string' }
      }
      case 'number':
        return { kind: 'primitive', value: 'number' }
      case 'boolean':
        return { kind: 'primitive', value: 'boolean' }
      case 'object': {
        if (Array.isArray(value)) {
          return analyzeArray(value, name, depth)
        }
        return analyzeObject(value as Record<string, unknown>, name, depth)
      }
      default:
        return { kind: 'primitive', value: 'unknown' }
    }
  }

  function analyzeArray(arr: unknown[], name: string, depth: number): TypeNode {
    if (arr.length === 0) return { kind: 'array', items: [] }

    const objectItems: Record<string, unknown>[] = []
    const nonObjectItems: TypeNode[] = []
    let hasNull = false

    for (const item of arr) {
      if (item === null) {
        hasNull = true
        continue
      }
      if (typeof item === 'object' && !Array.isArray(item)) {
        objectItems.push(item as Record<string, unknown>)
      } else {
        const t = analyze(item, singularize(name), depth + 1)
        nonObjectItems.push(t)
      }
    }

    // Check for tuple pattern
    if (arr.length <= 6 && arr.length >= 2 && objectItems.length === 0) {
      const itemTypes = arr.map((item, i) => analyze(item, `${name}${i}`, depth + 1))
      const typeStrings = itemTypes.map((t) => typeNodeToString(t, mode))
      const uniqueTypes = new Set(typeStrings)
      if (uniqueTypes.size > 1 && uniqueTypes.size === arr.length) {
        return { kind: 'tuple', items: itemTypes }
      }
    }

    // Check for enum-like string arrays
    if (objectItems.length === 0 && nonObjectItems.length > 0) {
      const allStrings = arr.every((item) => typeof item === 'string')
      if (allStrings) {
        const uniqueValues = [...new Set(arr as string[])]
        if (uniqueValues.length <= 10 && uniqueValues.length >= 2 && uniqueValues.length < arr.length) {
          // Extract as named union type alias
          const unionName = toTypeName(singularize(name))
          if (!extractedUnions.has(unionName)) {
            extractedUnions.set(unionName, uniqueValues)
          }

          const literals: TypeNode[] = uniqueValues.map((v) => ({
            kind: 'literal' as const,
            value: v,
          }))
          if (hasNull) literals.push({ kind: 'primitive', value: 'null' })
          return { kind: 'array', items: [{ kind: 'union', items: literals }] }
        }
      }

      const uniquePrimitives = [...new Set(nonObjectItems.map((t) => typeNodeToString(t, mode)))]
      const items: TypeNode[] = uniquePrimitives.map((t) => ({ kind: 'primitive' as const, value: t }))
      if (hasNull) items.push({ kind: 'primitive', value: 'null' })

      return { kind: 'array', items: items.length === 1 ? items : [{ kind: 'union', items }] }
    }

    // Object array: merge all items
    if (objectItems.length > 0) {
      const mergedType = mergeObjectArray(objectItems, name, depth)
      const resultItems: TypeNode[] = [mergedType]
      for (const t of nonObjectItems) {
        if (!resultItems.some((r) => typeNodeToString(r, mode) === typeNodeToString(t, mode))) {
          resultItems.push(t)
        }
      }
      if (hasNull) resultItems.push({ kind: 'primitive', value: 'null' })

      return {
        kind: 'array',
        items: resultItems.length === 1 ? resultItems : [{ kind: 'union', items: resultItems }],
      }
    }

    if (hasNull) {
      return { kind: 'array', items: [{ kind: 'primitive', value: 'null' }] }
    }

    return { kind: 'array', items: [] }
  }

  function mergeObjectArray(
    objects: Record<string, unknown>[],
    name: string,
    depth: number,
  ): TypeNode {
    const allKeys = new Map<string, { values: unknown[]; count: number }>()
    for (const obj of objects) {
      for (const [key, val] of Object.entries(obj)) {
        const entry = allKeys.get(key) ?? { values: [], count: 0 }
        entry.values.push(val)
        entry.count++
        allKeys.set(key, entry)
      }
    }

    const itemName = toTypeName(singularize(name))
    const fields = new Map<string, { type: TypeNode; optional: boolean }>()
    const fieldComments = new Map<string, string>()

    for (const [key, { values, count }] of allKeys) {
      const optional = count < objects.length

      const types: TypeNode[] = []
      const typeStrings = new Set<string>()
      let hasNullValue = false

      for (const val of values) {
        if (val === null) {
          hasNullValue = true
          continue
        }
        const t = analyze(val, key, depth + 1)
        const ts = typeNodeToString(t, mode)
        if (!typeStrings.has(ts)) {
          typeStrings.add(ts)
          types.push(t)
        }
        if ((t.kind === 'primitive' || t.kind === 'branded') && t.name) {
          fieldComments.set(key, t.name)
        }
      }

      if (hasNullValue) {
        types.push({ kind: 'primitive', value: 'null' })
      }

      const fieldType = types.length === 1 ? types[0] : { kind: 'union' as const, items: types }
      fields.set(key, { type: fieldType, optional })
    }

    if (fieldComments.size > 0) {
      comments.set(itemName, fieldComments)
    }

    return emitDefinition(itemName, fields)
  }

  function analyzeObject(
    obj: Record<string, unknown>,
    name: string,
    depth: number,
  ): TypeNode {
    const keys = Object.keys(obj)
    if (keys.length === 0) {
      return { kind: 'record', items: [{ kind: 'primitive', value: 'unknown' }] }
    }

    // Detect Record<string, T> pattern
    if (keys.length > 5) {
      const looksLikeDynamic = keys.every(
        (k) => /^\d+$/.test(k) || /^[a-f0-9-]{8,}$/i.test(k),
      )
      if (looksLikeDynamic) {
        const valueTypes = new Set(keys.map((k) => typeof obj[k]))
        if (valueTypes.size === 1) {
          const sampleType = analyze(obj[keys[0]], `${name}Value`, depth + 1)
          if (typeof obj[keys[0]] === 'object' && obj[keys[0]] !== null) {
            const allValues = keys.map((k) => obj[k]) as Record<string, unknown>[]
            const merged = mergeObjectArray(allValues, `${name}Value`, depth)
            return { kind: 'record', items: [merged] }
          }
          return { kind: 'record', items: [sampleType] }
        }
      }
    }

    const typeName = toTypeName(name)
    const fields = new Map<string, { type: TypeNode; optional: boolean }>()
    const fieldComments = new Map<string, string>()

    for (const [key, val] of Object.entries(obj)) {
      const fieldType = analyze(val, key, depth + 1)
      const isNullable = val === null
      fields.set(key, { type: fieldType, optional: isNullable })
      if ((fieldType.kind === 'primitive' || fieldType.kind === 'branded') && fieldType.name) {
        fieldComments.set(key, fieldType.name)
      }
    }

    if (fieldComments.size > 0) {
      comments.set(typeName, fieldComments)
    }

    return emitDefinition(typeName, fields)
  }

  function emitDefinition(
    name: string,
    fields: Map<string, { type: TypeNode; optional: boolean }>,
  ): TypeNode {
    // Build signature for deduplication
    const sigParts: string[] = []
    for (const [key, { type, optional }] of fields) {
      sigParts.push(`${key}${optional ? '?' : ''}:${typeNodeToString(type, mode)}`)
    }
    const signature = sigParts.sort().join(';')

    if (signatureMap.has(signature)) {
      const existingName = signatureMap.get(signature)!
      return { kind: 'ref', value: existingName }
    }

    let finalName = name
    let counter = 2
    while (signatureMap.has(`__name__${finalName}`)) {
      finalName = `${name}${counter++}`
    }
    signatureMap.set(signature, finalName)
    signatureMap.set(`__name__${finalName}`, finalName)

    const fieldComments = comments.get(name)

    if (mode === 'type') {
      emitTypeAlias(finalName, fields, fieldComments)
    } else {
      emitInterface(finalName, fields, fieldComments)
    }

    return { kind: 'ref', value: finalName }
  }

  function emitTypeAlias(
    name: string,
    fields: Map<string, { type: TypeNode; optional: boolean }>,
    fieldComments?: Map<string, string>,
  ) {
    const lines: string[] = []
    for (const [key, { type, optional }] of fields) {
      const comment = fieldComments?.get(key)
      if (comment) {
        lines.push(`  /** ${comment} */`)
      }
      const readonlyPrefix = (isIdLikeField(key) || isTimestampField(key)) ? 'readonly ' : ''
      const opt = optional ? '?' : ''
      lines.push(`  ${readonlyPrefix}${toSafeKey(key)}${opt}: ${typeNodeToString(type, mode)}`)
    }

    definitions.push(`export type ${name} = {\n${lines.join('\n')}\n}`)
  }

  function emitInterface(
    name: string,
    fields: Map<string, { type: TypeNode; optional: boolean }>,
    fieldComments?: Map<string, string>,
  ) {
    const lines: string[] = []
    for (const [key, { type, optional }] of fields) {
      const comment = fieldComments?.get(key)
      if (comment) {
        lines.push(`  /** ${comment} */`)
      }
      const readonlyMod = (isIdLikeField(key) || isTimestampField(key)) ? 'readonly ' : ''
      const opt = optional ? '?' : ''
      lines.push(`  ${readonlyMod}${toSafeKey(key)}${opt}: ${typeNodeToString(type, mode)};`)
    }

    definitions.push(`export interface ${name} {\n${lines.join('\n')}\n}`)
  }

  // --- Entry point ---
  const rootType = analyze(json, rootName, 0)

  // Build preamble
  const preamble: string[] = []

  // Branded types (type mode only)
  if (mode === 'type' && usedBrandedTypes.size > 0) {
    for (const brand of usedBrandedTypes) {
      const comment = formatComments[brand]
      preamble.push(`/** Branded type for ${comment} values */`)
      preamble.push(`type ${brand} = string & { readonly __brand: '${brand}' }`)
    }
  }

  // Extracted union types
  for (const [unionName, values] of extractedUnions) {
    const literals = values.map((v) => `"${v}"`).join(' | ')
    if (mode === 'type') {
      preamble.push(`type ${unionName} = ${literals}`)
    } else {
      preamble.push(`type ${unionName} = ${literals}`)
    }
  }

  // If the root is a simple type (not a definition), emit a type alias
  if (definitions.length === 0) {
    const parts = [...preamble]
    parts.push(`export type ${toTypeName(rootName)} = ${typeNodeToString(rootType, mode)}`)
    return parts.join('\n\n')
  }

  // If root is an array with a ref type, add a type alias for the array
  if (rootType.kind === 'array') {
    const arrayTypeStr = typeNodeToString(rootType, mode)
    typeAliases.push(`export type ${toTypeName(rootName)} = ${arrayTypeStr}`)
  }

  const parts = [...preamble, ...definitions]
  if (typeAliases.length > 0) {
    parts.push(...typeAliases)
  }

  return parts.join('\n\n')
}
