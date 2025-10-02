document.addEventListener('DOMContentLoaded', () => {
  initFundSelect();
  initShareQuantityInput();
  initPaymentButton();

  const amountInput = document.getElementById('amount-input');
  formatAmountInputWithRaw(amountInput);

  // Thêm format cho input số tiền đầu tư
  const investmentAmountInput = document.getElementById('investment-amount-input');
  formatAmountInputWithRaw(investmentAmountInput);

  initInterestRateSelect();
  initInvestmentCalculator();
  initTermSelect();
  initShareQuantityCalculation();
  initInvestmentAmountCalculation(); // Thêm function mới
  loadTermRates(); // Load kỳ hạn từ API

  format_date_today();

});

function format_date_today()
{
  const today = new Date();
  const formatted = today.toLocaleDateString("vi-VN"); // ra dạng 25/08/2025
  document.getElementById("today-date").textContent = formatted;
}

// Load kỳ hạn từ nav_management API
async function loadTermRates() {
  try {
    const response = await fetch('/nav_management/api/term_rates', {
      method: 'GET',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'same-origin'
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        populateTermSelect(result.rates);
        // Lưu rate map vào biến global để sử dụng
        window.termRateMap = result.rate_map;
      } else {
        console.error('API trả về lỗi:', result.message);
        showFallbackTermSelect();
      }
    } else {
      console.error('Lỗi HTTP:', response.status);
      showFallbackTermSelect();
    }
  } catch (error) {
    console.error('Lỗi load kỳ hạn:', error);
    showFallbackTermSelect();
  }
}

// Populate term select với dữ liệu từ API
function populateTermSelect(rates) {
  const termSelect = document.getElementById('term-select');
  termSelect.innerHTML = '<option value="" selected="selected" disabled="disabled">-- Chọn kỳ hạn --</option>';
  
  rates.forEach(rate => {
    const option = document.createElement('option');
    option.value = rate.term_months;
    option.dataset.rate = rate.interest_rate;
    option.textContent = `${rate.term_months} tháng (${rate.interest_rate}%)`;
    termSelect.appendChild(option);
  });
  
  // Trigger tính toán lại sau khi load dữ liệu
  const amountInput = document.getElementById('amount-input');
  if (amountInput) {
    amountInput.dispatchEvent(new Event('input'));
  }
}

// Fallback nếu API lỗi
function showFallbackTermSelect() {
  const termSelect = document.getElementById('term-select');
  termSelect.innerHTML = `
    <option value="" selected="selected" disabled="disabled">-- Chọn kỳ hạn --</option>
    <option value="1" data-rate="4.80">1 tháng (4.80%)</option>
    <option value="2" data-rate="5.80">2 tháng (5.80%)</option>
    <option value="3" data-rate="6.20">3 tháng (6.20%)</option>
    <option value="4" data-rate="6.50">4 tháng (6.50%)</option>
    <option value="5" data-rate="7.00">5 tháng (7.00%)</option>
    <option value="6" data-rate="7.70">6 tháng (7.70%)</option>
    <option value="7" data-rate="8.00">7 tháng (8.00%)</option>
    <option value="8" data-rate="8.50">8 tháng (8.50%)</option>
    <option value="9" data-rate="8.60">9 tháng (8.60%)</option>
    <option value="10" data-rate="8.70">10 tháng (8.70%)</option>
    <option value="11" data-rate="8.90">11 tháng (8.90%)</option>
    <option value="12" data-rate="9.10">12 tháng (9.10%)</option>
  `;
  
  // Trigger tính toán lại sau khi load fallback
  const amountInput = document.getElementById('amount-input');
  if (amountInput) {
    amountInput.dispatchEvent(new Event('input'));
  }
}

// Xử lý chọn chứng chỉ quỹ
function initFundSelect() {
  const fundSelect = document.getElementById('fund-select');
  const fundNameDisplay = document.getElementById('summary-fund-name');
  const navDisplay = document.getElementById('current-nav');
  const currentId = document.getElementById('current-id');
  const amountInput = document.getElementById('amount-input');
  const amountDisplay = document.getElementById('summary-amount');

  const selectedTickerFromStorage = sessionStorage.getItem('selectedTicker');

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
        option.dataset.nav = fund.current_nav; // Giữ lại cho hiển thị, nhưng không dùng để tính toán
        fundSelect.appendChild(option);
      });

      // 👉 Tự động chọn nếu có dữ liệu
      const selectedTicker = selectedTickerFromStorage;
      if (selectedTicker) {
        // Đợi DOM update option xong
        setTimeout(() => {
          fundSelect.value = selectedTicker;
          fundSelect.dispatchEvent(new Event('change'));
          sessionStorage.removeItem('selectedTicker'); // cleanup
        }, 0);
      }

      fundSelect.addEventListener('change', async () => {
        const selected = fundData.find(f => f.ticker === fundSelect.value);
        if (selected) {
          fundNameDisplay.textContent = selected.name;
          currentId.textContent = selected.id;
          
          // Lấy opening_avg_price hôm nay + chi phí vốn (đã cộng)
          try {
            // Ưu tiên dùng API nav_management (public)
            let openingPrice = Number(selected.current_nav); // Giữ lại cho hiển thị, nhưng không dùng để tính toán
            let capitalCostPercent = 0;
            let finalPrice = null; // chỉ gán khi đã cộng chi phí vốn

            // Thử JSON nav_management trước
            try {
              const nmJson = await fetch('/nav_management/api/opening_price_today', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
                body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { fund_id: selected.id } })
              });
              if (nmJson.ok) {
                const r = await nmJson.json();
                if (r && r.result && r.result.success) {
                  const d = r.result.data || {};
                  openingPrice = Number(d.opening_avg_price || openingPrice);
                  if (d.opening_price_with_capital_cost != null) {
                    finalPrice = Number(d.opening_price_with_capital_cost);
                    capitalCostPercent = Number(d.capital_cost_percent || 0);
                  }
                }
              }
            } catch (_) {}

            // Fallback HTTP GET nếu JSON thất bại
            if (!finalPrice || finalPrice <= 0) {
              try {
                const nmHttp = await fetch(`/nav_management/api/opening_price_today_http?fund_id=${encodeURIComponent(selected.id)}`);
                if (nmHttp.ok) {
                  const j = await nmHttp.json();
                  if (j && j.success) {
                    const d = j.data || {};
                    openingPrice = Number(d.opening_avg_price || openingPrice);
                    if (d.opening_price_with_capital_cost != null) {
                      finalPrice = Number(d.opening_price_with_capital_cost);
                      capitalCostPercent = Number(d.capital_cost_percent || 0);
                    }
                  }
                }
              } catch (_) {}
            }

            // Nếu chưa có finalPrice → cộng chi phí vốn từ nav_management fund_config
            if (!finalPrice || finalPrice <= 0) {
              try {
                const configResponse = await fetch('/nav_management/api/fund_config', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                  credentials: 'same-origin',
                  body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { fund_id: selected.id } })
                });
                const configResult = await configResponse.json();
                if (configResult && configResult.result && configResult.result.success) {
                  capitalCostPercent = Number(configResult.result.data.capital_cost_percent || 0);
                  finalPrice = openingPrice * (1 + capitalCostPercent / 100);
                }
              } catch (_) {}
            }

            // Cuối cùng, đảm bảo MROUND(step=50) và render
            finalPrice = Math.round(Number((finalPrice != null ? finalPrice : openingPrice)) / 50) * 50;
            navDisplay.textContent = finalPrice.toLocaleString('vi-VN') + 'đ';

            // Lưu giá trị vào global
            window.currentNavPrice = finalPrice;
            window.currentNavBase = openingPrice;
            window.capitalCostPercent = capitalCostPercent;
            
          } catch (error) {
            console.error('Lỗi lấy dữ liệu NAV và chi phí vốn:', error);
            // Fallback về giá NAV hiện tại của fund
            const fallbackPrice = Number(selected.current_nav); // Giữ lại cho hiển thị, nhưng không dùng để tính toán
            navDisplay.textContent = fallbackPrice.toLocaleString('vi-VN') + 'đ';
            
            // Lưu giá trị fallback vào biến global
            window.currentNavPrice = fallbackPrice;
            window.currentNavBase = fallbackPrice;
            window.capitalCostPercent = 0;
          }

          // Reset số cổ phiếu về 0
          const shareInput = document.getElementById('share-quantity-input');
          if (shareInput) {
            shareInput.value = '';
            shareInput.dispatchEvent(new Event('input')); // Gọi lại tính toán nếu cần
          }

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

