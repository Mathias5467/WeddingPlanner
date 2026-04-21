"use server"

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';


/* GUEST MANAGER*/
export async function getGuests() {
  return db.prepare("SELECT * FROM guests ORDER BY family_side, name").all();
}

export async function addGuest(formData: FormData) {
  const name = formData.get('name') as string;
  const side = formData.get('side') as string;
  const status = formData.get('status') as string;
  const note = formData.get('note') as string;
  
  if (!name) return;

  const stmt = db.prepare("INSERT INTO guests (name, family_side, status, note) VALUES (?, ?, ?, ?)");
  stmt.run(name, side, status, note);
  
  revalidatePath('/');
}

export async function updateGuest(id: number, formData: FormData) {
  const name = formData.get('name') as string;
  const side = formData.get('side') as string;
  const status = formData.get('status') as string;
  const note = formData.get('note') as string;

  const stmt = db.prepare("UPDATE guests SET name = ?, family_side = ?, status = ?, note = ? WHERE id = ?");
  stmt.run(name, side, status, note, id);

  revalidatePath('/');
}

export async function deleteGuest(id: number) {
  db.prepare("DELETE FROM table_seats WHERE guest_id = ?").run(id);
  db.prepare("DELETE FROM guests WHERE id = ?").run(id);
  revalidatePath('/');
}


/* TABLES MANAGING */
export async function getTables() {
  return db.prepare("SELECT * FROM tables").all();
}

export async function addTable(formData: FormData) {
  const name = formData.get('name') as string;
  const shape = formData.get('shape') as string;
  const capacity = parseInt(formData.get('capacity') as string) || 8;
  
  if (!name) return;

  try {
    const stmt = db.prepare("INSERT INTO tables (name, shape, capacity, x_pos, y_pos, rotation) VALUES (?, ?, ?, ?, ?, ?)");
    stmt.run(name, shape, capacity, 100, 100, 0);
    revalidatePath('/');
  } catch (error) {
    console.error("Chyba pri pridávaní stola:", error);
  }
}

export async function updateTablePos(id: number, x: number, y: number) {
  db.prepare("UPDATE tables SET x_pos = ?, y_pos = ? WHERE id = ?").run(x, y, id);
}

export async function updateTableCapacity(id: number, capacity: number) {
  db.prepare("UPDATE tables SET capacity = ? WHERE id = ?").run(capacity, id);
  db.prepare("DELETE FROM table_seats WHERE table_id = ? AND seat_number >= ?")
    .run(id, capacity);
    
  revalidatePath('/');
}

export async function deleteTable(id: number) {
  db.prepare("DELETE FROM table_seats WHERE table_id = ?").run(id);
  db.prepare("DELETE FROM tables WHERE id = ?").run(id);
  revalidatePath('/');
}

export async function updateTableRotation(id: number, rotation: number) {
  db.prepare("UPDATE tables SET rotation = ? WHERE id = ?").run(rotation, id);
  revalidatePath('/');
}

// SEATING ACTIONS
export async function getTableSeats() {
  return db.prepare(`
    SELECT ts.*, g.name as guest_name, g.family_side 
    FROM table_seats ts 
    JOIN guests g ON ts.guest_id = g.id
  `).all();
}

export async function assignGuestToSeat(tableId: number, seatNumber: number, guestId: number) {
  db.prepare("DELETE FROM table_seats WHERE guest_id = ?").run(guestId);
  db.prepare("INSERT INTO table_seats (table_id, seat_number, guest_id) VALUES (?, ?, ?)")
    .run(tableId, seatNumber, guestId);
  revalidatePath('/');
}

export async function removeGuestFromSeat(seatId: number) {
  db.prepare("DELETE FROM table_seats WHERE id = ?").run(seatId);
  revalidatePath('/');
}

export async function unassignGuest(tableId: number, seatNumber: number) {
  db.prepare("DELETE FROM table_seats WHERE table_id = ? AND seat_number = ?")
    .run(tableId, seatNumber);
  revalidatePath('/');
}


/* Task manager */
export async function getTasks() {
  return db.prepare("SELECT * FROM tasks ORDER BY position ASC, created_at DESC").all();
}

