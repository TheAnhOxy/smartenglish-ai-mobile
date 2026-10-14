/**
 * Utilities xử lý tiền tệ, thời gian và bảo mật thông tin cá nhân (PII Masking)
 * phục vụ cho module hóa đơn điện tử SePay eInvoice & hoàn tiền.
 */

// Chuyển đổi số tiền VNĐ thành chữ tiếng Việt chuẩn hóa đơn tài chính (Nghị định 123/2020/NĐ-CP)
export const convertVNDToWords = (total?: number): string => {
  if (!total || isNaN(total) || total <= 0) return 'Không đồng';
  const defaultNumbers = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  const readThreeDigits = (threeDigits: number, showZeroHundred: boolean) => {
    const hundred = Math.floor(threeDigits / 100);
    const remainder = threeDigits % 100;
    const ten = Math.floor(remainder / 10);
    const unit = remainder % 10;
    let result = '';

    if (hundred > 0 || showZeroHundred) {
      result += defaultNumbers[hundred] + ' trăm ';
      if (ten === 0 && unit > 0) result += 'lẻ ';
    }

    if (ten > 1) {
      result += defaultNumbers[ten] + ' mươi ';
      if (unit === 1) result += 'mốt ';
    } else if (ten === 1) {
      result += 'mười ';
      if (unit === 1) result += 'một ';
    }

    if (ten === 0 && unit > 0) {
      result += defaultNumbers[unit] + ' ';
    } else if (unit === 5 && ten >= 1) {
      result += 'lăm ';
    } else if (unit > 1) {
      result += defaultNumbers[unit] + ' ';
    }

    return result.trim();
  };

  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  let numberStr = Math.floor(total).toString();
  const groups: number[] = [];

  while (numberStr.length > 0) {
    const chunk = numberStr.slice(-3);
    numberStr = numberStr.slice(0, -3);
    groups.push(parseInt(chunk, 10));
  }

  const words: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i];
    if (group > 0) {
      const showZero = i < groups.length - 1;
      const groupWord = readThreeDigits(group, showZero);
      words.push(`${groupWord} ${units[i]}`.trim());
    }
  }

  const full = words.join(' ').replace(/\s+/g, ' ').trim();
  if (!full) return 'Không đồng';
  return full.charAt(0).toUpperCase() + full.slice(1) + ' đồng chẵn.';
};

// Định dạng ngày giờ chuẩn hiển thị danh sách
export const formatDateStr = (dateStr?: string): string => {
  if (!dateStr) return 'Mới cập nhật';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

// Định dạng ngày đầy đủ theo chuẩn hóa đơn SePay: Ngày DD tháng MM năm YYYY
export const formatFullDateParts = (dateStr?: string): { day: string; month: string; year: string } => {
  if (!dateStr) {
    const now = new Date();
    return {
      day: now.getDate().toString().padStart(2, '0'),
      month: (now.getMonth() + 1).toString().padStart(2, '0'),
      year: now.getFullYear().toString(),
    };
  }
  try {
    const d = new Date(dateStr);
    return {
      day: d.getDate().toString().padStart(2, '0'),
      month: (d.getMonth() + 1).toString().padStart(2, '0'),
      year: d.getFullYear().toString(),
    };
  } catch {
    return { day: '14', month: '10', year: '2026' };
  }
};

// Kiểm tra đơn hàng có nằm trong thời hạn 7 ngày cam kết hoàn tiền không
export const isWithin7Days = (dateStr?: string): boolean => {
  if (!dateStr) return false;
  try {
    const created = new Date(dateStr).getTime();
    const diffDays = (Date.now() - created) / (1000 * 3600 * 24);
    return diffDays <= 7;
  } catch {
    return false;
  }
};

// Che mờ dữ liệu cá nhân (PII Masking) để bảo vệ người dùng khỏi việc lộ thông tin khi mở màn hình
export const maskPhone = (phone?: string): string => {
  if (!phone) return '—';
  const str = phone.trim();
  if (str.length <= 4) return '••••';
  return `${str.slice(0, 3)}••••${str.slice(-3)}`;
};

export const maskEmail = (email?: string): string => {
  if (!email || !email.includes('@')) return '—';
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `••@${domain}`;
  return `${name.slice(0, 2)}••••@${domain}`;
};

export const maskBankAccount = (acc?: string): string => {
  if (!acc) return '—';
  const str = acc.trim();
  if (str.length <= 4) return '••••' + str;
  return `${str.slice(0, 3)}••••${str.slice(-3)}`;
};
