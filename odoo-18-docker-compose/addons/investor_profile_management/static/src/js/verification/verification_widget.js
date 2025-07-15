// Verification Completion Widget Component

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
        // Load data from sessionStorage
        const storedPersonalData = sessionStorage.getItem('personalProfileData');
        const storedBankData = sessionStorage.getItem('bankInfoData');
        const storedAddressData = sessionStorage.getItem('addressInfoData');
            
        if (storedPersonalData) {
            this.state.personalProfileData = JSON.parse(storedPersonalData);
            }

        if (storedBankData) {
            this.state.bankInfoData = JSON.parse(storedBankData);
        }

        if (storedAddressData) {
            this.state.addressInfoData = JSON.parse(storedAddressData);
        }

        // Load status info
        this.loadStatusInfo();
    }

    loadInitialFormData() {
        // Load data from sessionStorage if available
        const storedPersonalData = sessionStorage.getItem('personalProfileData');
        const storedBankData = sessionStorage.getItem('bankInfoData');
        const storedAddressData = sessionStorage.getItem('addressInfoData');

        if (storedPersonalData) {
            this.state.personalProfileData = JSON.parse(storedPersonalData);
        }
        if (storedBankData) {
            this.state.bankInfoData = JSON.parse(storedBankData);
        }
        if (storedAddressData) {
            this.state.addressInfoData = JSON.parse(storedAddressData);
        }
    }

    async loadStatusInfo() {
        try {
            const response = await fetch('/get_status_info');
            const data = await response.json();
            
            if (data && data.length > 0) {
                this.state.statusInfo = data[0];
            }
        } catch (error) {
            // Handle error silently
        }
    }

    async completeVerification() {
        if (!this.state.agreedToTerms) {
            alert("Vui lòng đồng ý với các điều khoản và điều kiện để hoàn tất.");
            return;
        }

        try {
            const allData = {
                personal_profile: this.state.personalProfileData,
                bank_info: this.state.bankInfoData,
                address_info: this.state.addressInfoData
            };

            const response = await fetch('/profile/save-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(allData)
            });
            
            if (response.ok) {
                // Clear sessionStorage after successful save
                sessionStorage.removeItem('personalProfileData');
                sessionStorage.removeItem('bankInfoData');
                sessionStorage.removeItem('addressInfoData');
                
                // Show success message
                this.showMessage('Verification completed successfully!', 'success');
            } else {
                throw new Error('Failed to save verification data');
            }
        } catch (error) {
            this.showMessage('Error completing verification: ' + error.message, 'error');
        }
    }

    onBack() {
        window.location.href = '/address_info';
    }

    async loadProfileData() {
        try {
            const response = await fetch('/data_verification');
            const data = await response.json();
            
            if (data && data.length > 0) {
                this.state.profile = data[0];
            } else {
                this.state.profile = {};
            }
        } catch (error) {
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