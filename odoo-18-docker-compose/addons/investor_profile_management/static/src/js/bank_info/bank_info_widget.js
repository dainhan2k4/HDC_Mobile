// Bank Information Widget Component
console.log('Loading BankInfoWidget component...');

const { Component, xml, useState, onMounted } = owl;

class BankInfoWidget extends Component {
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
                <h3 class="text-secondary fw-semibold mb-4">Thông tin tài khoản ngân hàng</h3>
                <form class="row g-3" t-on-submit.prevent="saveProfile">
                  <fieldset>
                    <legend class="fw-bold fs-6 mb-3">1. Thông tin tài khoản ngân hàng</legend>
                    <div class="col-12 mb-3">
                      <label for="account_holder_name" class="form-label">Tên chủ tài khoản <span style="color:#f97316">*</span></label>
                      <input id="account_holder_name" type="text" class="form-control" t-model="state.formData.account_holder" required="required"/>
                    </div>
                    <div class="col-12 mb-3">
                      <label for="bank_account_number" class="form-label">Số tài khoản <span style="color:#f97316">*</span></label>
                      <input id="bank_account_number" type="text" class="form-control" t-model="state.formData.account_number" required="required"/>
                    </div>
                    <div class="col-12 mb-3">
                      <label for="bank_name" class="form-label">Tên ngân hàng <span style="color:#f97316">*</span></label>
                      <input id="bank_name" type="text" class="form-control" t-model="state.formData.bank_name" required="required"/>
                    </div>
                    <div class="col-12 mb-3">
                      <label for="bank_branch" class="form-label">Chi nhánh <span style="color:#f97316">*</span></label>
                      <input id="bank_branch" type="text" class="form-control" t-model="state.formData.branch" required="required"/>
                    </div>
                    <div class="form-text mt-2">(*) Thông tin bắt buộc và tài khoản sẽ được dùng khi thực hiện lệnh bán</div>
                  </fieldset>
                  <fieldset>
                    <legend class="fw-bold fs-6 mb-3">2. Thông tin khác</legend>
                    <div class="col-12 mb-3">
                      <label for="company_name" class="form-label">Công ty nơi làm việc</label>
                      <input id="company_name" type="text" class="form-control" t-model="state.formData.company_name"/>
                    </div>
                    <div class="col-12 mb-3">
                      <label for="company_address" class="form-label">Địa chỉ Công ty</label>
                      <input id="company_address" type="text" class="form-control" t-model="state.formData.company_address"/>
                    </div>
                    <div class="col-12 mb-3">
                      <label for="monthly_income" class="form-label">Mức thu nhập hàng tháng</label>
                      <input id="monthly_income" type="text" placeholder="Nhập số tiền (VD: 1.000.000)" class="form-control" t-model="state.formData.monthly_income" t-on-input="formatCurrency"/>
                    </div>
                    <div class="col-12 mb-3">
                      <label for="occupation" class="form-label">Nghề nghiệp</label>
                      <input id="occupation" type="text" class="form-control" t-model="state.formData.occupation"/>
                    </div>
                    <div class="col-12 mb-3">
                      <label for="position" class="form-label">Chức vụ</label>
                      <input id="position" type="text" class="form-control" t-model="state.formData.position"/>
                    </div>
                  </fieldset>
                  <div class="col-12 d-flex justify-content-end gap-2 mt-3">
                    <button type="submit" class="btn btn-sm fw-semibold rounded-pill" style="background-color:#f97316;border-color:#f97316;color:white">Lưu Thông Tin</button>
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
                <t t-if="state.modalTitle === 'Thành công'">
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
        console.log("🎯 BankInfoWidget - setup called!");

        this.state = useState({
            loading: true,
            profile: {},
            statusInfo: {},
            formData: {
                account_holder: '',
                account_number: '',
                bank_name: '',
                branch: '',
                company_name: '',
                company_address: '',
                monthly_income: '',
                occupation: '',
                position: ''
            },
            activeTab: 'bank',
            showModal: false,
            modalTitle: '',
            modalMessage: '',
        });

