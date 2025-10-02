// Verification Completion Widget Component
console.log('Loading VerificationWidget component...');

const { Component, xml, useState, onMounted } = owl;

class VerificationWidget extends Component {
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
                <h3 class="text-secondary fw-semibold mb-4">Xác thực hoàn tất</h3>
                <form class="row g-3" t-on-submit.prevent="completeVerification">
                  <fieldset>
                    <legend class="fw-bold fs-6 mb-3">Xác nhận hoàn tất</legend>
                    <p class="text-secondary mb-3">
                      Để bắt đầu thực hiện giao dịch, Quý khách cần phải xác nhận thông tin và đồng ý các điều khoản, điều kiện dưới đây:
                    </p>
                    <p class="text-secondary mb-3">
                      Sau khi hoàn tất bước xác nhận này thông tin <span class="fw-bold text-primary">Hợp đồng mở tài khoản</span> của Quý khách sẽ được gửi tới email <span class="fw-bold" style="color:#f97316"><t t-esc="state.contractEmail" /></span>.
                    </p>
                    <p class="text-secondary mb-3">
                      Quý khách vui lòng in, ký xác nhận và gửi thư về địa chỉ của công ty trong phần liên hệ!
                    </p>
                    <div class="p-3 border rounded-3 bg-light mb-3 text-secondary" style="max-height:200px; overflow-y:auto;">
                      <p class="mb-2">cần thiết để thực hiện nghĩa vụ thuế của tôi tại nơi đó ...</p>
                      <p class="mb-2">Khi được yêu cầu bởi luật pháp hay cơ quan thuế nước sở tại ...</p>
                      <p>Tôi cam kết sẽ thông báo cho Fincorp ...</p>
                    </div>
                    <div class="form-check mb-3">
                      <input type="checkbox" id="agree_terms" t-model="state.agreedToTerms" required="required" class="form-check-input"/>
                      <label for="agree_terms" class="form-check-label">Tôi đồng ý với các điều khoản và điều kiện trên <span style="color:#f97316">*</span></label>
                    </div>
                  </fieldset>
                  <div class="col-12 d-flex justify-content-end gap-2 mt-3">
                    <button type="button" class="btn btn-sm fw-semibold rounded-pill" style="color:#f97316;border-color:#f97316" t-on-click="onBack">Quay lại</button>
                    <button type="submit" class="btn btn-sm fw-semibold rounded-pill" style="background-color:#f97316;border-color:#f97316;color:white">Hoàn tất</button>
                  </div>
                </form>
              </section>
            </div>
          </div>
        </div>
        <div t-if="state.showModal" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.5);">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content" style="border:2px solid #f97316;">
              <div class="modal-header" style="border-bottom:1px solid #f97316;">
                <h5 class="modal-title" style="color:#f97316;"><t t-esc="state.modalTitle" /></h5>
                <button type="button" class="btn-close" t-on-click="closeModal"></button>
              </div>
              <div class="modal-body text-center">
                <t t-if="state.modalTitle === 'Thành công' || state.modalTitle === 'Xác nhận thành công'">
                  <div style="font-size:3rem;color:#43a047;">
                    <i class="fa fa-check-circle"></i>
                  </div>
                </t>
                <p class="mt-3"><t t-esc="state.modalMessage" /></p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-sm fw-semibold rounded-pill" style="background-color:#f97316;border-color:#f97316;color:white" t-on-click="closeModal">Đóng</button>
              </div>
            </div>
          </div>
        </div>
    `;

    setup() {
        console.log("🎯 VerificationWidget - setup called!");

        this.state = useState({
            loading: true,
            profile: {},
            statusInfo: {},
            agreedToTerms: false,
            contractEmail: 'nhaltp7397@gmail.com', // Hardcoded for now, will fetch dynamically later
            companyAddress: '123 Fincorp St, Financial City, Country', // Hardcoded for now
            showModal: false,
            modalTitle: '',
            modalMessage: '',
        });

        onMounted(async () => {
            // Hide loading spinner
            const loadingSpinner = document.getElementById('loadingSpinner');
            const widgetContainer = document.getElementById('verificationWidget');
            
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
            }
            // Load profile data and status info
            await this.loadProfileData();
            this.loadInitialFormData(); // Load form data from sessionStorage
            await this.loadStatusInfo();
            await this.checkAllInfoCompleted();
            
            this.state.loading = false;
        });
    }

    loadInitialFormData() {
        // Load data from sessionStorage if available
        const storedPersonalData = sessionStorage.getItem('personalProfileData');
        const storedBankData = sessionStorage.getItem('bankInfoData');
        const storedAddressData = sessionStorage.getItem('addressInfoData');

        if (storedPersonalData) {
            console.log("✅ Loaded personalProfileData from sessionStorage:", JSON.parse(storedPersonalData));
        } else {
            console.log("ℹ️ No personal profile data in sessionStorage");
        }
        if (storedBankData) {
            console.log("✅ Loaded bankInfoData from sessionStorage:", JSON.parse(storedBankData));
        } else {
            console.log("ℹ️ No bank info data in sessionStorage");
        }
        if (storedAddressData) {
            console.log("✅ Loaded addressInfoData from sessionStorage:", JSON.parse(storedAddressData));
        } else {
            console.log("ℹ️ No address info data in sessionStorage");
        }
    }

    async loadStatusInfo() {
        try {
            const response = await fetch('/get_status_info');
            const data = await response.json();
            if (data && data.length > 0) {
                this.state.statusInfo = data[0];
            } else {
                this.state.statusInfo = {};
            }
            // Luôn lấy tên user từ profile
            const profileRes = await fetch('/data_personal_profile');
            const profileData = await profileRes.json();
            if (profileData && profileData.length > 0 && profileData[0].name) {
                this.state.profile.name = profileData[0].name;
            } else {
                this.state.profile.name = (window.odoo && window.odoo.session_info && window.odoo.session_info.name) || 'Chưa có thông tin';
            }
        } catch (error) {
            this.state.statusInfo = {};
            this.state.profile.name = (window.odoo && window.odoo.session_info && window.odoo.session_info.name) || 'Chưa có thông tin';
        }
    }

    async checkAllInfoCompleted() {
        // Gọi API kiểm tra đủ thông tin 3 phần
        try {
            const [personal, bank, address] = await Promise.all([
                fetch('/data_personal_profile').then(r => r.json()),
                fetch('/data_bank_info').then(r => r.json()),
                fetch('/data_address_info').then(r => r.json()),
            ]);
            if (!personal.length) {
                this.state.modalTitle = 'Thiếu thông tin';
                this.state.modalMessage = 'Bạn cần nhập đầy đủ thông tin cá nhân trước khi xác thực.';
                this.state.showModal = true;
                setTimeout(() => { window.location.href = '/personal_profile'; }, 1800);
                return;
            }
            if (!bank.length) {
                this.state.modalTitle = 'Thiếu thông tin';
                this.state.modalMessage = 'Bạn cần nhập đầy đủ thông tin ngân hàng trước khi xác thực.';
                this.state.showModal = true;
                setTimeout(() => { window.location.href = '/bank_info'; }, 1800);
                return;
            }
            if (!address.length) {
                this.state.modalTitle = 'Thiếu thông tin';
                this.state.modalMessage = 'Bạn cần nhập đầy đủ thông tin địa chỉ trước khi xác thực.';
                this.state.showModal = true;
                setTimeout(() => { window.location.href = '/address_info'; }, 1800);
                return;
            }
        } catch (error) {
            this.state.modalTitle = 'Lỗi';
            this.state.modalMessage = 'Không kiểm tra được thông tin hồ sơ. Vui lòng thử lại.';
            this.state.showModal = true;
        }
    }

    async completeVerification() {
        // Kiểm tra xác nhận điều khoản
        if (!this.state.agreedToTerms) {
            this.state.modalTitle = 'Thiếu xác nhận';
            this.state.modalMessage = 'Vui lòng đồng ý với các điều khoản và điều kiện để hoàn tất.';
            this.state.showModal = true;
            return;
        }

        try {
            // Kiểm tra thông tin từ các bước trước
            const personalData = JSON.parse(sessionStorage.getItem('personalProfileData') || '{}');
            const bankData = JSON.parse(sessionStorage.getItem('bankInfoData') || '{}');
            const addressData = JSON.parse(sessionStorage.getItem('addressInfoData') || '{}');

            // Kiểm tra thông tin cá nhân
            const requiredPersonalFields = ['name', 'birth_date', 'gender', 'nationality', 'id_type', 'id_number', 'id_issue_date', 'id_issue_place'];
            const missingPersonalFields = requiredPersonalFields.filter(field => !personalData[field]);
            
            // Kiểm tra thông tin ngân hàng
            const requiredBankFields = ['bank_name', 'account_number', 'account_holder', 'branch'];
            const missingBankFields = requiredBankFields.filter(field => !bankData[field]);
            
            // Kiểm tra thông tin địa chỉ (chỉ yêu cầu các trường bắt buộc)
            const requiredAddressFields = ['city', 'district', 'ward'];
            const missingAddressFields = requiredAddressFields.filter(field => !addressData[field]);

            // Tạo thông báo lỗi nếu có trường bắt buộc bị thiếu
            let errorMessage = '';
            
            if (missingPersonalFields.length > 0) {
                errorMessage += 'Thiếu thông tin cá nhân: ' + missingPersonalFields.join(', ') + '\n';
            }
            
            if (missingBankFields.length > 0) {
                errorMessage += 'Thiếu thông tin ngân hàng: ' + missingBankFields.join(', ') + '\n';
            }
            
            if (missingAddressFields.length > 0) {
                errorMessage += 'Thiếu thông tin địa chỉ: ' + missingAddressFields.join(', ');
            }

            // Nếu có lỗi thiếu thông tin, hiển thị thông báo
            if (errorMessage) {
                this.state.modalTitle = 'Thiếu thông tin';
                this.state.modalMessage = 'Vui lòng điền đầy đủ thông tin trước khi xác thực.\n\n' + errorMessage;
                this.state.showModal = true;
                return;
            }

            // Nếu đã đủ thông tin, hiển thị thông báo hoàn tất
            this.state.modalTitle = 'Xác nhận hoàn tất';
            this.state.modalMessage = 'Bạn đã hoàn tất việc xác thực thông tin. Vui lòng đợi hệ thống xử lý.';
            this.state.showModal = true;
            
            // Chuyển hướng về trang chủ sau 3 giây
            setTimeout(() => { 
                window.location.href = '/my/home'; 
            }, 3000);
            
        } catch (error) {
            console.error('Lỗi khi xác thực:', error);
            this.state.modalTitle = 'Lỗi';
            this.state.modalMessage = 'Có lỗi xảy ra khi xác thực: ' + error.message;
            this.state.showModal = true;
        }
    }

    onBack() {
        window.location.href = '/address_info';
    }

    getCSRFToken() {
        const csrfToken = document.querySelector('meta[name="csrf-token"]');
        return csrfToken ? csrfToken.getAttribute('content') : '';
    }

    async loadProfileData() {
        try {
            console.log("🔄 Loading verification profile data from server...");
            const response = await fetch('/data_verification');
            const data = await response.json();
            console.log("📥 Verification profile data received:", data);
            
            if (data && data.length > 0) {
                this.state.profile = data[0];
                console.log("✅ Verification profile data loaded successfully:", this.state.profile);
            } else {
                console.log("ℹ️ No existing verification profile data found on server");
                this.state.profile = {};
            }
        } catch (error) {
            console.error("❌ Error fetching verification profiles:", error);
            this.state.profile = {};
        }
    }

    closeModal = () => {
        this.state.showModal = false;
    };
}

// Make component globally available
window.VerificationWidget = VerificationWidget;
console.log('VerificationWidget component loaded and available globally');

// Auto-mount when script is loaded
if (typeof owl !== 'undefined') {
    const widgetContainer = document.getElementById('verificationWidget');
    if (widgetContainer) {
        console.log('Mounting VerificationWidget');
        owl.mount(VerificationWidget, widgetContainer);
    }
} 