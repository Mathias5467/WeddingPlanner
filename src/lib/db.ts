import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';


const dbPath = path.join(process.cwd(), 'wedding.db');
const db = new Database(dbPath);
try {
  db.exec(`
    ALTER TABLE expenses ADD COLUMN unit_price REAL DEFAULT 0;
    ALTER TABLE expenses ADD COLUMN quantity INTEGER DEFAULT 1;
    ALTER TABLE expenses ADD COLUMN deposit REAL DEFAULT 0;
    ALTER TABLE expenses ADD COLUMN is_booked INTEGER DEFAULT 0;
  `);
  console.log("Databáza úspešne zaktualizovaná!");
} catch (e) {
  console.log("Stĺpce už pravdepodobne existujú.");
}
try {
  const tableInfo = db.prepare("PRAGMA table_info(tables)").all() as any[];
  const hasRotation = tableInfo.some(column => column.name === 'rotation');
  
  if (!hasRotation) {
    db.exec("ALTER TABLE tables ADD COLUMN rotation INTEGER DEFAULT 0");
    console.log("Stĺpec 'rotation' bol úspešne pridaný.");
  }
} catch (e) {
  console.error("Chyba pri migrácii:", e);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      family_side TEXT DEFAULT 'Bride',
      relation TEXT DEFAULT '',
      status TEXT DEFAULT 'Not Asked',
      phone TEXT DEFAULT '',
      allergies TEXT DEFAULT '',
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
      name TEXT NOT NULL,
      shape TEXT DEFAULT 'round',
      capacity INTEGER DEFAULT 8,
      x_pos INTEGER DEFAULT 100,
      y_pos INTEGER DEFAULT 100,
      rotation INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS table_seats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER,
      guest_id INTEGER,
      seat_number INTEGER DEFAULT 0,
      FOREIGN KEY(table_id) REFERENCES tables(id),
      FOREIGN KEY(guest_id) REFERENCES guests(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    due_date TEXT,
    tags TEXT,
    position INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time TEXT NOT NULL,         -- Formát HH:mm
    activity TEXT NOT NULL,     -- Názov aktivity
    location TEXT DEFAULT '',   -- Kde sa to koná
    description TEXT DEFAULT '',-- Detailnejšie info
    position INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,      -- napr. "image/jpeg", "application/pdf"
    size INTEGER NOT NULL,    -- veľkosť v bytes
    path TEXT NOT NULL,      -- cesta k súboru: "/uploads/nazov.jpg"
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
    );
    INSERT OR IGNORE INTO settings (key, value) VALUES ('target_budget', '12000');

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