// Xử lý nút thanh toán
function initPaymentButton() {
  const paymentBtn = document.getElementById('payment-btn');
  const backBtn = document.getElementById('back-btn');
  const fundSelect = document.getElementById('fund-select');
  const amountInput = document.getElementById('amount-input');

  // Kiểm tra lãi/lỗ và enable/disable button
  function checkProfitabilityAndUpdateButton() {
    const selectedOption = fundSelect.options[fundSelect.selectedIndex];
    const fundId = selectedOption.dataset.id;
    const investmentAmountInput = document.getElementById('investment-amount-input');
    const shareQuantityInput = document.getElementById('share-quantity-input');
    
    // Lấy số tiền từ investment amount input hoặc tính từ share quantity
    let amount = parseFloat(investmentAmountInput.value.replace(/[^0-9]/g, "")) || 0;
    if (amount === 0) {
      const shares = parseFloat(shareQuantityInput.value) || 0;
      const nav = window.currentNavPrice || 0;
      amount = shares * nav;
    }
    
    if (!fundId || amount < 1000000) {
      paymentBtn.disabled = true;
      paymentBtn.style.opacity = '0.5';
      return;
    }
    
    // Lấy thông tin lãi suất và kiểm tra lãi/lỗ
    const termSelect = document.getElementById('term-select');
    const selectedTermOption = termSelect.options[termSelect.selectedIndex];
    const months = parseInt(selectedTermOption.value, 10) || 0;
    const rate = parseFloat(selectedTermOption.dataset.rate) || 0;
    
    if (months === 0 || rate === 0) {
      paymentBtn.disabled = true;
      paymentBtn.style.opacity = '0.5';
      return;
    }
    
    // Tính toán lãi/lỗ dựa trên chặn trên/dưới
    checkProfitability(fundId, amount, months, rate);
  }

  // Kiểm tra lãi/lỗ dựa trên chặn trên/dưới
  async function checkProfitability(fundId, amount, months, rate) {
    try {
      // Lấy cấu hình chặn trên/dưới từ nav_management
      const capResponse = await fetch('/nav_management/api/cap_config');
      const capData = await capResponse.json();
      
      if (!capData.success || !capData.cap_upper || !capData.cap_lower) {
        console.warn('Không thể lấy cấu hình chặn trên/dưới, cho phép thanh toán');
        paymentBtn.disabled = false;
        paymentBtn.style.opacity = '1';
        return;
      }
      
      // Lấy NAV hiện tại của quỹ
      const nav = window.currentNavPrice || 0;
      if (nav <= 0) {
        console.warn('Không có NAV hiện tại, cho phép thanh toán');
        paymentBtn.disabled = false;
        paymentBtn.style.opacity = '1';
        return;
      }
      
      // Số ngày theo kỳ hạn
      const today = new Date();
      const maturityDate = new Date(today);
      maturityDate.setMonth(today.getMonth() + months);
      const days = Math.ceil((maturityDate - today) / (1000 * 60 * 60 * 24));
      
      // Đọc số lượng CCQ từ input (fallback 1 nếu thiếu)
      const qtyInput = document.getElementById('share-quantity-input');
      const units = qtyInput ? (parseFloat(qtyInput.value) || 0) : 0;
      
      // Giá trị mua/bán theo Excel: amount * rate/365 * days + amount
      const finalValue = amount * (rate / 100) / 365 * days + amount;
      
      // Giá bán 1 = ROUND(Giá trị mua/bán / Số lượng CCQ, 0)
      const price1 = (units > 0) ? Math.round(finalValue / units) : 0;
      
      // Giá bán 2 = MROUND(giá 1, 50)
      const price2 = price1 ? (Math.round(price1 / 50) * 50) : 0;
      
      // Tính lãi suất suy ra từ giá bán 2 (công thức Excel: =(T9/J9-1)*365/G9)
      // Chuyển đổi từ lãi suất ngày sang lãi suất năm
      // Tính số ngày thực tế từ ngày hiện tại + kỳ hạn
      const r_new = (nav > 0 && days > 0 && price2 > 0) ? ((price2 / nav - 1) * 365 / days * 100) : 0;
      
      // Tính chênh lệch lãi suất
      const delta = r_new - rate;
      
      // Kiểm tra lãi/lỗ
      const capUpper = parseFloat(capData.cap_upper);
      const capLower = parseFloat(capData.cap_lower);
      
      const isProfitable = delta >= capLower && delta <= capUpper;
      
      console.log(`📊 Kiểm tra lãi/lỗ:`);
      console.log(`   - NAV: ${nav}`);
      console.log(`   - Lãi suất gốc: ${rate}%`);
      console.log(`   - Giá bán 1: ${price1}`);
      console.log(`   - Giá bán 2: ${price2}`);
      console.log(`   - Lãi suất mới: ${r_new}%`);
      console.log(`   - Chênh lệch: ${delta}%`);
      console.log(`   - Chặn trên: ${capUpper}%, Chặn dưới: ${capLower}%`);
      console.log(`   - Có lãi: ${isProfitable}`);
      
      if (isProfitable) {
        paymentBtn.disabled = false;
        paymentBtn.style.opacity = '1';
        paymentBtn.title = 'Đầu tư có lãi - Có thể thanh toán';
      } else {
        paymentBtn.disabled = true;
        paymentBtn.style.opacity = '0.5';
        paymentBtn.title = `Đầu tư không có lãi (chênh lệch: ${delta.toFixed(2)}% ngoài khoảng ${capLower}%-${capUpper}%)`;
      }
      
    } catch (error) {
      console.error('Lỗi kiểm tra lãi/lỗ:', error);
      // Nếu có lỗi, cho phép thanh toán để không block user
      paymentBtn.disabled = false;
      paymentBtn.style.opacity = '1';
    }
  }

  paymentBtn.addEventListener('click', () => {
    const fundName = document.getElementById('summary-fund-name').textContent;
    const units = document.getElementById('summary-units').textContent;
    const investmentAmount = document.getElementById('summary-investment-amount').textContent.replace(/[^0-9]/g, '');
    const amount = document.getElementById('summary-amount').textContent.replace(/[^0-9]/g, '');
    const totalAmount = document.getElementById('summary-total').textContent.replace(/[^0-9]/g, '');
    const selectedOption = fundSelect.options[fundSelect.selectedIndex];
    const fundId = selectedOption.dataset.id;
    const fundSelectedText = selectedOption?.textContent.trim();

    if (!fundSelectedText || fundSelect.selectedIndex === 0) {
      Swal.fire({
        title: "Thiếu thông tin!",
        text: "Vui lòng chọn sản phẩm chứng chỉ quỹ để tiếp tục.",
        icon: "warning",
        confirmButtonText: "OK",
        confirmButtonColor: "#36A2EB"
      });
      return;
    }

    // Sử dụng giá trị lệnh thực tế từ form (đã được MROUND 50)
    let finalAmount = parseInt(amount.replace(/[^0-9]/g, '')) || 0;
    if (finalAmount === 0) {
      // Fallback: sử dụng investment amount nếu amount input trống
      finalAmount = parseInt(investmentAmount.replace(/[^0-9]/g, '')) || 0;
    }

    if (finalAmount <= 0) {
      Swal.fire({
        title: "Thiếu thông tin!",
        text: "Vui lòng nhập số tiền đầu tư hoặc số lượng CCQ hợp lệ để tiếp tục.",
        icon: "warning",
        confirmButtonText: "OK",
        confirmButtonColor: "#36A2EB"
      });
      return;
    }

    if (finalAmount < 1000000) {
      Swal.fire({
        title: "Số tiền quá thấp!",
        text: "Số tiền đầu tư tối thiểu là 1,000,000đ.",
        icon: "warning",
        confirmButtonText: "OK",
        confirmButtonColor: "#36A2EB"
      });
      return;
    }

    // Kiểm tra trạng thái lệnh từ widget
    const profitStatus = document.getElementById('profit-status');
    const isLossOrder = profitStatus && profitStatus.textContent.includes('❌');
    
    if (isLossOrder) {
      Swal.fire({
        title: "Lệnh không có lãi!",
        text: "Lệnh này không có lãi theo quy định. Vui lòng điều chỉnh số tiền đầu tư hoặc kỳ hạn.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#dc3545"
      });
      return;
    }

    // Nếu đang chọn kỳ hạn là "Tùy chỉnh", kiểm tra khoảng ngày
    const termValue = document.getElementById('term-select')?.value;
    if (!termValue) {
      Swal.fire({
        title: "Chưa chọn kỳ hạn!",
        text: "Vui lòng chọn kỳ hạn đầu tư.",
        icon: "warning",
        confirmButtonText: "OK",
        confirmButtonColor: "#36A2EB"
      });
      return; // 🛑 Dừng lại nếu chưa chọn
    }

    sessionStorage.setItem('selectedFundId', fundId);
    sessionStorage.setItem('selectedFundName', fundName);
    sessionStorage.setItem('selectedUnits', units);
    sessionStorage.setItem('selectedInvestmentAmount', investmentAmount);
    sessionStorage.setItem('selectedAmount', amount);
    sessionStorage.setItem('selectedTotalAmount', totalAmount);

    // Lưu kỳ hạn và lãi suất đã chọn để hiển thị/submit ở bước sau
    const termSelect = document.getElementById('term-select');
    const selectedTerm = termSelect ? parseInt(termSelect.value || '0', 10) : 0;
    const selectedRate = termSelect ? parseFloat(termSelect.options[termSelect.selectedIndex]?.dataset?.rate || '0') : 0;
    sessionStorage.setItem('selected_term_months', String(selectedTerm));
    sessionStorage.setItem('selected_interest_rate', String(selectedRate));

    // ✅ Mở điều khoản
//    const termsModal = new bootstrap.Modal(document.getElementById('termsModal'));

    // ✅ Hiển thị modal ký tên
    const signatureModal = new bootstrap.Modal(document.getElementById('signatureModal'));

    signatureModal.show();
    // window.location.href = '/fund_confirm';
  });

  backBtn.addEventListener('click', () => {
    window.location.href = '/fund_widget';
  });

  // Thêm event listeners để kiểm tra lãi/lỗ khi có thay đổi
  fundSelect.addEventListener('change', checkProfitabilityAndUpdateButton);
  amountInput.addEventListener('input', checkProfitabilityAndUpdateButton);
  
  // Thêm event listener cho investment amount input
  const investmentAmountInput = document.getElementById('investment-amount-input');
  if (investmentAmountInput) {
    investmentAmountInput.addEventListener('input', checkProfitabilityAndUpdateButton);
  }
  
  // Thêm event listener cho share quantity input
  const shareQuantityInput = document.getElementById('share-quantity-input');
  if (shareQuantityInput) {
    shareQuantityInput.addEventListener('input', checkProfitabilityAndUpdateButton);
  }
  
  // Thêm event listener cho term select
  const termSelect = document.getElementById('term-select');
  if (termSelect) {
    termSelect.addEventListener('change', checkProfitabilityAndUpdateButton);
  }
  
  // Kiểm tra lần đầu khi trang load
  setTimeout(checkProfitabilityAndUpdateButton, 1000);
}

