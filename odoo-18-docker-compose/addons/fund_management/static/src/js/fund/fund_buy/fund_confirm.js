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
  const termMonths = sessionStorage.getItem('selected_term_months') || '0';
  const interestRate = sessionStorage.getItem('selected_interest_rate') || '0';

  document.getElementById('confirm-fund-name').textContent = fundName;
  document.getElementById('confirm-amount').textContent = Number(amount).toLocaleString('vi-VN') + 'đ';
  document.getElementById('confirm-total-amount').textContent = Number(totalAmount).toLocaleString('vi-VN') + 'đ';
  document.getElementById('confirm-units').textContent = units;
  const elTerm = document.getElementById('confirm-term-months');
  const elRate = document.getElementById('confirm-interest-rate');
  if (elTerm) elTerm.textContent = termMonths ? `${termMonths} tháng` : '...';
  if (elRate) elRate.textContent = interestRate ? `${Number(interestRate).toFixed(2)} %` : '...';
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
      const termMonths = document.getElementById('confirm-term-months')?.textContent || '';
      const interestRate = document.getElementById('confirm-interest-rate')?.textContent || '';

      sessionStorage.setItem('result_fund_name', fundName);
      sessionStorage.setItem('result_order_date', orderDate);
      sessionStorage.setItem('result_amount', amount);
      sessionStorage.setItem('result_total_amount', totalAmount);
      sessionStorage.setItem('result_program', program);
      sessionStorage.setItem('result_order_type', orderType);
      sessionStorage.setItem('result_units', units);
      sessionStorage.setItem('selected_term_months', (termMonths || '').replace(/[^0-9]/g, ''));
      sessionStorage.setItem('selected_interest_rate', (interestRate || '').replace(/[^0-9.]/g, ''));

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

function setupPaymentMethodEvents() {
  const select = document.getElementById("paymentMethod");
  const bankDiv = document.getElementById("bank-transfer-info");
  const qrDiv = document.getElementById("qr-payment-info");
  const payosDiv = document.getElementById("payos-payment-info");

  if (!select || !bankDiv || !qrDiv) return; // Tránh lỗi nếu không tìm thấy phần tử

  select.addEventListener("change", function () {
    const method = this.value;
    const isBank = method === "bank";
    const isQR = method === "qr";
    const isPayOS = method === "payos";
    bankDiv.style.display = isBank ? "block" : "none";
    qrDiv.style.display = isQR ? "block" : "none";
    if (payosDiv) payosDiv.style.display = isPayOS ? "block" : "none";
  });
}

function setPaymentDeadlines() {
  // Hàm định dạng ngày giờ
  function formatDateTime(date) {
    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }

  // Thời điểm hiện tại + 15 phút
  const now = new Date();
  const deadline = new Date(now.getTime() + 15 * 60 * 1000);

  // Gán thời gian vào DOM
  const bankElem = document.getElementById("deadline-bank");
  const qrElem = document.getElementById("deadline-qr");

  if (bankElem) bankElem.textContent = formatDateTime(deadline);
  if (qrElem) qrElem.textContent = formatDateTime(deadline);
}

// ===== GOM TẤT CẢ VÀO 1 DOMContentLoaded =====
document.addEventListener('DOMContentLoaded', () => {
  renderConfirmInfo();
  renderCurrentDateTime();
  setupConfirmPageEvents();
  setupPaymentMethodEvents();
  setPaymentDeadlines();

  // Xử lý PayOS: gọi API module PayOS khi người dùng chọn PayOS
  const payosBtn = document.getElementById('payos-payment-btn');
  if (payosBtn) {
    payosBtn.addEventListener('click', async () => {
      const errorBox = document.getElementById('payos-error');
      const errorMsg = document.getElementById('payos-error-message');
      try {
        // Lấy dữ liệu hiển thị
        const amountText = document.getElementById('confirm-total-amount')?.textContent || '0';
        const amount = Number((amountText || '0').replace(/[^0-9]/g, '')) || 0;
        const units = Number((document.getElementById('confirm-units')?.textContent || '0').replace(/[^0-9.]/g, '')) || 0;
        const fundName = document.getElementById('confirm-fund-name')?.textContent || '';

        // Có thể đã có transaction_id trước đó; nếu không, tạo tạm thời ở API PayOS controller (module payos handle)
        const payload = {
          transaction_id: Number(sessionStorage.getItem('transaction_id') || 0) || 0,
          amount: amount,
          units: units,
          description: `Thanh toán mua quỹ: ${fundName}`,
          cancel_url: '/payment/cancel',
          return_url: '/payment/success'
        };

        const res = await fetch('/api/payment/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!data || data.success !== true) {
          throw new Error((data && data.error) || 'Không tạo được liên kết PayOS');
        }

        const checkoutUrl = data.checkout_url || (data.data && data.data.checkout_url);
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
          return;
        }

        // Nếu không có checkoutUrl, thử hiển thị QR nếu có
        const qr = data.qr_code || (data.data && data.data.qr_code);
        if (qr) {
          const img = document.createElement('img');
          img.src = qr;
          img.alt = 'QR PayOS';
          img.style.maxWidth = '220px';
          payosBtn.insertAdjacentElement('afterend', img);
          return;
        }

        throw new Error('Thiếu dữ liệu trả về từ PayOS');
      } catch (err) {
        if (errorMsg) errorMsg.textContent = err?.message || 'Lỗi không xác định';
        if (errorBox) errorBox.style.display = 'block';
        // Không log icon theo rule; console an toàn cho dev
        console.error('PayOS error:', err);
      }
    });
  }
});
