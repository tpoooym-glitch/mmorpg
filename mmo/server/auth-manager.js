import crypto from 'crypto';

// สร้าง session token ที่ปลอดภัย
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ยืนยันความถูกต้องของ token
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  if (token.length !== 64) return null; // hex 32 bytes = 64 chars
  return token;
}

// ระบบ Auth: จัดเก็บ token และ player info
const sessionStore = new Map(); // { token -> { id, name, class, createdAt } }

// สร้าง session ใหม่ (เรียกตอนผู้เล่น login/connect)
export function createSession(playerName, playerClass) {
  if (!playerName || playerName.trim().length === 0) {
    throw new Error('Player name is required');
  }
  if (!playerClass || !['warrior', 'mage', 'rogue'].includes(playerClass)) {
    throw new Error('Invalid class. Must be warrior, mage, or rogue');
  }

  const token = generateSessionToken();
  const session = {
    id: crypto.randomUUID(),
    token,
    name: playerName.substring(0, 32), // ตัดให้ไม่เกิน 32 ตัว
    class: playerClass,
    createdAt: Date.now(),
    lastActivity: Date.now()
  };

  sessionStore.set(token, session);
  return session;
}

// ตรวจสอบ token และอัพเดต activity
export function authenticateToken(token) {
  const session = verifyToken(token) && sessionStore.get(token);
  if (!session) return null;

  // ตรวจสอบว่า token ยังไม่หมดอายุ (24 ชั่วโมง)
  if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
    sessionStore.delete(token);
    return null;
  }

  session.lastActivity = Date.now();
  return session;
}

// ยกเลิก session (logout)
export function invalidateSession(token) {
  return sessionStore.delete(token);
}

// ล้างเซสชันที่หมดอายุทุก 30 นาที
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  for (const [token, session] of sessionStore.entries()) {
    if (now - session.createdAt > maxAge) {
      sessionStore.delete(token);
    }
  }
}, 30 * 60 * 1000);
