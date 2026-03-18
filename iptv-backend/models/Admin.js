const db = require('../database/db');
const bcrypt = require('bcryptjs');

class Admin {
  static create({ username, password, email, role = 'admin' }) {
    const hashedPassword = bcrypt.hashSync(password, 10);

    const stmt = db.prepare(`
      INSERT INTO admins (username, password, email, role)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(username, hashedPassword, email, role);
    return result.lastInsertRowid;
  }

  static findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM admins WHERE username = ?');
    return stmt.get(username);
  }

  static authenticate(username, password) {
    const admin = this.findByUsername(username);
    if (!admin) return null;

    const isValid = bcrypt.compareSync(password, admin.password);
    if (!isValid) return null;

    return admin;
  }

  static getAll() {
    const stmt = db.prepare('SELECT id, username, email, role, created_at FROM admins');
    return stmt.all();
  }

  static update(id, data) {
    const fields = [];
    const values = [];

    if (data.password) {
      fields.push('password = ?');
      values.push(bcrypt.hashSync(data.password, 10));
    }
    if (data.email) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.role) {
      fields.push('role = ?');
      values.push(data.role);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const stmt = db.prepare(`UPDATE admins SET ${fields.join(', ')} WHERE id = ?`);
    return stmt.run(...values);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM admins WHERE id = ?');
    return stmt.run(id);
  }
}

module.exports = Admin;
