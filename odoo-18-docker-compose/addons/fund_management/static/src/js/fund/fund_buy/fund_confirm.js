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

  console.log('🔍 Fund Confirm - Dữ liệu từ sessionStorage:', {
    fundName: fundName,
    amount: amount,
    totalAmount: totalAmount,
    units: units,
    termMonths: termMonths,
    interestRate: interestRate
  });

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
      
      // ✅ Fix: Lưu lại dữ liệu kỳ hạn và lãi suất từ sessionStorage gốc
      const originalTermMonths = sessionStorage.getItem('selected_term_months');
      const originalInterestRate = sessionStorage.getItem('selected_interest_rate');
      
      console.log('💾 Fund Confirm - Lưu dữ liệu kỳ hạn:', {
        originalTermMonths: originalTermMonths,
        originalInterestRate: originalInterestRate,
        displayTermMonths: termMonths,
        displayInterestRate: interestRate
      });
      
      // Giữ nguyên dữ liệu gốc từ fund_buy
      if (originalTermMonths) {
        sessionStorage.setItem('selected_term_months', originalTermMonths);
      }
      if (originalInterestRate) {
        sessionStorage.setItem('selected_interest_rate', originalInterestRate);
      }
      
      // ✅ Backup: Lưu thêm vào các key khác để đảm bảo không mất dữ liệu
      sessionStorage.setItem('backup_term_months', originalTermMonths || '0');
      sessionStorage.setItem('backup_interest_rate', originalInterestRate || '0');
      
      console.log('💾 Backup dữ liệu:', {
        backupTermMonths: sessionStorage.getItem('backup_term_months'),
        backupInterestRate: sessionStorage.getItem('backup_interest_rate')
      });

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

// ===== Constants =====
const QR_CONFIG = {
  GENERATOR_API: 'https://api.qrserver.com/v1/create-qr-code/',
  DEFAULT_SIZE: '250x250',
  FALLBACK_SIZE: '300x300',
  MAX_WIDTH: '250px',
  BORDER: '2px solid #dee2e6',
  IMAGE_CLASSES: 'img-fluid rounded shadow-sm mx-auto d-block',
  TEXT_CLASSES: 'small text-muted mt-2 mb-0',
  TEXT_CONTENT: 'Quét mã QR để thanh toán qua PayOS',
  ALT_TEXT: 'QR PayOS'
};

const PAYOS_CONFIG = {
  DESCRIPTION_MAX_LENGTH: 25,
  ACCOUNT_NUMBER_DIGITS: 4,
  VIETQR_MIN_LENGTH: 50,
  VIETQR_PREFIX: '000201',
  ROUTES: {
    CONFIRM: '/fund_confirm',
    SUCCESS: '/payment/success'
  }
};

const QR_CODE_TYPES = {
  DATA_URL: 'data:',
  HTTP_URL: 'http',
  BASE64: 'base64',
  VIETQR: 'vietqr'
};

// ===== Helper Functions =====
// Các hàm parse VietQR đã bị loại bỏ vì không sử dụng mock data
// Chỉ sử dụng dữ liệu từ PayOS API response

function setupCopyButtons(accountNumber, amount, description) {
  // Copy account number
  const copyAccountBtn = document.getElementById('copy-account-number');
  if (copyAccountBtn) {
    copyAccountBtn.addEventListener('click', () => {
      copyToClipboard(accountNumber);
      showCopySuccess(copyAccountBtn);
    });
  }
  
  // Copy amount
  const copyAmountBtn = document.getElementById('copy-amount');
  if (copyAmountBtn) {
    copyAmountBtn.addEventListener('click', () => {
      // Copy số tiền không có "vnd" để dễ paste vào app ngân hàng
      const amountOnly = amount.replace(/[^0-9]/g, '');
      copyToClipboard(amountOnly);
      showCopySuccess(copyAmountBtn);
    });
  }
  
  // Copy description
  const copyDescBtn = document.getElementById('copy-description');
  if (copyDescBtn) {
    copyDescBtn.addEventListener('click', () => {
      copyToClipboard(description);
      showCopySuccess(copyDescBtn);
    });
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      console.log('✅ Đã sao chép:', text);
    }).catch(err => {
      console.error('❌ Lỗi khi sao chép:', err);
      fallbackCopyToClipboard(text);
    });
  } else {
    fallbackCopyToClipboard(text);
  }
}

function fallbackCopyToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    console.log('✅ Đã sao chép (fallback):', text);
  } catch (err) {
    console.error('❌ Lỗi khi sao chép (fallback):', err);
  }
  
  document.body.removeChild(textArea);
}

