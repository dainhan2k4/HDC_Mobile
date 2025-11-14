// Helper function để resolve PDF URL (có thể được gọi từ mọi nơi)
function resolvePdfUrl() {
  const fromMeta = document.querySelector('meta[name="contract-pdf-url"]')?.getAttribute('content');
  if (fromMeta) {
    return fromMeta;
  }
  if (window.Contract && window.Contract.pdfUrl) {
    return window.Contract.pdfUrl;
  }
  return '/fund_management/static/src/pdf/terms2.pdf';
}

document.addEventListener('DOMContentLoaded', () => {
  initFundSelect();
  initShareQuantityInput();
  initPaymentButton();
  initDebugButton();
  initFundBuyDebugToggle(); // Thêm init debug toggle

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

// Khởi tạo debug toggle cho fund_buy
function initFundBuyDebugToggle() {
  const debugToggle = document.getElementById('fund-buy-debug-toggle');
  const debugWarning = document.getElementById('fund-buy-debug-warning');
  
  if (!debugToggle) return;
  
  // Load từ localStorage
  const savedDebugMode = localStorage.getItem('fund_buy_debug_mode') === 'true';
  debugToggle.checked = savedDebugMode;
  if (debugWarning) {
    debugWarning.style.display = savedDebugMode ? 'block' : 'none';
  }
  
  // Lắng nghe thay đổi
  debugToggle.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    localStorage.setItem('fund_buy_debug_mode', isEnabled.toString());
    
    if (debugWarning) {
      debugWarning.style.display = isEnabled ? 'block' : 'none';
    }
    
    console.log('[Fund Buy Debug] Debug mode:', isEnabled ? 'ENABLED' : 'DISABLED');
    
    // Trigger lại check profitability để cập nhật button state
    const fundSelect = document.getElementById('fund-select');
    const termSelect = document.getElementById('term-select');
    if (fundSelect && termSelect && fundSelect.selectedIndex > 0) {
      const selectedOption = fundSelect.options[fundSelect.selectedIndex];
      const fundId = selectedOption.dataset.id;
      const selectedTermOption = termSelect.options[termSelect.selectedIndex];
      const months = parseInt(selectedTermOption.value, 10) || 0;
      const rate = parseFloat(selectedTermOption.dataset.rate) || 0;
      
      if (fundId && months > 0 && rate > 0) {
        const investmentAmountInput = document.getElementById('investment-amount-input');
        const shareQuantityInput = document.getElementById('share-quantity-input');
        let amount = parseFloat(investmentAmountInput.value.replace(/[^0-9]/g, "")) || 0;
        if (amount === 0) {
          const shares = parseFloat(shareQuantityInput.value) || 0;
          const nav = window.currentNavPrice || 0;
          amount = shares * nav;
        }
        
        if (amount >= 1000000) {
          checkProfitability(fundId, amount, months, rate);
        }
      }
    }
  });
}

function format_date_today()
{
  const today = new Date();
  const formatted = today.toLocaleDateString("vi-VN"); // ra dạng 25/08/2025
  document.getElementById("today-date").textContent = formatted;
}

