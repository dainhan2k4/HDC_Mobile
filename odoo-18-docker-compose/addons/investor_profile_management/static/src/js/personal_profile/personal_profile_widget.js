// Personal Profile Widget Component
console.log('Loading PersonalProfileWidget component...');

const { Component, xml, useState, onMounted } = owl;

class PersonalProfileWidget extends Component {
    // Configuration constants
    static CONFIG = {
        FACE_API: {
            VERSION: '0.22.2',
            VLADMANDIC_VERSION: '1.7.14',
            CDN_SOURCES: [
                'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js',
                'https://unpkg.com/face-api.js@0.22.2/dist/face-api.min.js',
                'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.js'
            ],
            MODEL_SOURCES: [
                'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model',
                'https://unpkg.com/@vladmandic/face-api@1.7.14/model',
                'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights',
                'https://unpkg.com/face-api.js@0.22.2/weights'
            ],
            LOCAL_PATHS: [
                '/web/static/lib/face-api/face-api.min.js',
                '/static/lib/face-api/face-api.min.js',
                '/face-api.min.js'
            ],
            TIMEOUTS: {
                SCRIPT_LOAD: 8000,
                MODEL_LOAD: 12000,
                INITIALIZATION: 1000
            }
        },
        DETECTION: {
            INPUT_SIZE: 320,
            SCORE_THRESHOLD: 0.3,
            INTERVAL: 1000,
            PERFECT_FACE_THRESHOLD: 3
        },
        CAPTURE: {
            REQUIREMENTS: {
                front: 3,
                left: 2,
                right: 2
            },
            INSTRUCTIONS: {
                front: 'Nhìn thẳng vào camera và giữ nguyên tư thế',
                left: 'Quay mặt sang trái một góc 45 độ',
                right: 'Quay mặt sang phải một góc 45 độ'
            }
        }
    };

