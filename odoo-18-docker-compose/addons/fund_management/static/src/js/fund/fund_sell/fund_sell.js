document.addEventListener('DOMContentLoaded', async () => {
  await initFundSellPage();
  initFundSellConfirmPage();
  initFinalSellSubmit();
  initBackButton();
});

// ================================
// 🚀 Trang chọn quỹ để bán
// ================================
async function initFundSellPage() {
  const fundSelect = document.getElementById('fund-sell-select');
  const amountInput = document.getElementById('fund-sell-amount-input');

  if (!fundSelect || !amountInput) return;

  const unitsDisplay = document.getElementById('fund-sell-units');
  const amountDisplay = document.getElementById('fund-sell-amount');
  const navDisplay = document.getElementById('fund-sell-current-nav');

  try {
    const response = await fetch('/data_investment');
    const fundData = await response.json();

    fundSelect.innerHTML = '<option disabled selected>-- Chọn quỹ đã mua --</option>';
    fundData.forEach(fund => {
      const option = document.createElement('option');
      option.value = fund.id;
      option.textContent = `${fund.fund_name} (${fund.fund_ticker})`;
      fundSelect.appendChild(option);
    });

    setupSellQuantityLimit(fundData, fundSelect, amountInput);
    updateSellSummary(fundData, fundSelect, amountInput);
    handleFundSellConfirm(fundData, fundSelect, amountInput);

    fundSelect.addEventListener('change', () => {
      const selected = fundData.find(f => f.id == fundSelect.value);

      if (selected) {
        unitsDisplay.textContent = selected.units.toLocaleString('vi-VN');
        amountDisplay.textContent = Number(selected.amount).toLocaleString('vi-VN') + 'đ';
        navDisplay.textContent = Number(selected.current_nav).toLocaleString('vi-VN') + 'đ'; // Giữ lại cho hiển thị, nhưng không dùng để tính toán
      } else {
        unitsDisplay.textContent = '--';
        amountDisplay.textContent = '--';
        navDisplay.textContent = '--';
      }
    });

    amountInput.addEventListener('input', () => {
      const quantity = parseFloat(amountInput.value || '0');
      console.log('Số lượng muốn bán:', quantity);
    });
  } catch (err) {
    console.error('Lỗi khi tải dữ liệu investment:', err);
  }
}

function setupSellQuantityLimit(fundData, fundSelect, amountInput) {
  amountInput.addEventListener('input', () => {
    const selected = fundData.find(f => f.id == fundSelect.value);
    if (!selected) return;

    const maxUnits = parseFloat(selected.units);
    let quantity = parseFloat(amountInput.value || '0');

    if (quantity > maxUnits) {
      quantity = maxUnits;
      amountInput.value = quantity;
    }

    console.log('✅ Số lượng muốn bán:', quantity);
  });
}

function updateSellSummary(fundData, fundSelect, amountInput) {
  const estimatedValueDisplay = document.getElementById('fund-sell-estimated-value');
  const fundNameDisplay = document.getElementById('fund-sell-summary-name');
  const amountDisplay = document.getElementById('fund-sell-summary-amount');

  function update() {
    const selected = fundData.find(f => f.id == fundSelect.value);
    const quantity = parseFloat(amountInput.value || '0');

    if (!selected || isNaN(quantity)) {
      estimatedValueDisplay.textContent = '--';
      fundNameDisplay.textContent = '--';
      amountDisplay.textContent = '--';
      return;
    }

    // Làm tròn current_nav cho bội số 50 (giữ lại cho hiển thị, nhưng không dùng để tính toán)
    const navRounded = Math.round(selected.current_nav / 50) * 50;
    const estimated = quantity * navRounded;

    estimatedValueDisplay.textContent = estimated.toLocaleString('vi-VN') + 'đ';
    fundNameDisplay.textContent = selected.fund_name;
    amountDisplay.textContent = quantity.toLocaleString('vi-VN');
  }

  fundSelect.addEventListener('change', update);
  amountInput.addEventListener('input', update);
}

