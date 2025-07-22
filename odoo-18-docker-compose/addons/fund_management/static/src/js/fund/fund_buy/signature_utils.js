


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
    handleHandSignature(ctx, canvas);
  });

  submitDigitalBtn.addEventListener('click', async () => {
    digitalStatus.textContent = "⏳ Đang thực hiện ký số...";
    await handleDigitalSignature("/fund_management/static/src/pdf/terms2.pdf", digitalStatus);
  });
}

function handleHandSignature(ctx, canvas) {
  const isEmpty = !ctx.getImageData(0, 0, canvas.width, canvas.height).data.some(ch => ch !== 0);
  if (isEmpty) {
    Swal.fire("Thiếu chữ ký", "Vui lòng ký vào ô để xác nhận.", "warning");
    return;
  }

  const signatureModal = bootstrap.Modal.getInstance(document.getElementById('signatureModal'));
  signatureModal.hide();

  setTimeout(() => {
    document.querySelector('#tab-digital').click();
    const modal = new bootstrap.Modal(document.getElementById('signatureModal'));
    modal.show();
  }, 300);
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



// Fallback cho SweetAlert và Bootstrap
if (typeof Swal === 'undefined') {
  window.Swal = {
    fire: function(options) {
      if (typeof options === 'string') {
        alert(options);
      } else {
        alert(options.title || 'Thông báo');
      }
    }
  };
}

if (typeof bootstrap === 'undefined') {
  window.bootstrap = {
    Modal: function(element) {
      return {
        show: function() {
          if (element) element.style.display = 'block';
        },
        hide: function() {
          if (element) element.style.display = 'none';
        }
      };
    }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  initTermsModalActions();
  initSignatureActions();
});