function showCopySuccess(button) {
  const originalHTML = button.innerHTML;
  button.innerHTML = '<i class="fas fa-check"></i> Đã sao chép';
  button.classList.remove('btn-outline-success');
  button.classList.add('btn-success');
  
  setTimeout(() => {
    button.innerHTML = originalHTML;
    button.classList.remove('btn-success');
    button.classList.add('btn-outline-success');
  }, 2000);
}

function detectQRCodeType(qrCode) {
  if (!qrCode) return null;
  // Ưu tiên: Kiểm tra URL hình ảnh (có logo VietQR từ PayOS)
  if (qrCode.startsWith(QR_CODE_TYPES.HTTP_URL) || qrCode.startsWith('https://')) {
    return QR_CODE_TYPES.HTTP_URL;
  }
  if (qrCode.startsWith(QR_CODE_TYPES.DATA_URL)) return QR_CODE_TYPES.DATA_URL;
  // VietQR string (cần tạo QR code)
  if (qrCode.startsWith(PAYOS_CONFIG.VIETQR_PREFIX) || 
      (qrCode.startsWith('00') && qrCode.length > PAYOS_CONFIG.VIETQR_MIN_LENGTH && !qrCode.startsWith(QR_CODE_TYPES.HTTP_URL))) {
    return QR_CODE_TYPES.VIETQR;
  }
  return QR_CODE_TYPES.BASE64;
}

function generateQRCodeImageUrl(data, size = QR_CONFIG.DEFAULT_SIZE) {
  return `${QR_CONFIG.GENERATOR_API}?size=${size}&data=${encodeURIComponent(data)}`;
}

function createQRImageElement(src) {
  const qrImg = document.createElement('img');
  qrImg.src = src;
  qrImg.alt = QR_CONFIG.ALT_TEXT;
  qrImg.className = QR_CONFIG.IMAGE_CLASSES;
  qrImg.style.maxWidth = QR_CONFIG.MAX_WIDTH;
  qrImg.style.border = QR_CONFIG.BORDER;
  qrImg.style.display = 'block';
  return qrImg;
}

function createQRTextElement() {
  const qrText = document.createElement('p');
  qrText.className = QR_CONFIG.TEXT_CLASSES;
  qrText.textContent = QR_CONFIG.TEXT_CONTENT;
  return qrText;
}

function renderQRCode(container, qrCode, onError) {
  if (!container) return;
  
  container.innerHTML = '';
  
  const qrType = detectQRCodeType(qrCode);
  let qrImageSrc;
  let isVietQRString = false;
  
  switch (qrType) {
    case QR_CODE_TYPES.VIETQR:
      // VietQR string - cần tạo QR code từ string
      isVietQRString = true;
      qrImageSrc = generateQRCodeImageUrl(qrCode, QR_CONFIG.DEFAULT_SIZE);
      break;
    case QR_CODE_TYPES.HTTP_URL:
      // URL hình ảnh từ PayOS (có logo VietQR)
      qrImageSrc = qrCode;
      break;
    case QR_CODE_TYPES.DATA_URL:
      qrImageSrc = qrCode;
      break;
    case QR_CODE_TYPES.BASE64:
    default:
      qrImageSrc = `data:image/png;base64,${qrCode}`;
      break;
  }
  
  const qrImg = createQRImageElement(qrImageSrc);
  const qrText = createQRTextElement();
  
  // Hiển thị header và footer (giống PayOS) nếu là VietQR string
  const qrHeader = document.getElementById('payos-qr-header');
  const qrFooter = document.getElementById('payos-qr-footer');
  
  if (isVietQRString) {
    if (qrHeader) qrHeader.style.display = 'block';
    if (qrFooter) qrFooter.style.display = 'block';
  } else {
    // Nếu là URL từ PayOS, ẩn header/footer vì đã có logo trong QR code
    if (qrHeader) qrHeader.style.display = 'none';
    if (qrFooter) qrFooter.style.display = 'none';
  }
  
  // Error handler
  qrImg.onerror = function() {
    console.error('❌ Không thể load QR code:', qrCode.substring(0, 50) + '...');
    if (qrType === QR_CODE_TYPES.VIETQR) {
      // Fallback: thử lại với size lớn hơn
      qrImg.src = generateQRCodeImageUrl(qrCode, QR_CONFIG.FALLBACK_SIZE);
    } else if (onError) {
      onError();
    }
  };
  
  // Success handler
  qrImg.onload = function() {
    console.log('✅ QR code đã load thành công');
    container.style.display = 'block';
  };
  
  container.appendChild(qrImg);
  container.appendChild(qrText);
  container.style.display = 'block';
}