    static template = xml`
        <div class="bg-light p-4">
          <div class="container bg-white rounded-3 shadow-sm p-4">
            <div class="row g-4">
              <!-- Sidebar -->
              <aside class="col-md-4">
                <section class="bg-light rounded-3 p-3 mb-3">
                  <h2 class="fw-bold fs-5 text-dark mb-2"><t t-esc="state.profile.name || 'Chưa có thông tin'" /></h2>
                  <p class="small text-secondary mb-1">Số TK: <span class="font-monospace"><t t-esc="state.statusInfo.so_tk || 'Chưa có'" /></span></p>
                  <p class="small text-secondary mb-1">Mã giới thiệu: <span class="font-monospace"><t t-esc="state.statusInfo.ma_gioi_thieu || 'Chưa có'" /></span></p>
                  <p class="small text-secondary mb-1">Trạng thái TK đầu tư:
                    <span t-if="state.statusInfo.trang_thai_tk_dau_tu == 'da_duyet'" class="badge rounded-pill px-2 py-1 fw-semibold bg-success">Đã duyệt</span>
                    <span t-elif="state.statusInfo.trang_thai_tk_dau_tu == 'cho_duyet'" class="badge rounded-pill px-2 py-1 fw-semibold bg-warning text-dark">Chờ duyệt</span>
                    <span t-elif="state.statusInfo.trang_thai_tk_dau_tu == 'tu_choi'" class="badge rounded-pill px-2 py-1 fw-semibold" style="background-color:#f97316;color:white">Từ chối</span>
                    <span t-else="" class="badge rounded-pill px-2 py-1 fw-semibold bg-secondary">Chưa có</span>
                  </p>
                  <p class="small text-secondary mb-1">Hồ sơ gốc:
                    <span t-if="state.statusInfo.ho_so_goc == 'da_nhan'" class="badge rounded-pill px-2 py-1 fw-semibold bg-success">Đã nhận</span>
                    <span t-elif="state.statusInfo.ho_so_goc == 'chua_nhan'" class="badge rounded-pill px-2 py-1 fw-semibold bg-warning text-dark">Chưa nhận</span>
                    <span t-else="" class="badge rounded-pill px-2 py-1 fw-semibold bg-secondary">Chưa có</span>
                  </p>
                  <t t-if="state.statusInfo.rm_name and state.statusInfo.rm_id">
                    <p class="small text-secondary mb-1">RM: <t t-esc="state.statusInfo.rm_name" />-<t t-esc="state.statusInfo.rm_id" /></p>
                  </t>
                  <t t-if="state.statusInfo.bda_name and state.statusInfo.bda_id">
                    <p class="small text-secondary mb-1">BDA: <t t-esc="state.statusInfo.bda_name" />-<t t-esc="state.statusInfo.bda_id" /></p>
                  </t>
                </section>
                <nav class="nav nav-pills flex-column bg-white rounded-3 shadow-sm p-3 mb-3 gap-2">
                  <a href="/personal_profile" class="nav-link py-2 px-3 fw-semibold" t-att-class="window.location.pathname=='/personal_profile' ? 'active text-white shadow-sm' : 'text-dark'" t-att-style="window.location.pathname=='/personal_profile' ? 'background-color:#f97316' : ''">Thông tin cá nhân</a>
                  <a href="/bank_info" class="nav-link py-2 px-3 fw-semibold" t-att-class="window.location.pathname=='/bank_info' ? 'active text-white shadow-sm' : 'text-dark'" t-att-style="window.location.pathname=='/bank_info' ? 'background-color:#f97316' : ''">Thông tin tài khoản ngân hàng</a>
                  <a href="/address_info" class="nav-link py-2 px-3 fw-semibold" t-att-class="window.location.pathname=='/address_info' ? 'active text-white shadow-sm' : 'text-dark'" t-att-style="window.location.pathname=='/address_info' ? 'background-color:#f97316' : ''">Thông tin địa chỉ</a>
                  <a href="/verification" class="nav-link py-2 px-3 fw-semibold" t-att-class="window.location.pathname=='/verification' ? 'active text-white shadow-sm' : 'text-dark'" t-att-style="window.location.pathname=='/verification' ? 'background-color:#f97316' : ''">Xác thực hoàn tất</a>
                </nav>
              </aside>
              <!-- Main content -->
              <section class="col-md-8 bg-white rounded-3 shadow-sm p-4">
                <h3 class="text-secondary fw-semibold mb-4">Thông tin cá nhân</h3>
                <form class="row g-3" t-on-submit.prevent="saveProfile">
                  <fieldset>
                    <legend class="fw-bold fs-6 mb-3">1. Thông tin nhà đầu tư</legend>
                    <div class="col-12 mb-3">
                      <label for="fullname" class="form-label">Họ &amp; Tên đầy đủ <span style="color:#f97316">*</span></label>
                      <input id="fullname" type="text" class="form-control bg-gray-100" t-model="state.formData.name" required="required" />
                    </div>
                    <div class="col-12 mb-3">
                      <label class="form-label">Giới tính <span style="color:#f97316">*</span></label>
                      <div>
                        <div class="form-check form-check-inline bg-gray-100 rounded px-2 py-1">
                          <input class="form-check-input" type="radio" name="gender" value="male" t-model="state.formData.gender" id="gender_male" />
                          <label class="form-check-label" for="gender_male">Nam</label>
                        </div>
                        <div class="form-check form-check-inline bg-gray-100 rounded px-2 py-1">
                          <input class="form-check-input" type="radio" name="gender" value="female" t-model="state.formData.gender" id="gender_female" />
                          <label class="form-check-label" for="gender_female">Nữ</label>
                        </div>
                      </div>
                    </div>
                    <div class="col-12 mb-3">
                      <label for="birth_date" class="form-label">Ngày sinh <span style="color:#f97316">*</span></label>
                      <input id="birth_date" type="date" t-model="state.formData.birth_date" required="required" class="form-control bg-gray-100" />
                    </div>
                    <div class="col-12 mb-3">
                      <label for="nationality" class="form-label">Quốc tịch <span style="color:#f97316">*</span></label>
                      <select id="nationality" t-model="state.formData.nationality" required="required" class="form-select bg-gray-100">
                        <option value="">Chọn quốc tịch</option>
                        <t t-foreach="state.countries" t-as="country" t-key="country.id">
                          <option t-att-value="toString(country.id)"><t t-esc="country.name" /></option>
                        </t>
                      </select>
                    </div>
                    <div class="col-12 mb-3">
                      <label for="email" class="form-label">Email</label>
                      <input id="email" type="email" t-model="state.formData.email" class="form-control"/>
                    </div>
                    <div class="col-12 mb-3">
                      <label for="phone" class="form-label">Số điện thoại <span style="color:#f97316">*</span></label>
                      <input id="phone" type="tel" t-model="state.formData.phone" 
                             pattern="[0-9]{10}" 
                             title="Số điện thoại phải có đúng 10 chữ số"
                             maxlength="10"
                             required="required" 
                             t-on-input="onPhoneInput"
                             class="form-control"/>
                      <div class="form-text">Nhập đúng 10 chữ số (ví dụ: 0123456789)</div>
                    </div>
                  </fieldset>
                  <fieldset>
                    <legend class="fw-bold fs-6 mb-3">2. Thông tin CMND/CCCD/Mã GD chứng khoán</legend>
                    <div class="col-12 mb-3">
                      <label for="id-type" class="form-label">Loại giấy tờ <span style="color:#f97316">*</span></label>
                      <select id="id-type" t-model="state.formData.id_type" required="required" class="form-select">
                        <option value="id_card">CMND/CCCD</option>
                        <option value="passport">Hộ chiếu</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                    <div class="col-12 mb-3">
                      <label for="id-number" class="form-label">Số hiệu giấy tờ <span style="color:#f97316">*</span></label>
                      <input id="id-number" type="text" t-model="state.formData.id_number" required="required" class="form-control bg-gray-100" />
                    </div>
                    <div class="col-12 mb-3">
                      <label for="id_issue_date" class="form-label">Ngày cấp <span style="color:#f97316">*</span></label>
                      <input id="id_issue_date" type="date" t-model="state.formData.id_issue_date" required="required" class="form-control bg-gray-100" />
                    </div>
                    <div class="col-12 mb-3">
                      <label for="id_issue_place" class="form-label">Nơi cấp <span style="color:#f97316">*</span></label>
                      <input id="id_issue_place" type="text" t-model="state.formData.id_issue_place" required="required" class="form-control bg-gray-100" />
                    </div>
                    <div class="col-12 mb-3">
                      <label class="form-label">Tải hình ảnh rõ ràng giấy tờ CMND/CCCD/ Mã GD chứng khoán <span style="color:#f97316">*</span></label>
                      <div class="text-secondary small mb-2">Giấy tờ còn hạn sử dụng, đủ ánh sáng, là hình gốc, không scan và photocopy, dung lượng tệp tối đa 10 MB</div>
                      <div class="text-info small mb-2">
                        <i class="fas fa-info-circle"></i> Thông tin sẽ được tự động trích xuất khi upload ảnh
                      </div>
                      <div class="row g-2">
                        <!-- Box upload mặt trước -->
                        <div class="col-md-6">
                          <label class="upload-box"
                            style="border:1.5px dashed #bbb; border-radius:10px; min-height:200px; display:flex; align-items:center; justify-content:center; background:#fafbfc; width:100%; cursor:pointer; flex-direction:column; transition:box-shadow .2s;"
                            onmouseover="this.style.boxShadow='0 0 0 2px #f9731633';"
                            onmouseout="this.style.boxShadow='none';"
                          >
                            <input type="file" accept="image/*" style="display:none;" t-on-change="onEkycFront" />
                            <t t-if="!state.ekycFiles.frontPreview and !state.ocrLoading.front">
                              <i class="fa fa-upload" style="font-size:2rem;color:#888;"></i>
                              <div class="mt-2 text-primary fw-semibold">Chọn ảnh mặt trước</div>
                            </t>
                            <t t-if="state.ocrLoading.front">
                              <div class="text-center">
                                <div class="spinner-border" role="status" style="color:#f97316">
                                  <span class="visually-hidden">Đang xử lý...</span>
                                </div>
                                <div class="mt-2 fw-semibold" style="color:#f97316">Đang trích xuất thông tin...</div>
                              </div>
                            </t>
                            <t t-if="state.ekycFiles.frontPreview and !state.ocrLoading.front">
                              <img t-att-src="state.ekycFiles.frontPreview" alt="Preview Mặt trước CCCD" style="max-width:100%;max-height:140px;border-radius:6px;border:1px solid #ccc;" />
                              <button type="button" class="btn btn-sm mt-2" style="color:#f97316;border-color:#f97316" t-on-click="removeFrontImage">Xóa</button>
                            </t>
                          </label>
                        </div>
                        <!-- Box upload mặt sau -->
                        <div class="col-md-6">
                          <label class="upload-box"
                            style="border:1.5px dashed #bbb; border-radius:10px; min-height:200px; display:flex; align-items:center; justify-content:center; background:#fafbfc; width:100%; cursor:pointer; flex-direction:column; transition:box-shadow .2s;"
                            onmouseover="this.style.boxShadow='0 0 0 2px #f9731633';"
                            onmouseout="this.style.boxShadow='none';"
                          >
                            <input type="file" accept="image/*" style="display:none;" t-on-change="onEkycBack" />
                            <t t-if="!state.ekycFiles.backPreview and !state.ocrLoading.back">
                              <i class="fa fa-upload" style="font-size:2rem;color:#888;"></i>
                              <div class="mt-2 text-primary fw-semibold">Chọn ảnh mặt sau</div>
                            </t>
                            <t t-if="state.ocrLoading.back">
                              <div class="text-center">
                                <div class="spinner-border" role="status" style="color:#f97316">
                                  <span class="visually-hidden">Đang xử lý...</span>
                                </div>
                                <div class="mt-2 fw-semibold" style="color:#f97316">Đang trích xuất thông tin...</div>
                              </div>
                            </t>
                            <t t-if="state.ekycFiles.backPreview and !state.ocrLoading.back">
                              <img t-att-src="state.ekycFiles.backPreview" alt="Preview Mặt sau CCCD" style="max-width:100%;max-height:140px;border-radius:6px;border:1px solid #ccc;" />
                              <button type="button" class="btn btn-sm mt-2" style="color:#f97316;border-color:#f97316" t-on-click="removeBackImage">Xóa</button>
                            </t>
                          </label>
                        </div>
                      </div>
                    </div>
                    <button type="button" class="btn btn-sm fw-semibold rounded-pill mt-2" style="background-color:#f97316;border-color:#f97316;color:white" t-on-click="startEkycVerification">Xác thực eKYC</button>
                    <div t-if="state.ekycLoading" class="text-info mt-2">Đang xác thực eKYC...</div>
                    <div t-if="state.ekycError" class="mt-2" style="color:#f97316"><t t-esc="state.ekycError" /></div>
                  </fieldset>
                  <div class="col-12 d-flex justify-content-end gap-2 mt-3">
                    <button type="submit" class="btn btn-sm fw-semibold rounded-pill" style="background-color:#f97316;border-color:#f97316;color:white">Lưu Thông Tin</button>
                  </div>
                </form>
              </section>
            </div>
          </div>
        </div>

        <!-- eKYC Camera Modal -->
        <div t-if="state.showEkycModal" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.8); z-index: 9999;">
          <style>
            .face-frame-main {
              animation: pulse 2s infinite;
            }
            
            .corner-indicator {
              animation: cornerPulse 1.5s infinite;
            }
            
            .guide-line {
              animation: guidePulse 2s infinite;
            }
            
            .face-position-indicator {
              animation: facePulse 1s infinite;
            }
            
            .instruction-text {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .instruction-text i {
              font-size: 14px;
            }
            
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.02); }
            }
            
            @keyframes cornerPulse {
              0%, 100% { opacity: 0.7; }
              50% { opacity: 1; }
            }
            
            @keyframes guidePulse {
              0%, 100% { opacity: 0.4; }
              50% { opacity: 0.8; }
            }
            
            @keyframes facePulse {
              0%, 100% { transform: translate(-50%, -50%) scale(1); }
              50% { transform: translate(-50%, -50%) scale(1.05); }
            }
            
            .face-frame-overlay {
              filter: drop-shadow(0 0 10px rgba(0,0,0,0.3));
            }
            
            .progress-ring {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
            }
            
            .progress-ring-svg {
              transform: rotate(-90deg);
            }
            
            .progress-ring-bg {
              stroke: rgba(255, 255, 255, 0.3);
              stroke-width: 4;
              fill: none;
            }
            
            .progress-ring-fill {
              stroke-linecap: round;
              transition: stroke-dashoffset 0.5s ease;
            }
            
            .center-crosshair {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 20px;
              height: 20px;
            }
            
            .crosshair-line {
              position: absolute;
              background: rgba(255, 255, 255, 0.6);
              transition: all 0.3s ease;
            }
            
            .crosshair-line.horizontal {
              width: 20px;
              height: 2px;
              top: 50%;
              left: 0;
              transform: translateY(-50%);
            }
            
            .crosshair-line.vertical {
              width: 2px;
              height: 20px;
              left: 50%;
              top: 0;
              transform: translateX(-50%);
            }
            
            .face-circle {
              width: 100%;
              height: 100%;
              border-radius: 50%;
              background: transparent;
            }
            
            .progress-container {
              background: rgba(255,255,255,0.1);
              padding: 15px;
              border-radius: 10px;
              border: 1px solid rgba(255,255,255,0.2);
            }
            
            .progress-text {
              color: white;
              font-size: 14px;
            }
            
            .progress-percentage {
              color: #ff6b6b;
              font-size: 16px;
            }
            
            .progress-steps {
              margin-top: 10px;
            }
            
            .progress-step {
              flex: 1;
              text-align: center;
            }
            
            .step-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              margin: 0 auto;
              transition: all 0.3s ease;
            }
            
            .camera-controls {
              margin-top: 2rem;
            }
            
            .camera-controls .btn {
              min-width: 140px;
              font-weight: 500;
              border-radius: 8px;
              transition: all 0.3s ease;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            }
            
            .camera-controls .btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
            
            .camera-controls .btn:disabled {
              opacity: 0.6;
              transform: none;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .camera-controls .btn-primary {
              background: linear-gradient(135deg, #007bff, #0056b3);
              border: none;
            }
            
            .camera-controls .btn-success {
              background: linear-gradient(135deg, #28a745, #1e7e34);
              border: none;
            }
            
            .camera-controls .btn-danger {
              background: #f97316;
              border: none;
            }
            
            .progress-step.completed .step-dot {
              background: #28a745;
              box-shadow: 0 0 8px rgba(40, 167, 69, 0.6);
            }
            
            .progress-step.partial .step-dot {
              background: #ffc107;
              box-shadow: 0 0 8px rgba(255, 193, 7, 0.6);
            }
            
            .progress-step.pending .step-dot {
              background: rgba(255,255,255,0.3);
              border: 1px solid rgba(255,255,255,0.5);
            }
          </style>
          <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content" style="border:2px solid #f97316;">
              <div class="modal-header" style="border-bottom:1px solid #f97316;">
                <h5 class="modal-title" style="color:#f97316;">
                  <i class="fas fa-camera"></i> Xác thực eKYC
                </h5>
                <button type="button" class="btn-close" t-on-click="closeEkycModal"></button>
              </div>
              <div class="modal-body text-center">
                <!-- Camera Preview -->
                <div class="camera-container mb-3" style="position: relative; display: inline-block;">
                  <video id="ekycVideoPreview" autoplay="autoplay" muted="muted" 
                         style="width: 100%; max-width: 500px; height: auto; border-radius: 8px; border: 2px solid #ddd;"
                         t-att-class="state.cameraActive ? 'd-block' : 'd-none'">
                  </video>
                  
                  <!-- Circular Face Frame Overlay -->
                  <div t-if="state.cameraActive" 
                       class="face-frame-overlay position-absolute"
                       style="top: 50%; left: 50%; transform: translate(-50%, -50%); width: 300px; height: 300px; pointer-events: none; z-index: 10;">
                    
                    <!-- Main Circular Face Frame -->
                    <div class="face-frame-main" t-att-style="getFaceFrameStyle()">
                      <!-- Progress Ring -->
                      <div class="progress-ring" t-att-style="getProgressRingStyle()">
                        <svg class="progress-ring-svg" width="300" height="300">
                          <circle class="progress-ring-bg" cx="150" cy="150" r="140" stroke-width="4" fill="none"/>
                          <circle class="progress-ring-fill" cx="150" cy="150" r="140" stroke-width="4" fill="none" 
                                  t-att-style="getProgressRingFillStyle()"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Camera Status -->
                  <div t-if="state.cameraActive" 
                       class="camera-status position-absolute text-center text-white fw-bold"
                       style="top: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); padding: 8px 16px; border-radius: 15px; font-size: 12px; z-index: 15;">
                    <i class="fas fa-camera me-2"></i>
                    <t t-esc="state.cameraStatus" />
                  </div>
                  
                  <!-- Camera Instructions -->
                  <div t-if="state.cameraActive" 
                       class="camera-instructions position-absolute text-center text-white fw-bold"
                       style="bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); padding: 10px 20px; border-radius: 20px; font-size: 14px; z-index: 15;">
                    <i class="fas fa-user-circle me-2"></i>
                    <t t-esc="state.cameraInstructions" />
                  </div>
                  
                  <!-- Camera Error -->
                  <div t-if="state.cameraError" class="alert alert-danger mt-2">
                    <i class="fas fa-exclamation-triangle"></i> <t t-esc="state.cameraError" />
                    <button type="button" class="btn btn-sm ms-2" style="color:#f97316;border-color:#f97316" t-on-click="initCamera">
                      <i class="fas fa-redo"></i> Thử lại
                    </button>
                  </div>
                </div>
                
                <!-- Progress Display - Hidden -->
                <!-- <div class="progress-container mt-3">
                  <div class="progress-text">
                    <strong>Tiến độ chụp ảnh:</strong>
                  </div>
                  <div class="row text-center mt-2">
                    <div class="col-4">
                      <div class="progress-step" t-att-class="getProgressStepClass('front')">
                        <div class="step-dot"></div>
                        <div class="progress-text small mt-1">Chỉnh diện</div>
                        <div class="progress-percentage">
                          <t t-esc="getCapturedCount('front')" />/<t t-esc="state.captureRequirements.front" />
                        </div>
                      </div>
                    </div>
                    <div class="col-4">
                      <div class="progress-step" t-att-class="getProgressStepClass('left')">
                        <div class="step-dot"></div>
                        <div class="progress-text small mt-1">Góc trái</div>
                        <div class="progress-percentage">
                          <t t-esc="getCapturedCount('left')" />/<t t-esc="state.captureRequirements.left" />
                        </div>
                      </div>
                    </div>
                    <div class="col-4">
                      <div class="progress-step" t-att-class="getProgressStepClass('right')">
                        <div class="step-dot"></div>
                        <div class="progress-text small mt-1">Góc phải</div>
                        <div class="progress-percentage">
                          <t t-esc="getCapturedCount('right')" />/<t t-esc="state.captureRequirements.right" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div> -->
                
                <!-- Captured Images Summary - Hidden -->
                <!-- <div class="mt-3">
                  <div class="row text-center">
                    <div class="col-4">
                      <div class="small text-white">
                        <i class="fas fa-user-circle"></i> Chỉnh diện: <t t-esc="getCapturedCount('front')" />/<t t-esc="state.captureRequirements.front" />
                      </div>
                    </div>
                    <div class="col-4">
                      <div class="small text-white">
                        <i class="fas fa-arrow-left"></i> Góc trái: <t t-esc="getCapturedCount('left')" />/<t t-esc="state.captureRequirements.left" />
                      </div>
                    </div>
                    <div class="col-4">
                      <div class="small text-white">
                        <i class="fas fa-arrow-right"></i> Góc phải: <t t-esc="getCapturedCount('right')" />/<t t-esc="state.captureRequirements.right" />
                      </div>
                    </div>
                  </div>
                </div> -->
                
                <!-- Camera Controls - Hidden -->
                <!-- <div class="camera-controls d-flex justify-content-center mt-4">
                  <div class="d-flex gap-4">
                    <button t-if="!state.cameraActive and !state.cameraError" 
                            type="button" 
                            class="btn btn-primary px-4 py-2" 
                            t-on-click="initCamera">
                      <i class="fas fa-camera me-2"></i> Kích hoạt Camera
                    </button>
                    <button type="button" class="btn px-4 py-2" style="background-color:#f97316;border-color:#f97316;color:white" 
                            t-on-click="processEkycVerification" 
                            t-att-disabled="!isAllImagesCaptured() or state.isProcessing">
                      <i class="fas fa-check me-2"></i> Xác thực eKYC
                    </button>
                  </div>
                </div> -->
                
                <!-- Current Phase Indicator - Hidden -->
                <!-- <div class="mt-3">
                  <div class="alert alert-info text-center">
                    <i class="fas fa-camera"></i>
                    <strong>Đang chụp: </strong>
                    <span t-if="state.currentCapturePhase === 'front'">
                      <i class="fas fa-user-circle"></i> Chỉnh diện
                    </span>
                    <span t-elif="state.currentCapturePhase === 'left'">
                      <i class="fas fa-arrow-left"></i> Góc trái
                    </span>
                    <span t-elif="state.currentCapturePhase === 'right'">
                      <i class="fas fa-arrow-right"></i> Góc phải
                    </span>
                  </div>
                </div> -->
                
                <!-- Processing Status -->
                <div t-if="state.isProcessing" class="mt-3">
                  <div class="spinner-border" role="status" style="color:#f97316">
                    <span class="visually-hidden">Đang xử lý...</span>
                  </div>
                  <p class="mt-2">Đang xác thực thông tin eKYC...</p>
                </div>
                
                <!-- eKYC Result Display -->
                <div t-if="state.ekycResult" class="mt-3">
                  <div t-if="state.ekycResult.success" class="alert alert-success">
                    <i class="fas fa-check-circle"></i> 
                    <strong>Xác thực eKYC thành công!</strong>
                    <p class="mb-0 mt-2">Thông tin đã được cập nhật tự động.</p>
                    <p class="mb-0 mt-2">
                      <i class="fas fa-check"></i> 
                      <strong>Bạn có thể tiếp tục hoàn thiện thông tin cá nhân.</strong>
                    </p>
                  </div>
                  <div t-if="!state.ekycResult.success" class="alert alert-danger">
                    <i class="fas fa-times-circle"></i> 
                    <strong>Xác thực eKYC thất bại!</strong>
                    <p class="mb-0 mt-2" t-esc="state.ekycResult.error" />
                    <div class="mt-3">
                      <button type="button" class="btn" style="background-color:#f97316;border-color:#f97316;color:white" t-on-click="resetEkycVerification">
                        <i class="fas fa-redo"></i> Xác thực lại
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Success/Error Modal -->
        <div t-if="state.showModal" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.5);">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content" style="border:2px solid #f97316;">
              <div class="modal-header" style="border-bottom:1px solid #f97316;">
                <h5 class="modal-title" style="color:#f97316;"><t t-esc="state.modalTitle" /></h5>
                <button type="button" class="btn-close" t-on-click="closeModal"></button>
              </div>
              <div class="modal-body text-center">
                <t t-if="state.modalTitle === 'Thành công'">
                  <div style="font-size:3rem;color:#43a047;">
                    <i class="fa fa-check-circle"></i>
                  </div>
                </t>
                <p class="mt-3"><t t-esc="state.modalMessage" /></p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn" style="background-color:#f97316;border-color:#f97316;color:white" t-on-click="closeModal">Đóng</button>
              </div>
            </div>
          </div>
        </div>
    `;

