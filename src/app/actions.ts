"use server"

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';


async function getUserId() {
  const session = (await cookies()).get('auth_session');
  if (!session) throw new Error("Neprihlásený používateľ");
  const userData = JSON.parse(session.value);
  return userData.id;
}

/* GUEST MANAGER */
export async function getGuests() {
  const userId = await getUserId();
  return db.prepare("SELECT * FROM guests WHERE user_id = ? ORDER BY family_side, name").all(userId);
}

export async function addGuest(formData: FormData) {
  const userId = await getUserId();
  const name = formData.get('name') as string;
  const side = formData.get('side') as string;
  const status = formData.get('status') as string;
  const alergies = formData.get('alergies') as string;
  const note = formData.get('note') as string;
  
  if (!name) return;
  db.prepare("INSERT INTO guests (user_id, name, family_side, status, alergies, note) VALUES (?, ?, ?, ?, ?, ?)")
    .run(userId, name, side, status, alergies, note);
  revalidatePath('/');
}

export async function updateGuest(id: number, formData: FormData) {
  const userId = await getUserId();
  const name = formData.get('name') as string;
  const side = formData.get('side') as string;
  const status = formData.get('status') as string;
  const alergies = formData.get('alergies') as string;
  const note = formData.get('note') as string;

  db.prepare("UPDATE guests SET name = ?, family_side = ?, status = ?, alergies = ?, note = ? WHERE id = ? AND user_id = ?")
    .run(name, side, status, alergies, note, id, userId);
  revalidatePath('/');
}

export async function deleteGuest(id: number) {
  const userId = await getUserId();
  db.prepare("DELETE FROM table_seats WHERE guest_id = ? AND user_id = ?").run(id, userId);
  db.prepare("DELETE FROM guests WHERE id = ? AND user_id = ?").run(id, userId);
  revalidatePath('/');
}

/* TABLES MANAGING */
export async function getTables() {
  const userId = await getUserId();
  return db.prepare("SELECT * FROM tables WHERE user_id = ?").all(userId);
}

