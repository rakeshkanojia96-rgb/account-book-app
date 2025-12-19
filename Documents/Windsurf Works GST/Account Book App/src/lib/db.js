import { neon } from '@neondatabase/serverless'

const sql = neon(import.meta.env.DATABASE_URL || '')

export { sql }

export const db = {
  async query(text, params) {
    try {
      const result = await sql(text, params)
      return { data: result, error: null }
    } catch (error) {
      console.error('Database error:', error)
      return { data: null, error }
    }
  }
}
