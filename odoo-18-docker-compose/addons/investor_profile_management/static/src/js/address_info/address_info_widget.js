// Address Information Widget Component
console.log('Loading AddressInfoWidget component...');

const { Component, xml, useState, onMounted } = owl;

class AddressInfoWidget extends Component {
    static template = xml`
        <div class="bg-gray-50 p-6 font-sans">
          <!-- Odoo Owl template example for an address information page -->
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
                  <a href="/bank_info" class="flex items-center gap-2 border-l-4 border-transparent pl-3 py-2 w-full hover:border-indigo-700 hover:text-indigo-700 rounded">Thông tin tài khoản ngân hàng</a>
                  <a href="/address_info" class="flex items-center gap-2 border-l-4 border-indigo-700 pl-3 py-2 w-full text-indigo-700 bg-indigo-50 rounded" aria-current="true">Thông tin địa chỉ</a>
                  <a href="/verification" class="flex items-center gap-2 border-l-4 border-transparent pl-3 py-2 w-full hover:border-indigo-700 hover:text-indigo-700 rounded">Xác thực hoàn tất</a>
                </nav>
              </aside>
              <!-- Main content -->
              <section class="flex-1 bg-white rounded-lg shadow p-6 text-xs text-gray-600">
                <h3 class="text-gray-500 font-semibold mb-4">Thông tin địa chỉ</h3>
                <form class="space-y-8" t-on-submit.prevent="saveProfile">
                  <fieldset>
                    <legend class="font-bold text-lg">Địa chỉ liên hệ</legend>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label for="street" class="block text-gray-700 font-bold">Số nhà, Tên đường <span class="text-red-600">*</span></label>
                      <input id="street" type="text" class="col-span-2 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500" t-model="state.formData.street" required="required"/>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label for="state_id" class="block text-gray-700 font-bold">Tỉnh/Thành phố <span class="text-red-600">*</span></label>
                      <input id="state_id" type="text" class="col-span-2 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500" t-model="state.formData.state" required="required"/>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label for="district" class="block text-gray-700 font-bold">Quận/Huyện <span class="text-red-600">*</span></label>
                      <input id="district" type="text" class="col-span-2 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500" t-model="state.formData.district" required="required"/>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label for="ward" class="block text-gray-700 font-bold">Phường/Xã <span class="text-red-600">*</span></label>
                      <input id="ward" type="text" class="col-span-2 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500" t-model="state.formData.ward" required="required"/>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label for="country_id" class="block text-gray-700 font-bold">Quốc gia <span class="text-red-600">*</span></label>
                      <select id="country_id" t-model="state.formData.country_id" required="required" class="col-span-2 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        <option value="">Chọn quốc gia</option>
                        <t t-foreach="state.countries" t-as="country" t-key="country.id">
                          <option t-att-value="country.id"><t t-esc="country.name" /></option>
                        </t>
                      </select>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label for="zip" class="block text-gray-700 font-bold">Mã bưu điện</label>
                      <input id="zip" type="text" class="col-span-2 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500" t-model="state.formData.zip"/>
                    </div>
                    <p class="text-[10px] text-gray-400 mt-2 italic">(*) Thông tin bắt buộc</p>
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
        console.log("🎯 AddressInfoWidget - setup called!");

        this.state = useState({
            loading: true,
            profile: {},
            statusInfo: {},
            formData: {
                street: '',
                city: '',
                state: '',
                zip: '',
                district: '',
                ward: '',
                country_id: '',
            },
            activeTab: 'address',
            countries: []
        });

        onMounted(async () => {
            // Hide loading spinner
            const loadingSpinner = document.getElementById('loadingSpinner');
            const widgetContainer = document.getElementById('addressInfoWidget');
            
            if (loadingSpinner && widgetContainer) {
                loadingSpinner.style.display = 'none';
                widgetContainer.style.display = 'block';
            }

            // Load profile data and status info
            await Promise.all([
                this.loadProfileData(),
                this.loadCountries()
            ]);
            this.loadInitialFormData(); // Load form data after profile and countries are loaded
            await this.loadStatusInfo();
            
            this.state.loading = false;
        });
    }

    loadInitialFormData() {
        // Load data from sessionStorage if available, otherwise from profile
        const storedData = sessionStorage.getItem('addressInfoData');
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            Object.assign(this.state.formData, parsedData);
            console.log("✅ Form data loaded from sessionStorage:", this.state.formData);
        } else if (this.state.profile && Object.keys(this.state.profile).length > 0) {
            this.state.formData.street = this.state.profile.street || '';
            this.state.formData.city = this.state.profile.city || '';
            this.state.formData.district = this.state.profile.district || '';
            this.state.formData.ward = this.state.profile.ward || '';
            this.state.formData.state = this.state.profile.state_id ? String(this.state.profile.state_id) : '';
            this.state.formData.zip = this.state.profile.zip || '';
            this.state.formData.country_id = this.state.profile.country_id ? String(this.state.profile.country_id) : '';
            console.log("✅ Form data initialized with existing profile data:", this.state.formData);
        } else {
            console.log("ℹ️ No existing address data found, using default values");
        }
    }

    async loadCountries() {
        try {
            const response = await fetch('/get_countries');
            const data = await response.json();
            this.state.countries = data;
            console.log("📥 Countries loaded:", data);
        } catch (error) {
            console.error("❌ Error fetching countries:", error);
            // Fallback countries, ensure these are loaded for testing if API fails
            this.state.countries = [
                { id: 1, name: 'Vietnam' },
                { id: 2, name: 'USA' },
                { id: 3, name: 'UK' }
            ];
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
            console.log("💾 Saving address info data to sessionStorage...");
            const addressData = this.state.formData;
            
            // Store current page's data in sessionStorage
            sessionStorage.setItem('addressInfoData', JSON.stringify(addressData));
            
            // Navigate to the next page (Verification Completion)
            window.location.href = '/verification';

        } catch (error) {
            console.error("❌ Error saving address info data:", error);
            alert("Failed to save address information. Please try again.");
        }
    }

    onBack() {
        window.location.href = '/bank_info';
    }

    async loadProfileData() {
        try {
            console.log("🔄 Loading address profile data from server...");
            const response = await fetch('/data_address_info');
            const data = await response.json();
            console.log("📥 Address profile data received:", data);
            
            if (data && data.length > 0) {
                // For address info, data might be an array of addresses, we'll take the first one or handle multiple later.
                // For now, assuming user only fills out one primary address for simplicity.
                this.state.profile = data[0];
                console.log("✅ Address profile data loaded successfully:", this.state.profile);
            } else {
                console.log("ℹ️ No existing address profile data found on server");
                this.state.profile = {};
            }
        } catch (error) {
            console.error("❌ Error fetching address profiles:", error);
            this.state.profile = {};
        }
    }
}

// Make component globally available
window.AddressInfoWidget = AddressInfoWidget;
console.log('AddressInfoWidget component loaded and available globally');

// Auto-mount when script is loaded
if (typeof owl !== 'undefined') {
    const widgetContainer = document.getElementById('addressInfoWidget');
    if (widgetContainer) {
        console.log('Mounting AddressInfoWidget');
        owl.mount(AddressInfoWidget, widgetContainer);
    }
} 