import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'wedding.db');
const db = new Database(dbPath);


try {
  db.exec(`
    ALTER TABLE expenses ADD COLUMN unit_price REAL DEFAULT 0;
    ALTER TABLE expenses ADD COLUMN quantity INTEGER DEFAULT 1;
    ALTER TABLE expenses ADD COLUMN deposit REAL DEFAULT 0;
    ALTER TABLE expenses ADD COLUMN is_booked INTEGER DEFAULT 0;
  `);
} catch (e) {}

try {
  const tableInfo = db.prepare("PRAGMA table_info(tables)").all() as any[];
  if (tableInfo.length > 0 && !tableInfo.some(c => c.name === 'rotation')) {
    db.exec("ALTER TABLE tables ADD COLUMN rotation INTEGER DEFAULT 0");
  }
} catch (e) {}

try {
  const guestInfo = db.prepare("PRAGMA table_info(guests)").all() as any[];
  if (guestInfo.length > 0 && !guestInfo.some(c => c.name === 'alergies')) {
    db.exec("ALTER TABLE guests ADD COLUMN alergies TEXT DEFAULT ''");
  }
} catch (e) {}


const tablesToMigrate = [
  'guests', 'expenses', 'tables', 'table_seats', 
  'tasks', 'schedule', 'files', 'couple_photos'
];

tablesToMigrate.forEach(tableName => {
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
    if (tableInfo.length > 0) {
      const hasUserId = tableInfo.some(column => column.name === 'user_id');
      if (!hasUserId) {
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN user_id INTEGER`);
        console.log(`Pridaný stĺpec user_id do ${tableName}`);
      }
    }
  } catch (e) {}
});


try {
  const settingsInfo = db.prepare("PRAGMA table_info(settings)").all() as any[];
  if (settingsInfo.length > 0) {
    const hasUserId = settingsInfo.some(column => column.name === 'user_id');
    if (!hasUserId) {
      db.exec("DROP TABLE settings");
      console.log("Stará tabuľka settings zmazaná pre inováciu na viac účtov.");
    }
  }
} catch (e) {}


db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    couple_name TEXT
  );

  CREATE TABLE IF NOT EXISTS guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    family_side TEXT DEFAULT 'Bride',
    status TEXT DEFAULT 'Not Asked',
    alergies TEXT DEFAULT '',
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS expense_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#a8c7fa'
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    category_id INTEGER,
    name TEXT NOT NULL,
    unit_price REAL DEFAULT 0,
    quantity INTEGER DEFAULT 1,
    deposit REAL DEFAULT 0,
    is_booked INTEGER DEFAULT 0,
    note TEXT DEFAULT '',
    FOREIGN KEY(category_id) REFERENCES expense_categories(id)
  );

  CREATE TABLE IF NOT EXISTS tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    shape TEXT DEFAULT 'round',
    capacity INTEGER DEFAULT 8,
    x_pos INTEGER DEFAULT 100,
    y_pos INTEGER DEFAULT 100,
    rotation INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS table_seats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    table_id INTEGER,
    guest_id INTEGER,
    seat_number INTEGER DEFAULT 0,
    FOREIGN KEY(table_id) REFERENCES tables(id),
    FOREIGN KEY(guest_id) REFERENCES guests(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    text TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    due_date TEXT,
    tags TEXT,
    position INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    time TEXT NOT NULL,
    activity TEXT NOT NULL,
    location TEXT DEFAULT '',
    description TEXT DEFAULT '',
    position INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER NOT NULL,
    path TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    user_id INTEGER,
    key TEXT,
    value TEXT,
    PRIMARY KEY (user_id, key)
  );

  CREATE TABLE IF NOT EXISTS couple_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    path TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Predvolený admin (ID bude pravdepodobne 1)
  INSERT OR IGNORE INTO users (id, username, password, couple_name) 
  VALUES (1, 'admin', 'svadba2026', 'M&M');

  -- Predvolené nastavenia pre prvého usera (aby nebola prázdna appka)
  INSERT OR IGNORE INTO settings (user_id, key, value) VALUES (1, 'target_budget', '12000');
  INSERT OR IGNORE INTO settings (user_id, key, value) VALUES (1, 'wedding_date', '');
`);

const countCats = db.prepare('SELECT COUNT(*) as count FROM expense_categories').get() as { count: number };
if (countCats.count === 0) {
  const insertCat = db.prepare('INSERT INTO expense_categories (name, color) VALUES (?, ?)');
  const defaultCats = [
    ['Priestory', '#a8c7fa'], 
    ['Hostina a Catering', '#81c995'], 
    ['Fotograf a Video', '#b39ddb'],
    ['Hudba a DJ', '#f28b82'], 
    ['Výzdoba a Kvety', '#fde293'], 
    ['Oblečenie', '#8ab4f8'],
    ['Doprava', '#f8ad9d'], 
    ['Prstene', '#ff99bb'],
    ['Ostatné', '#8e918f']
  ];
  defaultCats.forEach(cat => insertCat.run(cat[0], cat[1]));
}

export default db;