    setup() {
        console.log("🎯 PersonalProfileWidget - setup called!");

        this.state = useState({
            loading: true,
            profile: {},
            statusInfo: {},
            countries: [],
            formData: {
                name: '',
                gender: '',
                birth_date: '',
                nationality: '',
                email: '',
                phone: '',
                id_type: 'id_card',
                id_number: '',
                id_issue_date: '',
                id_issue_place: ''
            },
            activeTab: 'personal',
            ekycFiles: {
                front: null,
                back: null,
                frontPreview: null,
                backPreview: null
            },
            ekycLoading: false,
            ekycError: '',
            showModal: false,
            modalTitle: '',
            modalMessage: '',
                                // eKYC Camera states
                    showEkycModal: false,
                    cameraActive: false,
                    cameraError: '',
                    cameraStatus: 'Đang khởi tạo...',
                    cameraInstructions: 'Vui lòng đặt khuôn mặt vào đúng vi trí!',
                    capturedImages: [],
                    capturedImageTypes: [], // Track what type of image was captured
                    isProcessing: false,
                    _mediaStream: null,
                    faceStatus: null,
                    autoCaptureEnabled: true,
                    autoCaptureInterval: null,
                    lastCaptureTime: 0,
                    perfectFaceStartTime: 0, // Track when face becomes perfect
                    ekycResult: null,
                    currentCapturePhase: 'front', // 'front', 'left', 'right'
                    captureRequirements: {
                        front: 3,  // 3 ảnh chỉnh diện
                        left: 2,   // 2 ảnh góc trái
                        right: 2   // 2 ảnh góc phải
                    },
                    // OCR Loading states
                    ocrLoading: {
                        front: false,
                        back: false
                    }
        });

        onMounted(async () => {
            // Hide loading spinner
            const loadingSpinner = document.getElementById('loadingSpinner');
            const widgetContainer = document.getElementById('personalProfileWidget');
            
            if (loadingSpinner && widgetContainer) {
                loadingSpinner.style.display = 'none';
                widgetContainer.style.display = 'block';
            }

            // Reset storage nếu user đổi
            const currentUserId = window.currentUserId || (window.odoo && window.odoo.session_info && window.odoo.session_info.uid);
            const storedUserId = sessionStorage.getItem('personalProfileUserId');
            if (storedUserId && String(storedUserId) !== String(currentUserId)) {
                sessionStorage.removeItem('personalProfileData');
                sessionStorage.removeItem('personalProfileUserId');
                sessionStorage.removeItem('bankInfoData');
                sessionStorage.removeItem('bankInfoUserId');
                sessionStorage.removeItem('addressInfoData');
                sessionStorage.removeItem('addressInfoUserId');
                // Reset formData và preview ảnh/video
                Object.assign(this.state.formData, {
                    name: '',
                    gender: 'male',
                    birth_date: '',
                    nationality: '',
                    email: '',
                    phone: '',
                    id_type: 'id_card',
                    id_number: '',
                    id_issue_date: '',
                    id_issue_place: ''
                });
                this.state.ekycFiles.front = null;
                this.state.ekycFiles.back = null;
                this.state.ekycFiles.frontPreview = null;
                this.state.ekycFiles.backPreview = null;
            }

            // Load countries, profile data and status info
            await Promise.all([
                this.loadCountries(),
                this.loadProfileData()
            ]);
            this.loadInitialFormData(); // Load form data after profile is loaded
            await this.loadStatusInfo();
            
            this.state.loading = false;
        });
    }