// DEBUG: Hiển thị phân tích tính toán đáo hạn và lãi/lỗ
function initDebugButton() {
  const btn = document.getElementById('debug-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    try {
      const fundName = document.getElementById('summary-fund-name')?.textContent || '';
      const termSelect = document.getElementById('term-select');
      const selectedOption = termSelect?.options[termSelect.selectedIndex];
      const months = selectedOption ? (parseInt(selectedOption.value, 10) || 0) : 0;
      let rate = selectedOption ? (parseFloat(selectedOption.dataset.rate) || 0) : 0;

      // Lấy số tiền từ input đã chuẩn hóa (amount-input) hoặc từ investment-amount-input
      const actualAmountInput = document.getElementById('amount-input');
      const investmentAmountInput = document.getElementById('investment-amount-input');
      let amount = 0;
      if (actualAmountInput && actualAmountInput.value) {
        amount = parseFloat(actualAmountInput.value.replace(/[^0-9]/g, '')) || 0;
      }
      if (!amount && investmentAmountInput && investmentAmountInput.value) {
        amount = parseFloat(investmentAmountInput.value.replace(/[^0-9]/g, '')) || 0;
      }

      const shareQuantityInput = document.getElementById('share-quantity-input');
      let shares = parseFloat(shareQuantityInput?.value || '0') || 0;
      const nav = window.currentNavPrice || 0;
      if (!amount && shares > 0 && nav > 0) amount = shares * nav;
      if (amount > 0 && shares === 0 && nav > 0) shares = Math.floor(amount / nav);

      if (amount <= 0 || months === 0 || rate === 0) {
        Swal.fire({ icon: 'warning', title: 'Thiếu dữ liệu', text: 'Vui lòng nhập số tiền/kỳ hạn/lãi suất hợp lệ.' });
        return;
      }

      // Ngày và số ngày kỳ hạn - tính giống Python backend
      const today = new Date();
      const maturityDate = calculateMaturityDate(today, months);
      const days = calculateDaysBetween(today, maturityDate);

      // Lấy giá CCQ tại thời điểm mua (J) từ currentNavPrice
      const pricePerUnit = nav; // J: Giá CCQ tại thời điểm mua
      
      // Lấy phí mua (K) từ fee-input hoặc summary-fee (số tiền tuyệt đối)
      const feeInput = document.getElementById('fee-input');
      const summaryFee = document.getElementById('summary-fee');
      let feeAmount = 0;
      if (feeInput && feeInput.value) {
          feeAmount = parseFloat(feeInput.value.replace(/[^0-9]/g, '')) || 0;
      } else if (summaryFee && summaryFee.textContent) {
          feeAmount = parseFloat(summaryFee.textContent.replace(/[^0-9]/g, '')) || 0;
      }
      
      // L: Giá trị mua = I * J + K (I = shares, J = pricePerUnit, K = feeAmount)
      const purchaseValue = (shares * pricePerUnit) + feeAmount;

      // Giá trị bán 1 (U) theo công thức nav_management
      const sellValue1 = purchaseValue * (rate / 100) / 365 * days + purchaseValue;
      // Giá bán 1 (S) = ROUND(Giá trị bán 1 / Số lượng CCQ, 0)
      const sellPrice1 = shares > 0 ? Math.round(sellValue1 / shares) : 0;
      // Giá bán 2 (T) = MROUND(Giá bán 1, 50)
      const sellPrice2 = sellPrice1 ? (Math.round(sellPrice1 / 50) * 50) : 0;

      // Lấy cap config để kiểm tra lãi/lỗ nếu có
      let capUpper = null, capLower = null, rNew = 0, delta = 0, isProfitable = null;
      try {
        const capResponse = await fetch('/nav_management/api/cap_config');
        const capData = await capResponse.json();
        if (capData && capData.success && days > 0 && sellPrice2 > 0) {
          // J = Giá CCQ tại thời điểm mua = pricePerUnit
          // Lãi suất quy đổi (O) = (Giá bán 2 / Giá mua - 1) * 365 / Số ngày * 100
          rNew = (pricePerUnit > 0) ? ((sellPrice2 / pricePerUnit - 1) * 365 / days * 100) : 0;
          // Chênh lệch lãi suất (Q) = Lãi suất quy đổi - Lãi suất
          delta = rNew - rate;
          capUpper = parseFloat(capData.cap_upper);
          capLower = parseFloat(capData.cap_lower);
          isProfitable = delta >= capLower && delta <= capUpper;
        }
      } catch (_) {}

      const sellValueRounded = Math.round(sellValue1 / 50) * 50;

      const lines = [
        `Quỹ: ${fundName}`,
        `Số tiền đầu tư (amount-input): ${amount.toLocaleString('vi-VN')} đ`,
        `Số lượng CCQ (I): ${shares}`,
        `Giá CCQ tại thời điểm mua (J): ${pricePerUnit.toLocaleString('vi-VN')} đ`,
        `Phí mua (K): ${feeAmount.toLocaleString('vi-VN')} đ`,
        `NAV hiện tại: ${nav.toLocaleString('vi-VN')} đ`,
        `Kỳ hạn: ${months} tháng (~${days} ngày)`,
        `Lãi suất (N): ${rate}%`,
        '',
        '— Công thức chi tiết —',
        `L (Giá trị mua) = I × J + K`,
        `                  = ${shares} × ${pricePerUnit.toLocaleString('vi-VN')} + ${feeAmount.toLocaleString('vi-VN')}`,
        `                  = ${purchaseValue.toLocaleString('vi-VN')} đ`,
        '',
        `U (Giá trị bán 1) = L × N / 365 × G + L`,
        `                  = ${purchaseValue.toLocaleString('vi-VN')} × (${rate}/100) / 365 × ${days} + ${purchaseValue.toLocaleString('vi-VN')}`,
        `                  = ${sellValue1.toLocaleString('vi-VN')} đ`,
        `Giá trị bán 1 (MROUND 50): ${sellValueRounded.toLocaleString('vi-VN')} đ`,
        '',
        `S (Giá bán 1) = ROUND(U / I, 0)`,
        `              = ROUND(${sellValue1.toLocaleString('vi-VN')} / ${shares || 0}, 0) = ${sellPrice1.toLocaleString('vi-VN')} đ/CCQ`,
        `T (Giá bán 2) = MROUND(S, 50) = MROUND(${sellPrice1.toLocaleString('vi-VN')}, 50) = ${sellPrice2.toLocaleString('vi-VN')} đ/CCQ`,
      ];
        if (isProfitable !== null && capUpper !== null && capLower !== null) {
        lines.push(
          '',
          `O (Lãi suất quy đổi) = (T / J - 1) × 365 / G × 100`,
          `                     = (${sellPrice2.toLocaleString('vi-VN')} / ${pricePerUnit.toLocaleString('vi-VN')} - 1) × 365 / ${days} × 100 = ${rNew.toFixed(4)}%`,
          `Q (Chênh lệch lãi suất) = O - N = ${rNew.toFixed(4)}% - ${rate}% = ${delta.toFixed(4)}%`,
          `Ngưỡng: ${capLower}% → ${capUpper}%`,
          `Kết luận: ${isProfitable ? '✅ Trong ngưỡng' : '❌ Ngoài ngưỡng'}`
        );
      } else {
        lines.push('Không đủ dữ liệu cấu hình chặn trên/dưới để kiểm tra lãi/lỗ.');
      }

      Swal.fire({
        icon: 'info',
        title: 'DEBUG tính toán đáo hạn',
        html: `<pre style="text-align:left;white-space:pre-wrap">${lines.join('\n')}</pre>`,
        width: 700
      });
    } catch (err) {
      console.error('DEBUG error', err);
      Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể hiển thị DEBUG.' });
    }
  });
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
  let fundSearch = document.getElementById('fund-search');
  const fundNameDisplay = document.getElementById('summary-fund-name');
  const navDisplay = document.getElementById('current-nav');
  const currentId = document.getElementById('current-id');
  const amountInput = document.getElementById('amount-input');
  const amountDisplay = document.getElementById('summary-amount');

  const selectedTickerFromStorage = sessionStorage.getItem('selectedTicker');

  // Ẩn hẳn dropdown nếu còn hiển thị do cache/template cũ
  try {
    if (fundSelect) {
      fundSelect.style.display = 'none';
      fundSelect.setAttribute('aria-hidden', 'true');
      fundSelect.setAttribute('tabindex', '-1');
    }
  } catch (_) {}

  // Fallback: nếu input tìm kiếm chưa có trong template, tạo động để đảm bảo luôn nhập được
  try {
    if (fundSelect && !fundSearch) {
      const parent = fundSelect.parentElement;
      if (parent) {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'fund-search';
        input.className = 'form-control mb-2';
        input.placeholder = 'Tìm theo tên/mã CCQ...';
        parent.insertBefore(input, fundSelect);
        fundSearch = input;
      }
    }
  } catch (_) {}

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

      // Tìm kiếm realtime nâng cao (autocomplete + danh sách gợi ý giống ô search)
      if (fundSearch) {
        // Tạo suggestion panel
        const panel = document.createElement('div');
        panel.id = 'fund-suggest-panel';
        panel.style.position = 'absolute';
        panel.style.zIndex = '1050';
        panel.style.left = '0';
        panel.style.right = '0';
        panel.style.maxHeight = '280px';
        panel.style.overflowY = 'auto';
        panel.style.background = '#fff';
        panel.style.border = '1px solid #e5e7eb';
        panel.style.borderTop = 'none';
        panel.style.boxShadow = '0 8px 24px rgba(0,0,0,.12)';
        panel.style.display = 'none';

        // wrapper để định vị tuyệt đối theo input
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        fundSearch.parentElement.insertBefore(wrapper, fundSearch);
        wrapper.appendChild(fundSearch);
        wrapper.appendChild(panel);

        let activeIdx = -1; // index đang chọn bằng phím

        const renderPanel = (items) => {
          panel.innerHTML = '';
          activeIdx = -1;
          items.forEach((f, idx) => {
            const row = document.createElement('div');
            row.style.padding = '8px 12px';
            row.style.cursor = 'pointer';
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.gap = '8px';
            row.onmouseenter = () => highlight(idx);
            row.onclick = () => choose(f);

            const badge = document.createElement('span');
            badge.textContent = f.ticker;
            badge.style.minWidth = '56px';
            badge.style.textAlign = 'center';
            badge.style.padding = '2px 8px';
            badge.style.borderRadius = '999px';
            badge.style.background = '#f3f4f6';
            badge.style.fontWeight = '600';

            const name = document.createElement('div');
            name.textContent = f.name || '';
            name.style.flex = '1';
            name.style.whiteSpace = 'nowrap';
            name.style.overflow = 'hidden';
            name.style.textOverflow = 'ellipsis';

            const price = document.createElement('div');
            price.textContent = (Number(f.current_nav || 0)).toLocaleString('vi-VN');
            price.style.color = '#64748b';

            row.appendChild(badge);
            row.appendChild(name);
            row.appendChild(price);
            panel.appendChild(row);
          });
          panel.style.display = items.length ? 'block' : 'none';
        };

        const highlight = (idx) => {
          const children = Array.from(panel.children);
          children.forEach((el, i) => {
            el.style.background = i === idx ? '#f1f5f9' : '#fff';
          });
          activeIdx = idx;
        };

        const choose = (fund) => {
          // set select & trigger change
          fundSelect.value = fund.ticker;
          fundSelect.dispatchEvent(new Event('change'));
          if (fundSearch) {
            fundSearch.value = `${fund.name} (${fund.ticker})`;
          }
          panel.style.display = 'none';
        };

        const doFilter = () => {
          const q = (fundSearch.value || '').trim().toLowerCase();
          const source = fundData;
          const matches = (q ? source
            .filter(f => (f.name || '').toLowerCase().includes(q) || (f.ticker || '').toLowerCase().includes(q))
            : source)
            .slice(0, 10);
          renderPanel(matches);
          if (!q && matches.length === 0) panel.style.display = 'none';
        };

        fundSearch.addEventListener('input', doFilter);
        fundSearch.addEventListener('keydown', (e) => {
          const visible = panel.style.display !== 'none';
          if (!visible) return;
          const children = Array.from(panel.children);
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlight(Math.min(children.length - 1, activeIdx + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlight(Math.max(0, activeIdx - 1));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIdx >= 0 && children[activeIdx]) {
              children[activeIdx].click();
            } else {
              const matches = fundData
                .filter(f => (f.name || '').toLowerCase().includes((fundSearch.value||'').toLowerCase()) || (f.ticker||'').toLowerCase().includes((fundSearch.value||'').toLowerCase()))
                .slice(0,1);
              if (matches[0]) choose(matches[0]);
            }
          } else if (e.key === 'Escape') {
            panel.style.display = 'none';
          }
        });

        document.addEventListener('click', (ev) => {
          if (!panel.contains(ev.target) && ev.target !== fundSearch) {
            panel.style.display = 'none';
          }
        });

        // Hiển thị gợi ý khi focus
        fundSearch.addEventListener('focus', () => {
          doFilter();
        });
      }

      // 👉 Tự động chọn nếu có dữ liệu
      const selectedTicker = selectedTickerFromStorage;
      if (selectedTicker) {
        // Đợi DOM update option xong
        setTimeout(() => {
          fundSelect.value = selectedTicker;
          fundSelect.dispatchEvent(new Event('change'));
          const selected = fundData.find(f => f.ticker === selectedTicker);
          if (selected && fundSearch) {
            fundSearch.value = `${selected.name} (${selected.ticker})`;
          }
          sessionStorage.removeItem('selectedTicker'); // cleanup
        }, 0);
      }

      fundSelect.addEventListener('change', async () => {
        const selected = fundData.find(f => f.ticker === fundSelect.value);
        if (selected) {
          fundNameDisplay.textContent = selected.name;
          currentId.textContent = selected.id;
          if (fundSearch) {
            fundSearch.value = `${selected.name} (${selected.ticker})`;
          }
          
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

// Kiểm tra lãi/lỗ dựa trên chặn trên/dưới - Định nghĩa ở global scope để có thể gọi từ mọi nơi
async function checkProfitability(fundId, amount, months, rate) {
  const paymentBtn = document.getElementById('payment-btn');
  if (!paymentBtn) {
    console.warn('Payment button not found');
    return;
  }

  try {
    // Kiểm tra debug mode
    const debugToggle = document.getElementById('fund-buy-debug-toggle');
    const debugMode = debugToggle && debugToggle.checked;
    
    if (debugMode) {
      paymentBtn.disabled = false;
      paymentBtn.style.opacity = '1';
      return;
    }
    
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
    
    // Số ngày theo kỳ hạn - tính giống Python backend
    const today = new Date();
    const maturityDate = calculateMaturityDate(today, months);
    const days = calculateDaysBetween(today, maturityDate);
    
    // Đọc số lượng CCQ từ input (fallback 1 nếu thiếu)
    const qtyInput = document.getElementById('share-quantity-input');
    const units = qtyInput ? (parseFloat(qtyInput.value) || 0) : 0;
    
    // Lấy giá CCQ tại thời điểm mua (J) từ currentNavPrice
    const pricePerUnit = nav; // J: Giá CCQ tại thời điểm mua
    
    // Lấy phí mua (K) từ fee-input hoặc summary-fee (số tiền tuyệt đối)
    const feeInput = document.getElementById('fee-input');
    const summaryFee = document.getElementById('summary-fee');
    let feeAmount = 0;
    if (feeInput && feeInput.value) {
        feeAmount = parseFloat(feeInput.value.replace(/[^0-9]/g, '')) || 0;
    } else if (summaryFee && summaryFee.textContent) {
        feeAmount = parseFloat(summaryFee.textContent.replace(/[^0-9]/g, '')) || 0;
    }
    
    // L: Giá trị mua = I * J + K (I = units, J = pricePerUnit, K = feeAmount)
    const purchaseValue = (units * pricePerUnit) + feeAmount;
    
    // Giá trị bán 1 (U) = Giá trị mua * Lãi suất / 365 * Số ngày + Giá trị mua
    const sellValue1 = purchaseValue * (rate / 100) / 365 * days + purchaseValue;
    
    // Giá bán 1 (S) = ROUND(Giá trị bán 1 / Số lượng CCQ, 0)
    const sellPrice1 = (units > 0) ? Math.round(sellValue1 / units) : 0;
    
    // Giá bán 2 (T) = MROUND(Giá bán 1, 50)
    const sellPrice2 = sellPrice1 ? (Math.round(sellPrice1 / 50) * 50) : 0;
    
    // Tính lãi suất quy đổi (O) = (Giá bán 2 / Giá mua - 1) * 365 / Số ngày * 100
    // J = Giá CCQ tại thời điểm mua = pricePerUnit
    const r_new = (pricePerUnit > 0 && days > 0 && sellPrice2 > 0) ? ((sellPrice2 / pricePerUnit - 1) * 365 / days * 100) : 0;
    
    // Tính chênh lệch lãi suất
    const delta = r_new - rate;
    
    // Kiểm tra lãi/lỗ
    const capUpper = parseFloat(capData.cap_upper);
    const capLower = parseFloat(capData.cap_lower);
    
    const isProfitable = delta >= capLower && delta <= capUpper;
    
    console.log(`📊 Kiểm tra lãi/lỗ:`);
    console.log(`   - NAV: ${nav}`);
    console.log(`   - Số lượng CCQ: ${units}`);
    console.log(`   - Giá CCQ tại thời điểm mua (J): ${pricePerUnit}`);
    console.log(`   - Phí mua (K): ${feeAmount}`);
    console.log(`   - Giá trị mua (L = I * J + K): ${purchaseValue}`);
    console.log(`   - Lãi suất gốc: ${rate}%`);
    console.log(`   - Giá trị bán 1 (U): ${sellValue1}`);
    console.log(`   - Giá bán 1 (S): ${sellPrice1}`);
    console.log(`   - Giá bán 2 (T): ${sellPrice2}`);
    console.log(`   - Lãi suất quy đổi (O): ${r_new}%`);
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

// Xử lý nút thanh toán
function initPaymentButton() {
  const paymentBtn = document.getElementById('payment-btn');
  const backBtn = document.getElementById('back-btn');
  const fundSelect = document.getElementById('fund-select');
  const amountInput = document.getElementById('amount-input');

  // Kiểm tra lãi/lỗ và enable/disable button
  function checkProfitabilityAndUpdateButton() {
    // Kiểm tra debug mode trước
    const debugToggle = document.getElementById('fund-buy-debug-toggle');
    const debugMode = debugToggle && debugToggle.checked;
    
    if (debugMode) {
      paymentBtn.disabled = false;
      paymentBtn.style.opacity = '1';
      return;
    }
    
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

    // Không auto-chặn theo sức mua ở bước này; kiểm tra tại thời điểm bấm thanh toán
    
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

  paymentBtn.addEventListener('click', async () => {
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
    let selectedTerm = 0;
    let selectedRate = 0;
    
    if (termSelect && termSelect.selectedIndex >= 0) {
      const selectedOption = termSelect.options[termSelect.selectedIndex];
      selectedTerm = parseInt(selectedOption.value || '0', 10);
      selectedRate = parseFloat(selectedOption.dataset.rate || '0');
      
      console.log('💾 Lưu dữ liệu kỳ hạn:', {
        termMonths: selectedTerm,
        interestRate: selectedRate,
        optionValue: selectedOption.value,
        optionRate: selectedOption.dataset.rate
      });
    }
    
    sessionStorage.setItem('selected_term_months', String(selectedTerm));
    sessionStorage.setItem('selected_interest_rate', String(selectedRate));

    // ✅ Mở điều khoản
//    const termsModal = new bootstrap.Modal(document.getElementById('termsModal'));

    // ✅ Kiểm tra sức mua realtime trước khi OTP (tạm thời bypass)
    const BYPASS_PURCHASING_POWER = true;
    if (!BYPASS_PURCHASING_POWER) {
      try {
        const resp = await fetch('/my-account/get_balance', {
          method: 'POST',
          headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({})
        });
        const j = await resp.json().catch(() => ({}));
        const totalToPay = parseInt((document.getElementById('summary-total')?.textContent || '0').replace(/[^0-9]/g, ''), 10) || finalAmount;
        const bal = (j && j.status === 'success') ? (Number(j.balance?.available_cash || j.balance?.purchasing_power || 0) || 0) : 0;
        if (bal > 0 && totalToPay > bal) {
          await Swal.fire({
            icon: 'warning',
            title: 'Không đủ sức mua',
            text: 'Số dư tài khoản không đủ. Vui lòng nạp thêm tiền để tiếp tục.',
            confirmButtonText: 'Đã hiểu'
          });
          return;
        }
      } catch (_) {
        // Không block nếu lỗi kiểm tra sức mua
      }
    }

    // ✅ Smart OTP trước khi hiển thị hợp đồng/ký tên
    // Hiển thị modal signature để ký tên
    const showSignature = () => {
      try {
        const signatureModalElement = document.getElementById('signatureModal');
        if (!signatureModalElement) {
          console.warn('[Signature] Modal element not found, redirecting to fund_confirm');
          window.location.href = '/fund_confirm';
          return;
        }
        
        // Kiểm tra xem Bootstrap có sẵn không
        if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
          console.error('[Signature] Bootstrap Modal is not available, redirecting to fund_confirm');
          window.location.href = '/fund_confirm';
          return;
        }
        
        // Kiểm tra xem modal đã được khởi tạo chưa
        let signatureModal = bootstrap.Modal.getInstance(signatureModalElement);
        if (!signatureModal) {
          signatureModal = new bootstrap.Modal(signatureModalElement, {
            backdrop: true,
            keyboard: true,
            focus: true
          });
        }
        
        // Load PDF contract vào viewer nếu có
        const pdfViewer = document.getElementById('contract-pdf-viewer');
        if (pdfViewer) {
          const pdfUrl = resolvePdfUrl();
          if (pdfUrl) {
            pdfViewer.src = pdfUrl + '#toolbar=0';
          }
        }
        
      signatureModal.show();
      } catch (error) {
        console.error('[Signature] Error showing signature modal:', error);
        // Fallback: chuyển sang trang fund_confirm
        window.location.href = '/fund_confirm';
      }
    };

    try {
      // Kiểm tra write token còn hiệu lực không trước khi yêu cầu OTP
      let otpType = 'smart'; // Default
      let hasValidToken = false;
      let tokenExpiresIn = '';
      
      try {
        const configResponse = await fetch('/api/otp/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'same-origin',
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {}
          })
        });
        const configResult = await configResponse.json().catch(() => ({}));
        const configData = configResult.result || configResult;
        if (configData) {
          if (configData.otp_type) {
            otpType = configData.otp_type;
          }
          if (configData.has_valid_write_token !== undefined) {
            hasValidToken = configData.has_valid_write_token;
          }
          if (configData.write_token_expires_in) {
            tokenExpiresIn = configData.write_token_expires_in;
          }
        }
        console.log('[OTP] OTP Type:', otpType, 'Has valid token:', hasValidToken, 'Expires in:', tokenExpiresIn);
      } catch (configError) {
        console.warn('[OTP] Failed to get OTP config, using default:', configError);
      }
      
      // Nếu write token còn hiệu lực, skip OTP và hiển thị hợp đồng luôn
      if (hasValidToken) {
        console.log('[OTP] Write token còn hiệu lực, skip OTP verification');
        // Hiển thị thông báo ngắn về token còn hiệu lực
        if (tokenExpiresIn) {
          await Swal.fire({
            icon: 'info',
            title: 'Xác thực thành công',
            text: `Smart OTP còn hiệu lực (${tokenExpiresIn}). Đang tiếp tục...`,
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false
          });
        }
        // Hiển thị hợp đồng luôn, không cần verify OTP
        showSignature();
        return;
      }
      
      // Nếu token hết hạn hoặc chưa có, yêu cầu verify OTP
      console.log('[OTP] Write token đã hết hạn hoặc chưa có, yêu cầu verify OTP');
      
      // Mở popup OTP để user nhập mã (không gửi OTP tự động)
      if (window.FundManagementSmartOTP && typeof window.FundManagementSmartOTP.open === 'function') {
        window.FundManagementSmartOTP.open({
          otpType: otpType, // Truyền loại OTP vào popup
          onConfirm: async (otp, debugMode) => {
            // Verify OTP giống stock_trading: /api/otp/verify -> lấy write token
            try {
              console.log('[OTP Verify] Sending OTP:', otp?.substring(0, 2) + '****', 'Debug Mode:', debugMode);
              
              // Gọi API với type='json' - cần gửi JSON-RPC format
              const response = await fetch('/api/otp/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin',
                body: JSON.stringify({ 
                  jsonrpc: '2.0', 
                  method: 'call', 
                  params: { 
                    otp: otp || '',
                    debug: debugMode || false
                  } 
                })
              });
              
              const jsonRpcResponse = await response.json().catch(() => ({}));
              console.log('[OTP Verify] Response:', response.status, jsonRpcResponse);
              
              // Với type='json', Odoo trả về JSON-RPC format: {jsonrpc: '2.0', id: null, result: {...}}
              // Dữ liệu thực tế nằm trong result
              const data = jsonRpcResponse.result || jsonRpcResponse;
              
              if (!data || data.success !== true) {
                const errorMsg = data?.message || jsonRpcResponse?.error?.message || jsonRpcResponse?.error || 'Mã OTP không hợp lệ';
                console.error('[OTP Verify] Error:', errorMsg, 'Full response:', jsonRpcResponse);
                throw new Error(errorMsg);
              }
              
              // OTP verify thành công - hiển thị thông báo thành công trước
              console.log('[OTP Verify] Success');
              try {
              await Swal.fire({
                icon: 'success',
                title: 'Xác thực thành công',
                text: data?.message || 'Mã Smart OTP đã được xác thực thành công. Bạn có thể tiếp tục ký hợp đồng.',
                confirmButtonText: 'Tiếp tục',
                timer: 3000,
                  timerProgressBar: true,
                  allowOutsideClick: false,
                  allowEscapeKey: false,
                  backdrop: true,
                  showClass: {
                    popup: 'animate__animated animate__fadeInDown'
                  },
                  hideClass: {
                    popup: 'animate__animated animate__fadeOutUp'
                  }
                });
              } catch (swalError) {
                console.warn('[OTP] Swal error (non-critical):', swalError);
              }
              
              // Sau khi hiển thị thông báo thành công, mới hiển thị hợp đồng
              showSignature();
            } catch (e) {
              // Hiển thị SweetAlert phía trước popup OTP
              // SweetAlert tự động có z-index cao (1060), không cần set thủ công
              try {
              await Swal.fire({ 
                icon: 'error', 
                title: 'Smart OTP không chính xác', 
                  text: e?.message || 'Vui lòng kiểm tra lại mã OTP',
                  allowOutsideClick: false,
                  allowEscapeKey: false,
                  backdrop: true,
                  showClass: {
                    popup: 'animate__animated animate__shakeX'
                  },
                  hideClass: {
                    popup: 'animate__animated animate__fadeOutUp'
                  }
                });
              } catch (swalError) {
                console.error('[OTP] Swal error:', swalError);
                // Fallback: hiển thị alert thông thường nếu Swal lỗi
                alert('Smart OTP không chính xác: ' + (e?.message || 'Vui lòng kiểm tra lại mã OTP'));
              }
              throw e; // Re-throw để popup OTP không đóng
            }
          },
          onResend: null, // Không hỗ trợ gửi lại OTP
        });
      } else {
        // Fallback nếu chưa có component OTP
        showSignature();
      }
    } catch (_) {
      showSignature();
    }
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
      const sharesRaw = investmentAmount / nav;
      // Làm tròn số CCQ theo bội số 50 gần nhất
      const shares = Math.round(sharesRaw / 50) * 50;
      // Cập nhật số lượng CCQ (đảm bảo không âm)
      shareQuantityInput.value = shares > 0 ? shares : '';
      
      // Tính lại số tiền đầu tư theo số CCQ đã làm tròn
      let actualAmount = shares * nav;
      // Chuẩn hóa MROUND 50 cho số tiền
      actualAmount = Math.round(actualAmount / 50) * 50;
      const formattedAmount = actualAmount ? actualAmount.toLocaleString('vi-VN') : '';
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

      // Cập nhật trạng thái sức mua nếu đã có dữ liệu
      const purchasingPower = window.__stockPurchasingPower__ || 0;
      const statusEl = document.getElementById('purchasing-power-status');
      const statusSumEl = document.getElementById('summary-purchasing-power-status');
      if (purchasingPower > 0) {
        const hasEnough = totalRounded <= purchasingPower;
        if (statusEl) {
          statusEl.textContent = hasEnough ? 'Đủ sức mua' : 'Không đủ sức mua';
          statusEl.classList.remove('text-success', 'text-danger');
          statusEl.classList.add(hasEnough ? 'text-success' : 'text-danger');
        }
        if (statusSumEl) {
          statusSumEl.textContent = hasEnough ? 'Đủ sức mua' : 'Không đủ sức mua';
          statusSumEl.classList.remove('text-success', 'text-danger');
          statusSumEl.classList.add(hasEnough ? 'text-success' : 'text-danger');
        }
      }

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

  // Commit khi Enter/blur: làm tròn shares theo bội số 50 và cập nhật lại số tiền đầu tư tương ứng
  const commitFromInvestment = () => {
    if (isUpdatingFromInvestment) return;
    const nav = window.currentNavPrice || 0;
    let rawAmount = investmentAmountInput.value.replace(/[^0-9]/g, '');
    const investmentAmount = parseFloat(rawAmount || '0');
    if (nav <= 0 || investmentAmount <= 0) return;
    // Tính shares và MROUND 50 cho shares
    const shares = Math.round((investmentAmount / nav) / 50) * 50;
    // Cập nhật số CCQ đã làm tròn
    shareQuantityInput.value = shares > 0 ? String(shares) : '';
    // Tính lại amount theo shares (MROUND 50)
    let actualAmount = shares * nav;
    actualAmount = Math.round(actualAmount / 50) * 50;
    amountInput.value = actualAmount ? actualAmount.toLocaleString('vi-VN') : '';
    // Kích hoạt lại luồng tính toán để cập nhật fee/summary
    shareQuantityInput.dispatchEvent(new Event('input'));
  };

  investmentAmountInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitFromInvestment();
      investmentAmountInput.blur();
    }
  });
  investmentAmountInput.addEventListener('blur', commitFromInvestment);
}