//Tính toán phí mua
//function initFeeCalculation() {
//  const amountInput = document.getElementById('amount-input');
//  const feeInput = document.getElementById('fee-input');
//  const summaryAmount = document.getElementById('summary-amount');
//  const summaryFee = document.getElementById('summary-fee');
//  const summaryTotal = document.getElementById('summary-total');
//
//  amountInput.addEventListener('input', () => {
//      // Lấy số gốc không có dấu
//      let raw = amountInput.value.replace(/[^0-9]/g, '');
//
//      // Giới hạn tối đa 12 chữ số
//      if (raw.length > 12) {
//        raw = raw.slice(0, 12);
//      }
//
//      // Lưu lại vào dataset
//      amountInput.dataset.raw = raw;
//
//      // Format lại input để hiển thị
//      amountInput.value = raw ? Number(raw).toLocaleString('vi-VN') : '';
//
//      // Tính toán phí
//      const amount = parseInt(raw || '0');
//      let fee = 0;
//
//      if (amount < 10000000) fee = amount * 0.003;
//      else if (amount < 20000000) fee = amount * 0.002;
//      else fee = amount * 0.001;
//
//      const total = amount + fee;
//      feeInput.value = Math.floor(fee).toLocaleString('vi-VN') + 'đ';
//      summaryAmount.textContent = amount.toLocaleString('vi-VN') + 'đ';
//      summaryFee.textContent = Math.floor(fee).toLocaleString('vi-VN') + 'đ';
//      summaryTotal.textContent = Math.floor(total).toLocaleString('vi-VN') + 'đ';
//    });
//}