        onMounted(async () => {
            // Hide loading spinner
            const loadingSpinner = document.getElementById('loadingSpinner');
            const widgetContainer = document.getElementById('bankInfoWidget');
            
            if (loadingSpinner && widgetContainer) {
                loadingSpinner.style.display = 'none';
                widgetContainer.style.display = 'block';
            }
            // Reset storage nếu user đổi
            const currentUserId = window.currentUserId || (window.odoo && window.odoo.session_info && window.odoo.session_info.uid);
            const storedUserId = sessionStorage.getItem('bankInfoUserId');
            if (storedUserId && String(storedUserId) !== String(currentUserId)) {
                sessionStorage.removeItem('bankInfoData');
                sessionStorage.removeItem('bankInfoUserId');
            }
            // Load profile data and status info
            await this.loadProfileData();
            this.loadInitialFormData(); // Load form data after profile is loaded or from sessionStorage
            await this.loadStatusInfo();
            
            this.state.loading = false;
        });
    }

    loadInitialFormData() {
        // Ưu tiên lấy từ sessionStorage
        const storedData = sessionStorage.getItem('bankInfoData');
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            Object.assign(this.state.formData, parsedData);
            // Format monthly_income nếu có
            if (this.state.formData.monthly_income) {
                this.state.formData.monthly_income = this.formatCurrencyValue(this.state.formData.monthly_income);
            }
            console.log("✅ Form data loaded from sessionStorage:", this.state.formData);
        } else if (this.state.profile && Object.keys(this.state.profile).length > 0) {
            this.state.formData.account_holder = this.state.profile.account_holder || '';
            this.state.formData.account_number = this.state.profile.account_number || '';
            this.state.formData.bank_name = this.state.profile.bank_name || '';
            this.state.formData.branch = this.state.profile.branch || '';
            this.state.formData.company_name = this.state.profile.company_name || '';
            this.state.formData.company_address = this.state.profile.company_address || '';
            this.state.formData.monthly_income = this.formatCurrencyValue(this.state.profile.monthly_income) || '';
            this.state.formData.occupation = this.state.profile.occupation || '';
            this.state.formData.position = this.state.profile.position || '';
            console.log("✅ Form data initialized with existing profile data:", this.state.formData);
        } else {
            console.log("ℹ️ No existing bank data found, using default values");
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

    async saveProfile() {
        try {
            const bankData = { ...this.state.formData };
            // Chuyển monthly_income về số nếu có dấu chấm
            if (bankData.monthly_income) {
                bankData.monthly_income = parseFloat(String(bankData.monthly_income).replace(/\./g, ''));
            }
            // ... kiểm tra dữ liệu ...
            // Gửi dữ liệu lên Odoo
            const response = await fetch('/save_bank_info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bankData)
            });
            const result = await response.json();
            if (response.ok && result.success) {
                sessionStorage.setItem('bankInfoData', JSON.stringify(bankData));
                sessionStorage.setItem('bankInfoUserId', String(window.currentUserId || ''));
                this.state.modalTitle = 'Thành công';
                this.state.modalMessage = 'Lưu Thông Tin ngân hàng thành công!';
                this.state.showModal = true;
                setTimeout(() => { window.location.href = '/address_info'; }, 1500);
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

    closeModal = () => {
        this.state.showModal = false;
    };

    async loadProfileData() {
        try {
            console.log("🔄 Loading bank profile data from server...");
            const response = await fetch('/data_bank_info');
            const data = await response.json();
            console.log("📥 Bank profile data received:", data);
            
            if (data && data.length > 0) {
                // For bank info, data might be an array of accounts, we'll take the first one or handle multiple later.
                // For now, assuming user only fills out one primary bank account for simplicity.
                this.state.profile = data[0];
                console.log("✅ Bank profile data loaded successfully:", this.state.profile);
            } else {
                console.log("ℹ️ No existing bank profile data found on server");
                this.state.profile = {};
            }
        } catch (error) {
            console.error("❌ Error fetching bank profiles:", error);
            this.state.profile = {};
        }
    }

    formatCurrency(ev) {
        // Lấy giá trị hiện tại
        let value = ev.target.value;
        
        // Loại bỏ tất cả ký tự không phải số
        value = value.replace(/[^\d]/g, '');
        
        // Format với dấu phẩy ngăn cách hàng nghìn
        if (value) {
            value = parseInt(value).toLocaleString('vi-VN');
        }
        
        // Cập nhật giá trị vào state
        this.state.formData.monthly_income = value;
    }

    formatCurrencyValue(value) {
        if (value) {
            return parseInt(value).toLocaleString('vi-VN');
        }
        return '';
    }

    parseCurrencyValue(value) {
        if (value) {
            // Loại bỏ tất cả ký tự không phải số
            return value.replace(/[^\d]/g, '');
        }
        return '';
    }
}

// Make component globally available
window.BankInfoWidget = BankInfoWidget;
console.log('BankInfoWidget component loaded and available globally');

// Auto-mount when script is loaded
if (typeof owl !== 'undefined') {
    const widgetContainer = document.getElementById('bankInfoWidget');
    if (widgetContainer) {
        console.log('Mounting BankInfoWidget');
        owl.mount(BankInfoWidget, widgetContainer);
    }
} 