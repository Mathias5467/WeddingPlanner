"use server"

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import { UTApi } from "uploadthing/server";
const utapi = new UTApi();



async function getUserId() {
  const session = (await cookies()).get('auth_session');
  if (!session) throw new Error("Neprihlásený používateľ");
  const userData = JSON.parse(session.value);
  return userData.id;
}

/* GUEST MANAGER */
export async function getGuests() {
  const userId = await getUserId();
  const { rows } = await db.execute({
    sql: "SELECT * FROM guests WHERE user_id = ? ORDER BY family_side, name",
    args: [userId]
  });
  return rows.map(r => ({ ...r })); 
}

export async function addGuest(formData: FormData) {
  const userId = await getUserId();
  const name = formData.get('name') as string;
  const side = formData.get('side') as string;
  const status = formData.get('status') as string;
  const alergies = formData.get('alergies') as string;
  const note = formData.get('note') as string;
  
  if (!name) return;
  await db.execute({
    sql: "INSERT INTO guests (user_id, name, family_side, status, alergies, note) VALUES (?, ?, ?, ?, ?, ?)",
    args: [userId, name, side, status, alergies, note]
  });
  revalidatePath('/');
}

export async function updateGuest(id: number, formData: FormData) {
  const userId = await getUserId();
  const name = formData.get('name') as string;
  const side = formData.get('side') as string;
  const status = formData.get('status') as string;
  const alergies = formData.get('alergies') as string;
  const note = formData.get('note') as string;

  await db.execute({
    sql: "UPDATE guests SET name = ?, family_side = ?, status = ?, alergies = ?, note = ? WHERE id = ? AND user_id = ?",
    args: [name, side, status, alergies, note, id, userId]
  });
  revalidatePath('/');
}

export async function deleteGuest(id: number) {
  const userId = await getUserId();
  await db.execute({ sql: "DELETE FROM table_seats WHERE guest_id = ? AND user_id = ?", args: [id, userId] });
  await db.execute({ sql: "DELETE FROM guests WHERE id = ? AND user_id = ?", args: [id, userId] });
  revalidatePath('/');
}

/* TABLES MANAGING */
export async function getTables() {
  const userId = await getUserId();
  const { rows } = await db.execute({ sql: "SELECT * FROM tables WHERE user_id = ?", args: [userId] });
  return rows.map(r => ({ ...r })); 
}


export async function addTable(formData: FormData) {
  const userId = await getUserId();
  const name = formData.get('name') as string;
  const shape = formData.get('shape') as string;
  const capacity = parseInt(formData.get('capacity') as string) || 8;
  
  if (!name) return;
  await db.execute({
    sql: "INSERT INTO tables (user_id, name, shape, capacity, x_pos, y_pos, rotation) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [userId, name, shape, capacity, 100, 100, 0]
  });
  revalidatePath('/');
}

export async function updateTablePos(id: number, x: number, y: number) {
  const userId = await getUserId();
  await db.execute({
    sql: "UPDATE tables SET x_pos = ?, y_pos = ? WHERE id = ? AND user_id = ?",
    args: [x, y, id, userId]
  });
}

export async function updateTableCapacity(id: number, capacity: number) {
  const userId = await getUserId();
  await db.execute({ sql: "UPDATE tables SET capacity = ? WHERE id = ? AND user_id = ?", args: [capacity, id, userId] });
  await db.execute({ sql: "DELETE FROM table_seats WHERE table_id = ? AND seat_number >= ? AND user_id = ?", args: [id, capacity, userId] });
  revalidatePath('/');
}

export async function deleteTable(id: number) {
  const userId = await getUserId();
  await db.execute({ sql: "DELETE FROM table_seats WHERE table_id = ? AND user_id = ?", args: [id, userId] });
  await db.execute({ sql: "DELETE FROM tables WHERE id = ? AND user_id = ?", args: [id, userId] });
  revalidatePath('/');
}

export async function updateTableRotation(id: number, rotation: number) {
  const userId = await getUserId();
  await db.execute({ sql: "UPDATE tables SET rotation = ? WHERE id = ? AND user_id = ?", args: [rotation, id, userId] });
  revalidatePath('/');
}

