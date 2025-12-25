// Compatibility layer for Neon database with Clerk auth
// This file provides Supabase-like API for existing code

import { neon } from '@neondatabase/serverless'

// Vite only exposes env vars prefixed with VITE_ to the browser, so we
// primarily read from VITE_DATABASE_URL. DATABASE_URL is kept as a fallback
// for environments where it may still be injected.
const connectionString = import.meta.env.VITE_DATABASE_URL || import.meta.env.DATABASE_URL
const sql = connectionString ? neon(connectionString) : null

// Query builder that supports method chaining
class QueryBuilder {
  constructor(table) {
    this.table = table
    this.queryType = 'select'
    this.columns = '*'
    this.whereConditions = []
    this.orderByClause = null
    this.limitValue = null
    this.insertData = null
    this.updateData = null
  }

  select(columns = '*') {
    this.queryType = 'select'
    this.columns = columns
    return this
  }

  eq(column, value) {
    this.whereConditions.push({ column, operator: '=', value })
    return this
  }

  gte(column, value) {
    this.whereConditions.push({ column, operator: '>=', value })
    return this
  }

  lte(column, value) {
    this.whereConditions.push({ column, operator: '<=', value })
    return this
  }

  ilike(column, value) {
    this.whereConditions.push({ column, operator: 'ILIKE', value })
    return this
  }

  order(column, options = {}) {
    const direction = options.ascending ? 'ASC' : 'DESC'
    this.orderByClause = `${column} ${direction}`
    return this
  }

  limit(count) {
    this.limitValue = count
    return this
  }

  single() {
    this.singleRow = true
    return this
  }

  async execute() {
    try {
      if (!sql) throw new Error('Database not configured')

      let query = ''
      let params = []

      if (this.queryType === 'select') {
        query = `SELECT ${this.columns} FROM ${this.table}`
        
        if (this.whereConditions.length > 0) {
          const whereClause = this.whereConditions.map((cond, i) => {
            params.push(cond.value)
            return `${cond.column} ${cond.operator} $${params.length}`
          }).join(' AND ')
          query += ` WHERE ${whereClause}`
        }
        
        if (this.orderByClause) {
          query += ` ORDER BY ${this.orderByClause}`
        }
        
        if (this.limitValue) {
          query += ` LIMIT ${this.limitValue}`
        }
      } else if (this.queryType === 'insert') {
        // Support both insert({ ... }) and insert([{ ... }])
        const row = Array.isArray(this.insertData) ? this.insertData[0] : this.insertData
        const columns = Object.keys(row)
        const values = Object.values(row)
        params = values
        
        const columnNames = columns.join(', ')
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')
        
        query = `INSERT INTO ${this.table} (${columnNames}) VALUES (${placeholders}) RETURNING *`
      } else if (this.queryType === 'update') {
        const updates = Object.keys(this.updateData).map((key, i) => {
          params.push(this.updateData[key])
          return `${key} = $${params.length}`
        }).join(', ')
        
        query = `UPDATE ${this.table} SET ${updates}`
        
        if (this.whereConditions.length > 0) {
          const whereClause = this.whereConditions.map((cond) => {
            params.push(cond.value)
            return `${cond.column} ${cond.operator} $${params.length}`
          }).join(' AND ')
          query += ` WHERE ${whereClause}`
        }
        
        query += ' RETURNING *'
      } else if (this.queryType === 'delete') {
        query = `DELETE FROM ${this.table}`
        
        if (this.whereConditions.length > 0) {
          const whereClause = this.whereConditions.map((cond) => {
            params.push(cond.value)
            return `${cond.column} ${cond.operator} $${params.length}`
          }).join(' AND ')
          query += ` WHERE ${whereClause}`
        }
        
        query += ' RETURNING *'
      }

      const result = await sql(query, params)
      
      if (this.singleRow) {
        return { data: result[0] || null, error: null }
      }
      
      return { data: result, error: null }
    } catch (error) {
      console.error('Database query error:', error)
      return { data: null, error }
    }
  }

  // Make the builder awaitable
  then(resolve, reject) {
    return this.execute().then(resolve, reject)
  }
}

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
    const builder = new QueryBuilder(table)
    
    return {

      select: (columns = '*') => {
        builder.queryType = 'select'
        builder.columns = columns
        return builder
      },
      
      insert: (data) => {
        builder.queryType = 'insert'
        builder.insertData = data
        return builder
      },
      
      update: (data) => {
        builder.queryType = 'update'
        builder.updateData = data
        return builder
      },
      
      delete: () => {
        builder.queryType = 'delete'
        return builder
      }
    }
  }
}
