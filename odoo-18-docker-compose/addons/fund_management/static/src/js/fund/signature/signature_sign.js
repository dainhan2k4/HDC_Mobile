// Force refresh - v2.3 - Improved modal layout - Timestamp: 2024-12-19
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔧 signature_sign.js loaded - v2.3');
  loadCurrentDatetime();
  initSignatureActions();
  initSignatureTypeCards();
  restrictStartDate();

});

// Initialize signature type cards click handlers
function initSignatureTypeCards() {
  const signatureTypeCards = document.querySelectorAll('.signature-type-card');
  const handSignTab = document.getElementById('hand-sign');
  const digitalSignTab = document.getElementById('digital-sign');
  
  signatureTypeCards.forEach(card => {
    card.addEventListener('click', function() {
      const target = this.getAttribute('data-target');
      if (!target) return;
      
      // Remove active class from all cards
      signatureTypeCards.forEach(c => c.classList.remove('active'));
      // Add active class to clicked card
      this.classList.add('active');
      
      // Switch tab
      const tabButton = document.querySelector(`[data-bs-target="#${target}"]`);
      if (tabButton) {
        const tab = new bootstrap.Tab(tabButton);
        tab.show();
      }
      
      // Ẩn/hiện phần ký tay dựa trên tab được chọn
      if (target === 'digital-sign') {
        // Ẩn phần ký tay khi chọn ký số
        if (handSignTab) {
          handSignTab.style.display = 'none';
        }
        // Đảm bảo tab ký số được hiển thị
        if (digitalSignTab) {
          digitalSignTab.style.display = 'block';
          digitalSignTab.classList.add('show', 'active');
        }
      } else if (target === 'hand-sign') {
        // Hiện phần ký tay khi chọn ký tay
        if (handSignTab) {
          handSignTab.style.display = 'block';
          handSignTab.classList.add('show', 'active');
        }
        // Ẩn tab ký số
        if (digitalSignTab) {
          digitalSignTab.style.display = 'none';
          digitalSignTab.classList.remove('show', 'active');
        }
      }
    });
  });
  
  // Update active card when tab changes
  const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
  tabButtons.forEach(button => {
    button.addEventListener('shown.bs.tab', function(event) {
      const targetId = event.target.getAttribute('data-bs-target');
      if (!targetId) return;
      
      // Remove active from all cards
      signatureTypeCards.forEach(c => c.classList.remove('active'));
      
      // Find and activate corresponding card
      const targetCard = document.querySelector(`[data-target="${targetId.replace('#', '')}"]`);
      if (targetCard) {
        targetCard.classList.add('active');
      }
      
      // Ẩn/hiện phần ký tay dựa trên tab được chọn
      if (targetId === '#digital-sign') {
        // Ẩn phần ký tay khi chọn ký số
        if (handSignTab) {
          handSignTab.style.display = 'none';
          handSignTab.classList.remove('show', 'active');
        }
        // Đảm bảo tab ký số được hiển thị
        if (digitalSignTab) {
          digitalSignTab.style.display = 'block';
          digitalSignTab.classList.add('show', 'active');
        }
      } else if (targetId === '#hand-sign') {
        // Hiện phần ký tay khi chọn ký tay
        if (handSignTab) {
          handSignTab.style.display = 'block';
          handSignTab.classList.add('show', 'active');
        }
        // Ẩn tab ký số
        if (digitalSignTab) {
          digitalSignTab.style.display = 'none';
          digitalSignTab.classList.remove('show', 'active');
        }
      }
    });
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


// Giao diện ký
function initSignatureActions() {
  const canvas = document.getElementById('signature-pad');
  const clearBtn = document.getElementById('clear-signature');
  const submitHandBtn = document.getElementById('submit-signature-hand');
  const submitDigitalBtn = document.getElementById('submit-signature-digital');
  const digitalStatus = document.getElementById('digital-sign-status');

  if (!canvas || !clearBtn || !submitHandBtn || !submitDigitalBtn) return;

  const ctx = canvas.getContext('2d');
  let drawing = false;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#000';

  function getCanvasPos(evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (evt.touches && evt.touches.length) {
      const t = evt.touches[0];
      return {
        x: (t.clientX - rect.left) * scaleX,
        y: (t.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (evt.clientX - rect.left) * scaleX,
      y: (evt.clientY - rect.top) * scaleY,
    };
  }

  // === KÝ TAY ===
  canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    const { x, y } = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  });

  // Loại bỏ real-time preview - quay lại cách preview sau khi xác nhận

  canvas.addEventListener('mouseup', () => {
    drawing = false;
    ctx.beginPath();
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    const { x, y } = getCanvasPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  });

  // Touch support
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    drawing = true;
    const { x, y } = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!drawing) return;
    const { x, y } = getCanvasPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    drawing = false;
    ctx.beginPath();
  }, { passive: false });

  clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  submitHandBtn.addEventListener('click', () => {
//    handleHandSignature(ctx, canvas);
    handleHandSignatureWithPDFAppend(ctx, canvas);
  });

  submitDigitalBtn.addEventListener('click', async () => {
    digitalStatus.textContent = "⏳ Đang thực hiện ký số...";
    const pdfUrl = resolvePdfUrl();
    await handleDigitalSignature(pdfUrl, digitalStatus);
  });
}