// Xử lý tính toán số lượng CCQ từ số tiền đầu tư
function initInvestmentAmountCalculation() {
  const investmentAmountInput = document.getElementById('investment-amount-input');
  const shareQuantityInput = document.getElementById('share-quantity-input');
  const amountInput = document.getElementById('amount-input');
  const feeInput = document.getElementById('fee-input');
  const maturityPriceDisplay = document.getElementById('maturity-price');

  const summaryInvestmentAmount = document.getElementById('summary-investment-amount');
  const summaryAmount = document.getElementById('summary-amount');
  const summaryFee = document.getElementById('summary-fee');
  const summaryTotal = document.getElementById('summary-total');
  const summaryUnits = document.getElementById('summary-units');

  // Flag để tránh vòng lặp vô hạn
  let isUpdatingFromInvestment = false;

  investmentAmountInput.addEventListener('input', () => {
    if (isUpdatingFromInvestment) return;
    isUpdatingFromInvestment = true;
    // Lấy số tiền đầu tư (raw number, không dấu)
    let rawAmount = investmentAmountInput.value.replace(/[^0-9]/g, '');

    // Giới hạn cứng 12 chữ số
    if (rawAmount.length > 12) {
      rawAmount = rawAmount.slice(0, 12);
      investmentAmountInput.value = rawAmount;
    }

    const investmentAmount = parseFloat(rawAmount || '0');

    // Tính số lượng CCQ từ số tiền đầu tư
    const nav = window.currentNavPrice || 0;
    
    if (nav > 0 && investmentAmount > 0) {
      // Tính số lượng CCQ = Số tiền đầu tư / Giá CCQ
      const shares = Math.floor(investmentAmount / nav);
      
      // Cập nhật số lượng CCQ
      shareQuantityInput.value = shares;
      
      // Tính số tiền mua CCQ thực tế (MROUND 50)
      const actualAmount = Math.round(investmentAmount / 50) * 50;
      const formattedAmount = actualAmount.toLocaleString('vi-VN');
      amountInput.value = formattedAmount;

      // Tính phí dựa trên actualAmount thực tế
      let fee = 0;
      if (actualAmount < 10000000) fee = actualAmount * 0.003;
      else if (actualAmount < 20000000) fee = actualAmount * 0.002;
      else fee = actualAmount * 0.001;

      const total = actualAmount + fee;

      // Summary MROUND 50
      const investmentAmountRounded = Math.round(investmentAmount / 50) * 50;
      const actualAmountRounded = Math.round(actualAmount / 50) * 50;
      const feeRounded = Math.round(fee / 50) * 50;
      const totalRounded = Math.round(total / 50) * 50;
      
      feeInput.value = feeRounded.toLocaleString('vi-VN') + 'đ';
      summaryInvestmentAmount.textContent = investmentAmountRounded.toLocaleString('vi-VN') + 'đ';
      summaryAmount.textContent = actualAmountRounded.toLocaleString('vi-VN') + 'đ';
      summaryFee.textContent = feeRounded.toLocaleString('vi-VN') + 'đ';
      summaryTotal.textContent = totalRounded.toLocaleString('vi-VN') + 'đ';
      summaryUnits.textContent = shares;

      // Tính giá mua khi đáo hạn
      calculateMaturityPrice(shares, nav);
    } else {
      // Reset các giá trị nếu không có dữ liệu hợp lệ
      shareQuantityInput.value = '';
      amountInput.value = '';
      feeInput.value = '0đ';
      summaryInvestmentAmount.textContent = '0đ';
      summaryAmount.textContent = '0đ';
      summaryFee.textContent = '0đ';
      summaryTotal.textContent = '0đ';
      summaryUnits.textContent = '0';
      maturityPriceDisplay.textContent = '...';
    }
    isUpdatingFromInvestment = false;
  });
}

// Cập nhật hiển thị giá trị đáo hạn với chỉ báo trực quan
function updateFinalValueDisplay(finalValue, isProfitable, delta = 0) {
  const finalValueField = document.getElementById('final-value');
  const profitIcon = document.getElementById('profit-icon');
  const lossIcon = document.getElementById('loss-icon');
  const profitStatus = document.getElementById('profit-status');
  const paymentBtn = document.getElementById('payment-btn');

  // Hiển thị giá trị
  finalValueField.textContent = finalValue.toLocaleString("vi-VN") + " đ";

  // Ẩn tất cả icon trước
  profitIcon.style.display = 'none';
  lossIcon.style.display = 'none';

  if (isProfitable === true) {
    // Lệnh có lãi - màu xanh
    finalValueField.style.color = '#28a745';
    finalValueField.style.backgroundColor = '#d4edda';
    finalValueField.style.borderColor = '#c3e6cb';
    
    // Hiển thị icon lãi
    profitIcon.style.display = 'inline-block';
    profitIcon.className = 'badge bg-success';
    profitIcon.textContent = '📈';
    
    // Hiển thị trạng thái
    profitStatus.textContent = `✅ Lệnh có lãi (chênh lệch: +${delta.toFixed(2)}%)`;
    profitStatus.style.color = '#28a745';
    
    // Enable button thanh toán
    if (paymentBtn) {
      paymentBtn.disabled = false;
      paymentBtn.style.opacity = '1';
      paymentBtn.className = 'btn btn-pill btn-buy';
      paymentBtn.title = 'Đầu tư có lãi - Có thể thanh toán';
    }
  } else if (isProfitable === false) {
    // Lệnh không có lãi - màu đỏ
    finalValueField.style.color = '#dc3545';
    finalValueField.style.backgroundColor = '#f8d7da';
    finalValueField.style.borderColor = '#f5c6cb';
    
    // Hiển thị icon lỗ
    lossIcon.style.display = 'inline-block';
    lossIcon.className = 'badge bg-danger';
    lossIcon.textContent = '📉';
    
    // Hiển thị trạng thái
    profitStatus.textContent = `❌ Lệnh không có lãi (chênh lệch: ${delta.toFixed(2)}% ngoài khoảng cho phép)`;
    profitStatus.style.color = '#dc3545';
    
    // Disable button thanh toán
    if (paymentBtn) {
      paymentBtn.disabled = true;
      paymentBtn.style.opacity = '0.5';
      paymentBtn.className = 'btn btn-pill btn-secondary';
      paymentBtn.title = 'Đầu tư không có lãi - Không thể thanh toán';
    }
  } else {
    // Trạng thái không xác định - màu xám
    finalValueField.style.color = '#6c757d';
    finalValueField.style.backgroundColor = '#f8f9fa';
    finalValueField.style.borderColor = '#dee2e6';
    
    // Ẩn tất cả icon
    profitIcon.style.display = 'none';
    lossIcon.style.display = 'none';
    
    // Hiển thị trạng thái
    profitStatus.textContent = '⚠️ Không thể kiểm tra lãi/lỗ';
    profitStatus.style.color = '#6c757d';
    
    // Cho phép thanh toán khi không xác định được
    if (paymentBtn) {
      paymentBtn.disabled = false;
      paymentBtn.style.opacity = '1';
      paymentBtn.className = 'btn btn-pill btn-buy';
      paymentBtn.title = 'Không thể kiểm tra lãi/lỗ - Cho phép thanh toán';
    }
  }
}

