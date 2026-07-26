const { pool } = require('./database');

function prepare(sql) {
  const mysqlSql = sql;
  return {
    get: async (...params) => {
      const [rows] = await pool.query(mysqlSql, params);
      return rows[0] || null;
    },
    all: async (...params) => {
      const [rows] = await pool.query(mysqlSql, params);
      return rows;
    },
    run: async (...params) => {
      const [result] = await pool.query(mysqlSql, params);
      return {
        changes: result.affectedRows,
        lastInsertRowid: result.insertId
      };
    }
  };
}

const db = { prepare, pool };

module.exports = { db };