/* SEATING ACTIONS */
export async function getTableSeats() {
  const userId = await getUserId();
  const { rows } = await db.execute({
    sql: `SELECT ts.*, g.name as guest_name, g.family_side 
          FROM table_seats ts 
          JOIN guests g ON ts.guest_id = g.id
          WHERE ts.user_id = ?`,
    args: [userId]
  });
  return rows.map(r => ({ ...r })); 
}

export async function assignGuestToSeat(tableId: number, seatNumber: number, guestId: number) {
  const userId = await getUserId();
  await db.execute({ sql: "DELETE FROM table_seats WHERE guest_id = ? AND user_id = ?", args: [guestId, userId] });
  await db.execute({
    sql: "INSERT INTO table_seats (user_id, table_id, seat_number, guest_id) VALUES (?, ?, ?, ?)",
    args: [userId, tableId, seatNumber, guestId]
  });
  revalidatePath('/');
}

export async function unassignGuest(tableId: number, seatNumber: number) {
  const userId = await getUserId();
  await db.execute({
    sql: "DELETE FROM table_seats WHERE table_id = ? AND seat_number = ? AND user_id = ?",
    args: [tableId, seatNumber, userId]
  });
  revalidatePath('/');
}

/* TASK MANAGER */
export async function getTasks() {
  const userId = await getUserId();
  const { rows } = await db.execute({ sql: "SELECT * FROM tasks WHERE user_id = ? ORDER BY position ASC, created_at DESC", args: [userId] });
  return rows.map(r => ({ ...r })); 
}

export async function addTask(formData: FormData) {
  const userId = await getUserId();
  const text = formData.get('text') as string;
  const due_date = formData.get('due_date') as string;
  const tags = formData.get('tags') as string;
  
  const { rows } = await db.execute({ sql: "SELECT MAX(position) as maxPos FROM tasks WHERE user_id = ?", args: [userId] });
  const lastPos = (rows[0]?.maxPos as number) || 0;

  await db.execute({
    sql: "INSERT INTO tasks (user_id, text, due_date, tags, position) VALUES (?, ?, ?, ?, ?)",
    args: [userId, text, due_date, tags, lastPos + 1]
  });
  revalidatePath('/');
}

export async function updateTasksOrder(orderedIds: number[]) {
  const userId = await getUserId();
  
  const tx = await db.transaction('write');
  try {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx.execute({
        sql: "UPDATE tasks SET position = ? WHERE id = ? AND user_id = ?",
        args: [i, orderedIds[i], userId]
      });
    }
    await tx.commit();
  } catch (e) {
    await tx.rollback();
  }
  revalidatePath('/');
}

export async function toggleTask(id: number, completed: number) {
  const userId = await getUserId();
  await db.execute({ sql: "UPDATE tasks SET completed = ? WHERE id = ? AND user_id = ?", args: [completed, id, userId] });
  revalidatePath('/');
}

export async function deleteTask(id: number) {
  const userId = await getUserId();
  await db.execute({ sql: "DELETE FROM tasks WHERE id = ? AND user_id = ?", args: [id, userId] });
  revalidatePath('/');
}

export async function updateTask(id: number, formData: FormData) {
  const userId = await getUserId();
  const text = formData.get('text') as string;
  const due_date = formData.get('due_date') as string;
  const tags = formData.get('tags') as string;
  await db.execute({
    sql: "UPDATE tasks SET text = ?, due_date = ?, tags = ? WHERE id = ? AND user_id = ?",
    args: [text, due_date, tags, id, userId]
  });
  revalidatePath('/');
}

/* SCHEDULE */
export async function getSchedule() {
  const userId = await getUserId();
  const { rows } = await db.execute({ sql: "SELECT * FROM schedule WHERE user_id = ? ORDER BY time ASC", args: [userId] });
  
  return rows.map(r => ({ ...r })); 
}

export async function addScheduleItem(formData: FormData) {
  const userId = await getUserId();
  const time = formData.get('time') as string;
  const activity = formData.get('activity') as string;
  const location = formData.get('location') as string;
  const description = formData.get('description') as string;
  await db.execute({
    sql: "INSERT INTO schedule (user_id, time, activity, location, description) VALUES (?, ?, ?, ?, ?)",
    args: [userId, time, activity, location, description]
  });
  revalidatePath('/');
}

