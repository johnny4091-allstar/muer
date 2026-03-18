const db = require('../database/db');

class Category {
  static create({ name, type, parentId = null }) {
    const stmt = db.prepare(`
      INSERT INTO categories (name, type, parent_id)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(name, type, parentId);
    return result.lastInsertRowid;
  }

  static getAll() {
    const stmt = db.prepare('SELECT * FROM categories ORDER BY type, name');
    return stmt.all();
  }

  static getByType(type) {
    const stmt = db.prepare('SELECT * FROM categories WHERE type = ? ORDER BY name');
    return stmt.all(type);
  }

  static getById(id) {
    const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
    return stmt.get(id);
  }

  static update(id, { name, type, parentId }) {
    const stmt = db.prepare(`
      UPDATE categories
      SET name = ?, type = ?, parent_id = ?
      WHERE id = ?
    `);

    return stmt.run(name, type, parentId, id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
    return stmt.run(id);
  }

  // For Xtream Codes API
  static formatForXtreamAPI(categories) {
    return categories.map(cat => ({
      category_id: cat.id.toString(),
      category_name: cat.name,
      parent_id: cat.parent_id ? cat.parent_id.toString() : "0"
    }));
  }
}

module.exports = Category;
