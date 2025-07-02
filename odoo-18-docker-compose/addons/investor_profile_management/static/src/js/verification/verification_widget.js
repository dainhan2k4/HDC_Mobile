// Verification Completion Widget Component
console.log('Loading VerificationWidget component...');

const { Component, xml, useState, onMounted } = owl;

class VerificationWidget extends Component {
    static template = xml`
        <div class="bg-gray-50 p-6 font-sans">
          <!-- Odoo Owl template example for a verification completion page -->
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
                  <a href="/address_info" class="flex items-center gap-2 border-l-4 border-transparent pl-3 py-2 w-full hover:border-indigo-700 hover:text-indigo-700 rounded">Thông tin địa chỉ</a>
                  <a href="/verification" class="flex items-center gap-2 border-l-4 border-indigo-700 pl-3 py-2 w-full text-indigo-700 bg-indigo-50 rounded" aria-current="true">Xác thực hoàn tất</a>
                </nav>
              </aside>
              <!-- Main content -->
              <section class="flex-1 bg-white rounded-lg shadow p-6 text-xs text-gray-600">
                <h3 class="text-gray-500 font-semibold mb-4">Xác thực hoàn tất</h3>
                <form class="space-y-8" t-on-submit.prevent="completeVerification">
                  <fieldset>
                    <legend class="font-bold text-lg">Xác nhận hoàn tất</legend>
                    <p class="text-sm text-gray-700 mb-4">
                      Để bắt đầu thực hiện giao dịch, Quý khách cần phải xác nhận thông tin và đồng ý các điều khoản, điều kiện dưới đây:
                    </p>
                    <p class="text-sm text-gray-700 mb-4">
                      Sau khi hoàn tất bước xác nhận này thông tin <span class="font-bold text-indigo-700">Hợp đồng mở tài khoản</span> của Quý khách sẽ được gửi tới email <span class="font-bold text-red-600"><t t-esc="state.contractEmail" /></span>.
                    </p>
                    <p class="text-sm text-gray-700 mb-6">
                      Quý khách vui lòng in, ký xác nhận và gửi thư về địa chỉ của công ty trong phần liên hệ!
                    </p>
                    <div class="p-4 border border-gray-300 rounded-md bg-gray-50 mb-6 text-sm overflow-y-auto max-h-48">
                        <p class="mb-2">cần thiết để thực hiện nghĩa vụ thuế của tôi tại nơi đó / Subject to applicable local laws, I hereby consent for Fincorp Investment Management Ltd to share my information with domestic and overseas tax authorities where necessary to establish my tax liability in any jurisdiction.</p>
                        <p class="mb-2">Khi được yêu cầu bởi luật pháp hay cơ quan thuế nước sở tại hay nước ngoài. Tôi đồng ý và cho phép Fincorp được trực tiếp khấu trừ từ tài khoản của tôi theo đúng pháp luật hiện hành / Where required by domestic or overseas regulators or tax authorities, I consent and agree that Fincorp may withhold such amounts as may be required according to applicable laws, regulations and directives.</p>
                        <p>Tôi cam kết sẽ thông báo cho Fincorp trong vòng 30 ngày nếu có bất kỳ thay đổi nào đối với thông tin mà tôi đã cung cấp cho Fincorp / I undertake to notify Fincorp within 30 calendar days if there is a change in any information which I have provided to Fincorp.</p>
                    </div>
                    <div class="flex items-center mb-4">
                      <input type="checkbox" id="agree_terms" t-model="state.agreedToTerms" required="required" class="form-checkbox text-indigo-600 h-4 w-4"/>
                      <label for="agree_terms" class="ml-2 block text-sm text-gray-900 font-semibold">Tôi đồng ý với các điều khoản và điều kiện trên <span class="text-red-600">*</span></label>
                    </div>
                  </fieldset>
                  <div class="flex justify-end gap-4">
                    <button type="button" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" t-on-click="onBack">
                      Quay lại
                    </button>
                    <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Hoàn tất
                    </button>
                  </div>
                </form>
              </section>
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
            companyAddress: '123 Fincorp St, Financial City, Country' // Hardcoded for now
        });

        onMounted(async () => {
            // Hide loading spinner
            const loadingSpinner = document.getElementById('loadingSpinner');
            const widgetContainer = document.getElementById('verificationWidget');
            
            if (loadingSpinner && widgetContainer) {
                loadingSpinner.style.display = 'none';
                widgetContainer.style.display = 'block';
            }

            // Load profile data and status info
            await this.loadProfileData();
            this.loadInitialFormData(); // Load form data from sessionStorage
            await this.loadStatusInfo();
            
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

    async completeVerification() {
        if (!this.state.agreedToTerms) {
            alert("Vui lòng đồng ý với các điều khoản và điều kiện để hoàn tất.");
            return;
        }

        try {
            console.log("🔄 Attempting to complete verification and save all data...");
            const personalData = JSON.parse(sessionStorage.getItem('personalProfileData') || '{}');
            const bankData = JSON.parse(sessionStorage.getItem('bankInfoData') || '{}');
            const addressData = JSON.parse(sessionStorage.getItem('addressInfoData') || '{}');
            
            // Combine all data into a single object for submission
            const allData = {
                ...personalData,
                bank_accounts: [bankData], // Assuming a single bank account for now
                addresses: [addressData] // Assuming a single address for now
            };
            
            console.log("📤 Combined data for submission:", allData);

            const response = await fetch('/save_all_profile_data', { // New endpoint to be created
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(allData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log("✅ Verification completed successfully!");
                alert('Chúc mừng! Hồ sơ của bạn đã được hoàn tất và gửi đi thành công!');
                sessionStorage.clear(); // Clear all stored data
                // Optionally, redirect to a success page or home
                window.location.href = '/my/home';
            } else {
                console.error("❌ Verification failed:", result.error);
                alert('Lỗi khi hoàn tất hồ sơ: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Error completing verification:', error);
            alert('Lỗi khi hoàn tất hồ sơ: ' + error.message);
        }
    }

    onBack() {
        window.location.href = '/address_info';
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