export async function deleteScheduleItem(id: number) {
  const userId = await getUserId();
  await db.execute({ sql: "DELETE FROM schedule WHERE id = ? AND user_id = ?", args: [id, userId] });
  revalidatePath('/');
}

export async function updateScheduleItem(id: number, formData: FormData) {
  const userId = await getUserId();
  const time = formData.get('time') as string;
  const activity = formData.get('activity') as string;
  const location = formData.get('location') as string;
  const description = formData.get('description') as string;
  await db.execute({
    sql: "UPDATE schedule SET time = ?, activity = ?, location = ?, description = ? WHERE id = ? AND user_id = ?",
    args: [time, activity, location, description, id, userId]
  });
  revalidatePath('/');
}

/* EXPENSES ACTIONS */
export async function getExpenses() {
  const userId = await getUserId();
  const { rows } = await db.execute({
    sql: `SELECT e.*, ec.name as category_name, ec.color as category_color 
          FROM expenses e 
          JOIN expense_categories ec ON e.category_id = ec.id 
          WHERE e.user_id = ? ORDER BY ec.id, e.name`,
    args: [userId]
  });
  
  return rows.map(row => ({ ...row }));
}

export async function getExpenseCategories() {
  const { rows } = await db.execute("SELECT * FROM expense_categories");
  
  return rows.map(row => ({ ...row }));
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

  await db.execute({
    sql: "INSERT INTO expenses (user_id, category_id, name, unit_price, quantity, deposit, is_booked, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    args: [userId, category_id, name, unit_price, quantity, deposit, is_booked, note]
  });
  revalidatePath('/');
}

export async function toggleBooked(id: number, status: number) {
  const userId = await getUserId();
  await db.execute({ sql: "UPDATE expenses SET is_booked = ? WHERE id = ? AND user_id = ?", args: [status, id, userId] });
  revalidatePath('/');
}

export async function updateExpense(id: number, formData: FormData) {
  const userId = await getUserId();
  const name = formData.get('name') as string;
  const category_id = parseInt(formData.get('category_id') as string);
  const unit_price = parseFloat(formData.get('unit_price') as string) || 0;
  const quantity = parseInt(formData.get('quantity') as string) || 1;
  const deposit = parseFloat(formData.get('deposit') as string) || 0;
  const note = formData.get('note') as string;

  await db.execute({
    sql: "UPDATE expenses SET name = ?, category_id = ?, unit_price = ?, quantity = ?, deposit = ?, note = ? WHERE id = ? AND user_id = ?",
    args: [name, category_id, unit_price, quantity, deposit, note, id, userId]
  });
  revalidatePath('/');
}

export async function deleteExpense(id: number) {
  const userId = await getUserId();
  await db.execute({ sql: "DELETE FROM expenses WHERE id = ? AND user_id = ?", args: [id, userId] });
  revalidatePath('/');
}

/* SETTINGS */
export async function getTargetBudget() {
  const userId = await getUserId();
  const { rows } = await db.execute({ sql: "SELECT value FROM settings WHERE user_id = ? AND key = 'target_budget'", args: [userId] });
  return parseFloat((rows[0]?.value as string) || "12000");
}

export async function updateTargetBudget(amount: number) {
  const userId = await getUserId();
  await db.execute({
    sql: "INSERT OR REPLACE INTO settings (user_id, key, value) VALUES (?, 'target_budget', ?)",
    args: [userId, String(amount)]
  });
  revalidatePath('/');
}

export async function getWeddingDate() {
  const userId = await getUserId();
  const { rows } = await db.execute({ sql: "SELECT value FROM settings WHERE user_id = ? AND key = 'wedding_date'", args: [userId] });
  return (rows[0]?.value as string) || null;
}

export async function updateWeddingDate(date: string) {
  const userId = await getUserId();
  await db.execute({
    sql: "INSERT OR REPLACE INTO settings (user_id, key, value) VALUES (?, 'wedding_date', ?)",
    args: [userId, date]
  });
  revalidatePath('/');
  return { success: true };
}

