import { createSelectSchema } from "drizzle-typebox"
import { t } from "elysia"
import type { Static, TSchema } from "elysia"
import { table } from "../database/schema"

// Type augmentation for Elysia context to include user from auth
export const baseResponseType = <T extends TSchema>(schema: T) => t.Object({
  status: t.Number(),
  message: t.String(),
  success: t.Boolean(),
  type: t.String(),
  data: t.Optional(schema)
})
export type BaseResponse<T> = {
  status: number
  message: string
  success: boolean
  type: string
  data: T
}

export const contentType = t.Recursive(Self => t.Object({
  type: t.Optional(t.String()),
  content: t.Optional(t.Array(Self)),
  attrs: t.Optional(t.Record(t.String(), t.Any())),
  marks: t.Optional(t.Array(t.Record(t.String(), t.Any()))),
  text: t.Optional(t.String())
}))
export const userType = createSelectSchema(table.user)

export type User = Static<typeof userType>

// Log message types for WebSocket communication
export const logMessageType = t.Object({
  type: t.Literal('log'),
  containerId: t.String(),
  timestamp: t.String(),
  message: t.String(),
  level: t.String()
})

export const subscribeMessageType = t.Object({
  type: t.Literal('subscribe'),
  containerId: t.String()
})

export const unsubscribeMessageType = t.Object({
  type: t.Literal('unsubscribe'),
  containerId: t.String()
})

export const stdinMessageType = t.Object({
  type: t.Literal('stdin'),
  id: t.String(),
  containerId: t.String(),
  input: t.String()
})

export const clientLogMessageType = t.Union([
  subscribeMessageType,
  unsubscribeMessageType,
  stdinMessageType
])

export type LogMessage = Static<typeof logMessageType>
export type SubscribeMessage = Static<typeof subscribeMessageType>
export type UnsubscribeMessage = Static<typeof unsubscribeMessageType>
export type StdinMessage = Static<typeof stdinMessageType>
export type ClientLogMessage = Static<typeof clientLogMessageType>

// Re-export websocket types and schemas
export * from './websocket';