function handleFundSellConfirm(fundData, fundSelect, amountInput, confirmButtonId = 'fund-sell-confirm-btn') {
  const confirmBtn = document.getElementById(confirmButtonId);
  if (!confirmBtn) return;

  confirmBtn.addEventListener('click', () => {
    const selected = fundData.find(f => f.id == fundSelect.value);
    const quantity = parseFloat(amountInput.value || '0');

    if (!selected || !quantity || quantity <= 0 || quantity > selected.units) {
      alert('⚠️ Vui lòng chọn quỹ và nhập số lượng hợp lệ.');
      return;
    }

    const dataToConfirm = {
      fund_id: selected.fund_id,
      fund_name: selected.fund_name,
      fund_ticker: selected.fund_ticker,
      quantity: quantity,
      current_nav: selected.current_nav, // Giữ lại cho hiển thị, nhưng không dùng để tính toán
      estimated_value: quantity * navRounded,
      investment_id: selected.id,
      original_amount: selected.amount,
      original_units: selected.units
    };

    sessionStorage.setItem('fund_sell_data', JSON.stringify(dataToConfirm));
    console.table(dataToConfirm);
    window.location.href = "/fund_sell_confirm";
  });
}

// ================================
// ✅ Trang xác nhận bán
// ================================
function initFundSellConfirmPage() {
  const data = JSON.parse(sessionStorage.getItem('fund_sell_data'));
  if (!data) return;

  const formatNumber = (num) => Number(num).toLocaleString('vi-VN');
  const formatCurrency = (num) => formatNumber(num) + 'đ';

  document.getElementById('sell-confirm-fund-name').textContent = data.fund_name;
  document.getElementById('sell-confirm-fund-ticker').textContent = data.fund_ticker;
  document.getElementById('sell-confirm-quantity').textContent = formatNumber(data.quantity);
  document.getElementById('sell-confirm-nav').textContent = formatCurrency(data.current_nav); // Giữ lại cho hiển thị, nhưng không dùng để tính toán
  document.getElementById('sell-confirm-value').textContent = formatCurrency(data.estimated_value);
  document.getElementById('sell-confirm-estimated-value').textContent = formatCurrency(data.estimated_value);
  document.getElementById('sell-confirm-original-units').textContent = formatNumber(data.original_units);
  document.getElementById('sell-confirm-original-amount').textContent = formatCurrency(data.original_amount);
  document.getElementById('sell-confirm-investment-id').textContent = data.investment_id;

  console.table(data);
}

// ================================
// ✅ Gửi xác nhận cuối cùng
// ================================
function initFinalSellSubmit() {
  const confirmBtn = document.getElementById('sell-confirm-final-submit');
  const sellData = JSON.parse(sessionStorage.getItem('fund_sell_data'));
  if (!confirmBtn || !sellData) return;

  confirmBtn.addEventListener('click', async () => {
    const confirmResult = await Swal.fire({
      title: "Xác nhận bán?",
      text: `Bạn có chắc chắn muốn bán ${sellData.quantity} chứng chỉ quỹ của quỹ \"${sellData.fund_name}\"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Huỷ",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d"
    });

    if (!confirmResult.isConfirmed) return;

    try {
      const formData = new FormData();
      formData.append('investment_id', sellData.investment_id);
      formData.append('quantity', sellData.quantity);
      formData.append('estimated_value', sellData.estimated_value);

      const res = await fetch('/submit_fund_sell', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (result.success) {
        await Swal.fire({
          title: "Thành công!",
          text: "Xác nhận bán quỹ thành công!",
          icon: "success",
          confirmButtonText: "Xem danh mục đầu tư",
          confirmButtonColor: "#28a745"
        });

        sessionStorage.removeItem('fund_sell_data');
        window.location.href = '/asset-management';
      } else {
        Swal.fire({
          title: "Lỗi!",
          text: result.message || "Có lỗi xảy ra trong quá trình xử lý.",
          icon: "error",
          confirmButtonText: "Đóng"
        });
      }

    } catch (err) {
      console.error("❌ Lỗi khi gửi form:", err);
      Swal.fire({
        title: "Lỗi hệ thống!",
        text: err.message || "Không thể kết nối đến server.",
        icon: "error",
        confirmButtonText: "Thử lại"
      });
    }
  });
}

function initBackButton() {
  const backBtn = document.getElementById('back-btn-sell');
  if (!backBtn) {
    console.warn("⚠️ Nút 'Quay lại' (id='back-btn-sell') không tồn tại trong DOM.");
    return;
  }

  backBtn.addEventListener('click', () => {
    // ✅ Điều hướng về trang chính hoặc widget
    window.location.href = '/fund_widget';
  });
}