    loadInitialFormData() {
        // Ưu tiên lấy từ sessionStorage
        const storedData = sessionStorage.getItem('personalProfileData');
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            
            // Check if this is fresh eKYC data (has OCR fields and CCCD images)
            const isEkycData = parsedData.name && parsedData.id_number && (parsedData.frontPreviewBase64 || parsedData.backPreviewBase64);
            
            if (isEkycData) {
                console.log("🔄 Fresh eKYC data detected, applying OCR data to form");
                
                // Apply OCR data to form
                this.state.formData.name = parsedData.name || '';
                this.state.formData.gender = parsedData.gender || 'male';
                this.state.formData.birth_date = parsedData.birth_date || '';
                this.state.formData.nationality = parsedData.nationality ? String(parsedData.nationality) : '';
                this.state.formData.id_type = parsedData.id_type || 'id_card';
                this.state.formData.id_number = parsedData.id_number || '';
                this.state.formData.id_issue_date = parsedData.id_issue_date || '';
                this.state.formData.id_issue_place = parsedData.id_issue_place || '';
                
                // Load CCCD images from eKYC và convert thành File objects để lưu thực sự
                if (parsedData.frontPreviewBase64) {
                    this.state.ekycFiles.frontPreview = parsedData.frontPreviewBase64;
                    // Convert base64 thành File object để có thể lưu vào database
                    this.state.ekycFiles.front = this.base64ToFile(parsedData.frontPreviewBase64, 'cccd_front.jpg');
                    console.log("✅ Front CCCD converted to File object for saving");
                }
                if (parsedData.backPreviewBase64) {
                    this.state.ekycFiles.backPreview = parsedData.backPreviewBase64;
                    // Convert base64 thành File object để có thể lưu vào database
                    this.state.ekycFiles.back = this.base64ToFile(parsedData.backPreviewBase64, 'cccd_back.jpg');
                    console.log("✅ Back CCCD converted to File object for saving");
                }
                
                // Keep existing email and phone if available, or set defaults
                if (this.state.profile && Object.keys(this.state.profile).length > 0) {
                    this.state.formData.email = this.state.profile.email || parsedData.email || '';
                    this.state.formData.phone = this.state.profile.phone || parsedData.phone || '';
                } else {
                    // Set default values if no existing profile
                    this.state.formData.email = parsedData.email || '';
                    this.state.formData.phone = parsedData.phone || '';
                }
                
                // Show success message
                
                console.log("✅ eKYC OCR data and CCCD images applied to form:", this.state.formData);
            } else {
                // Regular session storage data (with preview images)
                if (parsedData.nationality && typeof parsedData.nationality === 'number') {
                    parsedData.nationality = String(parsedData.nationality);
                }
                Object.assign(this.state.formData, parsedData);
                
                // If có preview base64 thì tạo lại preview
                if (parsedData.frontPreviewBase64) {
                    this.state.ekycFiles.frontPreview = parsedData.frontPreviewBase64;
                }
                if (parsedData.backPreviewBase64) {
                    this.state.ekycFiles.backPreview = parsedData.backPreviewBase64;
                }
                console.log("✅ Form data loaded from sessionStorage:", this.state.formData);
            }
        } else if (this.state.profile && Object.keys(this.state.profile).length > 0) {
            this.state.formData.name = this.state.profile.name || '';
            this.state.formData.gender = this.state.profile.gender || 'male';
            this.state.formData.email = this.state.profile.email || '';
            this.state.formData.phone = this.state.profile.phone || '';
            this.state.formData.id_type = this.state.profile.id_type || 'id_card';
            this.state.formData.id_number = this.state.profile.id_number || '';
            this.state.formData.id_issue_date = this.state.profile.id_issue_date || '';
            this.state.formData.id_issue_place = this.state.profile.id_issue_place || '';
            this.state.formData.birth_date = this.state.profile.birth_date || '';
            this.state.formData.nationality = this.state.profile.nationality ? Number(this.state.profile.nationality) : '';
            
            // Load CCCD images từ database nếu có
            console.log("🔍 Checking for CCCD images in profile:", this.state.profile);
            
            if (this.state.profile.id_front && this.state.profile.id_front !== '') {
                this.state.ekycFiles.frontPreview = this.state.profile.id_front;
                console.log("✅ Front CCCD loaded from database:", this.state.profile.id_front);
                
                // Convert URL images thành File objects để có thể save lại
                this.loadImageAsFile(this.state.profile.id_front, 'front');
            } else {
                console.log("ℹ️ No front CCCD image found in database");
            }
            
            if (this.state.profile.id_back && this.state.profile.id_back !== '') {
                this.state.ekycFiles.backPreview = this.state.profile.id_back;
                console.log("✅ Back CCCD loaded from database:", this.state.profile.id_back);
                
                // Convert URL images thành File objects để có thể save lại
                this.loadImageAsFile(this.state.profile.id_back, 'back');
            } else {
                console.log("ℹ️ No back CCCD image found in database");
            }
            
            console.log("✅ Form data initialized with existing profile data:", this.state.formData);
        } else {
            console.log("ℹ️ No existing profile data found, using default values");
        }
    }

    showEkycSuccessMessage() {
        // Show success message for eKYC data
        this.state.modalTitle = 'Thành công';
        this.state.modalMessage = 'Thông tin từ CCCD đã được tự động điền vào form thông tin cá nhân và địa chỉ. Vui lòng kiểm tra và lưu thông tin.';
        this.state.showModal = true;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.state.showModal = false;
        }, 5000);
    }

    async loadCountries() {
        try {
            const response = await fetch('/get_countries');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('No countries data received');
            }
            
            this.state.countries = data;
            
            // Create a mapping for quick lookup
            this.state.countryMapping = {};
            data.forEach(country => {
                this.state.countryMapping[String(country.id)] = country.name;
                // Also add common variations
                const name = country.name.toLowerCase();
                this.state.countryMapping[name] = String(country.id);
                this.state.countryMapping[country.name] = String(country.id);
            });
            
        } catch (error) {
            console.error("❌ Error fetching countries:", error);
            
            // Create fallback countries array
            this.state.countries = [
                { id: '241', name: 'Vietnam', code: 'VN' },
                { id: '233', name: 'USA', code: 'US' },
                { id: '231', name: 'UK', code: 'GB' },
                { id: '113', name: 'Japan', code: 'JP' },
                { id: '48', name: 'China', code: 'CN' },
                { id: '121', name: 'South Korea', code: 'KR' },
                { id: '197', name: 'Singapore', code: 'SG' },
                { id: '217', name: 'Thailand', code: 'TH' },
                { id: '132', name: 'Malaysia', code: 'MY' },
                { id: '103', name: 'Indonesia', code: 'ID' },
                { id: '174', name: 'Philippines', code: 'PH' },
                { id: '14', name: 'Australia', code: 'AU' },
                { id: '39', name: 'Canada', code: 'CA' },
                { id: '82', name: 'Germany', code: 'DE' },
                { id: '75', name: 'France', code: 'FR' },
                { id: '107', name: 'Italy', code: 'IT' },
                { id: '195', name: 'Spain', code: 'ES' },
                { id: '156', name: 'Netherlands', code: 'NL' },
                { id: '207', name: 'Switzerland', code: 'CH' },
                { id: '203', name: 'Sweden', code: 'SE' }
            ];
            
            // Fallback mapping with common countries
            this.state.countryMapping = {
                // Vietnam
                '241': 'Vietnam', 'vietnam': '241', 'việt nam': '241', 'vn': '241', 'viet nam': '241',
                'cộng hòa xã hội chủ nghĩa việt nam': '241', 'chxhcn việt nam': '241',
                
                // USA
                '233': 'USA', 'usa': '233', 'united states': '233', 'us': '233', 'hoa kỳ': '233', 'mỹ': '233',
                'united states of america': '233', 'america': '233',
                
                // UK
                '231': 'UK', 'uk': '231', 'united kingdom': '231', 'england': '231', 'anh': '231',
                'great britain': '231', 'britain': '231',
                
                // Japan
                '113': 'Japan', 'japan': '113', 'jp': '113', 'nhật bản': '113', 'japanese': '113',
                
                // China
                '48': 'China', 'china': '48', 'cn': '48', 'trung quốc': '48', 'chinese': '48',
                
                // Korea
                '121': 'South Korea', 'south korea': '121', 'korea': '121', 'kr': '121', 'hàn quốc': '121',
                
                // Singapore
                '197': 'Singapore', 'singapore': '197', 'sg': '197',
                
                // Thailand
                '217': 'Thailand', 'thailand': '217', 'th': '217', 'thái lan': '217',
                
                // Malaysia
                '132': 'Malaysia', 'malaysia': '132', 'my': '132',
                
                // Indonesia
                '103': 'Indonesia', 'indonesia': '103', 'id': '103',
                
                // Philippines
                '174': 'Philippines', 'philippines': '174', 'ph': '174',
                
                // Australia
                '14': 'Australia', 'australia': '14', 'au': '14',
                
                // Canada
                '39': 'Canada', 'canada': '39', 'ca': '39',
                
                // Germany
                '82': 'Germany', 'germany': '82', 'de': '82', 'đức': '82',
                
                // France
                '75': 'France', 'france': '75', 'fr': '75', 'pháp': '75',
                
                // Italy
                '107': 'Italy', 'italy': '107', 'it': '107', 'ý': '107',
                
                // Spain
                '195': 'Spain', 'spain': '195', 'es': '195', 'tây ban nha': '195',
                
                // Netherlands
                '156': 'Netherlands', 'netherlands': '156', 'nl': '156', 'hà lan': '156',
                
                // Switzerland
                '207': 'Switzerland', 'switzerland': '207', 'ch': '207', 'thụy sĩ': '207',
                
                // Sweden
                '203': 'Sweden', 'sweden': '203', 'se': '203', 'thụy điển': '203'
            };
        }
    }

    async loadStatusInfo() {
        try {
            const response = await fetch('/get_status_info');
            const data = await response.json();
            console.log("📥 Status info data:", data);
            
            if (data && data.length > 0) {
                this.state.statusInfo = data[0];
                console.log("✅ Status info loaded:", this.state.statusInfo);
            } else {
                console.log("ℹ️ No status info found");
            }
        } catch (error) {
            console.error("❌ Error fetching status info:", error);
        }
    }

    // Thêm hàm chuyển file sang base64
    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Thêm hàm chuyển base64 thành File object
    base64ToFile(base64String, filename) {
        try {
            // Extract the base64 data and mime type
            const arr = base64String.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            
            return new File([u8arr], filename, { type: mime });
        } catch (error) {
            console.error('Error converting base64 to file:', error);
            return null;
        }
    }

    // Thêm hàm load image từ URL thành File object  
    async loadImageAsFile(imageUrl, side) {
        try {
            console.log(`🔄 Loading ${side} CCCD image from URL:`, imageUrl);
            
            // Kiểm tra URL hợp lệ
            const isWebImage = imageUrl && imageUrl.startsWith('/web/image');
            const isDiskImage = imageUrl && imageUrl.startsWith('/id_images/');
            if (!imageUrl || imageUrl === '' || (!isWebImage && !isDiskImage)) {
                console.log(`⚠️ Invalid URL for ${side} CCCD image:`, imageUrl);
                return;
            }
            
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
            }
            
            const blob = await response.blob();
            if (blob.size === 0) {
                throw new Error('Image blob is empty');
            }
            
            const filename = `cccd_${side}.jpg`;
            const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
            
            if (side === 'front') {
                this.state.ekycFiles.front = file;
                console.log(`✅ Front CCCD image converted to File object:`, file.name, `(${file.size} bytes)`);
            } else if (side === 'back') {
                this.state.ekycFiles.back = file;
                console.log(`✅ Back CCCD image converted to File object:`, file.name, `(${file.size} bytes)`);
            }
        } catch (error) {
            console.error(`❌ Error loading ${side} CCCD image:`, error);
            // Không set file nếu có lỗi, để user có thể upload lại
        }
    }

    // Thêm hàm convert URL thành base64
    async urlToBase64(imageUrl) {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status}`);
            }
            
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error converting URL to base64:', error);
            return '';
        }
    }

    async saveProfile() {
        try {
            const profileData = { ...this.state.formData };
            // Đảm bảo nationality là số nguyên ID
            if (!profileData.nationality || isNaN(profileData.nationality) || Number(profileData.nationality) <= 0) {
                this.state.modalTitle = 'Lỗi';
                this.state.modalMessage = 'Bạn chưa chọn quốc tịch!';
                this.state.showModal = true;
                return;
            }
            
            // Kiểm tra số điện thoại phải có đúng 10 chữ số
            if (profileData.phone) {
                const phoneDigits = profileData.phone.replace(/[^0-9]/g, '');
                if (phoneDigits.length !== 10) {
                    this.state.modalTitle = 'Lỗi';
                    this.state.modalMessage = 'Số điện thoại phải có đúng 10 chữ số!';
                    this.state.showModal = true;
                    return;
                }
                // Cập nhật phone với chỉ số
                profileData.phone = phoneDigits;
            }
            // Ràng buộc phải có ảnh mặt trước, mặt sau CCCD (từ eKYC, upload, hoặc database)
            const hasFrontImage = this.state.ekycFiles.front || this.state.ekycFiles.frontPreview;
            const hasBackImage = this.state.ekycFiles.back || this.state.ekycFiles.backPreview;
            
            if (!hasFrontImage || !hasBackImage) {
                this.state.modalTitle = 'Lỗi';
                this.state.modalMessage = 'Bạn phải có đủ ảnh mặt trước và mặt sau CCCD! Vui lòng thực hiện eKYC hoặc upload ảnh CCCD.';
                this.state.showModal = true;
                return;
            }
            profileData.nationality = Number(profileData.nationality);
            // Convert images sang base64 cho việc lưu
            if (this.state.ekycFiles.front) {
                profileData.frontPreviewBase64 = await this.fileToBase64(this.state.ekycFiles.front);
                console.log("✅ Front CCCD File object converted to base64 for saving");
            } else if (this.state.ekycFiles.frontPreview && this.state.ekycFiles.frontPreview.startsWith('data:')) {
                profileData.frontPreviewBase64 = this.state.ekycFiles.frontPreview;
                console.log("✅ Front CCCD base64 data ready for saving");
            } else if (this.state.ekycFiles.frontPreview && (this.state.ekycFiles.frontPreview.startsWith('/web/image') || this.state.ekycFiles.frontPreview.startsWith('/id_images/'))) {
                // Image từ database - convert URL sang base64
                profileData.frontPreviewBase64 = await this.urlToBase64(this.state.ekycFiles.frontPreview);
                console.log("✅ Front CCCD URL converted to base64 for saving");
            } else {
                profileData.frontPreviewBase64 = '';
            }
            
            if (this.state.ekycFiles.back) {
                profileData.backPreviewBase64 = await this.fileToBase64(this.state.ekycFiles.back);
                console.log("✅ Back CCCD File object converted to base64 for saving");
            } else if (this.state.ekycFiles.backPreview && this.state.ekycFiles.backPreview.startsWith('data:')) {
                profileData.backPreviewBase64 = this.state.ekycFiles.backPreview;
                console.log("✅ Back CCCD base64 data ready for saving");
            } else if (this.state.ekycFiles.backPreview && (this.state.ekycFiles.backPreview.startsWith('/web/image') || this.state.ekycFiles.backPreview.startsWith('/id_images/'))) {
                // Image từ database - convert URL sang base64
                profileData.backPreviewBase64 = await this.urlToBase64(this.state.ekycFiles.backPreview);
                console.log("✅ Back CCCD URL converted to base64 for saving");
            } else {
                profileData.backPreviewBase64 = '';
            }
            
            console.log("📤 Sending profile data with CCCD images:", {
                hasfront: !!profileData.frontPreviewBase64,
                hasBack: !!profileData.backPreviewBase64,
                frontSize: profileData.frontPreviewBase64 ? `${profileData.frontPreviewBase64.length} chars` : '0',
                backSize: profileData.backPreviewBase64 ? `${profileData.backPreviewBase64.length} chars` : '0'
            });

            // Gửi dữ liệu lên Odoo
            const response = await fetch('/save_personal_profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
            const result = await response.json();
            if (response.ok && result.success) {
                sessionStorage.setItem('personalProfileData', JSON.stringify(profileData));
                sessionStorage.setItem('personalProfileUserId', String(window.currentUserId || ''));
                
                // Reload profile data để đảm bảo ảnh được hiển thị
                console.log("🔄 Reloading profile data after successful save...");
                await this.loadProfileData();
                this.loadInitialFormData();
                
                this.state.modalTitle = 'Thành công';
                this.state.modalMessage = 'Lưu Thông Tin cá nhân thành công!';
                this.state.showModal = true;
                setTimeout(() => { window.location.href = '/bank_info'; }, 1500);
            } else {
                this.state.modalTitle = 'Lỗi';
                this.state.modalMessage = result.error || 'Có lỗi xảy ra, vui lòng thử lại.';
                this.state.showModal = true;
            }

        } catch (error) {
            this.state.modalTitle = 'Lỗi';
            this.state.modalMessage = error.message || 'Có lỗi xảy ra, vui lòng thử lại.';
            this.state.showModal = true;
        }
    }

    async loadProfileData() {
        try {
            console.log("🔄 Loading profile data from server...");
            const response = await fetch('/data_personal_profile');
            const data = await response.json();
            console.log("📥 Personal profile data received:", data);
            
            if (data && data.length > 0) {
                this.state.profile = data[0];
                console.log("✅ Profile data loaded successfully:", this.state.profile);
            } else {
                console.log("ℹ️ No existing profile data found on server");
                this.state.profile = {};
            }
        } catch (error) {
            console.error("❌ Error fetching personal profile data:", error);
            this.state.profile = {};
        }
    }

    onUploadIdFront(ev) {
        const file = ev.target.files[0];
        if (file) {
            this.uploadIdImage(file, 'front');
        }
    }

    onUploadIdBack(ev) {
        const file = ev.target.files[0];
        if (file) {
            this.uploadIdImage(file, 'back');
        }
    }

    onPhoneInput(ev) {
        // Chỉ cho phép nhập số và giới hạn 10 ký tự
        let value = ev.target.value.replace(/[^0-9]/g, '');
        if (value.length > 10) {
            value = value.substring(0, 10);
        }
        this.state.formData.phone = value;
        ev.target.value = value;
    }

    async uploadIdImage(file, side) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('side', side);

            const response = await fetch('/upload_id_image', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                console.log(`✅ ${side} ID image uploaded successfully.`);
                // Optionally, refresh profile data to show the new image
                await this.loadProfileData();
            } else {
                const errorData = await response.json();
                console.error(`❌ Failed to upload ${side} ID image:`, errorData.error);
                alert(`Failed to upload ${side} ID image: ${errorData.error}`);
            }
        } catch (error) {
            console.error(`❌ Error uploading ${side} ID image:`, error);
            alert(`Error uploading ${side} ID image.`);
        }
    }

    async onEkycFront(ev) {
        const file = ev.target.files[0];
        if (file) {
            this.state.ekycFiles.front = file;
            if (this.state.ekycFiles.frontPreview && this.state.ekycFiles.frontPreview.startsWith('blob:')) {
                URL.revokeObjectURL(this.state.ekycFiles.frontPreview);
            }
            this.state.ekycFiles.frontPreview = URL.createObjectURL(file);
            
            // Auto-detect OCR from front CCCD
            await this.detectOCRFromImage(file, 'front');
        }
    }

    async onEkycBack(ev) {
        const file = ev.target.files[0];
        if (file) {
            this.state.ekycFiles.back = file;
            if (this.state.ekycFiles.backPreview && this.state.ekycFiles.backPreview.startsWith('blob:')) {
                URL.revokeObjectURL(this.state.ekycFiles.backPreview);
            }
            this.state.ekycFiles.backPreview = URL.createObjectURL(file);
            
            // Auto-detect OCR from back CCCD
            await this.detectOCRFromImage(file, 'back');
        }
    }

    async detectOCRFromImage(file, side) {
        try {
            console.log(`🔍 Detecting OCR from ${side} CCCD...`);
            
            // Set loading state
            this.state.ocrLoading[side] = true;
            
            const formData = new FormData();
            formData.append(side === 'front' ? 'frontID' : 'backID', file);
            
            const endpoint = side === 'front' ? '/api/ekyc/frontID' : '/api/ekyc/backID';
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            console.log(`✅ OCR result for ${side}:`, result);
            
            if (response.ok && result.success) {
                // Success - update form with OCR data
                // For front OCR: result.data contains the OCR data directly
                // For back OCR: result.data.data contains the OCR data (nested structure)
                const ocrData = side === 'back' && result.data && result.data.data ? result.data.data : result.data;
                this.updateFormWithOCRData(ocrData, side);
                const sideText = side === 'front' ? 'mặt trước' : 'mặt sau';
                this.showModal('Thành công', `Trích xuất thông tin ${sideText} CCCD thành công!`);
            } else {
                // Failed
                const errorMsg = result.error || `Lỗi trích xuất thông tin ${side === 'front' ? 'mặt trước' : 'mặt sau'} CCCD.`;
                this.showModal('Lỗi', errorMsg);
            }
        } catch (error) {
            const errorText = side === 'front' ? 'mặt trước' : 'mặt sau';
            this.showModal('Lỗi', `Có lỗi xảy ra khi trích xuất thông tin từ CCCD ${errorText}. Vui lòng thử lại.`);
            console.error(`❌ Error detecting OCR from ${side} CCCD:`, error);
        } finally {
            // Clear loading state
            this.state.ocrLoading[side] = false;
        }
    }

    updateFormWithOCRData(ocrData, side) {
        const updatedFields = [];
        
        if (side === 'front') {
            // Update front OCR data
            if (ocrData.idNumber) {
                this.state.formData.id_number = ocrData.idNumber;
                updatedFields.push('Số CCCD');
            }
            if (ocrData.fullName) {
                this.state.formData.name = ocrData.fullName;
                updatedFields.push('Họ và tên');
            }
            if (ocrData.dob) {
                this.state.formData.birth_date = this.formatDateForInput(ocrData.dob);
                updatedFields.push('Ngày sinh');
            }
            if (ocrData.gender) {
                this.state.formData.gender = (ocrData.gender === 'Nam' || ocrData.gender === 'Male') ? 'male' : 'female';
                updatedFields.push('Giới tính');
            }
            if (ocrData.nationality) {
                const countryId = this.findCountryIdByName(ocrData.nationality);
                if (countryId) {
                    // Convert to string for select dropdown
                    this.state.formData.nationality = String(countryId);
                    updatedFields.push('Quốc tịch');
                    
                    // Force re-render of the select dropdown
                    this.render();
                }
            }
            
            // Propagate address-related data for AddressInfoWidget via sessionStorage
            try {
                const addressPayload = {};
                if (ocrData.address) {
                    addressPayload.permanent_address = ocrData.address;
                }
                if (ocrData.place_of_birth) {
                    addressPayload.birth_place = ocrData.place_of_birth;
                }
                if (ocrData.place_of_origin || ocrData.hometown) {
                    addressPayload.hometown = ocrData.place_of_origin || ocrData.hometown;
                }
                if (Object.keys(addressPayload).length > 0) {
                    const existingRaw = sessionStorage.getItem('addressInfoData');
                    let merged = { };
                    if (existingRaw) {
                        try { merged = JSON.parse(existingRaw) || {}; } catch (e) { merged = {}; }
                    }
                    const finalData = { ...merged, ...addressPayload };
                    sessionStorage.setItem('addressInfoData', JSON.stringify(finalData));
                    sessionStorage.setItem('addressInfoFromEkyc', 'true');
                    console.log('🔗 Saved eKYC address data for AddressInfoWidget:', finalData);
                }
            } catch (e) {
                console.warn('⚠️ Failed to store eKYC address data to sessionStorage:', e);
            }
        } else if (side === 'back') {
            // Update back OCR data
            // OCR back returns: {init_date: '...', issue_date: '...', place_of_birth: '...'}
            if (ocrData.init_date) {
                this.state.formData.id_issue_date = this.formatDateForInput(ocrData.init_date);
                updatedFields.push('Ngày cấp');
            } else if (ocrData.issue_date) {
                this.state.formData.id_issue_date = this.formatDateForInput(ocrData.issue_date);
                updatedFields.push('Ngày cấp');
            }
            if (ocrData.place_of_birth) {
                this.state.formData.id_issue_place = ocrData.place_of_birth;
                updatedFields.push('Nơi cấp');
            }
            
            // Propagate birth place if available (some services return on back side)
            try {
                if (ocrData.place_of_birth) {
                    const existingRaw = sessionStorage.getItem('addressInfoData');
                    let merged = { };
                    if (existingRaw) {
                        try { merged = JSON.parse(existingRaw) || {}; } catch (e) { merged = {}; }
                    }
                    const finalData = { ...merged, birth_place: ocrData.place_of_birth };
                    sessionStorage.setItem('addressInfoData', JSON.stringify(finalData));
                    sessionStorage.setItem('addressInfoFromEkyc', 'true');
                    console.log('🔗 Updated eKYC birth place for AddressInfoWidget:', finalData);
                }
            } catch (e) {
                console.warn('⚠️ Failed to update eKYC birth place in sessionStorage:', e);
            }
        }
        
        console.log(`✅ Form updated with ${side} OCR data:`, this.state.formData);
        console.log(`📝 Updated fields: ${updatedFields.join(', ')}`);
        
        // Show detailed success message
        if (updatedFields.length > 0) {
            const sideText = side === 'front' ? 'mặt trước' : 'mặt sau';
            const fieldsText = updatedFields.join(', ');
            this.showModal('Thành công!', `Đã trích xuất thông tin từ CCCD ${sideText}:\n${fieldsText}`);
            
            // Auto-close success message after 3 seconds
            setTimeout(() => {
                this.state.showModal = false;
            }, 3000);
        }
    }

    startEkycVerification() {
        // Check if both CCCD images are uploaded
        if (!this.state.ekycFiles.front || !this.state.ekycFiles.back) {
            this.showModal('Lỗi', 'Vui lòng upload đầy đủ ảnh CCCD mặt trước và mặt sau trước khi xác thực eKYC.');
            return;
        }
        
        // Show eKYC camera modal
        this.state.showEkycModal = true;
        this.state.capturedImages = [];
        this.state.capturedImageTypes = [];
        this.state.isProcessing = false;
        this.state.lastCaptureTime = 0;
        this.state.perfectFaceStartTime = 0; // Reset perfect face timer
        this.state.currentCapturePhase = 'front'; // Start with front-facing
        this.state.cameraStatus = 'Đang khởi tạo camera...';
        
        // Set initial camera instructions based on current phase
        this.updateCameraInstructionsForPhase('front');
        
        // Auto-initialize camera
        setTimeout(() => {
            this.initCamera();
        }, 500);
    }

    closeEkycModal() {
        this.state.showEkycModal = false;
        this.stopCamera();
        
        // Ensure form data is preserved after closing modal
        if (this.state.formData && Object.keys(this.state.formData).length > 0) {
            const profileData = { 
                ...this.state.formData,
                // Preserve CCCD images
                frontPreviewBase64: this.state.ekycFiles.frontPreview,
                backPreviewBase64: this.state.ekycFiles.backPreview
            };
            
            sessionStorage.setItem('personalProfileData', JSON.stringify(profileData));
            sessionStorage.setItem('personalProfileUserId', String(window.currentUserId || ''));
            
            console.log('✅ Form data preserved after closing eKYC modal');
        }
    }
    
    resetEkycVerification() {
        // Reset all eKYC related states
        this.state.capturedImages = [];
        this.state.capturedImageTypes = [];
        this.state.isProcessing = false;
        this.state.lastCaptureTime = 0;
        this.state.perfectFaceStartTime = 0;
        this.state.ekycResult = null;
        this.state.currentCapturePhase = 'front';
        this.state.cameraStatus = 'Camera đã sẵn sàng';
        
        // Set initial camera instructions
        this.updateCameraInstructionsForPhase('front');
        
        // Re-initialize camera
        setTimeout(() => {
            this.initCamera();
        }, 500);
        
        console.log('🔄 eKYC verification reset, ready to start again');
    }

    // Helper methods for new capture logic
    getCapturedCount(phase) {
        return this.state.capturedImageTypes.filter(type => type === phase).length;
    }

    isAllImagesCaptured() {
        const frontCount = this.getCapturedCount('front');
        const leftCount = this.getCapturedCount('left');
        const rightCount = this.getCapturedCount('right');
        
        return frontCount >= this.state.captureRequirements.front &&
               leftCount >= this.state.captureRequirements.left &&
               rightCount >= this.state.captureRequirements.right;
    }

    getProgressStepClass(phase) {
        const count = this.getCapturedCount(phase);
        const required = this.state.captureRequirements[phase];
        
        if (count >= required) {
            return 'completed';
        } else if (count > 0) {
            return 'partial';
        } else {
            return 'pending';
        }
    }

    getNextCapturePhase() {
        const frontCount = this.getCapturedCount('front');
        const leftCount = this.getCapturedCount('left');
        const rightCount = this.getCapturedCount('right');
        
        if (frontCount < this.state.captureRequirements.front) {
            return 'front';
        } else if (leftCount < this.state.captureRequirements.left) {
            return 'left';
        } else if (rightCount < this.state.captureRequirements.right) {
            return 'right';
        }
        return null; // All phases completed
    }

    getPhaseName(phase) {
        const phaseNames = {
            'front': 'chỉnh diện',
            'left': 'góc phải',
            'right': 'góc trái'
        };
        return phaseNames[phase] || phase;
    }

    updateCameraInstructionsForPhase(phase) {
        const phaseInstructions = {
            'front': 'Vui lòng nhìn thẳng vào camera và giữ nguyên vị trí',
            'left': 'Vui lòng quay mặt sang trái để đạt góc phải và giữ nguyên vị trí',
            'right': 'Vui lòng quay mặt sang phải để đạt góc trái và giữ nguyên vị trí'
        };
        
        this.updateCameraInstructions(phaseInstructions[phase] || 'Vui lòng điều chỉnh khuôn mặt');
        console.log(`📋 Updated camera instructions for phase: ${phase} - ${this.state.cameraInstructions}`);
    }

    updateCameraInstructions(message) {
        if (this.state.cameraInstructions !== message) {
            this.state.cameraInstructions = message;
            console.log(`📋 Camera instructions: ${message}`);
        }
    }

    updateCapturePhase() {
        const nextPhase = this.getNextCapturePhase();
        if (nextPhase && nextPhase !== this.state.currentCapturePhase) {
            this.state.currentCapturePhase = nextPhase;
            this.state.perfectFaceStartTime = 0; // Reset timer for new phase
            console.log(`🔄 Switching to capture phase: ${nextPhase}`);
            
            // Update camera instructions for new phase
            this.updateCameraInstructionsForPhase(nextPhase);
        }
    }

    showModal(title, message) {
        this.state.modalTitle = title;
        this.state.modalMessage = message;
        this.state.showModal = true;
    }

    async initCamera() {
        this.stopCamera();
        this.state.cameraError = '';
        this.state.cameraStatus = 'Đang khởi tạo camera...';
        
        try {
            console.log('📹 Initializing camera...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }, 
                audio: false 
            });
            
            this.state._mediaStream = stream;
            const video = document.getElementById('ekycVideoPreview');
            
            if (video) {
                video.srcObject = stream;
                this.state.cameraActive = true;
                this.state.cameraStatus = 'Camera đã sẵn sàng';
                // Keep existing camera instructions or set default for current phase
                if (!this.state.cameraInstructions) {
                    this.updateCameraInstructionsForPhase(this.state.currentCapturePhase);
                }
                console.log('✅ Camera initialized successfully');
                
                // Start face detection after camera is ready
                video.onloadedmetadata = () => {
                    setTimeout(async () => {
                        // Check if Face API is already loaded from template
                        if (window.faceapi && this.areModelsLoaded()) {
                            console.log('✅ Face API and models already available from template');
                            this.startFaceDetection();
                            this.updateFaceStatus('detecting', 'fas fa-search', 'Đang phát hiện khuôn mặt...');
                        } else if (window.faceapi && !this.areModelsLoaded()) {
                            console.log('🔄 Face API loaded but models not ready, loading models...');
                            await this.loadFaceAPIModels();
                            this.startFaceDetection();
                            this.updateFaceStatus('detecting', 'fas fa-search', 'Đang phát hiện khuôn mặt...');
                        } else {
                            // Try to load Face API in background
                            await this.loadFaceAPI();
                            
                            // Check if Face API loaded successfully
                            if (window.faceapi) {
                                this.startFaceDetection();
                                this.updateFaceStatus('detecting', 'fas fa-search', 'Đang phát hiện khuôn mặt...');
                            } else {
                                console.warn('⚠️ Face API not available, using fallback detection');
                                this.startFaceDetection();
                                this.updateFaceStatus('detecting', 'fas fa-search', 'Đang phát hiện khuôn mặt (chế độ cơ bản)...');
                            }
                        }
                    }, 1000); // Small delay to ensure video is fully loaded
                };
                
                // Backup: Start face detection immediately if video is already loaded
                if (video.readyState >= 2) {
                    setTimeout(async () => {
                        // Check if Face API is already loaded from template
                        if (window.faceapi && this.areModelsLoaded()) {
                            console.log('✅ Face API and models already available from template (backup)');
                            this.startFaceDetection();
                            this.updateFaceStatus('detecting', 'fas fa-search', 'Đang phát hiện khuôn mặt...');
                        } else if (window.faceapi && !this.areModelsLoaded()) {
                            console.log('🔄 Face API loaded but models not ready (backup), loading models...');
                            await this.loadFaceAPIModels();
                            this.startFaceDetection();
                            this.updateFaceStatus('detecting', 'fas fa-search', 'Đang phát hiện khuôn mặt...');
                        } else {
                            // Try to load Face API in background
                            await this.loadFaceAPI();
                            
                            // Check if Face API loaded successfully
                            if (window.faceapi) {
                                this.startFaceDetection();
                                this.updateFaceStatus('detecting', 'fas fa-search', 'Đang phát hiện khuôn mặt...');
                            } else {
                                console.warn('⚠️ Face API not available, using fallback detection');
                                this.startFaceDetection();
                                this.updateFaceStatus('detecting', 'fas fa-search', 'Đang phát hiện khuôn mặt (chế độ cơ bản)...');
                            }
                        }
                    }, 1000);
                }
            } else {
                throw new Error('Video element not found');
            }
        } catch (error) {
            console.error('❌ Error accessing camera:', error);
            this.state.cameraError = 'Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập và thử lại.';
            this.state.cameraActive = false;
            this.state.cameraStatus = 'Lỗi camera';
        }
    }
    
    async loadFaceAPI() {
        if (window.faceapi) {
            console.log('✅ Face API already loaded from CDN');
            return;
        }
        
        try {
            console.log('🔄 Face API not found, trying to load...');
            
            // Check if Face API is already loaded from CDN in template
            if (window.faceapi) {
                console.log('✅ Face API loaded from template CDN');
                return;
            }
            
            // Try multiple CDN sources for better reliability
            const cdnSources = this.constructor.CONFIG.FACE_API.CDN_SOURCES;
            
            let loadSuccess = false;
            let lastError = null;
            
            for (const cdnUrl of cdnSources) {
                try {
                    console.log(`🔄 Trying CDN: ${cdnUrl}`);
                    await Promise.race([
                        this.loadScript(cdnUrl),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Script load timeout')), this.constructor.CONFIG.FACE_API.TIMEOUTS.SCRIPT_LOAD))
                    ]);
                    
                    // Wait for script to initialize
                    await new Promise(resolve => setTimeout(resolve, this.constructor.CONFIG.FACE_API.TIMEOUTS.INITIALIZATION));
                    
                    if (window.faceapi) {
                        loadSuccess = true;
                        console.log(`✅ Face API loaded from: ${cdnUrl}`);
                        break;
                    }
                } catch (error) {
                    console.warn(`⚠️ Failed to load from ${cdnUrl}:`, error);
                    lastError = error;
                    continue;
                }
            }
            
            if (!loadSuccess || !window.faceapi) {
                console.warn('⚠️ All CDNs failed, trying local fallback...');
                await this.loadFaceAPILocal();
                
                if (!window.faceapi) {
                    throw new Error(`Face API not available after trying all CDNs and local fallback. Last error: ${lastError?.message || 'Unknown'}`);
                }
            }
            
            // Load models with better error handling
            const modelUrls = this.constructor.CONFIG.FACE_API.MODEL_SOURCES;
            
            let modelsLoaded = false;
            let modelError = null;
            
            for (const modelUrl of modelUrls) {
                try {
                    console.log(`🔄 Loading models from: ${modelUrl}`);
                    await Promise.race([
                        Promise.all([
                            window.faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
                            window.faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
                            window.faceapi.nets.faceExpressionNet.loadFromUri(modelUrl)
                        ]),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Model load timeout')), this.constructor.CONFIG.FACE_API.TIMEOUTS.MODEL_LOAD))
                    ]);
                    modelsLoaded = true;
                    console.log(`✅ Models loaded from: ${modelUrl}`);
                    break;
                } catch (error) {
                    console.warn(`⚠️ Failed to load models from ${modelUrl}:`, error);
                    modelError = error;
                    continue;
                }
            }
            
            if (!modelsLoaded) {
                console.warn('⚠️ All CDN model sources failed, trying local fallback...');
                await this.loadFaceAPIModelsLocal();
                
                if (!this.areModelsLoaded()) {
                    throw new Error(`Models not loaded from CDN or local. Last error: ${modelError?.message || 'Unknown'}`);
                }
            }
            
            // Wait for models to be fully initialized
            await new Promise(resolve => setTimeout(resolve, this.constructor.CONFIG.FACE_API.TIMEOUTS.INITIALIZATION));
            
            // Verify models are ready
            if (!this.areModelsLoaded()) {
                throw new Error('Models not properly loaded');
            }
            
            console.log('✅ Face API and models loaded successfully');
        } catch (error) {
            console.error('❌ Error loading Face API:', error);
            // Don't throw error, just log it and let fallback methods handle detection
            console.warn('⚠️ Face API failed to load, will use fallback detection methods');
        }
    }
    
    async loadFaceAPIModels() {
        try {
            console.log('🔄 Loading Face API models...');
            
            // Load models with better error handling
            const modelUrls = this.constructor.CONFIG.FACE_API.MODEL_SOURCES;
            
            let modelsLoaded = false;
            let modelError = null;
            
            for (const modelUrl of modelUrls) {
                try {
                    console.log(`🔄 Loading models from: ${modelUrl}`);
                    await Promise.race([
                        Promise.all([
                            window.faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
                            window.faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
                            window.faceapi.nets.faceExpressionNet.loadFromUri(modelUrl)
                        ]),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Model load timeout')), this.constructor.CONFIG.FACE_API.TIMEOUTS.MODEL_LOAD))
                    ]);
                    modelsLoaded = true;
                    console.log(`✅ Models loaded from: ${modelUrl}`);
                    break;
                } catch (error) {
                    console.warn(`⚠️ Failed to load models from ${modelUrl}:`, error);
                    modelError = error;
                    continue;
                }
            }
            
            if (!modelsLoaded) {
                console.warn('⚠️ All CDN model sources failed, trying local fallback...');
                await this.loadFaceAPIModelsLocal();
                
                if (!this.areModelsLoaded()) {
                    throw new Error(`Models not loaded from CDN or local. Last error: ${modelError?.message || 'Unknown'}`);
                }
            }
            
            // Wait for models to be fully initialized
            await new Promise(resolve => setTimeout(resolve, this.constructor.CONFIG.FACE_API.TIMEOUTS.INITIALIZATION));
            
            // Verify models are ready
            if (!this.areModelsLoaded()) {
                throw new Error('Models not properly loaded');
            }
            
            console.log('✅ Face API models loaded successfully');
        } catch (error) {
            console.error('❌ Error loading Face API models:', error);
            throw error;
        }
    }
    
    async loadFaceAPIModelsLocal() {
        try {
            console.log('🔄 Trying to load Face API models from local assets...');
            
            // Try to load models from local assets
            const localModelPaths = [
                '/web/static/lib/face-api/models',
                '/static/lib/face-api/models',
                '/models'
            ];
            
            for (const localModelPath of localModelPaths) {
                try {
                    await Promise.all([
                        window.faceapi.nets.tinyFaceDetector.loadFromUri(localModelPath),
                        window.faceapi.nets.faceLandmark68Net.loadFromUri(localModelPath),
                        window.faceapi.nets.faceExpressionNet.loadFromUri(localModelPath)
                    ]);
                    console.log(`✅ Models loaded from local: ${localModelPath}`);
                    return;
                } catch (error) {
                    console.warn(`⚠️ Failed to load models from local path ${localModelPath}:`, error);
                    continue;
                }
            }
            
            console.warn('⚠️ Local models not found, will use fallback detection');
        } catch (error) {
            console.warn('⚠️ Error loading local models:', error);
        }
    }
    
    async loadFaceAPILocal() {
        try {
            console.log('🔄 Trying to load Face API from local assets...');
            
            // Try to load from local assets
            const localPaths = this.constructor.CONFIG.FACE_API.LOCAL_PATHS;
            
            for (const localPath of localPaths) {
                try {
                    await this.loadScript(localPath);
                    if (window.faceapi) {
                        console.log(`✅ Face API loaded from local: ${localPath}`);
                        return;
                    }
                } catch (error) {
                    console.warn(`⚠️ Failed to load from local path ${localPath}:`, error);
                    continue;
                }
            }
            
            console.warn('⚠️ Local Face API not found, will use fallback detection');
        } catch (error) {
            console.warn('⚠️ Error loading local Face API:', error);
        }
    }
    
    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if script already exists
            const existingScript = document.querySelector(`script[src="${src}"]`);
            if (existingScript) {
                console.log(`✅ Script already loaded: ${src}`);
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.crossOrigin = 'anonymous';
            script.type = 'text/javascript';
            
            script.onload = () => {
                console.log(`✅ Script loaded successfully: ${src}`);
                resolve();
            };
            
            script.onerror = (error) => {
                console.error(`❌ Failed to load script: ${src}`, error);
                // Remove failed script
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                reject(new Error(`Failed to load script: ${src}`));
            };
            
            // Add timeout
            const timeoutId = setTimeout(() => {
                console.error(`❌ Script load timeout: ${src}`);
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                reject(new Error(`Script load timeout: ${src}`));
            }, 8000);
            
            // Clear timeout on successful load
            const originalOnload = script.onload;
            script.onload = () => {
                clearTimeout(timeoutId);
                originalOnload();
            };
            
            document.head.appendChild(script);
        });
    }

    stopCamera() {
        this.state.cameraActive = false;
        this.state.cameraError = '';
        this.state.cameraStatus = 'Camera đã tắt';
        this.stopFaceDetection();
        
        if (this.state._mediaStream) {
            this.state._mediaStream.getTracks().forEach(track => track.stop());
            this.state._mediaStream = null;
        }
        
        const video = document.getElementById('ekycVideoPreview');
        if (video) {
            video.srcObject = null;
        }
        console.log('📹 Camera stopped');
    }

    captureImage(isAutoCapture = false) {
        if (!this.state.cameraActive || this.isAllImagesCaptured()) return;
        
        try {
            const video = document.getElementById('ekycVideoPreview');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            this.state.capturedImages.push(imageData);
            this.state.capturedImageTypes.push(this.state.currentCapturePhase);
            
            // Update last capture time for auto-capture
            this.state.lastCaptureTime = Date.now();
            
            // Get current phase info
            const currentPhase = this.state.currentCapturePhase;
            const currentCount = this.getCapturedCount(currentPhase);
            const requiredCount = this.state.captureRequirements[currentPhase];
            
            // Show capture feedback
            this.updateCameraInstructions(`✅ Chụp ${this.getPhaseName(currentPhase)} thành công! (${currentCount}/${requiredCount})`);
            
            // Check if current phase is completed
            if (currentCount >= requiredCount) {
                this.updateCapturePhase();
                
                if (this.isAllImagesCaptured()) {
                    this.state.cameraInstructions = '🎉 Hoàn thành chụp ảnh! Đang tự động xác thực eKYC...';
                    this.stopFaceDetection();
                    this.state.cameraStatus = 'Đang tự động xác thực eKYC...';
                    
                    // Auto-verify eKYC after a short delay
                    setTimeout(() => {
                        this.processEkycVerification();
                    }, 2000); // Wait 2 seconds before auto-verification
                } else {
                    // Move to next phase
                    const nextPhase = this.state.currentCapturePhase;
                    this.updateCameraInstructions(`🔄 Chuyển sang chụp ${this.getPhaseName(nextPhase)}. Vui lòng điều chỉnh khuôn mặt.`);
                }
            }
            
            // Reset perfect face timer for next capture
            this.state.perfectFaceStartTime = 0;
            
        } catch (error) {
            console.error('❌ Error capturing image:', error);
            this.showModal('Lỗi', 'Xác thực thất bại. Vui lòng thử lại.');
        }
    }

    removeCapturedImage(index) {
        const removedType = this.state.capturedImageTypes[index];
        this.state.capturedImages.splice(index, 1);
        this.state.capturedImageTypes.splice(index, 1);
        
        this.state.lastCaptureTime = 0; // Reset capture time to allow immediate re-capture
        this.state.perfectFaceStartTime = 0; // Reset perfect face timer
        
        // Update current phase if needed
        this.updateCapturePhase();
        
        this.updateCameraInstructions(`🗑️ Đã xóa ảnh ${this.getPhaseName(removedType)}. Vui lòng chụp lại.`);
        console.log(`🗑️ Removed ${removedType} image ${index}, reset timers for re-capture`);
    }

    async processEkycVerification() {
        if (!this.isAllImagesCaptured()) {
            const frontCount = this.getCapturedCount('front');
            const leftCount = this.getCapturedCount('left');
            const rightCount = this.getCapturedCount('right');
            
            this.showModal('Thiếu ảnh', 
                `Vui lòng chụp đủ ảnh theo yêu cầu:\n` +
                `- Chỉnh diện: ${frontCount}/${this.state.captureRequirements.front}\n` +
                `- Góc trái: ${leftCount}/${this.state.captureRequirements.left}\n` +
                `- Góc phải: ${rightCount}/${this.state.captureRequirements.right}`
            );
            return;
        }
        
        this.state.isProcessing = true;
        this.state.cameraStatus = 'Đang xử lý xác thực...';
        
        try {
            const formData = new FormData();
            
            // Add CCCD front image only (eKYC service only needs frontID)
            formData.append('frontID', this.state.ekycFiles.front);
            
            // Add 7 portrait images
            for (let i = 0; i < this.state.capturedImages.length; i++) {
                const imageFile = this.dataURLtoFile(this.state.capturedImages[i], `portrait_${i + 1}.jpg`);
                console.log(`📸 Adding portrait image ${i + 1}:`, imageFile.name, imageFile.type, imageFile.size);
                formData.append('portraitImages', imageFile);
            }
            
            console.log('🚀 Sending eKYC verification request...');
            console.log('📁 FormData contents:');
            for (let [key, value] of formData.entries()) {
                console.log(`  ${key}:`, value instanceof File ? `${value.name} (${value.type}, ${value.size} bytes)` : value);
            }
            
            const response = await fetch('/api/ekyc-process', {
                method: 'POST',
                body: formData
            });
            
            console.log('📡 Response status:', response.status);
            console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
            
            const result = await response.json();
            console.log('🔍 eKYC verification result:', result);
            
            if (response.ok && result.success) {
                // Success - update form with OCR data
                this.updateFormWithEkycResult(result);
                this.state.ekycResult = {
                    success: true,
                    message: 'Xác thực eKYC thành công! Thông tin đã được cập nhật tự động.'
                };
                
                // Show success message and close modal
                this.showModal('Thành công', 'Xác thực eKYC thành công! Thông tin đã được cập nhật tự động.');
                
                // Close eKYC modal after 3 seconds but don't redirect
                setTimeout(() => {
                    this.closeEkycModal();
                    // Don't redirect to avoid losing data
                }, 3000);
                
            } else {
                // Failed
                const errorMsg = result.error || 'Xác thực eKYC thất bại. Vui lòng thử lại.';
                this.state.ekycResult = {
                    success: false,
                    error: errorMsg
                };
                
                // Show error message for auto-verification
                this.showModal('Lỗi', errorMsg);
            }
            
        } catch (error) {
            console.error('❌ Error during eKYC verification:', error);
            this.showModal('Lỗi', 'Lỗi kết nối đến server eKYC. Vui lòng thử lại.');
        } finally {
            this.state.isProcessing = false;
            this.state.cameraStatus = 'Camera đã sẵn sàng';
        }
    }

    updateFormWithEkycResult(result) {
        // /ekyc-process endpoint only returns face matching results, not OCR data
        // OCR data is already processed separately when uploading CCCD images
        console.log('✅ eKYC face matching successful:', result);
        
        // Save current form data to session storage with CCCD images
        const profileData = { 
            ...this.state.formData,
            // Preserve CCCD images
            frontPreviewBase64: this.state.ekycFiles.frontPreview,
            backPreviewBase64: this.state.ekycFiles.backPreview
        };
        
        sessionStorage.setItem('personalProfileData', JSON.stringify(profileData));
        sessionStorage.setItem('personalProfileUserId', String(window.currentUserId || ''));
        
        console.log('✅ Form data and CCCD images saved to session storage after eKYC verification');
        
        // Force re-render to ensure data is displayed
        this.render();
    }

    dataURLtoFile(dataURL, filename) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        // Ensure correct mimetype for images
        const fileType = mime || 'image/jpeg';
        console.log(`📸 Creating file: ${filename}, type: ${fileType}, size: ${u8arr.length} bytes`);
        
        return new File([u8arr], filename, { type: fileType });
    }

    formatDateForInput(dateStr) {
        if (!dateStr) return '';
        
        const cleanDateStr = dateStr.toString().trim();
        console.log(`📅 Formatting date: "${cleanDateStr}"`);
        
        const patterns = [
            /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
            /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/,
            /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
            /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/
        ];
        
        for (const pattern of patterns) {
            const match = cleanDateStr.match(pattern);
            if (match) {
                let day, month, year;
                
                if (pattern.source.startsWith('^(\\d{4})')) {
                    year = match[1];
                    month = match[2];
                    day = match[3];
                } else {
                    day = match[1];
                    month = match[2];
                    year = match[3];
                }
                
                const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                console.log(`📅 Date formatted: "${cleanDateStr}" -> "${formattedDate}"`);
                return formattedDate;
            }
        }
        
        console.log(`⚠️ Date format not recognized: "${cleanDateStr}"`);
        return '';
    }

    findCountryIdByName(countryName) {
        if (!countryName) {
            return '';
        }
        
        const normalizedName = countryName.trim().toLowerCase();
        
        // First, try to map Vietnamese names to English names
        const vietnameseToEnglish = {
            'việt nam': 'vietnam',
            'viet nam': 'vietnam',
            'cộng hòa xã hội chủ nghĩa việt nam': 'vietnam',
            'chxhcn việt nam': 'vietnam',
            'chxhcnvn': 'vietnam',
            'hoa kỳ': 'united states',
            'mỹ': 'united states',
            'anh': 'united kingdom',
            'nhật bản': 'japan',
            'nhật': 'japan',
            'trung quốc': 'china',
            'hàn quốc': 'south korea',
            'hàn': 'south korea',
            'thái lan': 'thailand',
            'thái': 'thailand',
            'đức': 'germany',
            'pháp': 'france',
            'ý': 'italy',
            'tây ban nha': 'spain',
            'hà lan': 'netherlands',
            'thụy sĩ': 'switzerland',
            'thụy điển': 'sweden'
        };
        
        // Convert Vietnamese to English if possible
        let searchName = normalizedName;
        if (vietnameseToEnglish[normalizedName]) {
            searchName = vietnameseToEnglish[normalizedName];
        }
        
        // Use mapping from database if available
        if (this.state.countryMapping) {
            // Try exact match first
            let countryId = this.state.countryMapping[searchName];
            if (countryId) {
                return countryId;
            }
            
            // Try original name
            countryId = this.state.countryMapping[countryName];
            if (countryId) {
                return countryId;
            }
            
            // Try partial matches
            for (const [key, id] of Object.entries(this.state.countryMapping)) {
                if (typeof key === 'string' && (searchName.includes(key) || key.includes(searchName))) {
                    return id;
                }
            }
        }
        
        // Fallback to hardcoded mapping if database mapping fails
        const fallbackMap = {
            // Vietnam variations
            'việt nam': '241', 'vietnam': '241', 'vn': '241', 'viet nam': '241', 'việt': '241', 'viet': '241',
            'cộng hòa xã hội chủ nghĩa việt nam': '241', 'chxhcn việt nam': '241', 'chxhcnvn': '241',
            
            // USA variations
            'hoa kỳ': '233', 'usa': '233', 'united states': '233', 'us': '233', 'mỹ': '233', 'america': '233',
            'united states of america': '233', 'u.s.a': '233', 'u.s': '233',
            
            // UK variations
            'anh': '231', 'uk': '231', 'united kingdom': '231', 'england': '231', 'great britain': '231',
            'britain': '231', 'gb': '231', 'u.k': '231',
            
            // Japan variations
            'nhật bản': '113', 'japan': '113', 'jp': '113', 'japanese': '113', 'nhật': '113',
            
            // China variations
            'trung quốc': '48', 'china': '48', 'cn': '48', 'chinese': '48',
            'people\'s republic of china': '48', 'prc': '48',
            
            // Korea variations
            'hàn quốc': '121', 'south korea': '121', 'korea': '121', 'kr': '121', 'republic of korea': '121',
            'rok': '121', 'hàn': '121',
            
            // Other common countries
            'singapore': '197', 'sg': '197',
            'thailand': '217', 'th': '217', 'thái lan': '217', 'thái': '217',
            'malaysia': '132', 'my': '132',
            'indonesia': '103', 'id': '103',
            'philippines': '174', 'ph': '174',
            'australia': '14', 'au': '14',
            'canada': '39', 'ca': '39',
            'germany': '82', 'de': '82', 'đức': '82',
            'france': '75', 'fr': '75', 'pháp': '75',
            'italy': '107', 'it': '107', 'ý': '107',
            'spain': '195', 'es': '195', 'tây ban nha': '195',
            'netherlands': '156', 'nl': '156', 'hà lan': '156',
            'switzerland': '207', 'ch': '207', 'thụy sĩ': '207',
            'sweden': '203', 'se': '203', 'thụy điển': '203'
        };
        
        // Try fallback exact match
        const fallbackId = fallbackMap[normalizedName];
        if (fallbackId) {
            return fallbackId;
        }
        
        // Try fallback partial matches
        for (const [key, id] of Object.entries(fallbackMap)) {
            if (normalizedName.includes(key) || key.includes(normalizedName)) {
                return id;
            }
        }
        
        // Special case for Vietnam (most common)
        if (normalizedName.includes('việt') || normalizedName.includes('viet')) {
            return '241';
        }
        
        return '';
    }
    


    removeFrontImage = () => {
        if (this.state.ekycFiles.frontPreview && this.state.ekycFiles.frontPreview.startsWith('blob:')) {
            URL.revokeObjectURL(this.state.ekycFiles.frontPreview);
        }
        this.state.ekycFiles.front = null;
        this.state.ekycFiles.frontPreview = null;
        this.updatePersonalProfileDataSession('frontPreviewBase64', '');
    }

    removeBackImage = () => {
        if (this.state.ekycFiles.backPreview && this.state.ekycFiles.backPreview.startsWith('blob:')) {
            URL.revokeObjectURL(this.state.ekycFiles.backPreview);
        }
        this.state.ekycFiles.back = null;
        this.state.ekycFiles.backPreview = null;
        this.updatePersonalProfileDataSession('backPreviewBase64', '');
    }



    // Hàm tiện ích cập nhật sessionStorage
    updatePersonalProfileDataSession(key, value) {
        let data = {};
        try {
            data = JSON.parse(sessionStorage.getItem('personalProfileData')) || {};
        } catch (e) { data = {}; }
        data[key] = value;
        sessionStorage.setItem('personalProfileData', JSON.stringify(data));
    }

    closeModal = () => {
        this.state.showModal = false;
    };

    // Face Detection Methods
    startFaceDetection() {
        if (this.state.faceDetectionInterval) {
            clearInterval(this.state.faceDetectionInterval);
        }
        // Do not start detection if already captured all required images
        if (this.isAllImagesCaptured()) {
            console.log('🔍 Skipping startFaceDetection: already have all required images');
            return;
        }
        
        // Ensure camera instructions are set for current phase when starting detection
        this.updateCameraInstructionsForPhase(this.state.currentCapturePhase);
        
        // Determine detection method based on available APIs
        const detectionMethod = this.getBestDetectionMethod();
        console.log(`🔍 Starting face detection with method: ${detectionMethod}`);
        
        this.state.faceDetectionInterval = setInterval(() => {
            this.detectFace();
        }, this.constructor.CONFIG.DETECTION.INTERVAL); // Check every 1 second for better responsiveness
    }
    
    getBestDetectionMethod() {
        if (window.faceapi && this.areModelsLoaded()) {
            return 'Face API';
        } else {
            return 'Fallback (eKYC + Canvas)';
        }
    }
    
    areModelsLoaded() {
        if (!window.faceapi) {
            return false;
        }
        
        try {
            return window.faceapi.nets.tinyFaceDetector.isLoaded && 
                   window.faceapi.nets.faceLandmark68Net.isLoaded && 
                   window.faceapi.nets.faceExpressionNet.isLoaded;
        } catch (error) {
            console.warn('⚠️ Error checking model status:', error);
            return false;
        }
    }

    stopFaceDetection() {
        if (this.state.faceDetectionInterval) {
            clearInterval(this.state.faceDetectionInterval);
            this.state.faceDetectionInterval = null;
        }
        this.state.faceStatus = null;
        console.log('🔍 Face detection stopped');
    }

    async detectFace() {
        const video = document.getElementById('ekycVideoPreview');
        if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
            // Set waiting status if video not ready
            this.updateFaceStatus('waiting', 'fas fa-clock', 'Chờ camera khởi động...');
            // Ensure camera instructions are set for current phase
            if (!this.state.cameraInstructions) {
                this.updateCameraInstructionsForPhase(this.state.currentCapturePhase);
            }
            return;
        }

        // If already captured all required images, stop further detection to speed up flow
                        if (this.isAllImagesCaptured()) {
                    this.stopFaceDetection();
                    this.updateCameraInstructions('Đã chụp đủ ảnh theo yêu cầu. Sẵn sàng xác thực.');
                    return;
                }

        try {
            // Create canvas to analyze video frame
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);

            // Try Face API first, fallback to eKYC API, then canvas detection
            if (window.faceapi) {
                try {
                    await this.detectFaceWithFaceAPI(canvas);
                } catch (faceApiError) {
                    console.warn('⚠️ Face API detection failed, trying eKYC fallback:', faceApiError);
                    try {
                        await this.detectFaceWithEkycAPI(canvas);
                    } catch (ekycError) {
                        console.warn('⚠️ eKYC API failed, using enhanced canvas detection:', ekycError);
                        this.detectFaceWithCanvas(canvas);
                    }
                }
            } else {
                // Face API not available, try eKYC API first
                try {
                    await this.detectFaceWithEkycAPI(canvas);
                } catch (ekycError) {
                    console.warn('⚠️ eKYC API failed, using enhanced canvas detection:', ekycError);
                    this.detectFaceWithCanvas(canvas);
                }
            }
        } catch (error) {
            console.error('Error in face detection:', error);
            // Show helpful error message to user
            this.updateFaceStatus('error', 'fas fa-exclamation-triangle', 
                'Lỗi phát hiện khuôn mặt - Vui lòng thử lại hoặc kiểm tra camera');
            // Final fallback to basic detection
            this.detectFaceWithCanvas(canvas);
        }
    }

    async detectFaceWithFaceAPI(canvas) {
        try {
            // Check if models are loaded before using
            if (!this.areModelsLoaded()) {
                console.warn('⚠️ Face API models not loaded, using fallback detection');
                this.detectFaceWithCanvas(canvas);
                return;
            }
            
            // Use more lenient detection options
            const options = new window.faceapi.TinyFaceDetectorOptions({
                inputSize: this.constructor.CONFIG.DETECTION.INPUT_SIZE,
                scoreThreshold: this.constructor.CONFIG.DETECTION.SCORE_THRESHOLD
            });
            
            const detections = await window.faceapi.detectAllFaces(canvas, options)
                .withFaceLandmarks()
                .withFaceExpressions();
            
            console.log('🔍 Face API detections:', detections);
            
            if (detections.length === 0) {
                this.updateFaceStatus('no_face', 'fas fa-user-slash', 'Không tìm thấy khuôn mặt - Hãy di chuyển gần camera hơn và đảm bảo ánh sáng tốt');
                return;
            }
            
            if (detections.length > 1) {
                this.updateFaceStatus('multiple_faces', 'fas fa-users', 'Phát hiện nhiều khuôn mặt - Chỉ một người trong khung hình');
                return;
            }
            
            const detection = detections[0];
            const landmarks = detection.landmarks;
            
            // Check face position and orientation with more lenient criteria
            const isCentered = this.checkFaceCentered(landmarks, canvas);
            const isFrontFacing = this.checkFaceFrontFacing(landmarks);
            const isGoodSize = this.checkFaceSize(detection, canvas);
            
            console.log('📊 Face checks:', { isCentered, isFrontFacing, isGoodSize });
            
            // More lenient conditions - only require good size and basic positioning
            if (isGoodSize && (isCentered || isFrontFacing)) {
                const currentPhase = this.state.currentCapturePhase;
                const currentCount = this.getCapturedCount(currentPhase);
                const requiredCount = this.state.captureRequirements[currentPhase];
                
                // Track when face becomes perfect
                if (this.state.perfectFaceStartTime === 0) {
                    this.state.perfectFaceStartTime = Date.now();
                    console.log(`🎯 Face position perfect for ${currentPhase}, starting auto-capture timer...`);
                }
                
                const timeInPerfectPosition = Date.now() - this.state.perfectFaceStartTime;
                const remainingTime = Math.max(0, 2000 - timeInPerfectPosition);
                
                            if (remainingTime > 0) {
                this.updateFaceStatus('perfect', 'fas fa-check-circle', 
                    `Giữ nguyên vị trí ${this.getPhaseName(currentPhase)} ${Math.ceil(remainingTime/500)}s (${currentCount}/${requiredCount})`);
            } else {
                this.updateFaceStatus('perfect', 'fas fa-check-circle', 
                    `Đang chụp ${this.getPhaseName(currentPhase)}... (${currentCount}/${requiredCount})`);
            }
                
                // Auto-capture logic for eKYC API
                if (this.state.autoCaptureEnabled && 
                    currentCount < requiredCount && 
                    timeInPerfectPosition >= 500 &&
                    (!this.state.lastCaptureTime || Date.now() - this.state.lastCaptureTime > 500)) {
                    
                    this.captureImage(true);
                    this.state.perfectFaceStartTime = 0; // Reset timer for next capture
                }
            } else {
                // Face not in perfect position, reset timer
                if (this.state.perfectFaceStartTime > 0) {
                    this.state.perfectFaceStartTime = 0;
                    console.log('🔄 Face moved out of perfect position (eKYC API), resetting timer');
                }
                
                let message = 'Điều chỉnh khuôn mặt: ';
                let detailedMessage = '';
                
                if (!isCentered) {
                    message += 'Căn giữa, ';
                    detailedMessage += '• Di chuyển khuôn mặt vào giữa khung\n';
                }
                if (!isFrontFacing) {
                    message += 'Nhìn thẳng, ';
                    detailedMessage += '• Nhìn thẳng\n';
                }
                if (!isGoodSize) {
                    message += 'Tiến gần hơn';
                    detailedMessage += '• Di chuyển gần hơn';
                }
                
                this.updateFaceStatus('adjusting', 'fas fa-arrows-alt', message, detailedMessage);
            }
            
        } catch (error) {
            console.error('❌ Face API detection error:', error);
            throw error;
        }
    }
    
    checkFaceCentered(landmarks, canvas) {
        const nose = landmarks.getNose()[3]; // Bottom of nose
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        const distanceFromCenter = Math.sqrt(
            Math.pow(nose.x - centerX, 2) + Math.pow(nose.y - centerY, 2)
        );
        
        // More lenient - allow face to be further from center
        const maxDistance = Math.min(canvas.width, canvas.height) * 0.25;
        return distanceFromCenter < maxDistance;
    }
    
    checkFaceFrontFacing(landmarks) {
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        
        // Check if eyes are roughly horizontal (front-facing)
        const leftEyeY = leftEye.reduce((sum, point) => sum + point.y, 0) / leftEye.length;
        const rightEyeY = rightEye.reduce((sum, point) => sum + point.y, 0) / rightEye.length;
        
        const eyeHeightDiff = Math.abs(leftEyeY - rightEyeY);
        const maxHeightDiff = 20; // More lenient tolerance
        
        return eyeHeightDiff < maxHeightDiff;
    }
    
    checkFaceSize(detection, canvas) {
        const faceArea = detection.detection.box.area;
        const canvasArea = canvas.width * canvas.height;
        const faceRatio = faceArea / canvasArea;
        
        // More lenient size requirements - face should be between 5% and 50% of canvas area
        return faceRatio >= 0.05 && faceRatio <= 0.5;
    }

    async detectFaceWithEkycAPI(canvas) {
        try {
            // Skip calling detection API if already captured all required images
            if (this.isAllImagesCaptured()) {
                console.log('⏭️ Skipping eKYC detection API: already have all required images');
                return;
            }
            // Convert canvas to blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
            const file = new File([blob], 'face_frame.jpg', { type: 'image/jpeg' });
            
            // Create form data
            const formData = new FormData();
            formData.append('frame', file);
            formData.append('expected', this.state.currentCapturePhase); // Expect current phase orientation
            
            // Call eKYC detection API
            const response = await fetch('/api/ekyc/detection', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('🔍 eKYC detection result:', result);
                
                // Process detection result
                const currentPhase = this.state.currentCapturePhase;
                const currentCount = this.getCapturedCount(currentPhase);
                const requiredCount = this.state.captureRequirements[currentPhase];
                
                if (result.orientation === currentPhase && result.match) {
                    // Track when face becomes perfect
                    if (this.state.perfectFaceStartTime === 0) {
                        this.state.perfectFaceStartTime = Date.now();
                        console.log(`🎯 Face position perfect for ${currentPhase} (eKYC API), starting auto-capture timer...`);
                    }
                    
                    const timeInPerfectPosition = Date.now() - this.state.perfectFaceStartTime;
                    const remainingTime = Math.max(0, 1000 - timeInPerfectPosition);
                    
                    if (remainingTime > 0) {
                        this.updateFaceStatus('perfect', 'fas fa-check-circle', 
                            `Bắt đầu chụp ${this.getPhaseName(currentPhase)} sau ${Math.ceil(remainingTime/500)}s (${currentCount}/${requiredCount})`);
                    } else {
                        this.updateFaceStatus('perfect', 'fas fa-check-circle', 
                            `Đang chụp ${this.getPhaseName(currentPhase)}... (${currentCount}/${requiredCount})`);
                    }
                    
                    // Auto-capture logic for eKYC API
                    if (this.state.autoCaptureEnabled && 
                        currentCount < requiredCount && 
                        timeInPerfectPosition >= 1000 &&
                        (!this.state.lastCaptureTime || Date.now() - this.state.lastCaptureTime > 1000)) {
                        
                        console.log(`📸 Auto-capturing ${currentPhase} image due to perfect face position (eKYC API)`);
                        this.captureImage(true);
                        this.state.perfectFaceStartTime = 0; // Reset timer for next capture
                    }
                } else {
                    // Face not in perfect position, reset timer
                    if (this.state.perfectFaceStartTime > 0) {
                        this.state.perfectFaceStartTime = 0;
                        console.log(`🔄 Face moved out of perfect position for ${currentPhase} (eKYC API), resetting timer`);
                    }
                    
                    // Set common instruction for all cases
                    this.updateCameraInstructions(`Đang chụp ${this.getPhaseName(currentPhase)}. Vui lòng điều chỉnh khuôn mặt.`);
                    
                    if (result.orientation === 'left') {
                        this.updateFaceStatus('turn_right', 'fas fa-arrow-right', 'Quay sang phải', '• Quay mặt sang phải\n• Giữ nguyên vị trí khi quay');
                    } else if (result.orientation === 'right') {
                        this.updateFaceStatus('turn_left', 'fas fa-arrow-left', 'Quay sang trái', '• Quay mặt sang trái\n• Giữ nguyên vị trí khi quay');
                    } else {
                        this.updateFaceStatus('no_face', 'fas fa-user-slash', 'Không phát hiện khuôn mặt', '• Đặt khuôn mặt vào đúng vị trí\n• Đảm bảo ánh sáng đủ sáng');
                    }
                }
            } else {
                // Fallback to basic detection
                this.detectFaceWithCanvas(canvas);
            }
        } catch (error) {
            console.error('Error calling eKYC detection API:', error);
            // Fallback to basic detection
            this.detectFaceWithCanvas(canvas);
        }
    }

    detectFaceWithCanvas(canvas) {
        // Basic face detection using canvas analysis
        if (!canvas) {
            canvas = document.createElement('canvas');
            const video = document.getElementById('ekycVideoPreview');
            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
        }

        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Simple skin tone detection
        let skinPixels = 0;
        let totalPixels = data.length / 4;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Basic skin tone detection
            if (r > 95 && g > 40 && b > 20 && 
                Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
                Math.abs(r - g) > 15 && r > g && r > b) {
                skinPixels++;
            }
        }
        
        const skinRatio = skinPixels / totalPixels;
        
        // Determine status based on skin tone ratio
        let status, icon, message, instructions;
        
        if (skinRatio < 0.1) {
            // Reset timer if face not detected
            if (this.state.perfectFaceStartTime > 0) {
                this.state.perfectFaceStartTime = 0;
                console.log('🔄 No face detected (Canvas), resetting timer');
            }
            status = 'no_face';
            icon = 'fas fa-user-slash';
            message = 'Không phát hiện khuôn mặt';
            instructions = '';
        } else if (skinRatio < 0.2) {
            // Reset timer if face too far
            if (this.state.perfectFaceStartTime > 0) {
                this.state.perfectFaceStartTime = 0;
                console.log('🔄 Face too far (Canvas), resetting timer');
            }
            status = 'too_far';
            icon = 'fas fa-arrows-alt-v';
            message = 'Khuôn mặt quá xa';
            instructions = 'Vui lòng tiến lại gần hơn';
        } else if (skinRatio > 0.6) {
            // Reset timer if face too close
            if (this.state.perfectFaceStartTime > 0) {
                this.state.perfectFaceStartTime = 0;
                console.log('🔄 Face too close (Canvas), resetting timer');
            }
            status = 'too_close';
            icon = 'fas fa-arrows-alt-v';
            message = 'Khuôn mặt quá gần';
            instructions = 'Vui lòng lùi ra xa hơn';
        } else {
            const currentPhase = this.state.currentCapturePhase;
            const currentCount = this.getCapturedCount(currentPhase);
            const requiredCount = this.state.captureRequirements[currentPhase];
            
            // Track when face becomes perfect
            if (this.state.perfectFaceStartTime === 0) {
                this.state.perfectFaceStartTime = Date.now();
                console.log(`🎯 Face position perfect for ${currentPhase} (Canvas), starting auto-capture timer...`);
            }
            
            const timeInPerfectPosition = Date.now() - this.state.perfectFaceStartTime;
            const remainingTime = Math.max(0, 2000 - timeInPerfectPosition);
            
            if (remainingTime > 0) {
                status = 'perfect';
                icon = 'fas fa-check-circle';
                message = `Giữ nguyên vị trí ${this.getPhaseName(currentPhase)}! Bắt đầu chụp sau ${Math.ceil(remainingTime/1000)}s (${currentCount}/${requiredCount})`;
                instructions = `Giữ nguyên vị trí ${this.getPhaseName(currentPhase)}!`;
            } else {
                status = 'perfect';
                icon = 'fas fa-check-circle';
                message = `Đang chụp ${this.getPhaseName(currentPhase)}... (${currentCount}/${requiredCount})`;
                instructions = `Đang chụp ${this.getPhaseName(currentPhase)}...`;
            }
            
            // Auto-capture logic for canvas detection
            if (this.state.autoCaptureEnabled && 
                currentCount < requiredCount && 
                timeInPerfectPosition >= 2000 &&
                (!this.state.lastCaptureTime || Date.now() - this.state.lastCaptureTime > 2000)) {
                
                console.log(`📸 Auto-capturing ${currentPhase} image due to perfect face position (Canvas)`);
                this.captureImage(true);
                this.state.perfectFaceStartTime = 0; // Reset timer for next capture
            }
        }
        
        // Only update if status changed
        if (!this.state.faceStatus || this.state.faceStatus.status !== status) {
            this.updateFaceStatus(status, icon, message);
            this.updateCameraInstructions(instructions);
        }
    }

    updateFaceStatus(status, icon, message, detailedMessage = '') {
        this.state.faceStatus = {
            status: status,
            icon: icon,
            message: message,
            detailedMessage: detailedMessage
        };
        console.log('👤 Face status updated:', status, message);
        if (detailedMessage) {
            console.log('📋 Detailed instructions:', detailedMessage);
        }
    }
    
    getFaceFrameStyle() {
        const isPerfect = this.state.faceStatus && this.state.faceStatus.status === 'perfect';
        const borderColor = isPerfect ? '#28a745' : '#ffffff';
        const backgroundColor = isPerfect ? 'rgba(40, 167, 69, 0.05)' : 'rgba(255, 255, 255, 0.05)';
        return `width: 100%; height: 100%; border: 2px solid ${borderColor}; border-radius: 50%; position: relative; transition: all 0.3s ease; background: ${backgroundColor}; box-shadow: 0 0 20px ${isPerfect ? 'rgba(40, 167, 69, 0.2)' : 'rgba(255, 255, 255, 0.2)'}; opacity: 0.8;`;
    }
    
    getCornerStyle(position) {
        const isPerfect = this.state.faceStatus && this.state.faceStatus.status === 'perfect';
        const color = isPerfect ? '#28a745' : '#d32f2f';
        const size = '20px';
        const thickness = '3px';
        
        let style = `position: absolute; width: ${size}; height: ${size}; border: ${thickness} solid ${color}; transition: all 0.3s ease; opacity: 0.7;`;
        
        switch(position) {
            case 'top-left':
                style += 'top: -2px; left: -2px; border-right: none; border-bottom: none; border-radius: 20px 0 0 0;';
                break;
            case 'top-right':
                style += 'top: -2px; right: -2px; border-left: none; border-bottom: none; border-radius: 0 20px 0 0;';
                break;
            case 'bottom-left':
                style += 'bottom: -2px; left: -2px; border-right: none; border-top: none; border-radius: 0 0 0 20px;';
                break;
            case 'bottom-right':
                style += 'bottom: -2px; right: -2px; border-left: none; border-top: none; border-radius: 0 0 20px 0;';
                break;
        }
        
        return style;
    }
    
    getGuideLineStyle(type) {
        const isPerfect = this.state.faceStatus && this.state.faceStatus.status === 'perfect';
        const color = isPerfect ? 'rgba(40, 167, 69, 0.6)' : 'rgba(211, 47, 47, 0.4)';
        
        if (type === 'horizontal') {
            return `position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: ${color}; transform: translateY(-50%); transition: all 0.3s ease;`;
        } else {
            return `position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: ${color}; transform: translateX(-50%); transition: all 0.3s ease;`;
        }
    }
    
    getFacePositionIndicatorStyle() {
        const isPerfect = this.state.faceStatus && this.state.faceStatus.status === 'perfect';
        const color = isPerfect ? '#28a745' : '#d32f2f';
        return `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 120px; height: 160px; border: 2px dashed ${color}; border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%; transition: all 0.3s ease; opacity: ${isPerfect ? '1' : '0.7'};`;
    }
    
    getProgressRingStyle() {
        return `position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;`;
    }
    
    getProgressRingFillStyle() {
        const progress = (this.state.capturedImages.length / 7) * 100;
        const isPerfect = this.state.faceStatus && this.state.faceStatus.status === 'perfect';
        const color = isPerfect ? '#28a745' : '#ffffff';
        const circumference = 2 * Math.PI * 140;
        const strokeDasharray = circumference;
        const strokeDashoffset = circumference - (progress / 100) * circumference;
        
        return `stroke: ${color}; stroke-dasharray: ${strokeDasharray}; stroke-dashoffset: ${strokeDashoffset}; transform: rotate(-90deg); transform-origin: 50% 50%; transition: stroke-dashoffset 0.5s ease;`;
    }
    
    getFacePositionIndicatorStyle() {
        const isPerfect = this.state.faceStatus && this.state.faceStatus.status === 'perfect';
        const color = isPerfect ? '#28a745' : '#d32f2f';
        return `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 200px; height: 200px; border: 2px dashed ${color}; border-radius: 50%; transition: all 0.3s ease; opacity: ${isPerfect ? '1' : '0.7'}; z-index: 2;`;
    }
    
    getCenterCrosshairStyle() {
        return `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; z-index: 3;`;
    }
    
    getFaceInstructionsStyle() {
        const isPerfect = this.state.faceStatus && this.state.faceStatus.status === 'perfect';
        const color = isPerfect ? '#28a745' : '#d32f2f';
        return `position: absolute; bottom: -40px; left: 50%; transform: translateX(-50%); background: rgba(0, 0, 0, 0.8); color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 500; border: 1px solid ${color}; transition: all 0.3s ease;`;
    }
    
    toString(value) {
        return String(value);
    }

    // Cleanup method
    willUnmount() {
        this.stopCamera();
        this.stopFaceDetection();
        if (this.state.ekycFiles.frontPreview && this.state.ekycFiles.frontPreview.startsWith('blob:')) {
            URL.revokeObjectURL(this.state.ekycFiles.frontPreview);
        }
        if (this.state.ekycFiles.backPreview && this.state.ekycFiles.backPreview.startsWith('blob:')) {
            URL.revokeObjectURL(this.state.ekycFiles.backPreview);
        }
    }
}

// Expose the component globally for the entrypoint to mount
Object.assign(window, { PersonalProfileWidget });

// Auto-mount when script is loaded
if (typeof owl !== 'undefined') {
    const widgetContainer = document.getElementById('personalProfileWidget');
    if (widgetContainer) {
        owl.mount(PersonalProfileWidget, widgetContainer);
    }
} 
