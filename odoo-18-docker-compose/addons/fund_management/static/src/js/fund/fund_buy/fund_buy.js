document.addEventListener('DOMContentLoaded', () => {
  initFundSelect();
  initPaymentButton();
  initFeeCalculation();
  initUnitsCalculation();
  const amountInput = document.getElementById('amount-input');
  formatAmountInputWithRaw(amountInput);
  loadCurrentDatetime();
});


function initFundSelect() {
  const fundSelect = document.getElementById('fund-select');
  const fundNameDisplay = document.getElementById('summary-fund-name');
  const navDisplay = document.getElementById('current-nav');
  const currentId = document.getElementById('current-id');
  const amountInput = document.getElementById('amount-input');
  const amountDisplay = document.getElementById('summary-amount');

  fetch('/data_fund')
    .then(res => res.json())
    .then(fundData => {
      fundSelect.innerHTML = '<option disabled selected>-- Chọn quỹ đầu tư --</option>';
      fundData.forEach(fund => {
        const option = document.createElement('option');
        option.value = fund.ticker;
        option.textContent = `${fund.name} (${fund.ticker})`;
        option.dataset.id = fund.id;
        option.dataset.name = fund.name;
        option.dataset.nav = fund.current_nav;
        fundSelect.appendChild(option);
      });

      fundSelect.addEventListener('change', () => {
        const selected = fundData.find(f => f.ticker === fundSelect.value);
        if (selected) {
          fundNameDisplay.textContent = selected.name;
          currentId.textContent = selected.id;
          navDisplay.textContent = Number(selected.current_nav).toLocaleString('vi-VN') + 'đ';
        } else {
          fundNameDisplay.textContent = '';
          currentId.textContent = 'Không xác định';
          navDisplay.textContent = 'Không xác định';
        }
      });

      amountInput.addEventListener('input', () => {
        const val = parseInt(amountInput.dataset.raw || '0');
        amountDisplay.textContent = val.toLocaleString('vi-VN') + 'đ';
      });
    })
    .catch(err => {
      console.error('❌ Lỗi khi tải dữ liệu quỹ:', err);
      navDisplay.textContent = 'Không thể tải dữ liệu';
    });
}


function initPaymentButton() {
  const paymentBtn = document.getElementById('payment-btn');
  const backBtn = document.getElementById('back-btn');
  const fundSelect = document.getElementById('fund-select');

  paymentBtn.addEventListener('click', () => {
    const fundName = document.getElementById('summary-fund-name').textContent;
    const units = document.getElementById('summary-units').textContent;
    const amount = document.getElementById('summary-amount').textContent.replace(/[^0-9]/g, '');
    const totalAmount = document.getElementById('summary-total').textContent.replace(/[^0-9]/g, '');
    const selectedOption = fundSelect.options[fundSelect.selectedIndex];
    const fundId = selectedOption.dataset.id;

    sessionStorage.setItem('selectedFundId', fundId);
    sessionStorage.setItem('selectedFundName', fundName);
    sessionStorage.setItem('selectedUnits', units);
    sessionStorage.setItem('selectedAmount', amount);
    sessionStorage.setItem('selectedTotalAmount', totalAmount);

    window.location.href = '/fund_confirm';
  });

  backBtn.addEventListener('click', () => {
    window.location.href = '/fund_widget';
  });
}


function initFeeCalculation() {
  const amountInput = document.getElementById('amount-input');
  const feeInput = document.getElementById('fee-input');
  const summaryAmount = document.getElementById('summary-amount');
  const summaryFee = document.getElementById('summary-fee');
  const summaryTotal = document.getElementById('summary-total');

  amountInput.addEventListener('input', () => {
      // Lấy số gốc không có dấu
      let raw = amountInput.value.replace(/[^0-9]/g, '');

      // Giới hạn tối đa 12 chữ số
      if (raw.length > 12) {
        raw = raw.slice(0, 12);
      }

      // Lưu lại vào dataset
      amountInput.dataset.raw = raw;

      // Format lại input để hiển thị
      amountInput.value = raw ? Number(raw).toLocaleString('vi-VN') : '';

      // Tính toán phí
      const amount = parseInt(raw || '0');
      let fee = 0;

      if (amount < 10000000) fee = amount * 0.003;
      else if (amount < 20000000) fee = amount * 0.002;
      else fee = amount * 0.001;

      const total = amount + fee;
      feeInput.value = Math.floor(fee).toLocaleString('vi-VN') + 'đ';
      summaryAmount.textContent = amount.toLocaleString('vi-VN') + 'đ';
      summaryFee.textContent = Math.floor(fee).toLocaleString('vi-VN') + 'đ';
      summaryTotal.textContent = Math.floor(total).toLocaleString('vi-VN') + 'đ';
    });
}


function initUnitsCalculation() {
  const amountInput = document.getElementById('amount-input');
  const navDisplay = document.getElementById('current-nav');
  const summaryUnits = document.getElementById('summary-units');

  amountInput.addEventListener('input', () => {
    const amount = parseFloat(amountInput.dataset.raw || '0');
    const navString = navDisplay.textContent.replace(/\./g, '').replace(/,/g, '.');
    const nav = parseFloat(navString.replace(/[^0-9.-]+/g, '')) || 0;

    const units = (nav > 0) ? (amount / nav).toFixed(2) : 0;
    summaryUnits.textContent = units;
  });
}


function formatAmountInputWithRaw(inputElement) {
  inputElement.addEventListener('input', () => {
    const raw = inputElement.value.replace(/[^0-9]/g, '');
    inputElement.dataset.raw = raw;  // lưu raw value
    inputElement.value = raw ? Number(raw).toLocaleString('vi-VN') : '';
  });
}

function loadCurrentDatetime() {
  const now = new Date();

  const pad = (n) => n.toString().padStart(2, '0');

  const formatted = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ` +
                    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const dateElement = document.getElementById('buy-order-date');
  if (dateElement) {
    dateElement.textContent = formatted;
  }
}