// Hàm tạo PayOS payment và hiển thị QR
async function createPayOSPayment() {
  const payosDiv = document.getElementById('payos-payment-info');
  const errorBox = document.getElementById('payos-error');
  const errorMsg = document.getElementById('payos-error-message');
  const payosBtn = document.getElementById('payos-payment-btn');
  
  if (!payosDiv) return;
  
  // Ẩn error message
  if (errorBox) errorBox.style.display = 'none';
  
  // Hiển thị loading
  if (payosBtn) {
    payosBtn.disabled = true;
    payosBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang tạo thanh toán...';
  }
  
  // Xóa nội dung QR code cũ nếu có (chỉ xóa nội dung, không xóa container)
  const qrContainer = document.getElementById('payos-qr-code');
  if (qrContainer) {
    qrContainer.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tạo mã QR...</span></div><p class="small text-muted mt-2 mb-0">Đang tạo mã QR thanh toán...</p></div>';
    qrContainer.style.display = 'block'; // Hiển thị loading ngay
  }
  
  try {
    // ✅ Lấy đúng số tiền từ sessionStorage (raw value, chưa format)
    const totalAmountRaw = sessionStorage.getItem('selectedTotalAmount') || '0';
    const amount = Number(totalAmountRaw) || 0;
    
    // Lấy units từ sessionStorage
    const unitsRaw = sessionStorage.getItem('selectedUnits') || '0';
    const units = Number(unitsRaw) || 0;
    
    // Lấy fund name từ sessionStorage
    const fundName = sessionStorage.getItem('selectedFundName') || '';

    if (!amount || amount <= 0) {
      throw new Error('Số tiền thanh toán không hợp lệ');
    }
    
    console.log('💰 PayOS Payment - Dữ liệu:', {
      amount: amount,
      units: units,
      fundName: fundName,
      totalAmountRaw: totalAmountRaw,
      unitsRaw: unitsRaw
    });

    // Tạo payload
    const transactionId = Number(sessionStorage.getItem('transaction_id') || 0) || 0;
    const accountNumber = transactionId 
      ? String(transactionId).slice(-PAYOS_CONFIG.ACCOUNT_NUMBER_DIGITS) 
      : '****';
    
    const description = `Nap tien TK${accountNumber} tai HDC`.substring(0, PAYOS_CONFIG.DESCRIPTION_MAX_LENGTH);
    
    const payload = {
      transaction_id: transactionId,
      amount: amount,
      units: units,
      description: description,
      cancel_url: window.location.origin + PAYOS_CONFIG.ROUTES.CONFIRM,
      return_url: window.location.origin + PAYOS_CONFIG.ROUTES.SUCCESS
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

    // Lấy QR code từ response - kiểm tra nhiều format
    const qrCode = (
      data.qr_code || 
      data.qrCode ||
      (data.data && (data.data.qr_code || data.data.qrCode || data.data.qrCodeBase64 || data.data.qrCodeUrl))
    );
    const checkoutUrl = data.checkout_url || data.checkoutUrl || (data.data && (data.data.checkout_url || data.data.checkoutUrl));
    const orderCode = data.order_code || data.orderCode || (data.data && (data.data.order_code || data.data.orderCode)) || payload.transaction_id;
    
    // Debug: log response để kiểm tra
    console.log('💰 PayOS Response:', {
      success: data.success,
      qr_code: qrCode ? 'Có' : 'Không',
      qr_code_type: qrCode ? (qrCode.startsWith('data:') ? 'base64' : (qrCode.startsWith('http') ? 'url' : 'unknown')) : 'N/A',
      checkout_url: checkoutUrl ? 'Có' : 'Không',
      order_code: orderCode,
      full_response: data
    });
    
    // Nếu không có QR code từ PayOS, log cảnh báo
    if (!qrCode) {
      console.warn('⚠️ PayOS API không trả về QR code. Chỉ có checkoutUrl:', checkoutUrl);
    }

    // Hiển thị thông tin thanh toán (chỉ từ PayOS API)
    const paymentDetails = document.getElementById('payos-payment-details');
    if (paymentDetails) {
      // Lấy thông tin ngân hàng từ PayOS response (không có fallback mock data)
      const bankInfo = data.bank_info || (data.data && data.data.bank_info);
      
      // Chỉ hiển thị nếu có đầy đủ thông tin từ PayOS
      if (bankInfo && bankInfo.account_number) {
        const formattedAmount = amount.toLocaleString('vi-VN') + ' vnd';
        const amountOnly = amount.toLocaleString('vi-VN');
        
        // Hiển thị thông tin (chỉ từ PayOS)
        const bankNameEl = document.getElementById('payos-bank-name');
        const accountHolderEl = document.getElementById('payos-account-holder');
        const accountNumberEl = document.getElementById('payos-account-number');
        const amountEl = document.getElementById('payos-amount');
        const amountNoteEl = document.getElementById('payos-amount-note');
        const descriptionEl = document.getElementById('payos-description');
        
        if (bankNameEl) bankNameEl.textContent = bankInfo.bank_name || bankInfo.bankName || '';
        if (accountHolderEl) accountHolderEl.textContent = bankInfo.account_holder || bankInfo.accountHolder || '';
        if (accountNumberEl) accountNumberEl.textContent = bankInfo.account_number || bankInfo.accountNumber || '';
        if (amountEl) amountEl.textContent = formattedAmount;
        if (amountNoteEl) amountNoteEl.textContent = amountOnly;
        if (descriptionEl) descriptionEl.textContent = payload.description || '';
        
        // Setup copy buttons (chỉ nếu có đầy đủ thông tin)
        if (bankInfo.account_number) {
          setupCopyButtons(bankInfo.account_number, formattedAmount, payload.description || '');
        }
        
        paymentDetails.style.display = 'block';
      } else {
        // Ẩn payment details nếu không có dữ liệu từ PayOS
        paymentDetails.style.display = 'none';
        console.warn('⚠️ PayOS không trả về thông tin ngân hàng. Ẩn payment details.');
      }
    }

    // Hiển thị QR code - sử dụng helper function
    const qrContainer = document.getElementById('payos-qr-code');
    if (!qrContainer) {
      console.error('❌ Không tìm thấy container QR code');
      return;
    }
    
    // Xóa nội dung loading
    qrContainer.innerHTML = '';
    
    // Hiển thị QR code từ PayOS API
    if (qrCode) {
      console.log('✅ Sử dụng QR code từ PayOS API');
      renderQRCode(qrContainer, qrCode, () => {
        qrContainer.innerHTML = '<div class="alert alert-warning"><small>Không thể hiển thị mã QR từ PayOS. Vui lòng click vào nút bên dưới để thanh toán.</small></div>';
      });
    } else {
      // Không có QR code từ PayOS API
      console.warn('⚠️ PayOS API không trả về QR code. Chỉ sử dụng checkoutUrl.');
      qrContainer.innerHTML = `
        <div class="alert alert-info">
          <p class="mb-2"><strong>PayOS không trả về mã QR</strong></p>
          <p class="small mb-0">Vui lòng click vào nút bên dưới để mở trang thanh toán PayOS.</p>
        </div>
      `;
      qrContainer.style.display = 'block';
    }

    // Lưu checkout_url để có thể redirect sau
    if (checkoutUrl) {
      sessionStorage.setItem('payos_checkout_url', checkoutUrl);
    }

    // Cập nhật nút PayOS
    if (payosBtn) {
      payosBtn.disabled = false;
      if (checkoutUrl) {
        payosBtn.innerHTML = '<i class="fas fa-external-link-alt me-2"></i>Mở trang thanh toán PayOS';
        payosBtn.onclick = () => {
          window.open(checkoutUrl, '_blank');
        };
      } else {
        payosBtn.innerHTML = '<i class="fas fa-qrcode me-2"></i>Đã tạo mã QR';
        payosBtn.onclick = null;
      }
    }

  } catch (err) {
    console.error('PayOS error:', err);
    
    if (errorMsg) errorMsg.textContent = err?.message || 'Lỗi không xác định';
    if (errorBox) errorBox.style.display = 'block';
    
    // Reset nút PayOS
    if (payosBtn) {
      payosBtn.disabled = false;
      payosBtn.innerHTML = 'Thanh toán với PayOS';
    }
  }
}


// ===== GOM TẤT CẢ VÀO 1 DOMContentLoaded =====
document.addEventListener('DOMContentLoaded', async () => {
  renderConfirmInfo();
  renderCurrentDateTime();
  setupConfirmPageEvents();

  // ✅ Tự động tạo PayOS payment và hiển thị QR khi load trang
  await createPayOSPayment();

  // Xử lý PayOS: gọi API module PayOS khi người dùng click nút PayOS
  const payosBtn = document.getElementById('payos-payment-btn');
  if (payosBtn) {
    payosBtn.addEventListener('click', async () => {
      // Kiểm tra nếu đã có checkout_url, mở luôn
      const checkoutUrl = sessionStorage.getItem('payos_checkout_url');
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
        return;
      }
      
      // Nếu chưa có, tạo payment mới
      await createPayOSPayment();
    });
  }
});
