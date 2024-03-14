declare module 'sass-cast' {
  import type { Value, CustomFunction } from 'sass/types'

  export function toSass(
    value: unknown,
    options?: {
      parseUnquotedStrings?: boolean
      resolveFunctions?: boolean
    }
  ): Value

  export function fromSass(
    value: object,
    options?: {
      preserveUnits?: boolean
      rgbColors?: boolean
    }
  ): unknown

  export const sassFunctions: Record<string, CustomFunction<'async'>>
}

declare module 'sass-cast/legacy' {
  import type { LegacyValue, LegacyFunction } from 'sass/types'

  export function toSass(
    value: unknown,
    options?: {
      parseUnquotedStrings?: boolean
      resolveFunctions?: boolean
    }
  ): LegacyValue

  export function fromSass(
    value: object,
    options?: {
      preserveUnits?: boolean
      rgbColors?: boolean
    }
  ): unknown

  export const sassFunctions: Record<string, LegacyFunction<'async'>>
}
