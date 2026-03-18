const db = require('../database/db');

class Stream {
  // Live Streams
  static createLiveStream(data) {
    const stmt = db.prepare(`
      INSERT INTO live_streams (name, stream_url, stream_icon, category_id, epg_channel_id, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.name,
      data.stream_url,
      data.stream_icon || null,
      data.category_id || null,
      data.epg_channel_id || null,
      data.status || 'active'
    );

    return result.lastInsertRowid;
  }

  static getLiveStreams() {
    const stmt = db.prepare(`
      SELECT ls.*, c.name as category_name
      FROM live_streams ls
      LEFT JOIN categories c ON ls.category_id = c.id
      WHERE ls.status = 'active'
      ORDER BY ls.name
    `);
    return stmt.all();
  }

  static getLiveStreamById(id) {
    const stmt = db.prepare('SELECT * FROM live_streams WHERE id = ?');
    return stmt.get(id);
  }

  static updateLiveStream(id, data) {
    const stmt = db.prepare(`
      UPDATE live_streams
      SET name = ?, stream_url = ?, stream_icon = ?, category_id = ?,
          epg_channel_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    return stmt.run(
      data.name,
      data.stream_url,
      data.stream_icon,
      data.category_id,
      data.epg_channel_id,
      data.status,
      id
    );
  }

  static deleteLiveStream(id) {
    const stmt = db.prepare('DELETE FROM live_streams WHERE id = ?');
    return stmt.run(id);
  }

  // VOD Streams
  static createVOD(data) {
    const stmt = db.prepare(`
      INSERT INTO vod_streams (name, stream_url, stream_icon, category_id, plot,
                               cast, director, genre, release_date, rating, duration, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.name,
      data.stream_url,
      data.stream_icon || null,
      data.category_id || null,
      data.plot || null,
      data.cast || null,
      data.director || null,
      data.genre || null,
      data.release_date || null,
      data.rating || null,
      data.duration || null,
      data.status || 'active'
    );

    return result.lastInsertRowid;
  }

  static getVODStreams() {
    const stmt = db.prepare(`
      SELECT vs.*, c.name as category_name
      FROM vod_streams vs
      LEFT JOIN categories c ON vs.category_id = c.id
      WHERE vs.status = 'active'
      ORDER BY vs.name
    `);
    return stmt.all();
  }

  static getVODById(id) {
    const stmt = db.prepare('SELECT * FROM vod_streams WHERE id = ?');
    return stmt.get(id);
  }

  static updateVOD(id, data) {
    const stmt = db.prepare(`
      UPDATE vod_streams
      SET name = ?, stream_url = ?, stream_icon = ?, category_id = ?,
          plot = ?, cast = ?, director = ?, genre = ?, release_date = ?,
          rating = ?, duration = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    return stmt.run(
      data.name,
      data.stream_url,
      data.stream_icon,
      data.category_id,
      data.plot,
      data.cast,
      data.director,
      data.genre,
      data.release_date,
      data.rating,
      data.duration,
      data.status,
      id
    );
  }

  static deleteVOD(id) {
    const stmt = db.prepare('DELETE FROM vod_streams WHERE id = ?');
    return stmt.run(id);
  }

  // For Xtream Codes API compatibility
  static formatForXtreamAPI(streams, type = 'live') {
    return streams.map(stream => ({
      num: stream.id,
      name: stream.name,
      stream_type: type,
      stream_id: stream.id,
      stream_icon: stream.stream_icon || '',
      epg_channel_id: stream.epg_channel_id || null,
      added: stream.created_at,
      category_id: stream.category_id ? stream.category_id.toString() : null,
      category_name: stream.category_name || 'Uncategorized',
      direct_source: stream.stream_url
    }));
  }
}

module.exports = Stream;