// Tính giá mua khi đáo hạn theo công thức từ nav_management
function calculateMaturityPrice(shares, nav) {
  const maturityPriceDisplay = document.getElementById('maturity-price');
  const termSelect = document.getElementById('term-select');
  const selectedOption = termSelect.options[termSelect.selectedIndex];
  const months = parseInt(selectedOption.value, 10) || 0;
  const rate = parseFloat(selectedOption.dataset.rate) || 0;

  if (months > 0 && rate > 0 && shares > 0) {
    // Công thức từ nav_management: Giá trị bán = Giá trị lệnh * lãi suất / 365 * Số ngày + Giá trị lệnh
    // Tính số ngày thực tế từ ngày hiện tại + kỳ hạn
    const today = new Date();
    const maturityDate = new Date(today);
    maturityDate.setMonth(today.getMonth() + months);
    const days = Math.ceil((maturityDate - today) / (1000 * 60 * 60 * 24));
    
    // Sử dụng giá trị lệnh thực tế từ form
    const actualAmountInput = document.getElementById('amount-input');
    let amount = 0;
    
    if (actualAmountInput && actualAmountInput.value) {
      amount = parseFloat(actualAmountInput.value.replace(/[^0-9]/g, "")) || 0;
    }
    
    // Fallback: tính từ shares * nav nếu không có actualAmount
    if (amount === 0) {
      amount = shares * nav;
    }
    
    // Giá trị bán = amount * (rate / 100) / 365 * days + amount
    const sellValue = amount * (rate / 100) / 365 * days + amount;
    
    // Giá bán 1 = ROUND(Giá trị bán / Số lượng CCQ, 0)
    const price1 = Math.round(sellValue / shares);
    
    // Giá bán 2 = MROUND(Giá bán 1, 50)
    const price2 = Math.round(price1 / 50) * 50;
    
    maturityPriceDisplay.textContent = price2.toLocaleString('vi-VN') + 'đ';
  } else {
    maturityPriceDisplay.textContent = '...';
  }
}

// xử lý nhập số cổ phiếu và tính toán tổng chi phí dựa trên NAV và biểu phí, tính phí mua
function initShareQuantityCalculation() {
  const shareInput = document.getElementById('share-quantity-input');
  const investmentAmountInput = document.getElementById('investment-amount-input');
  const amountInput = document.getElementById('amount-input');
  const feeInput = document.getElementById('fee-input');
  const maturityPriceDisplay = document.getElementById('maturity-price');

  const summaryInvestmentAmount = document.getElementById('summary-investment-amount');
  const summaryAmount = document.getElementById('summary-amount');
  const summaryFee = document.getElementById('summary-fee');
  const summaryTotal = document.getElementById('summary-total');
  const summaryUnits = document.getElementById('summary-units');

  // Flag để tránh vòng lặp vô hạn
  let isUpdatingFromShares = false;

  shareInput.addEventListener('input', () => {
    if (isUpdatingFromShares) return;
    isUpdatingFromShares = true;
    // Lấy số lượng CCQ (raw number, không dấu)
    let rawShares = shareInput.value.replace(/[^0-9]/g, '');

    // Giới hạn cứng 6 chữ số
    if (rawShares.length > 6) {
      rawShares = rawShares.slice(0, 6);
      shareInput.value = rawShares;
    }

    const shares = parseFloat(rawShares || '0');

    // Tính số tiền đầu tư từ số lượng CCQ
    const nav = window.currentNavPrice || 0;
    
    if (nav > 0 && shares > 0) {
      // Tính số tiền đầu tư = Số lượng CCQ * Giá CCQ
      const investmentAmount = shares * nav;
      
      // Cập nhật số tiền đầu tư
      investmentAmountInput.value = investmentAmount.toLocaleString('vi-VN');
      
      // Tính số tiền mua CCQ thực tế (MROUND 50)
      const actualAmount = Math.round(investmentAmount / 50) * 50;
      const formattedAmount = actualAmount.toLocaleString('vi-VN');
      amountInput.value = formattedAmount;

      // Tính phí dựa trên actualAmount thực tế
      let fee = 0;
      if (actualAmount < 10000000) fee = actualAmount * 0.003;
      else if (actualAmount < 20000000) fee = actualAmount * 0.002;
      else fee = actualAmount * 0.001;

      const total = actualAmount + fee;

      // Summary MROUND 50
      const investmentAmountRounded = Math.round(investmentAmount / 50) * 50;
      const actualAmountRounded = Math.round(actualAmount / 50) * 50;
      const feeRounded = Math.round(fee / 50) * 50;
      const totalRounded = Math.round(total / 50) * 50;
      
      feeInput.value = feeRounded.toLocaleString('vi-VN') + 'đ';
      summaryInvestmentAmount.textContent = investmentAmountRounded.toLocaleString('vi-VN') + 'đ';
      summaryAmount.textContent = actualAmountRounded.toLocaleString('vi-VN') + 'đ';
      summaryFee.textContent = feeRounded.toLocaleString('vi-VN') + 'đ';
      summaryTotal.textContent = totalRounded.toLocaleString('vi-VN') + 'đ';
      summaryUnits.textContent = shares;

      // Tính giá mua khi đáo hạn
      calculateMaturityPrice(shares, nav);
    } else {
      // Reset các giá trị nếu không có dữ liệu hợp lệ
      investmentAmountInput.value = '';
      amountInput.value = '';
      feeInput.value = '0đ';
      summaryInvestmentAmount.textContent = '0đ';
      summaryAmount.textContent = '0đ';
      summaryFee.textContent = '0đ';
      summaryTotal.textContent = '0đ';
      summaryUnits.textContent = '0';
      maturityPriceDisplay.textContent = '...';
    }
    isUpdatingFromShares = false;
  });

  // Thêm validation cho bội số 50
  shareInput.addEventListener('blur', () => {
    let value = parseInt(shareInput.value, 10);

    // Nếu không phải số hợp lệ hoặc <= 0 thì xóa
    if (isNaN(value) || value <= 0) {
      shareInput.value = '';
      shareInput.dispatchEvent(new Event('input'));
      return;
    }

    // Nếu không phải bội số 50 thì cảnh báo và làm tròn tới bội số 50 gần nhất
    if (value % 50 !== 0) {
      if (window.Swal && typeof window.Swal.fire === 'function') {
        window.Swal.fire({
          icon: 'warning',
          title: 'Số lượng không hợp lệ',
          text: 'Số lượng CCQ phải là bội số của 50.',
          confirmButtonText: 'OK'
        });
      }
      value = Math.round(value / 50) * 50;
    }

    // Làm tròn tiếp đến bội số 100 gần nhất nếu cần theo quy định cũ (giữ nhất quán)
    const rounded = Math.round(value / 100) * 100;

    // Chỉ cập nhật và trigger event nếu giá trị thực sự thay đổi
    if (rounded !== value) {
      shareInput.value = String(rounded);
      shareInput.dispatchEvent(new Event('input'));
    } else {
      shareInput.value = String(value);
      shareInput.dispatchEvent(new Event('input'));
    }
  });
}

