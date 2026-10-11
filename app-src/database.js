/*
 * Offline-first persistence layer.
 * Android: native SQLite via @capacitor-community/sqlite.
 * Browser preview: localStorage fallback.
 *
 * Tables:
 *   word_packs(category_id PRIMARY KEY, words_json, updated_at)
 *   app_settings(setting_key PRIMARY KEY, setting_value, updated_at)
 *   saved_players(position PRIMARY KEY, player_name)
 */
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

const DB_NAME = 'word_imposter';
let db = null;
let ready = false;
let initPromise = null;

async function init() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (Capacitor.getPlatform() === 'web') {
      ready = true;
      return { mode: 'localStorage' };
    }
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    const consistency = await sqlite.checkConnectionsConsistency();
    const hasConnection = (await sqlite.isConnection(DB_NAME, false)).result;
    db = consistency.result && hasConnection
      ? await sqlite.retrieveConnection(DB_NAME, false)
      : await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
    await db.open();
    await db.execute(`
      CREATE TABLE IF NOT EXISTS word_packs (
        category_id TEXT PRIMARY KEY NOT NULL,
        words_json TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS app_settings (
        setting_key TEXT PRIMARY KEY NOT NULL,
        setting_value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS saved_players (
        position INTEGER PRIMARY KEY NOT NULL,
        player_name TEXT NOT NULL
      );
    `);
    ready = true;
    return { mode: 'sqlite' };
  })();
  return initPromise;
}

async function getPack(categoryId) {
  await init();
  if (Capacitor.getPlatform() === 'web') {
    const all = JSON.parse(localStorage.getItem('wi_words') || '{}');
    return Array.isArray(all[categoryId]) ? all[categoryId] : null;
  }
  const result = await db.query('SELECT words_json FROM word_packs WHERE category_id = ?;', [categoryId]);
  if (!result.values?.length) return null;
  try { return JSON.parse(result.values[0].words_json); } catch { return null; }
}

async function savePack(categoryId, words) {
  await init();
  const safeWords = [...new Set((words || []).map(x => String(x).trim()).filter(Boolean))];
  if (Capacitor.getPlatform() === 'web') {
    const all = JSON.parse(localStorage.getItem('wi_words') || '{}');
    all[categoryId] = safeWords;
    localStorage.setItem('wi_words', JSON.stringify(all));
    return;
  }
  await db.run(
    `INSERT INTO word_packs(category_id, words_json, updated_at) VALUES(?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(category_id) DO UPDATE SET words_json=excluded.words_json, updated_at=CURRENT_TIMESTAMP;`,
    [categoryId, JSON.stringify(safeWords)]
  );
}

async function getSetting(key) {
  await init();
  if (Capacitor.getPlatform() === 'web') return localStorage.getItem(`wi_setting_${key}`);
  const result = await db.query('SELECT setting_value FROM app_settings WHERE setting_key = ?;', [key]);
  return result.values?.[0]?.setting_value ?? null;
}

async function saveSetting(key, value) {
  await init();
  const encoded = typeof value === 'string' ? value : JSON.stringify(value);
  if (Capacitor.getPlatform() === 'web') {
    localStorage.setItem(`wi_setting_${key}`, encoded);
    return;
  }
  await db.run(
    `INSERT INTO app_settings(setting_key, setting_value, updated_at) VALUES(?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value, updated_at=CURRENT_TIMESTAMP;`,
    [key, encoded]
  );
}

async function savePlayers(names) {
  await init();
  const safeNames = (names || []).map(String);
  if (Capacitor.getPlatform() === 'web') {
    localStorage.setItem('wi_player_names', JSON.stringify(safeNames));
    return;
  }
  await db.execute('DELETE FROM saved_players;');
  for (let i = 0; i < safeNames.length; i++) {
    await db.run('INSERT INTO saved_players(position, player_name) VALUES(?, ?);', [i, safeNames[i]]);
  }
}

async function getPlayers() {
  await init();
  if (Capacitor.getPlatform() === 'web') {
    try { return JSON.parse(localStorage.getItem('wi_player_names') || 'null'); } catch { return null; }
  }
  const result = await db.query('SELECT player_name FROM saved_players ORDER BY position;');
  return result.values?.map(row => row.player_name) ?? null;
}

async function exportAll() {
  await init();
  const packs = {};
  if (Capacitor.getPlatform() === 'web') {
    Object.assign(packs, JSON.parse(localStorage.getItem('wi_words') || '{}'));
  } else {
    const result = await db.query('SELECT category_id, words_json FROM word_packs ORDER BY category_id;');
    for (const row of (result.values || [])) {
      try { packs[row.category_id] = JSON.parse(row.words_json); } catch { packs[row.category_id] = []; }
    }
  }
  return { schemaVersion: 1, exportedAt: new Date().toISOString(), wordPacks: packs };
}

export const WordImposterDB = { init, getPack, savePack, getSetting, saveSetting, savePlayers, getPlayers, exportAll };