export async function addTable(formData: FormData) {
  const userId = await getUserId();
  const name = formData.get('name') as string;
  const shape = formData.get('shape') as string;
  const capacity = parseInt(formData.get('capacity') as string) || 8;
  
  if (!name) return;
  db.prepare("INSERT INTO tables (user_id, name, shape, capacity, x_pos, y_pos, rotation) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(userId, name, shape, capacity, 100, 100, 0);
  revalidatePath('/');
}

export async function updateTablePos(id: number, x: number, y: number) {
  const userId = await getUserId();
  db.prepare("UPDATE tables SET x_pos = ?, y_pos = ? WHERE id = ? AND user_id = ?").run(x, y, id, userId);
}

export async function updateTableCapacity(id: number, capacity: number) {
  const userId = await getUserId();
  db.prepare("UPDATE tables SET capacity = ? WHERE id = ? AND user_id = ?").run(capacity, id, userId);
  db.prepare("DELETE FROM table_seats WHERE table_id = ? AND seat_number >= ? AND user_id = ?").run(id, capacity, userId);
  revalidatePath('/');
}

export async function deleteTable(id: number) {
  const userId = await getUserId();
  db.prepare("DELETE FROM table_seats WHERE table_id = ? AND user_id = ?").run(id, userId);
  db.prepare("DELETE FROM tables WHERE id = ? AND user_id = ?").run(id, userId);
  revalidatePath('/');
}

export async function updateTableRotation(id: number, rotation: number) {
  const userId = await getUserId();
  db.prepare("UPDATE tables SET rotation = ? WHERE id = ? AND user_id = ?").run(rotation, id, userId);
  revalidatePath('/');
}

/* SEATING ACTIONS */
export async function getTableSeats() {
  const userId = await getUserId();
  return db.prepare(`
    SELECT ts.*, g.name as guest_name, g.family_side 
    FROM table_seats ts 
    JOIN guests g ON ts.guest_id = g.id
    WHERE ts.user_id = ?
  `).all(userId);
}

export async function assignGuestToSeat(tableId: number, seatNumber: number, guestId: number) {
  const userId = await getUserId();
  db.prepare("DELETE FROM table_seats WHERE guest_id = ? AND user_id = ?").run(guestId, userId);
  db.prepare("INSERT INTO table_seats (user_id, table_id, seat_number, guest_id) VALUES (?, ?, ?, ?)")
    .run(userId, tableId, seatNumber, guestId);
  revalidatePath('/');
}

export async function unassignGuest(tableId: number, seatNumber: number) {
  const userId = await getUserId();
  db.prepare("DELETE FROM table_seats WHERE table_id = ? AND seat_number = ? AND user_id = ?")
    .run(tableId, seatNumber, userId);
  revalidatePath('/');
}

/* TASK MANAGER */
export async function getTasks() {
  const userId = await getUserId();
  return db.prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY position ASC, created_at DESC").all(userId);
}
export async function updateTasksOrder(orderedIds: number[]) {
  const userId = await getUserId();
  
  
  const stmt = db.prepare("UPDATE tasks SET position = ? WHERE id = ? AND user_id = ?");
  
  
  const transaction = db.transaction((ids, uid) => {
    ids.forEach((id: number, index: number) => {
      stmt.run(index, id, uid);
    });
  });

  transaction(orderedIds, userId);
  revalidatePath('/');
}
export async function addTask(formData: FormData) {
  const userId = await getUserId();
  const text = formData.get('text') as string;
  const due_date = formData.get('due_date') as string;
  const tags = formData.get('tags') as string;
  const lastPos = (db.prepare("SELECT MAX(position) as maxPos FROM tasks WHERE user_id = ?").get(userId) as any).maxPos || 0;

  db.prepare("INSERT INTO tasks (user_id, text, due_date, tags, position) VALUES (?, ?, ?, ?, ?)")
    .run(userId, text, due_date, tags, lastPos + 1);
  revalidatePath('/');
}

export async function toggleTask(id: number, completed: number) {
  const userId = await getUserId();
  db.prepare("UPDATE tasks SET completed = ? WHERE id = ? AND user_id = ?").run(completed, id, userId);
  revalidatePath('/');
}

export async function deleteTask(id: number) {
  const userId = await getUserId();
  db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").run(id, userId);
  revalidatePath('/');
}

export async function updateTask(id: number, formData: FormData) {
  const userId = await getUserId();
  const text = formData.get('text') as string;
  const due_date = formData.get('due_date') as string;
  const tags = formData.get('tags') as string;
  db.prepare("UPDATE tasks SET text = ?, due_date = ?, tags = ? WHERE id = ? AND user_id = ?")
    .run(text, due_date, tags, id, userId);
  revalidatePath('/');
}

/* SCHEDULE */
export async function updateScheduleItem(id: number, formData: FormData) {
  const userId = await getUserId();
  const time = formData.get('time') as string;
  const activity = formData.get('activity') as string;
  const location = formData.get('location') as string;
  const description = formData.get('description') as string;

  db.prepare("UPDATE schedule SET time = ?, activity = ?, location = ?, description = ? WHERE id = ? AND user_id = ?")
    .run(time, activity, location, description, id, userId);
    
  revalidatePath('/');
}
export async function getSchedule() {
  const userId = await getUserId();
  return db.prepare("SELECT * FROM schedule WHERE user_id = ? ORDER BY time ASC").all(userId);
}

export async function addScheduleItem(formData: FormData) {
  const userId = await getUserId();
  const time = formData.get('time') as string;
  const activity = formData.get('activity') as string;
  const location = formData.get('location') as string;
  const description = formData.get('description') as string;
  db.prepare("INSERT INTO schedule (user_id, time, activity, location, description) VALUES (?, ?, ?, ?, ?)")
    .run(userId, time, activity, location, description);
  revalidatePath('/');
}

export async function deleteScheduleItem(id: number) {
  const userId = await getUserId();
  db.prepare("DELETE FROM schedule WHERE id = ? AND user_id = ?").run(id, userId);
  revalidatePath('/');
}

/* FILE MANAGER */
export async function getFiles() {
  const userId = await getUserId();
  return db.prepare("SELECT * FROM files WHERE user_id = ? ORDER BY created_at DESC").all(userId);
}
export async function renameFile(id: number, newName: string) {
  if (!newName) return;
  
  const userId = await getUserId();
  
  
  db.prepare("UPDATE files SET name = ? WHERE id = ? AND user_id = ?")
    .run(newName, id, userId);
    
  revalidatePath('/');
}
export async function uploadFile(formData: FormData) {
  const userId = await getUserId();
  const file = formData.get('file') as File;
  if (!file || file.size === 0) return;
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const uploadDir = path.join(process.cwd(), 'public/uploads');
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), buffer);

  db.prepare("INSERT INTO files (user_id, name, type, size, path) VALUES (?, ?, ?, ?, ?)")
    .run(userId, file.name, file.type, file.size, `/uploads/${filename}`);
  revalidatePath('/');
}

