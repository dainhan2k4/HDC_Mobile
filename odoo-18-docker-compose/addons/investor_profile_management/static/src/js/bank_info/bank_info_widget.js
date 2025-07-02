// Bank Information Widget Component
console.log('Loading BankInfoWidget component...');

const { Component, xml, useState, onMounted } = owl;

class BankInfoWidget extends Component {
    static template = xml`
        <div class="bg-gray-50 p-6 font-sans">
          <!-- Odoo Owl template example for a bank information page -->
          <div class="max-w-7xl mx-auto bg-white rounded-lg shadow p-6">
            <div class="flex flex-col md:flex-row gap-6">
              <!-- Sidebar -->
              <aside class="md:w-96 flex-shrink-0 space-y-6">
                <section class="bg-gray-100 rounded-lg p-4">
                  <h2 class="font-bold text-lg text-gray-900 mb-2"><t t-esc="state.profile.name || 'Chưa có thông tin'" /></h2>
                  <p class="text-xs text-gray-600">Số TK: <span class="font-mono"><t t-esc="state.statusInfo.so_tk || 'Chưa có'" /></span></p>
                  <p class="text-xs text-gray-600">Mã giới thiệu: <span class="font-mono"><t t-esc="state.statusInfo.ma_gioi_thieu || 'Chưa có'" /></span></p>
                  <p class="text-xs text-gray-600">Trạng thái TK đầu tư: 
                    <span t-if="state.statusInfo.trang_thai_tk_dau_tu == 'da_duyet'" class="text-green-600 font-semibold">Đã duyệt</span>
                    <span t-elif="state.statusInfo.trang_thai_tk_dau_tu == 'cho_duyet'" class="text-yellow-600 font-semibold">Chờ duyệt</span>
                    <span t-elif="state.statusInfo.trang_thai_tk_dau_tu == 'tu_choi'" class="text-red-600 font-semibold">Từ chối</span>
                    <span t-else="" class="text-gray-600 font-semibold">Chưa có</span>
                  </p>
                  <p class="text-xs text-gray-600">Hồ sơ gốc: 
                    <span t-if="state.statusInfo.ho_so_goc == 'da_nhan'" class="text-green-600 font-semibold">Đã nhận</span>
                    <span t-elif="state.statusInfo.ho_so_goc == 'chua_nhan'" class="text-yellow-600 font-semibold">Chưa nhận</span>
                    <span t-else="" class="text-gray-600 font-semibold">Chưa có</span>
                  </p>
                  <p class="text-xs text-gray-600">RM: <t t-esc="state.statusInfo.rm_name || 'N/A'" />-<t t-esc="state.statusInfo.rm_id || 'N/A'" /></p>
                  <p class="text-xs text-gray-600">BDA: <t t-esc="state.statusInfo.bda_name || 'N/A'" />-<t t-esc="state.statusInfo.bda_id || 'N/A'" /></p>
                </section>
                <nav class="bg-white rounded-lg shadow p-4 text-sm font-semibold text-gray-700 space-y-2 select-none">
                  <a href="/personal_profile" class="flex items-center gap-2 border-l-4 border-transparent pl-3 py-2 w-full hover:border-indigo-700 hover:text-indigo-700 rounded">Thông tin cá nhân</a>
                  <a href="/bank_info" class="flex items-center gap-2 border-l-4 border-indigo-700 pl-3 py-2 w-full text-indigo-700 bg-indigo-50 rounded" aria-current="true">Thông tin tài khoản ngân hàng</a>
                  <a href="/address_info" class="flex items-center gap-2 border-l-4 border-transparent pl-3 py-2 w-full hover:border-indigo-700 hover:text-indigo-700 rounded">Thông tin địa chỉ</a>
                  <a href="/verification" class="flex items-center gap-2 border-l-4 border-transparent pl-3 py-2 w-full hover:border-indigo-700 hover:text-indigo-700 rounded">Xác thực hoàn tất</a>
                </nav>
              </aside>
              <!-- Main content -->
              <section class="flex-1 bg-white rounded-lg shadow p-6 text-xs text-gray-600">
                <h3 class="text-gray-500 font-semibold mb-4">Thông tin tài khoản ngân hàng</h3>
                <form class="space-y-8" t-on-submit.prevent="saveProfile">
                  <fieldset>
                    <legend class="font-bold text-lg">1. Thông tin tài khoản ngân hàng</legend>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label for="account_holder_name" class="block text-gray-700 font-bold">Tên chủ tài khoản <span class="text-red-600">*</span></label>
                      <input id="account_holder_name" type="text" class="col-span-2 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500" t-model="state.formData.account_holder" required="required"/>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label for="bank_account_number" class="block text-gray-700 font-bold">Số tài khoản <span class="text-red-600">*</span></label>
                      <input id="bank_account_number" type="text" class="col-span-2 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500" t-model="state.formData.account_number" required="required"/>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label for="bank_name" class="block text-gray-700 font-bold">Tên ngân hàng <span class="text-red-600">*</span></label>
                      <input id="bank_name" type="text" class="col-span-2 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500" t-model="state.formData.bank_name" required="required"/>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label for="bank_branch" class="block text-gray-700 font-bold">Chi nhánh <span class="text-red-600">*</span></label>
                      <input id="bank_branch" type="text" class="col-span-2 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500" t-model="state.formData.branch" required="required"/>
                    </div>
                    <p class="text-[10px] text-gray-400 mt-2 italic">(*) Thông tin bắt buộc và thông tin tài khoản ngân hàng được chuyển khoản khi thực hiện lệnh bán</p>
                  </fieldset>
                  <fieldset>
                    <legend class="font-bold text-lg">2. Thông tin khác</legend>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label for="company_name" class="block text-gray-700 font-bold">Công ty nơi làm việc</label>
                      <input id="company_name" type="text" class="col-span-2 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500" t-model="state.formData.company_name"/>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label for="company_address" class="block text-gray-700 font-bold">Địa chỉ Công ty</label>
                      <input id="company_address" type="text" class="col-span-2 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500" t-model="state.formData.company_address"/>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label for="monthly_income" class="block text-gray-700 font-bold">Mức thu nhập hàng tháng</label>
                      <input id="monthly_income" type="text" placeholder="Nhập số tiền (VD: 1.000.000)" class="col-span-2 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500" t-model="state.formData.monthly_income" t-on-input="formatCurrency"/>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label for="occupation" class="block text-gray-700 font-bold">Nghề nghiệp</label>
                      <input id="occupation" type="text" class="col-span-2 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500" t-model="state.formData.occupation"/>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label for="position" class="block text-gray-700 font-bold">Chức vụ</label>
                      <input id="position" type="text" class="col-span-2 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500" t-model="state.formData.position"/>
                    </div>
                  </fieldset>
                  <div class="flex justify-end gap-4">
                    <button type="button" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" t-on-click="onBack">
                      Quay lại
                    </button>
                    <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Tiếp tục
                    </button>
                  </div>
                </form>
              </section>
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
            activeTab: 'bank'
        });

        onMounted(async () => {
            // Hide loading spinner
            const loadingSpinner = document.getElementById('loadingSpinner');
            const widgetContainer = document.getElementById('bankInfoWidget');
            
            if (loadingSpinner && widgetContainer) {
                loadingSpinner.style.display = 'none';
                widgetContainer.style.display = 'block';
            }

            // Load profile data and status info
            await this.loadProfileData();
            this.loadInitialFormData(); // Load form data after profile is loaded or from sessionStorage
            await this.loadStatusInfo();
            
            this.state.loading = false;
        });
    }

    loadInitialFormData() {
        // Load data from sessionStorage if available, otherwise from profile
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

    async saveProfile() {
        try {
            console.log("💾 Saving bank info data to sessionStorage...");
            const bankData = {...this.state.formData};
            
            // Chuyển đổi monthly_income từ format tiền tệ về số
            if (bankData.monthly_income) {
                bankData.monthly_income = this.parseCurrencyValue(bankData.monthly_income);
            }
            
            // Store current page's data in sessionStorage
            sessionStorage.setItem('bankInfoData', JSON.stringify(bankData));
            
            // Navigate to the next page
            window.location.href = '/address_info';

        } catch (error) {
            console.error("❌ Error saving bank info data:", error);
            alert("Failed to save bank information. Please try again.");
        }
    }

    onBack() {
        window.location.href = '/personal_profile';
    }

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