// Xử lý chưa ký tay
function handleHandSignature(ctx, canvas) {
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

// Xử lý chữ ký và điền thông tin vào pdf
async function handleHandSignatureWithPDFAppend(ctx, canvas) {
  // 🔍 Kiểm tra nếu người dùng chưa ký gì
  const isEmpty = !ctx.getImageData(0, 0, canvas.width, canvas.height).data.some(ch => ch !== 0);
  if (isEmpty) {
    Swal.fire("Thiếu chữ ký", "Vui lòng ký vào ô để xác nhận.", "warning");
    return;
  }

  // 🖼️ Lấy ảnh chữ ký từ canvas
  const imageDataURL = canvas.toDataURL('image/png');
  const pdfUrl = resolvePdfUrl();

  // 🧠 Gọi để lấy name và email từ Odoo
  const { name, email, phone, id_number, birth_date } = await fetchCustomerAndSendToFlask();

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
    // Hiển thị loading
    Swal.fire({
      title: "Đang xử lý...",
      text: "Vui lòng chờ trong giây lát",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      }
    });

    // 📤 Gửi ảnh chữ ký và PDF lên backend
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 giây timeout
    
    const apiUrl = resolveSignServiceUrl('/api/append_signature');
    console.log('🔧 API URL:', apiUrl);
    console.log('🔧 PDF URL:', pdfUrl);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        signature_image: imageDataURL,
        pdf_url: pdfUrl,
        name: name,
        email: email,
        phone: phone,
        id_number: id_number,
        birth_date: birth_date,
        positions: resolveSignaturePositions()
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error("❌ API lỗi: " + error);
    }

    const blob = await response.blob();
    const pdfUrlBlob = URL.createObjectURL(blob);

    // Hiển thị preview hợp đồng đã ký trong SweetAlert
    const pdfPreview = document.createElement('embed');
    pdfPreview.src = pdfUrlBlob + '#toolbar=1&navpanes=1&scrollbar=1';
    pdfPreview.type = 'application/pdf';
    pdfPreview.style.width = '100%';
    pdfPreview.style.height = '600px';
    pdfPreview.style.border = '1px solid #ccc';
    pdfPreview.style.borderRadius = '4px';

    // Đóng loading và hiển thị preview
    Swal.close();

    const previewResult = await Swal.fire({
      title: 'Xem trước hợp đồng đã ký',
      html: pdfPreview,
      width: '70%',
      heightAuto: false,
      showConfirmButton: true,
      confirmButtonText: 'Xác nhận',
      showCancelButton: true,
      cancelButtonText: 'Hủy',
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: {
        popup: 'swal-wide'
      }
    });

    if (!previewResult.isConfirmed) {
      // Nếu hủy, quay lại modal ký
      return;
    }

    // Đóng modal và chuyển tiếp
    const signatureModal = bootstrap.Modal.getInstance(document.getElementById('signatureModal'));
    if (signatureModal) {
      signatureModal.hide();
    }

    // Chuyển sang trang fund_confirm
    window.location.href = "/fund_confirm";

  } catch (err) {
    console.error("❌ Lỗi khi gửi ảnh ký tay:", err);
    
    // Đóng loading
    Swal.close();
    
    let errorMessage = "Không thể xử lý chữ ký tay";
    if (err.name === 'AbortError') {
      errorMessage = "Yêu cầu bị timeout. Vui lòng thử lại.";
    } else if (err.message.includes('Failed to fetch')) {
      errorMessage = "Không thể kết nối đến service ký tay. Vui lòng kiểm tra kết nối.";
    }
    
    Swal.fire("Lỗi", errorMessage, "error");
  }
}

