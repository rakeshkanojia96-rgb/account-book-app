import { neon } from '@neondatabase/serverless'

const DATABASE_URL = import.meta.env.DATABASE_URL

if (!DATABASE_URL) {
  console.warn('DATABASE_URL not configured. Database operations will fail.')
}

const sql = DATABASE_URL ? neon(DATABASE_URL) : null

export const db = {
  async query(queryText, params = []) {
    if (!sql) {
      return { data: null, error: new Error('Database not configured') }
    }
    
    try {
      const result = await sql(queryText, params)
      return { data: result, error: null }
    } catch (error) {
      console.error('Database query error:', error)
      return { data: null, error }
    }
  },

  async insert(table, data, userId) {
    const columns = Object.keys(data).join(', ')
    const values = Object.values(data)
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')
    
    const queryText = `
      INSERT INTO ${table} (${columns}, user_id)
      VALUES (${placeholders}, $${values.length + 1})
      RETURNING *
    `
    
    return this.query(queryText, [...values, userId])
  },

  async select(table, userId, conditions = {}) {
    let queryText = `SELECT * FROM ${table} WHERE user_id = $1`
    const params = [userId]
    
    Object.entries(conditions).forEach(([key, value], index) => {
      queryText += ` AND ${key} = $${index + 2}`
      params.push(value)
    })
    
    return this.query(queryText, params)
  },

  async update(table, id, data, userId) {
    const updates = Object.keys(data)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ')
    const values = Object.values(data)
    
    const queryText = `
      UPDATE ${table}
      SET ${updates}, updated_at = NOW()
      WHERE id = $1 AND user_id = $${values.length + 2}
      RETURNING *
    `
    
    return this.query(queryText, [id, ...values, userId])
  },

  async delete(table, id, userId) {
    const queryText = `
      DELETE FROM ${table}
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `
    
    return this.query(queryText, [id, userId])
  }
}
