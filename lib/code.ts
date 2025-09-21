// lib/code.ts
export function makeCode(): string {
  // 4-digit code between 1000–9999
  return String(Math.floor(1000 + Math.random() * 9000));
}
