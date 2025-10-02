document.addEventListener('DOMContentLoaded', () => {
  loadCurrentDatetime();
  initSignatureActions();
  restrictStartDate();

  document.getElementById("send-btn").addEventListener("click", sendChatMessage);
  // Nhấn Enter trong ô chat để gửi
    document.getElementById("prompt").addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault(); // tránh xuống dòng
            sendChatMessage();
        }
    });
});


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
  const pdfUrl = '/fund_management/static/src/pdf/terms2.pdf';

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
    // 📤 Gửi ảnh chữ ký và PDF lên backend
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 giây timeout
    
    const response = await fetch("http://127.0.0.1:5000/api/append_signature", {
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
        birth_date: birth_date
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

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
      showConfirmButton: true,
      confirmButtonText: "Tiếp tục",
      showCancelButton: false
    }).then(result => {
      if (result.isConfirmed) {
        // Khi bấm Confirm → chuyển sang fund_confirm
        window.location.href = "/fund_confirm";
      }
    });

  } catch (err) {
    console.error("❌ Lỗi khi gửi ảnh ký tay:", err);
    
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
    
    const response = await fetch("http://127.0.0.1:5000/api/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document_base64: docBase64,
        signer: "danh.tran@example.com"
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


function sendChatMessage() {
    const input = document.getElementById("prompt");
    const message = input.value.trim();
    if (!message) {
        alert("⚠ Bạn chưa nhập nội dung!");
        return;
    }

    console.log("📤 Đang gửi tin nhắn:", message);

    const chatBox = document.getElementById("chat-messages");

    // Tin nhắn người dùng
    const userMsg = document.createElement("div");
    userMsg.className = "chat-bubble user-message mb-2";
    userMsg.textContent = message;
    chatBox.appendChild(userMsg);

    input.value = "";

    // Gửi request
    fetch("/chat_gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: message })
    })
    .then(response => {
        console.log("📥 Trạng thái HTTP:", response.status);
        if (!response.ok) throw new Error("API trả về lỗi: " + response.status);
        return response.json();
    })
    .then(data => {
        console.log("📥 Dữ liệu từ API:", data);
        const botReply = data.answer || "Không nhận được phản hồi.";

        const botMsg = document.createElement("div");
        botMsg.className = "chat-bubble bot-message mb-2";
        // Parse markdown thành HTML
        botMsg.innerHTML = marked.parse(botReply);
        chatBox.appendChild(botMsg);

        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

