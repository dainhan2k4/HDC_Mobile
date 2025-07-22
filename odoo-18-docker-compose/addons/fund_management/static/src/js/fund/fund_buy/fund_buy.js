document.addEventListener('DOMContentLoaded', () => {
  initFundSelect();
  initPaymentButton();

  initUnitsCalculation();
  const amountInput = document.getElementById('amount-input');
  formatAmountInputWithRaw(amountInput);
  loadCurrentDatetime();
  initTermsModalActions();
  initSignatureActions();

  initShareQuantityCalculation();
  restrictStartDate();

  initFeeCalculation();
//  initShareQuantityInputLimit()

   // Gán sự kiện onchange cho dropdown kỳ hạn
  const termSelect = document.getElementById('term-select');
  if (termSelect) {
    termSelect.addEventListener('change', () => {
      handleTermChange(termSelect.value);
    });

    // Gọi lần đầu nếu muốn hiển thị đúng nếu đã có giá trị mặc định là 'custom'
    handleTermChange(termSelect.value);
  }

});


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
        option.dataset.nav = fund.current_nav;
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

      fundSelect.addEventListener('change', () => {
        const selected = fundData.find(f => f.ticker === fundSelect.value);
        if (selected) {
          fundNameDisplay.textContent = selected.name;
          currentId.textContent = selected.id;
          navDisplay.textContent = Number(selected.current_nav).toLocaleString('vi-VN') + 'đ';

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


function initPaymentButton() {
  const paymentBtn = document.getElementById('payment-btn');
  const backBtn = document.getElementById('back-btn');
  const fundSelect = document.getElementById('fund-select');
  const amountInput = document.getElementById('amount-input');


  paymentBtn.addEventListener('click', () => {
    const fundName = document.getElementById('summary-fund-name').textContent;
    const units = document.getElementById('summary-units').textContent;
    const amount = document.getElementById('summary-amount').textContent.replace(/[^0-9]/g, '');
    const totalAmount = document.getElementById('summary-total').textContent.replace(/[^0-9]/g, '');
    const selectedOption = fundSelect.options[fundSelect.selectedIndex];
    const fundId = selectedOption.dataset.id;
    const fundSelectedText = selectedOption?.textContent.trim();

    if (!fundSelectedText || fundSelect.selectedIndex === 0) {
      Swal.fire({
        title: "Thiếu thông tin!",
        text: "Vui lòng chọn sản phẩm để tiếp tục.",
        icon: "warning",
        confirmButtonText: "OK",
        confirmButtonColor: "#36A2EB"
      });
      return;
    }

    // Kiểm tra điều kiện
    if (!amount || parseInt(amount.replace(/[^0-9]/g, '')) <= 0) {
      Swal.fire({
        title: "Thiếu thông tin!",
        text: "Vui lòng nhập số cổ phiếu hợp lệ để tiếp tục.",
        icon: "warning",
        confirmButtonText: "OK",
        confirmButtonColor: "#36A2EB"
      });
      return;
    }

    if (parseInt(amount.replace(/[^0-9]/g, '')) < 1000000) {
      Swal.fire({
        title: "Số tiền quá thấp!",
        text: "Số tiền đầu tư tối thiểu là 1,000,000đ.",
        icon: "warning",
        confirmButtonText: "Đã hiểu",
        confirmButtonColor: "#36A2EB"
      });
      return;
    }

    // Nếu đang chọn kỳ hạn là "Tùy chỉnh", kiểm tra khoảng ngày
    const termValue = document.getElementById('term-select')?.value;
    if (termValue === 'custom') {
      const isValid = validateCustomDateRange();
      if (!isValid) return; // 🛑 Dừng lại nếu sai
    }

    sessionStorage.setItem('selectedFundId', fundId);
    sessionStorage.setItem('selectedFundName', fundName);
    sessionStorage.setItem('selectedUnits', units);
    sessionStorage.setItem('selectedAmount', amount);
    sessionStorage.setItem('selectedTotalAmount', totalAmount);


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

function initShareQuantityCalculation() {
  const shareInput = document.getElementById('share-quantity-input');
  const navDisplay = document.getElementById('current-nav');
  const amountInput = document.getElementById('amount-input');
  const feeInput = document.getElementById('fee-input');

  const summaryAmount = document.getElementById('summary-amount');
  const summaryFee = document.getElementById('summary-fee');
  const summaryTotal = document.getElementById('summary-total');
  const summaryUnits = document.getElementById('summary-units');

  shareInput.addEventListener('input', () => {
    // Lấy số lượng cổ phiếu (raw number, không dấu)
    let rawShares = shareInput.value.replace(/[^0-9.]/g, '');

    // ✅ Giới hạn cứng 6 chữ số tại đây luôn
    if (rawShares.length > 6) {
      rawShares = rawShares.slice(0, 6);
      shareInput.value = rawShares; // Gán lại vào input để tránh lệch
    }

    const shares = parseFloat(rawShares || '0');

    // Lấy giá trị NAV hiện tại
    const navString = navDisplay.textContent.replace(/\./g, '').replace(/,/g, '.');
    const nav = parseFloat(navString.replace(/[^0-9.-]+/g, '')) || 0;

    // Tính toán số tiền mua
    const amount = shares * nav;
    const formattedAmount = Math.floor(amount).toLocaleString('vi-VN');
    amountInput.value = formattedAmount;

    // Tính phí theo như logic cũ
    let fee = 0;
    if (amount < 10000000) fee = amount * 0.003;
    else if (amount < 20000000) fee = amount * 0.002;
    else fee = amount * 0.001;

    const total = amount + fee;

    // Cập nhật các phần summary
    feeInput.value = Math.floor(fee).toLocaleString('vi-VN') + 'đ';
    summaryAmount.textContent = Math.floor(amount).toLocaleString('vi-VN') + 'đ';
    summaryFee.textContent = Math.floor(fee).toLocaleString('vi-VN') + 'đ';
    summaryTotal.textContent = Math.floor(total).toLocaleString('vi-VN') + 'đ';
    summaryUnits.textContent = shares;
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

function initSignatureActions() {
  const canvas = document.getElementById('signature-pad');
  const clearBtn = document.getElementById('clear-signature');
  const submitHandBtn = document.getElementById('submit-signature-hand');
  const submitDigitalBtn = document.getElementById('submit-signature-digital');
  const digitalStatus = document.getElementById('digital-sign-status');

  if (!canvas || !clearBtn || !submitHandBtn || !submitDigitalBtn) return;

  const ctx = canvas.getContext('2d');
  let drawing = false;

  // === KÝ TAY ===
  canvas.addEventListener('mousedown', () => {
    drawing = true;
    ctx.beginPath();
  });

  canvas.addEventListener('mouseup', () => {
    drawing = false;
    ctx.beginPath();
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  });

  clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  submitHandBtn.addEventListener('click', () => {
//    handleHandSignature(ctx, canvas);
    handleHandSignatureWithPDFAppend(ctx, canvas);
  });

  submitDigitalBtn.addEventListener('click', async () => {
    digitalStatus.textContent = "⏳ Đang thực hiện ký số...";
    await handleDigitalSignature("/fund_management/static/src/pdf/terms2.pdf", digitalStatus);
  });
}     // Giao diện ký

function handleHandSignature(ctx, canvas) {                                           // Xử lý ký tay
  const isEmpty = !ctx.getImageData(0, 0, canvas.width, canvas.height).data.some(ch => ch !== 0);
  if (isEmpty) {
    Swal.fire("Thiếu chữ ký", "Vui lòng ký vào ô để xác nhận.", "warning");
    return;
  }

  const signatureModal = bootstrap.Modal.getInstance(document.getElementById('signatureModal'));
  signatureModal.hide();

  setTimeout(() => {
    document.querySelector('#tab-digital').click();                 // chuyển sang ký số
    const modal = new bootstrap.Modal(document.getElementById('signatureModal'));
    modal.show();
  }, 300);
}

async function handleHandSignatureWithPDFAppend(ctx, canvas) {
  // 🔍 Kiểm tra nếu người dùng chưa ký gì
  const isEmpty = !ctx.getImageData(0, 0, canvas.width, canvas.height).data.some(ch => ch !== 0);
  if (isEmpty) {
    Swal.fire("Thiếu chữ ký", "Vui lòng ký vào ô để xác nhận.", "warning");
    return;
  }

  // 🖼️ Lấy ảnh chữ ký từ canvas
  const imageDataURL = canvas.toDataURL('image/png');
  const pdfUrl = '/fund_management/static/src/pdf/terms2.pdf';

  // 🧠 Gọi để lấy name và email từ Odoo
  const { name, email } = await fetchCustomerAndSendToFlask();

  // 👁️ Xem trước chữ ký và xác nhận gửi đi
  const previewImg = document.createElement("img");
  previewImg.src = imageDataURL;
  previewImg.style.maxWidth = "300px";
  previewImg.style.border = "1px solid #ccc";
  previewImg.style.display = "block";
  previewImg.style.margin = "10px auto";

  const confirmResult = await Swal.fire({
    title: "Xác nhận chữ ký",
    html: previewImg,
    showCancelButton: true,
    confirmButtonText: "Xác nhận chữ ký",
    cancelButtonText: "Hủy"
  });

  if (!confirmResult.isConfirmed) return;

  try {
    // 📤 Gửi ảnh chữ ký và PDF lên backend
    const response = await fetch("http://127.0.0.1:5000/api/append_signature", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        signature_image: imageDataURL,
        pdf_url: pdfUrl,
        name: name,
        email: email
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error("❌ API lỗi: " + error);
    }

    const blob = await response.blob();

    // 🖥️ Hiển thị nội dung PDF đã ký tay
    const pdfUrlBlob = URL.createObjectURL(blob);

    const pdfViewer = `
      <embed src="${pdfUrlBlob}#toolbar=0&navpanes=0&scrollbar=0"
             type="application/pdf"
             width="100%"
             height="600px"
             style="border: none;" />
    `;

    await Swal.fire({
      title: "Xem trước hợp đồng đã ký",
      html: pdfViewer,
      width: '70%',
      heightAuto: false,
      confirmButtonText: "Tải về",
      showCancelButton: true,
      cancelButtonText: "Đóng"
    }).then(result => {
      if (result.isConfirmed) {
        const a = document.createElement("a");
        a.href = pdfUrlBlob;
        a.download = "document_signed_by_hand.pdf";
        a.click();
        URL.revokeObjectURL(pdfUrlBlob);
      }
    });

  } catch (err) {
    console.error("❌ Lỗi khi gửi ảnh ký tay:", err);
    Swal.fire("Lỗi", "Không thể xử lý chữ ký tay", "error");
  }
}

async function handleDigitalSignature(pdfUrl, digitalStatusElement) {
  try {
    const docBase64 = await fetchPDFAsBase64(pdfUrl);

    const response = await fetch("http://127.0.0.1:5000/api/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document_base64: docBase64,
        signer: "danh.tran@example.com"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("⚠️ Lỗi phản hồi:", errorText);
      digitalStatusElement.textContent = "❌ Ký số thất bại.";
      return;
    }

    const result = await response.json();
    if (result.success) {
      digitalStatusElement.textContent = `✅ Đã ký số lúc ${result.timestamp}`;
      localStorage.setItem("digital_signature", result.signature);
      setTimeout(() => {
        bootstrap.Modal.getInstance(document.getElementById('signatureModal')).hide();
        window.location.href = '/fund_confirm';
      }, 1000);
    } else {
      digitalStatusElement.textContent = "❌ Ký số thất bại.";
    }
  } catch (error) {
    console.error("❌ Lỗi kết nối ký số:", error);
    digitalStatusElement.textContent = "❌ Lỗi kết nối ký số.";
  }
}

async function fetchPDFAsBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1]; // Remove "data:application/pdf;base64,"
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}


window.handleTermChange = function(value) {
  const customDateDiv = document.getElementById('custom-date-range');
  if (customDateDiv) {
    customDateDiv.style.display = value === 'custom' ? 'block' : 'none';
  }
};

function validateCustomDateRange() {
  const startInput = document.getElementById('start-date');
  const endInput = document.getElementById('end-date');

  const startDate = new Date(startInput.value);
  const endDate = new Date(endInput.value);

  // Kiểm tra người dùng đã chọn đủ cả 2 ngày
  if (!startInput.value || !endInput.value) {
    Swal.fire({
      title: "Thiếu thông tin!",
      text: "Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.",
      icon: "warning",
      confirmButtonText: "OK",
      confirmButtonColor: "#36A2EB"
    });
    return false;
  }

  // Tính số ngày giữa 2 mốc
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24); // convert milliseconds to days

  if (diffDays < 30) {
    Swal.fire({
      title: "Thời gian không hợp lệ!",
      text: "Kỳ hạn phải lớn hơn hoặc bằng 30 ngày.",
      icon: "warning",
      confirmButtonText: "OK",
      confirmButtonColor: "#36A2EB"
    });
    return false;
  }

  return true; // hợp lệ
}


function restrictStartDate() {
  const startDateInput = document.getElementById('start-date');
  if (!startDateInput) return;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0'); // Tháng từ 0 → 11
  const dd = String(today.getDate()).padStart(2, '0');

  const minDate = `${yyyy}-${mm}-${dd}`;
  startDateInput.setAttribute('min', minDate);
}

function initShareQuantityInputLimit() {
  const shareInput = document.getElementById('share-quantity-input');

  shareInput.addEventListener('input', () => {
    let raw = shareInput.value.replace(/\D/g, ''); // Loại bỏ mọi ký tự không phải số

    if (raw.length > 6) {
      raw = raw.slice(0, 6); // Giới hạn 6 chữ số
    }

    shareInput.value = raw;
  });
}

async function fetchCustomerAndSendToFlask() {
  try {
    const response = await fetch("http://localhost:8069/data_personal_profile", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("❌ Lỗi khi gọi API Odoo");
    }

    const data = await response.json();
    const { name, email } = data[0] || {};
    return { name, email };
  } catch (error) {
    console.error("Lỗi lấy thông tin người dùng:", error);
    return { name: "", email: "" };  // fallback
  }
}