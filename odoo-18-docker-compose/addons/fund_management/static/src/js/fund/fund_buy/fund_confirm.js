// ===== Hàm: Lấy ngày giờ định dạng đẹp =====
function getFormattedDateTime() {
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');

  const day = pad(now.getDate());
  const month = pad(now.getMonth() + 1);
  const year = now.getFullYear();

  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}

// ===== Hàm: Hiển thị thông tin xác nhận từ sessionStorage =====
function renderConfirmInfo() {
  const fundName = sessionStorage.getItem('selectedFundName') || 'Không rõ';
  const amount = sessionStorage.getItem('selectedAmount') || '0';
  const totalAmount = sessionStorage.getItem('selectedTotalAmount') || '0';
  const units = sessionStorage.getItem('selectedUnits') || '0';

  document.getElementById('confirm-fund-name').textContent = fundName;
  document.getElementById('confirm-amount').textContent = Number(amount).toLocaleString('vi-VN') + 'đ';
  document.getElementById('confirm-total-amount').textContent = Number(totalAmount).toLocaleString('vi-VN') + 'đ';
  document.getElementById('confirm-units').textContent = units;
}

// ===== Hàm: Gán ngày giờ vào các thẻ cần hiển thị =====
function renderCurrentDateTime() {
  const currentDateTime = getFormattedDateTime();
  const confirmDate = document.getElementById('confirm-order-date');
  const buyDate = document.getElementById('buy-order-date');

  if (confirmDate) confirmDate.textContent = currentDateTime;
  if (buyDate) buyDate.textContent = currentDateTime;
}

// ===== Hàm: Bắt sự kiện nút thanh toán và quay lại =====
function setupConfirmPageEvents() {
  const paymenConftBtn = document.getElementById('payment-confirm-btn');
  const backPaymentBtn = document.getElementById('back-payment-btn');

  if (paymenConftBtn) {
    paymenConftBtn.addEventListener('click', () => {
      const fundName = document.getElementById('confirm-fund-name')?.textContent || '';
      const orderDate = document.getElementById('confirm-order-date')?.textContent || '';
      const amount = document.getElementById('confirm-amount')?.textContent || '';
      const totalAmount = document.getElementById('confirm-total-amount')?.textContent || '';
      const program = document.getElementById('confirm-program')?.textContent || '';
      const orderType = document.getElementById('confirm-order-type')?.textContent || '';
      const units = document.getElementById('confirm-units')?.textContent || '';

      sessionStorage.setItem('result_fund_name', fundName);
      sessionStorage.setItem('result_order_date', orderDate);
      sessionStorage.setItem('result_amount', amount);
      sessionStorage.setItem('result_total_amount', totalAmount);
      sessionStorage.setItem('result_program', program);
      sessionStorage.setItem('result_order_type', orderType);
      sessionStorage.setItem('result_units', units);

      setTimeout(() => {
        window.location.href = '/fund_result';
      }, 500);
    });
  }

  if (backPaymentBtn) {
    backPaymentBtn.addEventListener('click', () => {
      window.location.href = '/fund_buy';
    });
  }
}

// ===== GOM TẤT CẢ VÀO 1 DOMContentLoaded =====
document.addEventListener('DOMContentLoaded', () => {
  renderConfirmInfo();
  renderCurrentDateTime();
  setupConfirmPageEvents();
});