export async function deleteFile(id: number, filePath: string) {
  const userId = await getUserId();
  db.prepare("DELETE FROM files WHERE id = ? AND user_id = ?").run(id, userId);
  try { await fs.unlink(path.join(process.cwd(), 'public', filePath)); } catch (e) {}
  revalidatePath('/');
}

/* EXPENSES ACTIONS */
export async function getExpenseCategories() {
  
  return db.prepare("SELECT * FROM expense_categories").all();
}
export async function updateExpense(id: number, formData: FormData) {
  const userId = await getUserId();
  const name = formData.get('name') as string;
  const category_id = parseInt(formData.get('category_id') as string);
  const unit_price = parseFloat(formData.get('unit_price') as string) || 0;
  const quantity = parseInt(formData.get('quantity') as string) || 1;
  const deposit = parseFloat(formData.get('deposit') as string) || 0;
  const note = formData.get('note') as string;

  db.prepare(`
    UPDATE expenses 
    SET name = ?, category_id = ?, unit_price = ?, quantity = ?, deposit = ?, note = ? 
    WHERE id = ? AND user_id = ?
  `).run(name, category_id, unit_price, quantity, deposit, note, id, userId);

  revalidatePath('/');
}
export async function getExpenses() {
  const userId = await getUserId();
  return db.prepare(`
    SELECT e.*, ec.name as category_name, ec.color as category_color 
    FROM expenses e 
    JOIN expense_categories ec ON e.category_id = ec.id 
    WHERE e.user_id = ?
    ORDER BY ec.id, e.name
  `).all(userId);
}