export async function addTask(formData: FormData) {
  const text = formData.get('text') as string;
  const due_date = formData.get('due_date') as string;
  const tags = formData.get('tags') as string;
  
  const lastPos = (db.prepare("SELECT MAX(position) as maxPos FROM tasks").get() as any).maxPos || 0;

  db.prepare("INSERT INTO tasks (text, due_date, tags, position) VALUES (?, ?, ?, ?)")
    .run(text, due_date, tags, lastPos + 1);
    
  revalidatePath('/');
}

export async function updateTasksOrder(orderedIds: number[]) {
  const stmt = db.prepare("UPDATE tasks SET position = ? WHERE id = ?");
  const transaction = db.transaction((ids) => {
    ids.forEach((id: number, index: number) => stmt.run(index, id));
  });
  transaction(orderedIds);
  revalidatePath('/');
}
export async function toggleTask(id: number, completed: number) {
  db.prepare("UPDATE tasks SET completed = ? WHERE id = ?").run(completed, id);
  revalidatePath('/');
}

export async function deleteTask(id: number) {
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  revalidatePath('/');
}

export async function updateTask(id: number, formData: FormData) {
  const text = formData.get('text') as string;
  const due_date = formData.get('due_date') as string;
  const tags = formData.get('tags') as string;

  db.prepare("UPDATE tasks SET text = ?, due_date = ?, tags = ? WHERE id = ?")
    .run(text, due_date, tags, id);
    
  revalidatePath('/');
}


/* Schedule */
export async function getSchedule() {
  return db.prepare("SELECT * FROM schedule ORDER BY time ASC").all();
}

export async function addScheduleItem(formData: FormData) {
  const time = formData.get('time') as string;
  const activity = formData.get('activity') as string;
  const location = formData.get('location') as string;
  const description = formData.get('description') as string;

  db.prepare("INSERT INTO schedule (time, activity, location, description) VALUES (?, ?, ?, ?)")
    .run(time, activity, location, description);
  revalidatePath('/');
}

export async function deleteScheduleItem(id: number) {
  db.prepare("DELETE FROM schedule WHERE id = ?").run(id);
  revalidatePath('/');
}

export async function updateScheduleItem(id: number, formData: FormData) {
  const time = formData.get('time') as string;
  const activity = formData.get('activity') as string;
  const location = formData.get('location') as string;
  const description = formData.get('description') as string;

  db.prepare("UPDATE schedule SET time = ?, activity = ?, location = ?, description = ? WHERE id = ?")
    .run(time, activity, location, description, id);
  revalidatePath('/');
}

/* File manager */
export async function getFiles() {
  return db.prepare("SELECT * FROM files ORDER BY created_at DESC").all();
}

export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file || file.size === 0) return;

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const uploadDir = path.join(process.cwd(), 'public/uploads');

  await fs.writeFile(path.join(uploadDir, filename), buffer);

  db.prepare("INSERT INTO files (name, type, size, path) VALUES (?, ?, ?, ?)")
    .run(file.name, file.type, file.size, `/uploads/${filename}`);

  revalidatePath('/');
}

export async function deleteFile(id: number, filePath: string) {
  try {
    await fs.unlink(path.join(process.cwd(), 'public', filePath));
  } catch (e) {
    console.error("Súbor na disku neexistuje:", e);
  }

  db.prepare("DELETE FROM files WHERE id = ?").run(id);
  revalidatePath('/');
}
export async function renameFile(id: number, newName: string) {
  if (!newName) return;
  
  db.prepare("UPDATE files SET name = ? WHERE id = ?").run(newName, id);
  revalidatePath('/');
}


/* EXPENSES ACTIONS */

export async function getExpenses() {
  return db.prepare(`
    SELECT e.*, ec.name as category_name, ec.color as category_color 
    FROM expenses e 
    JOIN expense_categories ec ON e.category_id = ec.id 
    ORDER BY ec.id, e.name
  `).all();
}

export async function getExpenseCategories() {
  return db.prepare("SELECT * FROM expense_categories").all();
}