// Ký số
async function handleDigitalSignature(pdfUrl, digitalStatusElement) {
  try {
    const docBase64 = await fetchPDFAsBase64(pdfUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 giây timeout
    
    const response = await fetch(resolveSignServiceUrl('/api/sign'), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document_base64: docBase64,
        signer: resolveSignerIdentifier(),
        positions: resolveSignaturePositions()
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("⚠️ Lỗi phản hồi:", errorText);
      digitalStatusElement.textContent = "❌ Ký số thất bại.";
      return;
    }

    const blob = await response.blob();
    const pdfUrlBlob = URL.createObjectURL(blob);

    // Hiển thị preview hợp đồng đã ký số trong SweetAlert
    const pdfPreview = document.createElement('embed');
    pdfPreview.src = pdfUrlBlob + '#toolbar=1&navpanes=1&scrollbar=1';
    pdfPreview.type = 'application/pdf';
    pdfPreview.style.width = '100%';
    pdfPreview.style.height = '600px';
    pdfPreview.style.border = '1px solid #ccc';
    pdfPreview.style.borderRadius = '4px';

    const previewResult = await Swal.fire({
      title: "Xem trước hợp đồng đã ký số",
      html: pdfPreview,
      width: '70%',
      heightAuto: false,
      showConfirmButton: true,
      confirmButtonText: "Xác nhận",
      showCancelButton: true,
      cancelButtonText: 'Hủy',
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: {
        popup: 'swal-wide'
      }
    });

    if (previewResult.isConfirmed) {
      const signatureModal = bootstrap.Modal.getInstance(document.getElementById('signatureModal'));
      if (signatureModal) {
        signatureModal.hide();
      }
      window.location.href = '/fund_confirm';
    }
  } catch (error) {
    console.error("❌ Lỗi kết nối ký số:", error);
    
    let errorMessage = "❌ Lỗi kết nối ký số.";
    if (error.name === 'AbortError') {
      errorMessage = "❌ Yêu cầu bị timeout. Vui lòng thử lại.";
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage = "❌ Không thể kết nối đến service ký số. Vui lòng kiểm tra kết nối.";
    }
    
    digitalStatusElement.textContent = errorMessage;
  }
}

// Fetch file PDF
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



// Giới hạn ngày bắt đầu
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



const ODOO_BASE_URL = window.location.origin;
// Lấy thông tin user
async function fetchCustomerAndSendToFlask() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 giây timeout
    
    const response = await fetch(`${ODOO_BASE_URL}/data_personal_profile`, {
      method: "GET",
      credentials: "include",
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`❌ Lỗi khi gọi API Odoo: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    const {
      name = "",
      email = "",
      phone = "",
      id_number = "",
      birth_date = ""
    } = data[0] || {};

    return { name, email, phone, id_number, birth_date };
  } catch (error) {
    return {
      name: "",
      email: "",
      phone: "",
      id_number: "",
      birth_date: ""
    };
  }
}


// ==== Helpers cấu hình tránh hardcode ====
function resolveSignServiceUrl(pathname) {
  // Gọi trực tiếp same-origin API, không base-path, không hardcode host/port
  const url = pathname;
  console.log('🔧 resolveSignServiceUrl:', url);
  console.log('🔧 Current location:', window.location.href);
  return url;
}

function resolvePdfUrl() {
  // Ưu tiên lấy từ meta hoặc biến toàn cục được server render theo hợp đồng hiện tại
  const fromMeta = document.querySelector('meta[name="contract-pdf-url"]')?.getAttribute('content');
  if (fromMeta) {
    console.log('🔧 resolvePdfUrl from meta:', fromMeta);
    return fromMeta;
  }
  if (window.Contract && window.Contract.pdfUrl) {
    console.log('🔧 resolvePdfUrl from window.Contract:', window.Contract.pdfUrl);
    return window.Contract.pdfUrl;
  }
  const defaultUrl = '/fund_management/static/src/pdf/terms2.pdf';
  console.log('🔧 resolvePdfUrl default:', defaultUrl);
  return defaultUrl;
}

function resolveSignerIdentifier() {
  // Lấy email/username từ thông tin người dùng nếu có; fallback rỗng
  const email = (window.CurrentUser && window.CurrentUser.email)
    || document.querySelector('meta[name="current-user-email"]')?.getAttribute('content')
    || '';
  return email;
}

function resolveSignaturePositions() {
  // Cho phép ghi đè vị trí qua meta JSON hoặc biến toàn cục; nếu không có trả undefined
  const meta = document.querySelector('meta[name="signature-positions"]')?.getAttribute('content');
  try {
    if (meta) return JSON.parse(meta);
  } catch (_) {}
  if (window.SignaturePositions) return window.SignaturePositions;
  return undefined;
}