/* DASHBOARD STATS */
export async function getDashboardStats() {
  const userId = await getUserId();
  
  const targetBudget = await getTargetBudget();
  
  
  const getCount = async (query: string, params: any[]) => {
    const { rows } = await db.execute({ sql: query, args: params });
    return Number(rows[0]?.count || 0);
  };

  const totalGuests = await getCount("SELECT COUNT(*) as count FROM guests WHERE user_id = ?", [userId]);
  const brideGuests = await getCount("SELECT COUNT(*) as count FROM guests WHERE user_id = ? AND family_side='Bride'", [userId]);
  const groomGuests = await getCount("SELECT COUNT(*) as count FROM guests WHERE user_id = ? AND family_side='Groom'", [userId]);
  const mutualGuests = await getCount("SELECT COUNT(*) as count FROM guests WHERE user_id = ? AND family_side='Mutual'", [userId]);
  
  const confirmed = await getCount("SELECT COUNT(*) as count FROM guests WHERE user_id = ? AND status='Will Come'", [userId]);
  const declined = await getCount("SELECT COUNT(*) as count FROM guests WHERE user_id = ? AND status='Won''t Come'", [userId]);
  const pending = await getCount("SELECT COUNT(*) as count FROM guests WHERE user_id = ? AND status IN ('Not Asked', 'Asked', 'Neoslovený', 'Oslovený')", [userId]);

  
  const getSum = async (query: string, params: any[]) => {
    const { rows } = await db.execute({ sql: query, args: params });
    return Number(rows[0]?.sum || 0);
  };

  const totalExp = await getSum("SELECT SUM(unit_price * quantity) as sum FROM expenses WHERE user_id = ?", [userId]);
  const paidExp = await getSum("SELECT SUM(deposit) as sum FROM expenses WHERE user_id = ?", [userId]);

  
  const { rows: expensesByCategoryRows } = await db.execute({
    sql: `SELECT ec.name, ec.color, COALESCE(SUM(e.unit_price * e.quantity), 0) as amount
          FROM expense_categories ec
          LEFT JOIN expenses e ON e.category_id = ec.id AND e.user_id = ?
          GROUP BY ec.id HAVING SUM(e.unit_price * e.quantity) > 0`,
    args: [userId]
  });
  
  const expensesByCategory = expensesByCategoryRows.map((item: any) => ({
    name: item.name,
    color: item.color,
    amount: Number(item.amount)
  }));

  return { 
    totalGuests, brideGuests, groomGuests, mutualGuests,
    confirmed, declined, pending,
    totalExp, paidExp, expensesByCategory,
    targetBudget
  };
}

/* AUTH (Login/Register zostáva bez getUserId na vstupe) */
export async function login(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  
  
  const { rows } = await db.execute({
    sql: "SELECT * FROM users WHERE username = ?",
    args: [username]
  });
  
  const user = rows[0] as any;

  
  if (user) {
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    
    if (isPasswordCorrect) {
      (await cookies()).set('auth_session', JSON.stringify({ id: user.id, name: user.couple_name }), {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 7, path: '/',
      });
      return { success: true };
    }
  }

  return { success: false, error: 'Nesprávne meno alebo heslo' };
}

export async function register(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const coupleName = formData.get('couple_name') as string;

  if (!username || !password || !coupleName) return { success: false, error: 'Všetky polia sú povinné' };

  try {
    const { rows: existing } = await db.execute({ sql: "SELECT id FROM users WHERE username = ?", args: [username] });
    if (existing.length > 0) return { success: false, error: 'Používateľské meno je obsadené' };

    
    const hashedPassword = await bcrypt.hash(password, 10);

    const res = await db.execute({
      sql: "INSERT INTO users (username, password, couple_name) VALUES (?, ?, ?)",
      args: [username, hashedPassword, coupleName] 
    });
    
    const userId = res.lastInsertRowid;
    await db.execute({ sql: "INSERT INTO settings (user_id, key, value) VALUES (?, 'target_budget', '12000')", args: [Number(userId)] });
    await db.execute({ sql: "INSERT INTO settings (user_id, key, value) VALUES (?, 'wedding_date', '')", args: [Number(userId)] });
    
    (await cookies()).set('auth_session', JSON.stringify({ id: Number(userId), name: coupleName }), {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 7, path: '/',
    });
    return { success: true };
  } catch (e) { 
    return { success: false, error: 'Chyba pri registrácii' }; 
  }
}

