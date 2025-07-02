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
    'result-units': sessionStorage.getItem('result_units')
  };

  Object.entries(dataMap).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value || '...';
  });
}

// ===== Gửi dữ liệu khi nhấn nút "Hoàn tất" =====
function setupFinishButton() {
  const finishBtn = document.getElementById('finish-btn');
  if (finishBtn) {
    finishBtn.addEventListener('click', async () => {
      console.log('📌 Bắt đầu xử lý sự kiện click nút Hoàn tất');

      const fundName = document.getElementById('result-fund-name')?.textContent.trim() || '';
      const amountText = document.getElementById('result-amount')?.textContent.trim() || '';
      const unitsText = document.getElementById('result-units')?.textContent.trim() || '';
      const fundId = sessionStorage.getItem('selectedFundId');

      const amount = parseVNDString(amountText);
      const units = parseFloat(unitsText.replace(/[^\d.-]/g, '')) || 0;

      console.log('✅ Sending:');
      console.log('fund_id:', fundId);
      console.log('amount:', amount);
      console.log('units:', units);

      try {
        const formData = new FormData();
        formData.append('fund_id', fundId);
        formData.append('amount', amount);
        formData.append('units', units);

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
            text: "Xác nhận mua cổ phiếu thành công!",
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
  } else {
    console.warn('Không tìm thấy nút "Hoàn tất" (finish-btn).');
  }
}

// ======= Gộp lại DOMContentLoaded =======
document.addEventListener('DOMContentLoaded', () => {
  renderResultPageData();
  setupFinishButton();
});
