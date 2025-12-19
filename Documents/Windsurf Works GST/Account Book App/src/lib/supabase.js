// Compatibility layer for Neon database with Clerk auth
// This file provides Supabase-like API for existing code

import { neon } from '@neondatabase/serverless'

const sql = import.meta.env.DATABASE_URL ? neon(import.meta.env.DATABASE_URL) : null

// Supabase-compatible API wrapper
export const supabase = {
  auth: {
    async getUser() {
      // This will be handled by Clerk in the components
      // Return a compatible structure
      return { data: { user: null }, error: null }
    }
  },

  from(table) {
    return {
      async select(columns = '*') {
        return {
          eq: async (column, value) => {
            try {
              if (!sql) throw new Error('Database not configured')
              const result = await sql`SELECT * FROM ${sql(table)} WHERE ${sql(column)} = ${value}`
              return { data: result, error: null }
            } catch (error) {
              return { data: null, error }
            }
          },
          gte: async (column, value) => {
            try {
              if (!sql) throw new Error('Database not configured')
              const result = await sql`SELECT * FROM ${sql(table)} WHERE ${sql(column)} >= ${value}`
              return { data: result, error: null }
            } catch (error) {
              return { data: null, error }
            }
          },
          lte: async (column, value) => {
            try {
              if (!sql) throw new Error('Database not configured')
              const result = await sql`SELECT * FROM ${sql(table)} WHERE ${sql(column)} <= ${value}`
              return { data: result, error: null }
            } catch (error) {
              return { data: null, error }
            }
          }
        }
      },

      async insert(data) {
        try {
          if (!sql) throw new Error('Database not configured')
          const columns = Object.keys(data)
          const values = Object.values(data)
          
          // Build INSERT query dynamically
          const columnNames = columns.join(', ')
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')
          
          const result = await sql(`
            INSERT INTO ${table} (${columnNames})
            VALUES (${placeholders})
            RETURNING *
          `, values)
          
          return { data: result, error: null }
        } catch (error) {
          return { data: null, error }
        }
      },

      async update(data) {
        return {
          eq: async (column, value) => {
            try {
              if (!sql) throw new Error('Database not configured')
              const updates = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ')
              const values = [...Object.values(data), value]
              
              const result = await sql(`
                UPDATE ${table}
                SET ${updates}
                WHERE ${column} = $${values.length}
                RETURNING *
              `, values)
              
              return { data: result, error: null }
            } catch (error) {
              return { data: null, error }
            }
          }
        }
      },

      async delete() {
        return {
          eq: async (column, value) => {
            try {
              if (!sql) throw new Error('Database not configured')
              const result = await sql(`DELETE FROM ${table} WHERE ${column} = $1 RETURNING *`, [value])
              return { data: result, error: null }
            } catch (error) {
              return { data: null, error }
            }
          }
        }
      }
    }
  }
}
