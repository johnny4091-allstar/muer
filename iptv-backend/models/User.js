const db = require('../database/db');
const bcrypt = require('bcryptjs');

class User {
  static create({ username, password, email, maxConnections = 1, expDate, isTrial = 0 }) {
    const hashedPassword = bcrypt.hashSync(password, 10);

    const stmt = db.prepare(`
      INSERT INTO users (username, password, email, max_connections, exp_date, is_trial)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(username, hashedPassword, email, maxConnections, expDate, isTrial);
    return result.lastInsertRowid;
  }

  static findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  static authenticate(username, password) {
    const user = this.findByUsername(username);
    if (!user) return null;

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) return null;

    // Check if account is expired
    if (user.exp_date) {
      const expDate = new Date(user.exp_date);
      if (expDate < new Date()) {
        return null; // Account expired
      }
    }

    // Check if account is active
    if (user.status !== 'active') {
      return null;
    }

    return user;
  }

  static getAll() {
    const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    return stmt.all();
  }

  static update(id, data) {
    const fields = [];
    const values = [];

    if (data.password) {
      fields.push('password = ?');
      values.push(bcrypt.hashSync(data.password, 10));
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.status) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.maxConnections !== undefined) {
      fields.push('max_connections = ?');
      values.push(data.maxConnections);
    }
    if (data.expDate !== undefined) {
      fields.push('exp_date = ?');
      values.push(data.expDate);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    return stmt.run(...values);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    return stmt.run(id);
  }

  static getUserInfo(username, password) {
    const user = this.authenticate(username, password);
    if (!user) return null;

    return {
      user_info: {
        username: user.username,
        password: password,
        auth: 1,
        status: user.status,
        exp_date: user.exp_date,
        is_trial: user.is_trial.toString(),
        active_cons: "0",
        created_at: user.created_at,
        max_connections: user.max_connections.toString()
      },
      server_info: {
        url: process.env.SERVER_URL || 'http://localhost:3000',
        port: process.env.SERVER_PORT || '80',
        https_port: process.env.HTTPS_PORT || '443',
        server_protocol: 'http',
        rtmp_port: '1935',
        timestamp_now: Math.floor(Date.now() / 1000),
        time_now: new Date().toISOString()
      }
    };
  }
}

module.exports = User;