// Xử lý cập nhật số ccq theo giá tiền. đã bỏ ko sử dụng
function initUnitsCalculation() {
  const amountInput = document.getElementById('amount-input');
  const navDisplay = document.getElementById('current-nav');
  const summaryUnits = document.getElementById('summary-units');

  amountInput.addEventListener('input', () => {
    const amount = parseFloat(amountInput.dataset.raw || '0');
    // Sử dụng giá trị lệnh thực tế từ form thay vì currentNavPrice
    const actualAmountInput = document.getElementById('amount-input');
    let actualAmount = 0;
    
    if (actualAmountInput && actualAmountInput.value) {
      actualAmount = parseFloat(actualAmountInput.value.replace(/[^0-9]/g, "")) || 0;
    }
    
    // Tính units từ actualAmount thực tế
    const units = (actualAmount > 0) ? (actualAmount / (window.currentNavPrice || 1)).toFixed(2) : 0;
    summaryUnits.textContent = units;
  });
}

// Lưu giá trị raw để tính toán
function formatAmountInputWithRaw(inputElement) {
  inputElement.addEventListener('input', () => {
    const raw = inputElement.value.replace(/[^0-9]/g, '');
    inputElement.dataset.raw = raw;  // lưu raw value
    inputElement.value = raw ? Number(raw).toLocaleString('vi-VN') : '';
  });
}


// Xác nhận điều khoản. Đã bỏ ko sử dụng
function initTermsModalActions() {
  const agreeCheckbox = document.getElementById('agreeTermsCheckbox');
  const openSignatureBtn = document.getElementById('open-signature-btn');

  if (!agreeCheckbox || !openSignatureBtn) return;

  openSignatureBtn.addEventListener('click', (e) => {
    if (!agreeCheckbox.checked) {
      e.preventDefault();
      Swal.fire("Bạn chưa đồng ý", "Vui lòng tick vào ô đồng ý điều khoản để tiếp tục.", "warning");
      return;
    }

    // ✅ Hiển thị modal ký tên
    const signatureModal = new bootstrap.Modal(document.getElementById('signatureModal'));
    signatureModal.show();
  });
}

// Edit format của input số CCQ
function initShareQuantityInput() {
  const input = document.getElementById('share-quantity-input');
  if (!input) return;

  // Tạo nút tăng/giảm bội số 50 nếu chưa có
  try {
    const wrapper = input.parentElement;
    if (wrapper && !wrapper.querySelector('.share-input-group')) {
      // Tạo group: [-] [input] [+]
      const group = document.createElement('div');
      group.className = 'share-input-group';
      group.style.display = 'inline-flex';
      group.style.alignItems = 'center';
      group.style.gap = '8px';

      const btnDec = document.createElement('button');
      btnDec.type = 'button';
      btnDec.textContent = '-';
      btnDec.className = 'btn btn-light btn-sm share-stepper';
      btnDec.addEventListener('click', () => {
        const current = parseInt(input.value.replace(/[^0-9]/g, ''), 10) || 0;
        const next = Math.max(0, current - 50);
        input.value = next > 0 ? String(next) : '';
        input.dispatchEvent(new Event('input'));
      });

      const btnInc = document.createElement('button');
      btnInc.type = 'button';
      btnInc.textContent = '+';
      btnInc.className = 'btn btn-light btn-sm share-stepper';
      btnInc.addEventListener('click', () => {
        const current = parseInt(input.value.replace(/[^0-9]/g, ''), 10) || 0;
        const next = current + 50;
        input.value = String(next);
        input.dispatchEvent(new Event('input'));
      });

      // Di chuyển input vào giữa 2 nút
      wrapper.insertBefore(group, input);
      group.appendChild(btnDec);
      group.appendChild(input);
      group.appendChild(btnInc);
      // style input nhỏ gọn
      input.classList.add('text-end');
      input.style.maxWidth = '180px';
    }
  } catch (_) {}

  // Trong lúc nhập: cho nhập nhưng chỉ số
  input.addEventListener('input', () => {
    let value = input.value.replace(/[^0-9]/g, '');
    if (value && parseInt(value, 10) < 0) value = '';
    input.value = value;
  });
}

