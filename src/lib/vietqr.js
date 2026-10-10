import { BANK } from '../config';

/** Transfer description, e.g. QUYCLB_U003_202610 */
export const transferContent = (userId, month) => `QUYCLB_${userId}_${month}`;

/**
 * Builds a dynamic VietQR image URL (VietQR quick-link format).
 */
export function buildVietQrUrl({ amount, content }) {
  // Lấy các giá trị đã được khai báo trong file config.js
  const { BANK_ID, ACCOUNT_NO, TEMPLATE, ACCOUNT_NAME } = BANK;
  
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo: content,
    accountName: ACCOUNT_NAME,
  });

  return `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-${TEMPLATE}.png?${params.toString()}`;
}