// Cập nhật hiển thị giá trị đáo hạn
function updateFinalValueDisplay(finalValue, isProfitable, delta = 0) {
  const finalValueField = document.getElementById('final-value');
  const paymentBtn = document.getElementById('payment-btn');

  // Kiểm tra null để tránh lỗi
  if (!finalValueField) {
    console.error('Element with id "final-value" not found');
    return;
  }

  // Hiển thị giá trị
  finalValueField.textContent = finalValue.toLocaleString("vi-VN") + " đ";

  // Reset về màu mặc định (không tô màu)
  finalValueField.style.color = '';
  finalValueField.style.backgroundColor = '';
  finalValueField.style.borderColor = '';
  
  // Điều khiển button thanh toán dựa trên trạng thái lãi/lỗ
  if (paymentBtn) {
    if (isProfitable === false) {
      // Nếu lỗ - disable button
      paymentBtn.disabled = true;
      paymentBtn.style.opacity = '0.5';
      paymentBtn.className = 'btn btn-pill btn-secondary';
    } else {
      // Nếu lãi hoặc không xác định - enable button
      paymentBtn.disabled = false;
      paymentBtn.style.opacity = '1';
      paymentBtn.className = 'btn btn-pill btn-buy';
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
    // Công thức NAV mới: Tính toán đầy đủ theo công thức từ nav_management
    // Tính ngày đáo hạn từ ngày hiện tại + kỳ hạn (giống Python backend)
    const today = new Date();
    const maturityDate = calculateMaturityDate(today, months);
    
    // Tính số ngày thực tế giữa ngày mua và ngày đáo hạn (giống Python backend)
    const days = calculateDaysBetween(today, maturityDate);
    
    // Lấy giá CCQ tại thời điểm mua (J) từ nav
    const pricePerUnit = nav; // J: Giá CCQ tại thời điểm mua
    
    // Lấy phí mua (K) từ fee-input hoặc summary-fee (số tiền tuyệt đối)
    const feeInput = document.getElementById('fee-input');
    const summaryFee = document.getElementById('summary-fee');
    let feeAmount = 0;
    if (feeInput && feeInput.value) {
        feeAmount = parseFloat(feeInput.value.replace(/[^0-9]/g, '')) || 0;
    } else if (summaryFee && summaryFee.textContent) {
        feeAmount = parseFloat(summaryFee.textContent.replace(/[^0-9]/g, '')) || 0;
    }
    
    // L: Giá trị mua = I * J + K (I = shares, J = pricePerUnit, K = feeAmount)
    const purchaseValue = (shares * pricePerUnit) + feeAmount;
    
    // U: Giá trị bán 1 = L * N / 365 * G + L
    const sellValue1 = purchaseValue * (rate / 100) / 365 * days + purchaseValue;
    
    // S: Giá bán 1 = ROUND(U / I, 0)
    const sellPrice1 = Math.round(sellValue1 / shares);
    
    // T: Giá bán 2 = MROUND(S, 50)
    const sellPrice2 = Math.round(sellPrice1 / 50) * 50;
    
    maturityPriceDisplay.textContent = sellPrice2.toLocaleString('vi-VN') + 'đ';
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

      // Cập nhật trạng thái sức mua nếu đã có dữ liệu
      const purchasingPower = window.__stockPurchasingPower__ || 0;
      const statusEl = document.getElementById('purchasing-power-status');
      const statusSumEl = document.getElementById('summary-purchasing-power-status');
      if (purchasingPower > 0) {
        const hasEnough = totalRounded <= purchasingPower;
        if (statusEl) {
          statusEl.textContent = hasEnough ? 'Đủ sức mua' : 'Không đủ sức mua';
          statusEl.classList.remove('text-success', 'text-danger');
          statusEl.classList.add(hasEnough ? 'text-success' : 'text-danger');
        }
        if (statusSumEl) {
          statusSumEl.textContent = hasEnough ? 'Đủ sức mua' : 'Không đủ sức mua';
          statusSumEl.classList.remove('text-success', 'text-danger');
          statusSumEl.classList.add(hasEnough ? 'text-success' : 'text-danger');
        }
      }

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

  // Thêm validation cho bội số 50 (tự động làm tròn, không popup)
  shareInput.addEventListener('blur', () => {
    let value = parseInt(shareInput.value, 10);

    // Nếu không phải số hợp lệ hoặc <= 0 thì xóa
    if (isNaN(value) || value <= 0) {
      shareInput.value = '';
      shareInput.dispatchEvent(new Event('input'));
      return;
    }

    // Nếu không phải bội số 50 thì tự động làm tròn tới bội số 50 gần nhất (không popup)
    if (value % 50 !== 0) {
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

// Nạp sức mua từ stock_trading và chỉ hiển thị trạng thái (không hiển thị số dư)
function initPurchasingPowerCheck() {
  fetch('/my-account/get_balance', {
    method: 'POST',
    headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({})
  }).then(async (res) => {
    const statusEl = document.getElementById('purchasing-power-status');
    const statusSumEl = document.getElementById('summary-purchasing-power-status');
    if (!res.ok) { if (statusEl) statusEl.textContent = 'Không xác định'; if (statusSumEl) statusSumEl.textContent = 'Không xác định'; return; }
    const data = await res.json();
    if (!data || data.status !== 'success') { if (statusEl) statusEl.textContent = 'Không xác định'; if (statusSumEl) statusSumEl.textContent = 'Không xác định'; return; }
    const bal = Math.max(0, Number((data.balance && (data.balance.available_cash || data.balance.purchasing_power)) || 0));
    window.__stockPurchasingPower__ = bal;

    // Sau khi có sức mua, cập nhật trạng thái ngay theo tổng cần thanh toán
    const totalEl = document.getElementById('summary-total');
    const total = totalEl ? parseFloat((totalEl.textContent || '0').replace(/[^0-9]/g, '')) || 0 : 0;
    const hasEnough = bal > 0 ? (total <= bal) : true;
    if (statusEl) {
      statusEl.textContent = hasEnough ? 'Đủ sức mua' : 'Không đủ sức mua';
      statusEl.classList.remove('text-success', 'text-danger');
      statusEl.classList.add(hasEnough ? 'text-success' : 'text-danger');
    }
    if (statusSumEl) {
      statusSumEl.textContent = hasEnough ? 'Đủ sức mua' : 'Không đủ sức mua';
      statusSumEl.classList.remove('text-success', 'text-danger');
      statusSumEl.classList.add(hasEnough ? 'text-success' : 'text-danger');
    }
  }).catch(() => {
    const statusEl = document.getElementById('purchasing-power-status');
    const statusSumEl = document.getElementById('summary-purchasing-power-status');
    if (statusEl) { statusEl.textContent = 'Không xác định'; statusEl.classList.remove('text-success', 'text-danger'); }
    if (statusSumEl) { statusSumEl.textContent = 'Không xác định'; statusSumEl.classList.remove('text-success', 'text-danger'); }
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
    try {
      const signatureModalElement = document.getElementById('signatureModal');
      if (!signatureModalElement) {
        console.warn('[Terms] Modal element not found, redirecting to fund_confirm');
        window.location.href = '/fund_confirm';
        return;
      }
      
      if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
        console.error('[Terms] Bootstrap Modal is not available, redirecting to fund_confirm');
        window.location.href = '/fund_confirm';
        return;
      }
      
      let signatureModal = bootstrap.Modal.getInstance(signatureModalElement);
      if (!signatureModal) {
        signatureModal = new bootstrap.Modal(signatureModalElement, {
          backdrop: true,
          keyboard: true,
          focus: true
        });
      }
      
      // Load PDF contract vào viewer nếu có
      const pdfViewer = document.getElementById('contract-pdf-viewer');
      if (pdfViewer) {
        const pdfUrl = resolvePdfUrl();
        if (pdfUrl) {
          pdfViewer.src = pdfUrl + '#toolbar=0';
        }
      }
      
    signatureModal.show();
    } catch (error) {
      console.error('[Terms] Error showing signature modal:', error);
      window.location.href = '/fund_confirm';
    }
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
        const nextRaw = Math.max(0, current - 100); // step 100
        const next = nextRaw > 0 ? Math.round(nextRaw / 50) * 50 : 0; // chuẩn hóa bội số 50 như nhập tay
        input.value = next > 0 ? String(next) : '';
        // Cập nhật amount-input ngay để thuật toán đáo hạn dùng đúng dữ liệu như nhập tay
        const amountEl = document.getElementById('amount-input');
        const nav = window.currentNavPrice || 0;
        const investmentAmount = (next > 0 && nav > 0) ? (next * nav) : 0;
        const actualAmount = Math.round(investmentAmount / 50) * 50;
        if (amountEl) {
          amountEl.value = actualAmount ? actualAmount.toLocaleString('vi-VN') : '';
          amountEl.dispatchEvent(new Event('input'));
        }
        input.dispatchEvent(new Event('input'));
      });

      const btnInc = document.createElement('button');
      btnInc.type = 'button';
      btnInc.textContent = '+';
      btnInc.className = 'btn btn-light btn-sm share-stepper';
      btnInc.addEventListener('click', () => {
        const current = parseInt(input.value.replace(/[^0-9]/g, ''), 10) || 0;
        const nextRaw = current + 100; // step 100
        const next = Math.round(nextRaw / 50) * 50; // chuẩn hóa bội số 50 như nhập tay
        input.value = String(next);
        // Cập nhật amount-input ngay để thuật toán đáo hạn dùng đúng dữ liệu như nhập tay
        const amountEl = document.getElementById('amount-input');
        const nav = window.currentNavPrice || 0;
        const investmentAmount = (next > 0 && nav > 0) ? (next * nav) : 0;
        const actualAmount = Math.round(investmentAmount / 50) * 50;
        if (amountEl) {
          amountEl.value = actualAmount ? actualAmount.toLocaleString('vi-VN') : '';
          amountEl.dispatchEvent(new Event('input'));
        }
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
    const actualAmountInput = document.getElementById('amount-input');
    const finalValueField = document.getElementById('final-value');
    const resaleDateField = document.getElementById('resale-date');
    const maturityDateField = document.getElementById('maturity-date');

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
            if (resaleDateField) resaleDateField.textContent = "...";
            if (maturityDateField) maturityDateField.textContent = "...";
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
                // Công thức NAV mới: Tính toán đầy đủ theo công thức từ nav_management
                // Tính ngày đáo hạn từ ngày hiện tại + kỳ hạn (giống Python backend)
                const today = new Date();
                const maturityDate = calculateMaturityDate(today, months);
                
                // Tính số ngày thực tế giữa ngày mua và ngày đáo hạn (giống Python backend)
                const days = calculateDaysBetween(today, maturityDate);

                // Cập nhật ngày đáo hạn và ngày bán lại (trừ 2 ngày làm việc)
                if (maturityDateField) maturityDateField.textContent = formatDateDDMMYYYY(maturityDate);
                if (resaleDateField) resaleDateField.textContent = formatDateDDMMYYYY(subtractBusinessDays(maturityDate, 2));
                
                // Lấy số lượng CCQ thực tế từ form
                const shareQuantityInput = document.getElementById('share-quantity-input');
                let shares = parseFloat(shareQuantityInput.value) || 0;
                
                // Lấy giá CCQ tại thời điểm mua (J) từ currentNavPrice
                const pricePerUnit = currentNav; // J: Giá CCQ tại thời điểm mua
                
                // Lấy phí mua (K) từ fee-input hoặc summary-fee (số tiền tuyệt đối)
                const feeInput = document.getElementById('fee-input');
                const summaryFee = document.getElementById('summary-fee');
                let feeAmount = 0;
                if (feeInput && feeInput.value) {
                    feeAmount = parseFloat(feeInput.value.replace(/[^0-9]/g, '')) || 0;
                } else if (summaryFee && summaryFee.textContent) {
                    feeAmount = parseFloat(summaryFee.textContent.replace(/[^0-9]/g, '')) || 0;
                }
                
                // Tính lại amount nếu chưa có (từ shares và pricePerUnit)
                if (amount === 0 && shares > 0 && pricePerUnit > 0) {
                    amount = shares * pricePerUnit;
                    amount = Math.round(amount / 50) * 50; // MROUND 50
                }
                
                // L: Giá trị mua = I * J + K (I = shares, J = pricePerUnit, K = feeAmount)
                const purchaseValue = (shares * pricePerUnit) + feeAmount;
                
                // U: Giá trị bán 1 = L * N / 365 * G + L
                //    = purchaseValue * (rate / 100) / 365 * days + purchaseValue
                const sellValue1 = purchaseValue * (rate / 100) / 365 * days + purchaseValue;
                
                // S: Giá bán 1 = ROUND(U / I, 0)
                const sellPrice1 = shares > 0 ? Math.round(sellValue1 / shares) : 0;
                
                // T: Giá bán 2 = MROUND(S, 50)
                const sellPrice2 = sellPrice1 > 0 ? (Math.round(sellPrice1 / 50) * 50) : 0;
                
                // V: Giá trị bán 2 = I * T
                const sellValue2 = shares * sellPrice2;
                
                // Tính lãi suất quy đổi (O) = (T / J - 1) * 365 / G * 100
                // J = Giá CCQ tại thời điểm mua = pricePerUnit
                const r_new = (pricePerUnit > 0 && days > 0 && sellPrice2 > 0) ? ((sellPrice2 / pricePerUnit - 1) * 365 / days * 100) : 0;
                
                // Q: Chênh lệch lãi suất = O - N
                delta = r_new - rate;
                
                // X: Phí bán (mặc định 0 nếu chưa có cấu hình)
                const sellFee = 0; // Có thể lấy từ cấu hình sau
                
                // Y: Thuế (mặc định 0 nếu chưa có cấu hình)
                const tax = 0; // Có thể lấy từ cấu hình sau
                
                // Z: Khách hàng thực nhận = U - X - Y
                const customerReceive = sellValue1 - sellFee - tax;
                
                console.log(`🔍 Debug tính toán NAV mới:`);
                console.log(`   - I (Số lượng CCQ): ${shares}`);
                console.log(`   - J (Giá CCQ tại thời điểm mua): ${pricePerUnit.toLocaleString('vi-VN')} đ`);
                console.log(`   - K (Phí mua - số tiền): ${feeAmount.toLocaleString('vi-VN')} đ`);
                console.log(`   - L (Giá trị mua = I * J + K): ${purchaseValue.toLocaleString('vi-VN')} đ`);
                console.log(`   - N (Lãi suất): ${rate}%`);
                console.log(`   - G (Số ngày): ${days}`);
                console.log(`   - U (Giá trị bán 1 = L * N / 365 * G + L): ${sellValue1.toLocaleString('vi-VN')} đ`);
                console.log(`   - S (Giá bán 1 = ROUND(U / I, 0)): ${sellPrice1.toLocaleString('vi-VN')} đ/CCQ`);
                console.log(`   - T (Giá bán 2 = MROUND(S, 50)): ${sellPrice2.toLocaleString('vi-VN')} đ/CCQ`);
                console.log(`   - V (Giá trị bán 2 = I * T): ${sellValue2.toLocaleString('vi-VN')} đ`);
                console.log(`   - O (Lãi suất quy đổi = (T / J - 1) * 365 / G * 100): ${r_new.toFixed(4)}%`);
                console.log(`   - Q (Chênh lệch lãi suất = O - N): ${delta.toFixed(4)}%`);
                console.log(`   - X (Phí bán): ${sellFee.toLocaleString('vi-VN')} đ`);
                console.log(`   - Y (Thuế): ${tax.toLocaleString('vi-VN')} đ`);
                console.log(`   - Z (Khách hàng thực nhận = U - X - Y): ${customerReceive.toLocaleString('vi-VN')} đ`);
                
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
                
                // Sử dụng giá trị khách hàng thực nhận (Z) làm giá trị đáo hạn
                finalValue = customerReceive;
                
                console.log(`🧮 Tính toán giá trị đáo hạn với công thức NAV mới:`);
                console.log(`   - Số tiền đầu tư (amount-input): ${amount.toLocaleString('vi-VN')} đ`);
                console.log(`   - Số lượng CCQ: ${shares}`);
                console.log(`   - Giá CCQ tại thời điểm mua: ${pricePerUnit.toLocaleString('vi-VN')} đ`);
                console.log(`   - Phí mua: ${feeAmount.toLocaleString('vi-VN')} đ`);
                console.log(`   - Giá trị mua (L): ${purchaseValue.toLocaleString('vi-VN')} đ`);
                console.log(`   - Lãi suất gốc: ${rate}% cho ${months} tháng`);
                console.log(`   - Giá trị bán 1 (U): ${sellValue1.toLocaleString('vi-VN')} đ`);
                console.log(`   - Giá bán 1 (S): ${sellPrice1.toLocaleString('vi-VN')} đ/CCQ`);
                console.log(`   - Giá bán 2 (T): ${sellPrice2.toLocaleString('vi-VN')} đ/CCQ`);
                console.log(`   - Giá trị bán 2 (V): ${sellValue2.toLocaleString('vi-VN')} đ`);
                console.log(`   - Lãi suất quy đổi (O): ${r_new.toFixed(4)}%`);
                console.log(`   - Chênh lệch lãi suất (Q): ${delta.toFixed(4)}%`);
                console.log(`   - Phí bán (X): ${sellFee.toLocaleString('vi-VN')} đ`);
                console.log(`   - Thuế (Y): ${tax.toLocaleString('vi-VN')} đ`);
                console.log(`   - Khách hàng thực nhận (Z): ${finalValue.toLocaleString('vi-VN')} đ`);
                console.log(`   - Chặn trên: ${capUpper}%, Chặn dưới: ${capLower}%`);
                console.log(`   - Có lãi: ${isProfitable}`);
            } else {
                // Sử dụng công thức NAV mới ngay cả khi không kiểm tra lãi/lỗ
                const today = new Date();
                const maturityDate = calculateMaturityDate(today, months);
                
                // Tính số ngày thực tế giữa ngày mua và ngày đáo hạn (giống Python backend)
                const days = calculateDaysBetween(today, maturityDate);

                // Cập nhật ngày đáo hạn và ngày bán lại (trừ 2 ngày làm việc)
                if (maturityDateField) maturityDateField.textContent = formatDateDDMMYYYY(maturityDate);
                if (resaleDateField) resaleDateField.textContent = formatDateDDMMYYYY(subtractBusinessDays(maturityDate, 2));
                
                // Lấy số lượng CCQ thực tế từ form
                const shareQuantityInput = document.getElementById('share-quantity-input');
                let shares = parseFloat(shareQuantityInput.value) || 0;
                if (shares === 0 && currentNav > 0) {
                    shares = amount / currentNav;
                }
                
                // Lấy giá CCQ tại thời điểm mua (J) từ currentNavPrice
                const pricePerUnit = currentNav; // J: Giá CCQ tại thời điểm mua
                
                // Lấy phí mua (K) từ fee-input hoặc summary-fee (số tiền tuyệt đối)
                const feeInput = document.getElementById('fee-input');
                const summaryFee = document.getElementById('summary-fee');
                let feeAmount = 0;
                if (feeInput && feeInput.value) {
                    feeAmount = parseFloat(feeInput.value.replace(/[^0-9]/g, '')) || 0;
                } else if (summaryFee && summaryFee.textContent) {
                    feeAmount = parseFloat(summaryFee.textContent.replace(/[^0-9]/g, '')) || 0;
                }
                
                // L: Giá trị mua = I * J + K (I = shares, J = pricePerUnit, K = feeAmount)
                const purchaseValue = (shares * pricePerUnit) + feeAmount;
                
                // U: Giá trị bán 1 = L * N / 365 * G + L
                const sellValue1 = purchaseValue * (rate / 100) / 365 * days + purchaseValue;
                
                // X: Phí bán (mặc định 0)
                const sellFee = 0;
                
                // Y: Thuế (mặc định 0)
                const tax = 0;
                
                // Z: Khách hàng thực nhận = U - X - Y
                finalValue = sellValue1 - sellFee - tax;
                
                // Không thể kiểm tra lãi/lỗ khi không có dữ liệu cap
                isProfitable = null;
                delta = 0;
                
                console.log(`🧮 Tính toán giá trị đáo hạn (công thức NAV mới):`);
                console.log(`   - Số tiền đầu tư: ${amount.toLocaleString('vi-VN')} đ`);
                console.log(`   - Số lượng CCQ: ${shares}`);
                console.log(`   - Giá CCQ tại thời điểm mua: ${pricePerUnit.toLocaleString('vi-VN')} đ`);
                console.log(`   - Phí mua: ${feeAmount.toLocaleString('vi-VN')} đ`);
                console.log(`   - L (Giá trị mua = I * J + K): ${purchaseValue.toLocaleString('vi-VN')} đ`);
                console.log(`   - Lãi suất: ${rate}% cho ${months} tháng (${days} ngày)`);
                console.log(`   - U (Giá trị bán 1): ${sellValue1.toLocaleString('vi-VN')} đ`);
                console.log(`   - X (Phí bán): ${sellFee.toLocaleString('vi-VN')} đ`);
                console.log(`   - Y (Thuế): ${tax.toLocaleString('vi-VN')} đ`);
                console.log(`   - Z (Khách hàng thực nhận): ${finalValue.toLocaleString('vi-VN')} đ`);
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
            // Fallback về tính toán cơ bản theo công thức NAV mới
            const today = new Date();
            const maturityDate = calculateMaturityDate(today, months);
            
            // Tính số ngày thực tế giữa ngày mua và ngày đáo hạn (giống Python backend)
            const days = calculateDaysBetween(today, maturityDate);
            
            // Lấy số lượng CCQ thực tế từ form
            const shareQuantityInput = document.getElementById('share-quantity-input');
            let shares = parseFloat(shareQuantityInput.value) || 0;
            if (shares === 0 && window.currentNavPrice > 0) {
                shares = amount / window.currentNavPrice;
            }
            
            // Lấy giá CCQ tại thời điểm mua (J)
            const pricePerUnit = window.currentNavPrice || 0;
            
            // Lấy phí mua (K) từ fee-input hoặc summary-fee
            const feeInput = document.getElementById('fee-input');
            const summaryFee = document.getElementById('summary-fee');
            let feeAmount = 0;
            if (feeInput && feeInput.value) {
                feeAmount = parseFloat(feeInput.value.replace(/[^0-9]/g, '')) || 0;
            } else if (summaryFee && summaryFee.textContent) {
                feeAmount = parseFloat(summaryFee.textContent.replace(/[^0-9]/g, '')) || 0;
            }
            
            // L: Giá trị mua = I * J + K
            const purchaseValue = (shares * pricePerUnit) + feeAmount;
            
            // U: Giá trị bán 1 = L * N / 365 * G + L
            let finalValue = purchaseValue * (rate / 100) / 365 * days + purchaseValue;
            
            // X: Phí bán (mặc định 0)
            const sellFee = 0;
            
            // Y: Thuế (mặc định 0)
            const tax = 0;
            
            // Z: Khách hàng thực nhận = U - X - Y
            finalValue = finalValue - sellFee - tax;
            
            // MROUND 50
            finalValue = Math.round(finalValue / 50) * 50;
            
            // Hiển thị với trạng thái không xác định
            updateFinalValueDisplay(finalValue, null, 0);

            // Reset ngày đáo hạn/bán lại
            if (resaleDateField) resaleDateField.textContent = "...";
            if (maturityDateField) maturityDateField.textContent = "...";
            
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
    if (actualAmountInput) {
      const commitAmount = () => {
        const raw = actualAmountInput.value.replace(/[^0-9]/g, '');
        const num = parseInt(raw || '0', 10) || 0;
        const committed = Math.round(num / 50) * 50; // chuẩn hóa MROUND 50
        actualAmountInput.value = committed ? committed.toLocaleString('vi-VN') : '';
        calculate();
      };
      actualAmountInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commitAmount();
          actualAmountInput.blur();
        }
      });
      actualAmountInput.addEventListener('blur', commitAmount);
    }

    // Khởi tạo lần đầu
    calculate();
}

// Trừ đi N ngày làm việc (bỏ qua T7/CN) - giống Python WORKDAY
function subtractBusinessDays(date, n) {
  const d = new Date(date);
  let remaining = n;
  while (remaining > 0) {
    d.setDate(d.getDate() - 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      remaining--;
    }
  }
  return d;
}

// Tính ngày đáo hạn từ ngày mua và kỳ hạn (tháng) - giống Python backend
// Sử dụng relativedelta logic: cộng tháng và điều chỉnh nếu rơi vào cuối tuần
function calculateMaturityDate(purchaseDate, termMonths) {
    if (!purchaseDate || !termMonths) return null;
    
    const maturityDate = new Date(purchaseDate);
    // Cộng tháng: xử lý trường hợp tháng có số ngày khác nhau (giống relativedelta)
    const currentMonth = maturityDate.getMonth();
    const currentYear = maturityDate.getFullYear();
    const currentDay = maturityDate.getDate();
    
    // Tính tháng và năm mới
    let newMonth = currentMonth + termMonths;
    let newYear = currentYear;
    
    // Xử lý tràn năm
    while (newMonth >= 12) {
        newMonth -= 12;
        newYear += 1;
    }
    while (newMonth < 0) {
        newMonth += 12;
        newYear -= 1;
    }
    
    // Tạo ngày đáo hạn, xử lý trường hợp ngày không hợp lệ (ví dụ: 31/02 -> 28/02 hoặc 29/02)
    const daysInNewMonth = new Date(newYear, newMonth + 1, 0).getDate();
    const adjustedDay = Math.min(currentDay, daysInNewMonth);
    
    maturityDate.setFullYear(newYear, newMonth, adjustedDay);
    
    // Kiểm tra nếu rơi vào cuối tuần (Saturday=6, Sunday=0) - giống Python backend
    // Python weekday return_type=2: Monday=1, Sunday=7, Saturday=6
    // JavaScript getDay(): Sunday=0, Monday=1, ..., Saturday=6
    const weekday = maturityDate.getDay();
    if (weekday === 0 || weekday === 6) {
        // Chuyển sang thứ 2 tuần sau
        // Sunday (0) -> Monday (+1), Saturday (6) -> Monday (+2)
        const daysToAdd = weekday === 0 ? 1 : 2;
        maturityDate.setDate(maturityDate.getDate() + daysToAdd);
    }
    
    return maturityDate;
}

// Tính số ngày giữa 2 ngày (chỉ tính phần ngày, không tính giờ) - giống Python backend
// Python: (maturity_dt - purchase_dt).days
function calculateDaysBetween(date1, date2) {
    if (!date1 || !date2) return 0;
    
    // Chuyển về cùng múi giờ và chỉ lấy phần ngày (bỏ qua giờ/phút/giây)
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    
    // Tính số milliseconds và chuyển sang ngày
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

function pad2(x) { return String(x).padStart(2, '0'); }
function formatDateDDMMYYYY(d) {
  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
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