//Lấy giá trị lãi suất từ cấu hình nav.term.rate
function initInterestRateSelect() {
    const select = document.getElementById('term-select');
    const rateField = document.getElementById('interest-rate');
    if (!select || !rateField) return;

    // Bảng lãi suất fallback theo kỳ hạn (tháng)
  let rateMap = null; // sẽ nạp 1 lần khi focus hoặc khi gọi updateRate lần đầu
  function getRateForMonths(months) {
    if (rateMap && rateMap[String(months)] != null) return parseFloat(rateMap[String(months)]);
    return 0;
  }

    // Hàm cập nhật lãi suất
    async function updateRate() {
      const selectedOption = select.options[select.selectedIndex];
      const months = parseInt(selectedOption.value, 10) || 0;
      let rate = parseFloat(selectedOption.dataset.rate);
      if (Number.isNaN(rate)) {
        try {
          if (!rateMap) {
            const r = await fetch('/nav_management/api/term_rates', { method: 'GET', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            if (r.ok) {
              const j = await r.json();
              if (j && j.success) rateMap = j.rate_map || {};
            }
          }
        } catch (e) {}
        rate = getRateForMonths(months);
        if (!Number.isNaN(rate) && rate) {
          selectedOption.dataset.rate = Number(rate).toFixed(2);
        }
      }
      rateField.textContent = rate ? rate.toFixed(2) + " %" : "...";
      // cập nhật tóm tắt
      const sumTerm = document.getElementById('summary-term');
      const sumInterest = document.getElementById('summary-interest');
      if (sumTerm) sumTerm.textContent = months ? months + ' tháng' : '...';
      if (sumInterest) sumInterest.textContent = rate ? rate.toFixed(2) + ' %' : '...';
    }
    // Gọi ngay lần đầu load
    updateRate();
    // Lắng nghe sự kiện thay đổi select
    select.addEventListener('change', updateRate);
}

// Tính giá trị ước tính user nhận được
function initInvestmentCalculator() {
    const select = document.getElementById('term-select');
    const rateField = document.getElementById('interest-rate');
    const investmentAmountInput = document.getElementById('investment-amount-input');
    const shareQuantityInput = document.getElementById('share-quantity-input');
    const finalValueField = document.getElementById('final-value');

    if (!select || !rateField || !investmentAmountInput || !finalValueField) return;

    async function calculate() {
        const selectedOption = select.options[select.selectedIndex];
        const months = parseInt(selectedOption.value, 10) || 0;
        let rate = parseFloat(selectedOption.dataset.rate);
        
        // Sử dụng dữ liệu từ nav_management nếu có
        if (Number.isNaN(rate) && window.termRateMap) {
            rate = parseFloat(window.termRateMap[String(months)]) || 0;
            console.log(`📊 Sử dụng lãi suất từ nav_management: ${months} tháng = ${rate}%`);
        }
        
        // Fallback cuối cùng nếu vẫn không có dữ liệu
        if (Number.isNaN(rate) || rate === 0) {
            const fallbackMap = {
                1: 4.80, 2: 5.80, 3: 6.20, 4: 6.50, 5: 7.00, 6: 7.70,
                7: 8.00, 8: 8.50, 9: 8.60, 10: 8.70, 11: 8.90, 12: 9.1,
            };
            rate = fallbackMap[months] || 0;
        }

        // Lấy số tiền từ investment amount input hoặc tính từ share quantity
        let amount = parseFloat(investmentAmountInput.value.replace(/[^0-9]/g, "")) || 0;
        if (amount === 0) {
            // Lấy shareQuantityInput từ DOM thay vì sử dụng biến đã khai báo
            const shareQuantityInput = document.getElementById('share-quantity-input');
            const shares = parseFloat(shareQuantityInput.value) || 0;
            const nav = window.currentNavPrice || 0;
            amount = shares * nav;
        }
        
        // Sử dụng giá trị lệnh thực tế từ form thay vì current nav
        const actualAmountInput = document.getElementById('amount-input');
        if (actualAmountInput && actualAmountInput.value) {
            const actualAmount = parseFloat(actualAmountInput.value.replace(/[^0-9]/g, "")) || 0;
            if (actualAmount > 0) {
                amount = actualAmount; // Sử dụng giá trị lệnh đã tính toán
            }
        }

        if (amount < 1000000 || months === 0 || rate === 0) {
            finalValueField.textContent = "...";
            return;
        }

        try {
            // Lấy cấu hình chặn trên/dưới từ nav_management
            const capResponse = await fetch('/nav_management/api/cap_config');
            const capData = await capResponse.json();
            
            // Lấy NAV hiện tại của quỹ
            const currentNav = window.currentNavPrice || 0;
            
            let finalValue = amount * (1 + rate / 100);
            let isProfitable = true;
            let delta = 0;
            
            if (capData.success && capData.cap_upper && capData.cap_lower && currentNav > 0) {
                // Công thức từ nav_management: Giá trị bán = Giá trị lệnh * lãi suất / 365 * Số ngày + Giá trị lệnh
                // Tính số ngày thực tế từ ngày hiện tại + kỳ hạn
                const today = new Date();
                const maturityDate = new Date(today);
                maturityDate.setMonth(today.getMonth() + months);
                const days = Math.ceil((maturityDate - today) / (1000 * 60 * 60 * 24));
                
                // Giá trị bán = amount * (rate / 100) / 365 * days + amount
                const sellValue = amount * (rate / 100) / 365 * days + amount;
                
                // Giá bán 1 = ROUND(Giá trị bán / Số lượng CCQ, 0)
                // Sử dụng số lượng CCQ thực tế từ form thay vì tính từ currentNav
                const shareQuantityInput = document.getElementById('share-quantity-input');
                let shares = parseFloat(shareQuantityInput.value) || 0;
                let price1;
                
                if (shares > 0) {
                    price1 = Math.round(sellValue / shares);
                } else {
                    // Fallback: tính từ currentNav nếu không có shares
                    shares = amount / currentNav;
                    price1 = Math.round(sellValue / shares);
                }
                
                // Giá bán 2 = MROUND(Giá bán 1, 50)
                const price2 = Math.round(price1 / 50) * 50;
                
                // Tính lãi suất suy ra từ giá bán 2 (công thức từ nav_management)
                // LS quy đổi = (Giá bán 2 / Giá mua/bán - 1) * 365 / Số ngày * 100
                // Sử dụng giá mua thực tế từ form thay vì currentNav
                const actualPrice = shares > 0 ? (amount / shares) : currentNav;
                const r_new = (price2 / actualPrice - 1) * 365 / days * 100;
                
                // Tính chênh lệch lãi suất
                delta = r_new - rate;
                
                console.log(`🔍 Debug tính toán lãi/lỗ:`);
                console.log(`   - amount: ${amount}`);
                console.log(`   - shares: ${shares}`);
                console.log(`   - actualPrice: ${actualPrice}`);
                console.log(`   - price2: ${price2}`);
                console.log(`   - r_new: ${r_new}`);
                console.log(`   - rate: ${rate}`);
                console.log(`   - delta: ${delta}`);
                
                // Kiểm tra lãi/lỗ
                const capUpper = parseFloat(capData.cap_upper);
                const capLower = parseFloat(capData.cap_lower);
                
                // Kiểm tra lãi/lỗ dựa trên chênh lệch lãi suất
                isProfitable = delta >= capLower && delta <= capUpper;
                
                console.log(`🔍 Kiểm tra lãi/lỗ:`);
                console.log(`   - capUpper: ${capUpper}`);
                console.log(`   - capLower: ${capLower}`);
                console.log(`   - delta: ${delta}`);
                console.log(`   - isProfitable: ${isProfitable}`);
                
                // Nếu có lãi, sử dụng giá trị đáo hạn thực tế từ công thức nav_management
                if (isProfitable) {
                    // Sử dụng giá trị bán đã tính (sellValue) thay vì công thức đơn giản
                    finalValue = sellValue;
                }
                
                console.log(`🧮 Tính toán giá trị đáo hạn với kiểm tra lãi/lỗ:`);
                console.log(`   - Số tiền đầu tư: ${amount.toLocaleString('vi-VN')} đ`);
                console.log(`   - Giá mua thực tế: ${actualPrice.toLocaleString('vi-VN')} đ`);
                console.log(`   - Số lượng CCQ: ${shares}`);
                console.log(`   - Lãi suất gốc: ${rate}% cho ${months} tháng`);
                console.log(`   - Giá bán 1: ${price1}`);
                console.log(`   - Giá bán 2: ${price2}`);
                console.log(`   - Lãi suất mới: ${r_new}%`);
                console.log(`   - Chênh lệch: ${delta}%`);
                console.log(`   - Chặn trên: ${capUpper}%, Chặn dưới: ${capLower}%`);
                console.log(`   - Có lãi: ${isProfitable}`);
                console.log(`   - Giá trị đáo hạn: ${finalValue.toLocaleString('vi-VN')} đ`);
            } else {
                // Sử dụng công thức từ nav_management ngay cả khi không kiểm tra lãi/lỗ
                const today = new Date();
                const maturityDate = new Date(today);
                maturityDate.setMonth(today.getMonth() + months);
                const days = Math.ceil((maturityDate - today) / (1000 * 60 * 60 * 24));
                
                // Giá trị bán = amount * (rate / 100) / 365 * days + amount
                finalValue = amount * (rate / 100) / 365 * days + amount;
                
                // Không thể kiểm tra lãi/lỗ khi không có dữ liệu cap
                isProfitable = null;
                delta = 0;
                
                console.log(`🧮 Tính toán giá trị đáo hạn (công thức nav_management):`);
                console.log(`   - Số tiền đầu tư: ${amount.toLocaleString('vi-VN')} đ`);
                console.log(`   - Lãi suất: ${rate}% cho ${months} tháng (${days} ngày)`);
                console.log(`   - Công thức: ${amount} × (${rate}/100) / 365 × ${days} + ${amount}`);
                console.log(`   - Kết quả: ${finalValue.toLocaleString('vi-VN')} đ`);
                console.log(`   - Không thể kiểm tra lãi/lỗ: ${isProfitable}`);
            }

            // MROUND 50
            finalValue = Math.round(finalValue / 50) * 50;

            // Định dạng VNĐ với màu sắc và chỉ báo trực quan
            updateFinalValueDisplay(finalValue, isProfitable, delta);

            // Cập nhật giá mua khi đáo hạn
            const investmentAmountInput = document.getElementById('investment-amount-input');
            const investmentAmount = parseFloat(investmentAmountInput.value.replace(/[^0-9]/g, "")) || 0;
            const shareQuantityInputForMaturity = document.getElementById('share-quantity-input');
            const shares = parseFloat(shareQuantityInputForMaturity.value) || 0;
            
            if (shares > 0) {
                calculateMaturityPrice(shares, window.currentNavPrice || 0);
            }
            
        } catch (error) {
            console.error('Lỗi kiểm tra lãi/lỗ:', error);
            // Fallback về tính toán cơ bản
            let finalValue = amount * (1 + rate / 100);
            // MROUND 50
            finalValue = Math.round(finalValue / 50) * 50;
            
            // Hiển thị với trạng thái không xác định
            updateFinalValueDisplay(finalValue, null, 0);
            
            // Reset về trạng thái mặc định
            const finalValueField = document.getElementById('final-value');
            const profitStatus = document.getElementById('profit-status');
            const paymentBtn = document.getElementById('payment-btn');
            
            finalValueField.style.color = '#6c757d';
            finalValueField.style.backgroundColor = '#f8f9fa';
            finalValueField.style.borderColor = '#dee2e6';
            
            profitStatus.textContent = '⚠️ Không thể kiểm tra lãi/lỗ';
            profitStatus.style.color = '#6c757d';
            
            if (paymentBtn) {
              paymentBtn.disabled = false;
              paymentBtn.style.opacity = '1';
              paymentBtn.className = 'btn btn-pill btn-buy';
              paymentBtn.title = 'Không thể kiểm tra lãi/lỗ - Cho phép thanh toán';
            }
        }
    }

    // Event listeners
    select.addEventListener('change', calculate);
    investmentAmountInput.addEventListener('input', calculate);
    shareQuantityInput.addEventListener('input', calculate);

    // Khởi tạo lần đầu
    calculate();
}

// Gọi API ẩn kỳ hạn (sử dụng nav_management)
function initTermSelect() {
  const selectEl = document.getElementById("term-select");
  if (!selectEl) return;

  let calculated = false; // chỉ fetch 1 lần

  selectEl.addEventListener("focus", () => {
    if (calculated) return; // tránh fetch nhiều lần
    calculated = true;

    console.log("🚀 Đang gọi API /api/fund/calc ...");

    fetch("/api/fund/calc", {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    })
      .then(res => {
        console.log("📥 HTTP status:", res.status);
        if (!res.ok) throw new Error("API fund calc lỗi: " + res.status);
        return res.json();
      })
      .then(data => {
        console.log("📥 Dữ liệu từ API fund calc:", data);
        data.forEach(item => {
          const option = selectEl.querySelector(`option[value="${item.month}"]`);
          if (option) {
            if (item.hide) {
              option.style.display = "none"; // Ẩn option
              console.log(`⛔ Ẩn kỳ hạn ${item.month} tháng (diff=${item.difference})`);
            } else {
              option.style.display = "block"; // Hiện option

              // Cập nhật lại data-rate và text hiển thị
              const rateStr = item.interest_rate2.toFixed(2); // giữ 2 số thập phân
              option.dataset.rate = rateStr;

              // Ví dụ: "3 tháng - 6.25%"
              option.textContent = `${item.month} tháng - ${rateStr}%`;

              console.log(`✅ Cập nhật kỳ hạn ${item.month} tháng: ${rateStr}%`);
            }
          }
        });
      })
      .catch(err => {
        console.error("❌ Lỗi khi fetch fund calc:", err);
        // Không cần làm gì thêm vì đã có fallback từ loadTermRates()
      });
  });
}

// Xử lý khi thay đổi kỳ hạn
function handleTermChange(termValue) {
  const termSelect = document.getElementById('term-select');
  const interestRateField = document.getElementById('interest-rate');
  const summaryTerm = document.getElementById('summary-term');
  const summaryInterest = document.getElementById('summary-interest');
  
  if (!termSelect || !termValue) return;
  
  const selectedOption = termSelect.options[termSelect.selectedIndex];
  const interestRate = parseFloat(selectedOption.dataset.rate) || 0;
  
  // Cập nhật hiển thị lãi suất
  if (interestRateField) {
    interestRateField.textContent = interestRate.toFixed(2) + '%';
  }
  
  // Cập nhật summary
  if (summaryTerm) {
    summaryTerm.textContent = `${termValue} tháng`;
  }
  if (summaryInterest) {
    summaryInterest.textContent = interestRate.toFixed(2) + '%';
  }
  
  // Trigger tính toán lại
  const shareInput = document.getElementById('share-quantity-input');
  if (shareInput) {
    shareInput.dispatchEvent(new Event('input'));
  }
  
  // Trigger tính toán giá trị đáo hạn
  const investmentAmountInput = document.getElementById('investment-amount-input');
  if (investmentAmountInput) {
    investmentAmountInput.dispatchEvent(new Event('input'));
  }
}

document.addEventListener("DOMContentLoaded", function () {
    const matchBtn = document.getElementById("match-btn");

    matchBtn.addEventListener("click", async function () {
        try {
            const response = await fetch("/match_transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({})
            });

            const data = await response.json();
            console.log("Kết quả khớp lệnh:", data);

            if (data.success) {
    let html = "<h3>Các cặp đã khớp:</h3><ul style='text-align:left'>";
    data.matched_pairs.forEach(pair => {
        html += `<li>
            ✅ BUY #${pair.buy_id} (NAV=${pair.buy_nav})
            <br/>⇄
            SELL #${pair.sell_id} (NAV=${pair.sell_nav})
        </li><hr/>`;
    });
    html += "</ul>";

              if (data.remaining.buys.length || data.remaining.sells.length) {
                  html += "<h3>Các lệnh chưa khớp:</h3><ul style='text-align:left'>";
                  data.remaining.buys.forEach(b => {
                      html += `<li>❌ BUY #${b.id} (NAV=${b.nav}, amount=${b.amount})</li>`;
                  });
                  data.remaining.sells.forEach(s => {
                      html += `<li>❌ SELL #${s.id} (NAV=${s.nav}, amount=${s.amount})</li>`;
                  });
                  html += "</ul>";
              }
                Swal.fire({
                    icon: "success",
                    title: "Kết quả khớp lệnh",
                    html: html,
                    width: 600,
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: data.message,
                });
            }
        } catch (error) {
            console.error("Fetch error:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi kết nối",
                text: "Có lỗi khi gọi API khớp lệnh!",
            });
        }
    });
});