export async function logout() {
  (await cookies()).delete('auth_session');
  revalidatePath('/');
}

export async function checkAuth() {
  const session = (await cookies()).get('auth_session');
  return session ? JSON.parse(session.value) : null;
}

/* FILES & HOME (Fotky zatial ostanu len ulozene v DB cesty, upozornenie k Vercelu plati) */
export async function getFiles() {
  const userId = await getUserId();
  const { rows } = await db.execute({ sql: "SELECT * FROM files WHERE user_id = ? ORDER BY created_at DESC", args: [userId] });
  return rows;
}

export async function uploadFile(formData: FormData) {
  const userId = await getUserId();
  const file = formData.get('file') as File;
  if (!file || file.size === 0) return;

  const response = await utapi.uploadFiles(file);
  
  if (response.data) {
    const fileUrl = response.data.url;
    const fileKey = response.data.key;

    await db.execute({
      sql: "INSERT INTO files (user_id, name, type, size, path) VALUES (?, ?, ?, ?, ?)",
      args: [userId, file.name, file.type, file.size, fileUrl]
    });
    revalidatePath('/');
  }
}

export async function deleteFile(id: number, filePath: string) {
  const userId = await getUserId();
  
  await db.execute({ sql: "DELETE FROM files WHERE id = ? AND user_id = ?", args: [id, userId] });
  const fileKey = filePath.split("/f/")[1];
  if (fileKey) {
    await utapi.deleteFiles(fileKey);
  }

  revalidatePath('/');
}

export async function renameFile(id: number, newName: string) {
  if (!newName) return;
  const userId = await getUserId();
  await db.execute({ sql: "UPDATE files SET name = ? WHERE id = ? AND user_id = ?", args: [newName, id, userId] });
  revalidatePath('/');
}

export async function getHomeData() {
  const userId = await getUserId();
  const weddingDate = await getWeddingDate();
  const { rows: photosRows } = await db.execute({ sql: "SELECT * FROM couple_photos WHERE user_id = ? ORDER BY created_at DESC", args: [userId] });
  
  return { 
    weddingDate, 
    photos: photosRows.map(r => ({ ...r })) 
  };
}

export async function uploadCouplePhoto(formData: FormData) {
  try {
    const userId = await getUserId();
    const file = formData.get('file') as File;

    if (!file || file.size === 0) {
      return { success: false, error: "Súbor sa nepodarilo prijať na serveri." };
    }
    console.log(`Nahrávam súbor: ${file.name}, Veľkosť: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

    if (file.size > 4.5 * 1024 * 1024) {
      return { success: false, error: "Súbor je príliš veľký pre bezplatný hosting (limit 4.5MB). Skúste menšiu fotku." };
    }

    const response = await utapi.uploadFiles(file);
    const uploadedFile = Array.isArray(response) ? response[0] : response;

    if (uploadedFile.data) {
      await db.execute({
        sql: "INSERT INTO couple_photos (user_id, path) VALUES (?, ?)",
        args: [userId, uploadedFile.data.url]
      });
      revalidatePath('/');
      return { success: true };
    } else {
      return { success: false, error: "UploadThing zamietol súbor: " + uploadedFile.error.message };
    }
  } catch (error: any) {
    console.error("CHYBA ACTION:", error);
    return { success: false, error: "Server error: " + error.message };
  }
}

export async function deleteCouplePhoto(id: number, filePath: string) {
  try {
    const userId = await getUserId();

    const res = await db.execute({
      sql: "DELETE FROM couple_photos WHERE id = ? AND user_id = ?",
      args: [id, userId]
    });
    if (res.rowsAffected > 0) {
      const fileKey = filePath.split("/f/")[1];

      if (fileKey) {
        console.log("Mažem súbor z cloudu s kľúčom:", fileKey);
        await utapi.deleteFiles(fileKey);
      }
    }

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Chyba pri mazaní fotky:", error);
    return { success: false };
  }
}

export async function savePhotoToDb(url: string) {
  try {
    const userId = await getUserId();
    await db.execute({
      sql: "INSERT INTO couple_photos (user_id, path) VALUES (?, ?)",
      args: [userId, url]
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Chyba pri zápise URL do DB:", error);
    return { success: false };
  }
}