export async function toggleBooked(id: number, status: number) {
  const userId = await getUserId();
  
  db.prepare("UPDATE expenses SET is_booked = ? WHERE id = ? AND user_id = ?")
    .run(status, id, userId);
    
  revalidatePath('/');
}
export async function addExpense(formData: FormData) {
  const userId = await getUserId();
  const name = formData.get('name') as string;
  const category_id = parseInt(formData.get('category_id') as string);
  const unit_price = parseFloat(formData.get('unit_price') as string) || 0;
  const quantity = parseInt(formData.get('quantity') as string) || 1;
  const deposit = parseFloat(formData.get('deposit') as string) || 0;
  const is_booked = formData.get('is_booked') === 'on' ? 1 : 0;
  const note = formData.get('note') as string;

  db.prepare("INSERT INTO expenses (user_id, category_id, name, unit_price, quantity, deposit, is_booked, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(userId, category_id, name, unit_price, quantity, deposit, is_booked, note);
  revalidatePath('/');
}

export async function deleteExpense(id: number) {
  const userId = await getUserId();
  db.prepare("DELETE FROM expenses WHERE id = ? AND user_id = ?").run(id, userId);
  revalidatePath('/');
}

/* SETTINGS */
export async function getTargetBudget() {
  const userId = await getUserId();
  const row = db.prepare("SELECT value FROM settings WHERE user_id = ? AND key = 'target_budget'").get(userId) as any;
  return parseFloat(row?.value || "12000");
}

export async function updateTargetBudget(amount: number) {
  const userId = await getUserId();
  db.prepare("INSERT OR REPLACE INTO settings (user_id, key, value) VALUES (?, 'target_budget', ?)")
    .run(userId, String(amount));
  revalidatePath('/');
}

export async function getWeddingDate() {
  const userId = await getUserId();
  const row = db.prepare("SELECT value FROM settings WHERE user_id = ? AND key = 'wedding_date'").get(userId) as any;
  return row?.value || null;
}

export async function updateWeddingDate(date: string) {
  const userId = await getUserId();
  db.prepare("INSERT OR REPLACE INTO settings (user_id, key, value) VALUES (?, 'wedding_date', ?)")
    .run(userId, date);
  revalidatePath('/');
  return { success: true };
}

/* DASHBOARD STATS */
export async function getDashboardStats() {
  const userId = await getUserId();
  
  const targetBudget = await getTargetBudget();
  
  const totalGuests = Number((db.prepare("SELECT COUNT(*) as count FROM guests WHERE user_id = ?").get(userId) as any).count || 0);
  
  const brideGuests = Number((db.prepare("SELECT COUNT(*) as count FROM guests WHERE user_id = ? AND family_side='Bride'").get(userId) as any).count || 0);
  const groomGuests = Number((db.prepare("SELECT COUNT(*) as count FROM guests WHERE user_id = ? AND family_side='Groom'").get(userId) as any).count || 0);
  const mutualGuests = Number((db.prepare("SELECT COUNT(*) as count FROM guests WHERE user_id = ? AND family_side='Mutual'").get(userId) as any).count || 0);

  const confirmed = Number((db.prepare("SELECT COUNT(*) as count FROM guests WHERE user_id = ? AND status='Will Come'").get(userId) as any).count || 0);
  const declined = Number((db.prepare("SELECT COUNT(*) as count FROM guests WHERE user_id = ? AND status='Won''t Come'").get(userId) as any).count || 0);
  const pending = Number((db.prepare("SELECT COUNT(*) as count FROM guests WHERE user_id = ? AND status IN ('Not Asked', 'Asked', 'Neoslovený', 'Oslovený')").get(userId) as any).count || 0);

  const totalExp = Number((db.prepare("SELECT SUM(unit_price * quantity) as sum FROM expenses WHERE user_id = ?").get(userId) as any).sum || 0);
  const paidExp = Number((db.prepare("SELECT SUM(deposit) as sum FROM expenses WHERE user_id = ?").get(userId) as any).sum || 0);

  const expensesByCategory = db.prepare(`
    SELECT ec.name, ec.color, COALESCE(SUM(e.unit_price * e.quantity), 0) as amount
    FROM expense_categories ec
    LEFT JOIN expenses e ON e.category_id = ec.id AND e.user_id = ?
    GROUP BY ec.id HAVING SUM(e.unit_price * e.quantity) > 0
  `).all(userId).map((item: any) => ({
    ...item,
    amount: Number(item.amount)
  }));

  return { 
    totalGuests, 
    brideGuests, 
    groomGuests, 
    mutualGuests,
    confirmed, 
    declined, 
    pending,
    totalExp, 
    paidExp, 
    expensesByCategory, 
    targetBudget 
  };
}

/* HOME DATA */
export async function deleteCouplePhoto(id: number, filePath: string) {
  const userId = await getUserId();

  const result = db.prepare("DELETE FROM couple_photos WHERE id = ? AND user_id = ?")
    .run(id, userId);

  if (result.changes > 0) {
    try {
      await fs.unlink(path.join(process.cwd(), 'public', filePath));
    } catch (e) {
      console.error("Súbor na disku sa nepodarilo zmazať:", e);
    }
  }

  revalidatePath('/');
}
export async function getHomeData() {
  const userId = await getUserId();
  const weddingDate = await getWeddingDate();
  const photos = db.prepare("SELECT * FROM couple_photos WHERE user_id = ? ORDER BY created_at DESC").all(userId);
  return { weddingDate, photos };
}

export async function uploadCouplePhoto(formData: FormData) {
  const userId = await getUserId();
  const file = formData.get('file') as File;
  if (!file || file.size === 0) return;
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `couple-${userId}-${Date.now()}`;
  const uploadDir = path.join(process.cwd(), 'public/uploads/home');
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), buffer);

  db.prepare("INSERT INTO couple_photos (user_id, path) VALUES (?, ?)")
    .run(userId, `/uploads/home/${filename}`);
  revalidatePath('/');
}


export async function login(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;
  if (user) {
    (await cookies()).set('auth_session', JSON.stringify({ id: user.id, name: user.couple_name }), {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 7, path: '/',
    });
    return { success: true };
  }
  return { success: false, error: 'Nesprávne údaje' };
}

export async function register(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const coupleName = formData.get('couple_name') as string;
  try {
    const info = db.prepare("INSERT INTO users (username, password, couple_name) VALUES (?, ?, ?)")
      .run(username, password, coupleName);
    const userId = info.lastInsertRowid;
    
    db.prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'target_budget', '12000')").run(userId);
    db.prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'wedding_date', '')").run(userId);
    
    (await cookies()).set('auth_session', JSON.stringify({ id: userId, name: coupleName }), {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 7, path: '/',
    });
    return { success: true };
  } catch (e) { return { success: false, error: 'Užívateľ už existuje' }; }
}

export async function logout() {
  (await cookies()).delete('auth_session');
  revalidatePath('/');
}

export async function checkAuth() {
  const session = (await cookies()).get('auth_session');
  return session ? JSON.parse(session.value) : null;
}