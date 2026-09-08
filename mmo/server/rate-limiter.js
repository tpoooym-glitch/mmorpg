/**
 * Rate Limiter: ป้องกัน Spam และ DoS
 */

class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;    // จำนวนคำขอสูงสุด
    this.windowMs = windowMs;          // ช่วงเวลา (ms)
    this.requests = new Map();         // { id -> [timestamp, timestamp, ...] }
  }

  // ตรวจสอบว่าอนุญาตคำขอหรือไม่
  isAllowed(id) {
    const now = Date.now();
    const timestamps = this.requests.get(id) || [];

    // ลบ timestamps ที่เก่าเกินไป
    const validTimestamps = timestamps.filter(t => now - t < this.windowMs);

    if (validTimestamps.length < this.maxRequests) {
      validTimestamps.push(now);
      this.requests.set(id, validTimestamps);
      return true;
    }

    // เพื่อไม่ให้ memory รั่ว ให้เก็บแค่ที่จำเป็น
    this.requests.set(id, validTimestamps);
    return false;
  }

  // ล้างรายการเก่าที่เก็บ (เรียก interval)
  cleanup() {
    const now = Date.now();
    for (const [id, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter(t => now - t < this.windowMs);
      if (valid.length === 0) {
        this.requests.delete(id);
      } else {
        this.requests.set(id, valid);
      }
    }
  }
}

// ตั้งค่า rate limiter สำหรับแต่ละประเภท
export const movementLimiter = new RateLimiter(30, 1000);    // 30 เหตุการณ์ต่อวินาที
export const attackLimiter = new RateLimiter(10, 1000);      // 10 ครั้งต่อวินาที
export const chatLimiter = new RateLimiter(5, 1000);         // 5 ข้อความต่อวินาที
export const skillLimiter = new RateLimiter(8, 1000);        // 8 คำสั่ง skill ต่อวินาที

// ล้างข้อมูลเก่าทุก 5 นาที
setInterval(() => {
  movementLimiter.cleanup();
  attackLimiter.cleanup();
  chatLimiter.cleanup();
  skillLimiter.cleanup();
}, 5 * 60 * 1000);