export async function addExpense(formData: FormData) {
  const name = formData.get('name') as string;
  const category_id = parseInt(formData.get('category_id') as string);
  const unit_price = parseFloat(formData.get('unit_price') as string) || 0;
  const quantity = parseInt(formData.get('quantity') as string) || 1;
  const deposit = parseFloat(formData.get('deposit') as string) || 0;
  const is_booked = formData.get('is_booked') === 'on' ? 1 : 0;
  const note = formData.get('note') as string;

  db.prepare(`
    INSERT INTO expenses (category_id, name, unit_price, quantity, deposit, is_booked, note) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(category_id, name, unit_price, quantity, deposit, is_booked, note);
  
  revalidatePath('/');
}

export async function toggleBooked(id: number, status: number) {
  db.prepare("UPDATE expenses SET is_booked = ? WHERE id = ?").run(status, id);
  revalidatePath('/');
}

export async function updateExpense(id: number, formData: FormData) {
  const name = formData.get('name') as string;
  const category_id = parseInt(formData.get('category_id') as string);
  const unit_price = parseFloat(formData.get('unit_price') as string) || 0;
  const quantity = parseInt(formData.get('quantity') as string) || 1;
  const deposit = parseFloat(formData.get('deposit') as string) || 0;
  const note = formData.get('note') as string;

  db.prepare(`
    UPDATE expenses 
    SET name = ?, category_id = ?, unit_price = ?, quantity = ?, deposit = ?, note = ? 
    WHERE id = ?
  `).run(name, category_id, unit_price, quantity, deposit, note, id);

  revalidatePath('/');
}

export async function toggleExpensePaid(id: number, paid: number) {
  db.prepare("UPDATE expenses SET paid = ? WHERE id = ?").run(paid, id);
  revalidatePath('/');
}

export async function deleteExpense(id: number) {
  db.prepare("DELETE FROM expenses WHERE id = ?").run(id);
  revalidatePath('/');
}

export async function getTargetBudget() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'target_budget'").get() as any;
  return parseFloat(row?.value || "0");
}

export async function updateTargetBudget(amount: number) {
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('target_budget', ?)")
    .run(String(amount));
  revalidatePath('/');
}

/* Dashboard */
export async function getDashboardStats() {
  const targetBudgetRow = db.prepare("SELECT value FROM settings WHERE key = 'target_budget'").get() as any;
  const targetBudget = parseFloat(targetBudgetRow?.value || "12000"); 
  // Počty podľa strán
  const totalGuests = (db.prepare("SELECT COUNT(*) as count FROM guests").get() as any).count || 0;
  const brideGuests = (db.prepare("SELECT COUNT(*) as count FROM guests WHERE family_side='Bride'").get() as any).count || 0;
  const groomGuests = (db.prepare("SELECT COUNT(*) as count FROM guests WHERE family_side='Groom'").get() as any).count || 0;
  const mutualGuests = (db.prepare("SELECT COUNT(*) as count FROM guests WHERE family_side='Mutual'").get() as any).count || 0;

  // Počty podľa stavu
  const confirmed = (db.prepare("SELECT COUNT(*) as count FROM guests WHERE status='Will Come'").get() as any).count || 0;
  const declined = (db.prepare("SELECT COUNT(*) as count FROM guests WHERE status='Won''t Come'").get() as any).count || 0;
  const pending = (db.prepare("SELECT COUNT(*) as count FROM guests WHERE status IN ('Not Asked', 'Asked')").get() as any).count || 0;

  // Ostatné
  const totalExp = (db.prepare("SELECT SUM(unit_price * quantity) as sum FROM expenses").get() as any).sum || 0;
  const paidExp = (db.prepare("SELECT SUM(deposit) as sum FROM expenses").get() as any).sum || 0;

  const expensesByCategory = db.prepare(`
    SELECT ec.name, ec.color, COALESCE(SUM(e.unit_price * e.quantity), 0) as amount
    FROM expense_categories ec
    LEFT JOIN expenses e ON e.category_id = ec.id
    GROUP BY ec.id HAVING SUM(e.unit_price * e.quantity) > 0
  `).all();

  return { 
    totalGuests, brideGuests, groomGuests, mutualGuests,
    confirmed, declined, pending,
    totalExp, paidExp, expensesByCategory,
    targetBudget
  };
}


/* Upcoming Tasks */
export async function getUpcomingTasks() {
  const now = new Date().toISOString();
  return db.prepare(`
    SELECT * FROM tasks 
    WHERE completed = 0 AND due_date IS NOT NULL 
    ORDER BY due_date ASC
  `).all();
}
