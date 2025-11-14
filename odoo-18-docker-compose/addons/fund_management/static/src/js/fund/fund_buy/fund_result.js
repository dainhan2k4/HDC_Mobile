// ===== Utils =====
function parseVNDString(value) {
  return parseInt(value.replace(/[^\d]/g, ''), 10) || 0;
}

// ===== Gán dữ liệu từ sessionStorage vào DOM =====
function renderResultPageData() {
  const dataMap = {
    'result-fund-name': sessionStorage.getItem('result_fund_name'),
    'result-order-date': sessionStorage.getItem('result_order_date'),
    'result-amount': sessionStorage.getItem('result_amount'),
    'result-total-amount': sessionStorage.getItem('result_total_amount'),
    'result-program': sessionStorage.getItem('result_program'),
    'result-order-type': sessionStorage.getItem('result_order_type'),
    'result-units': sessionStorage.getItem('result_units'),
    'result-term-months': sessionStorage.getItem('selected_term_months'),
    'result-interest-rate': sessionStorage.getItem('selected_interest_rate')
  };

  Object.entries(dataMap).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value || '...';
  });
}

// ===== Gửi dữ liệu khi nhấn nút "Hoàn tất" =====
function setupFinishButton() {
  const finishBtn = document.getElementById('finish-btn');
  if (!finishBtn) {
    console.warn('⛔ Không tìm thấy nút "Hoàn tất" (finish-btn).');
    return;
  }

  finishBtn.addEventListener('click', async () => {
    console.log('📌 Bắt đầu xử lý sự kiện click nút Hoàn tất');

    const fundName = document.getElementById('result-fund-name')?.textContent.trim() || '';
    const amountText = document.getElementById('result-amount')?.textContent.trim() || '';
    const unitsText = document.getElementById('result-units')?.textContent.trim() || '';
    const fundId = sessionStorage.getItem('selectedFundId');
    let termMonths = sessionStorage.getItem('selected_term_months');
    let interestRate = sessionStorage.getItem('selected_interest_rate');
    
    // ✅ Fallback: Nếu dữ liệu chính bị mất, dùng backup
    if (!termMonths || termMonths === '0' || termMonths === '') {
      termMonths = sessionStorage.getItem('backup_term_months') || '0';
      console.log('🔄 Sử dụng backup term_months:', termMonths);
    }
    if (!interestRate || interestRate === '0' || interestRate === '') {
      interestRate = sessionStorage.getItem('backup_interest_rate') || '0';
      console.log('🔄 Sử dụng backup interest_rate:', interestRate);
    }

    const amount = parseVNDString(amountText);
    const units = parseFloat(unitsText.replace(/[^\d.-]/g, '')) || 0;

    console.log('✅ Sending:');
    console.log('fund_id:', fundId);
    console.log('amount:', amount);
    console.log('units:', units);
    console.log('term_months:', termMonths, '(type:', typeof termMonths, ')');
    console.log('interest_rate:', interestRate, '(type:', typeof interestRate, ')');
    
    // Debug sessionStorage
    console.log('🔍 SessionStorage debug:');
    console.log('- selected_term_months:', sessionStorage.getItem('selected_term_months'));
    console.log('- selected_interest_rate:', sessionStorage.getItem('selected_interest_rate'));

    try {
      const formData = new FormData();
      formData.append('fund_id', fundId);
      formData.append('amount', amount);
      formData.append('units', units);
      if (termMonths) formData.append('term_months', termMonths);
      if (interestRate) formData.append('interest_rate', interestRate);

      const res = await fetch('/create_investment', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP error ${res.status}: ${errorText}`);
      }

      const result = await res.json();
      console.log('Phản hồi từ server:', result);

      if (result.success) {
        Swal.fire({
          title: "Thành công!",
          text: "Xác nhận mua CCQ thành công!",
          icon: "success",
          confirmButtonText: "Xem danh mục đầu tư",
          confirmButtonColor: "#28a745"
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = '/asset-management';
          }
        });
      } else {
        Swal.fire({
          title: "Có lỗi xảy ra!",
          text: result.message || "Không thể thực hiện giao dịch",
          icon: "error",
          confirmButtonText: "Thử lại",
          confirmButtonColor: "#dc3545"
        });
      }
    } catch (error) {
      console.error('❌ Lỗi gửi dữ liệu:', error);
      alert('Lỗi kết nối: ' + error.message);
    }
  });
}

// ======= Gộp lại DOMContentLoaded =======
document.addEventListener('DOMContentLoaded', () => {
  renderResultPageData();
  setupFinishButton();
});
