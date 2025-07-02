// Personal Profile Widget Component
console.log('Loading PersonalProfileWidget component...');

const { Component, xml, useState, onMounted } = owl;

class PersonalProfileWidget extends Component {
    static template = xml`
        <div class="bg-gray-50 p-6 font-sans">
          <!-- Odoo Owl template example for a personal profile page -->
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
                  <a href="/personal_profile" class="flex items-center gap-2 border-l-4 border-indigo-700 pl-3 py-2 w-full text-indigo-700 bg-indigo-50 rounded" aria-current="true">Thông tin cá nhân</a>
                  <a href="/bank_info" class="flex items-center gap-2 border-l-4 border-transparent pl-3 py-2 w-full hover:border-indigo-700 hover:text-indigo-700 rounded">Thông tin tài khoản ngân hàng</a>
                  <a href="/address_info" class="flex items-center gap-2 border-l-4 border-transparent pl-3 py-2 w-full hover:border-indigo-700 hover:text-indigo-700 rounded">Thông tin địa chỉ</a>
                  <a href="/verification" class="flex items-center gap-2 border-l-4 border-transparent pl-3 py-2 w-full hover:border-indigo-700 hover:text-indigo-700 rounded">Xác thực hoàn tất</a>
                </nav>
              </aside>
              <!-- Main content -->
              <section class="flex-1 bg-white rounded-lg shadow p-6 text-xs text-gray-600">
                <h3 class="text-gray-500 font-semibold mb-4">Thông tin cá nhân</h3>
                <form class="space-y-8" t-on-submit.prevent="saveProfile">
                  <fieldset>
                    <legend class="font-bold text-lg">1. Thông tin nhà đầu tư</legend>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label for="fullname" class="block text-gray-700 font-bold">Họ &amp; Tên đầy đủ <span class="text-red-600">*</span></label>
                      <input id="fullname" type="text" class="col-span-2 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500" t-model="state.formData.name" required="required"/>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label class="block text-gray-700 font-bold">Giới tính <span class="text-red-600">*</span></label>
                      <div class="flex items-center gap-6 col-span-2">
                        <label class="inline-flex items-center gap-1">
                          <input type="radio" name="gender" value="male" t-model="state.formData.gender" class="form-radio text-indigo-600"/>
                          <span>Nam</span>
                        </label>
                        <label class="inline-flex items-center gap-1">
                          <input type="radio" name="gender" value="female" t-model="state.formData.gender" class="form-radio text-indigo-600"/>
                          <span>Nữ</span>
                        </label>
                      </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label for="birth_date" class="block text-gray-700 font-bold">Ngày sinh <span class="text-red-600">*</span></label>
                      <input id="birth_date" type="date" t-model="state.formData.birth_date" required="required" class="col-span-2 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label for="nationality" class="block text-gray-700 font-bold">Quốc tịch <span class="text-red-600">*</span></label>
                      <select id="nationality" t-model="state.formData.nationality" required="required" class="col-span-2 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        <option value="">Chọn quốc tịch</option>
                        <t t-foreach="state.countries" t-as="country" t-key="country.id">
                          <option t-att-value="country.id"><t t-esc="country.name" /></option>
                        </t>
                      </select>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label for="email" class="block text-gray-700 font-bold">Email</label>
                      <input id="email" type="email" t-model="state.formData.email" class="col-span-2 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label for="phone" class="block text-gray-700 font-bold">Số điện thoại</label>
                      <div class="relative col-span-2">
                        <input id="phone" type="text" t-model="state.formData.phone" class="w-full border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-8"/>
                        <i class="fas fa-info-circle absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs" title="Số điện thoại liên hệ" aria-hidden="true"></i>
                      </div>
                    </div>
                  </fieldset>
                  <fieldset>
                    <div class="mb-2">
                      <span class="font-bold text-lg">2. Thông tin CMND/CCCD/Mã GD chứng khoán</span>
                      <span class="ml-2 text-gray-500 font-normal text-base">(Chú ý: Mã giao dịch chứng khoán chỉ dành cho người nước ngoài)</span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label for="id-type" class="block text-gray-700 font-bold">Loại giấy tờ <span class="text-red-600">*</span></label>
                      <select id="id-type" t-model="state.formData.id_type" required="required" class="col-span-2 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        <option value="id_card">CMND/CCCD</option>
                        <option value="passport">Hộ chiếu</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label for="id-number" class="block text-gray-700 font-bold">Số hiệu giấy tờ <span class="text-red-600">*</span></label>
                      <input id="id-number" type="text" t-model="state.formData.id_number" required="required" class="col-span-2 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-4">
                      <label for="id_issue_date" class="block text-gray-700 font-bold">Ngày cấp <span class="text-red-600">*</span></label>
                      <input id="id_issue_date" type="date" t-model="state.formData.id_issue_date" required="required" class="col-span-2 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-6">
                      <label for="id_issue_place" class="block text-gray-700 font-bold">Nơi cấp <span class="text-red-600">*</span></label>
                      <input id="id_issue_place" type="text" t-model="state.formData.id_issue_place" required="required" class="col-span-2 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
                    </div>
                    <p class="text-[10px] text-gray-400 mb-2">
                      Tải hình ảnh rõ ràng giấy tờ CMND/CCCD/ Mã GD chứng khoán <span class="text-red-600">*</span><br />
                      Giấy tờ còn hạn sử dụng, đủ ánh sáng, là hình gốc, không xoan và photocopy, dung lượng tệp tối đa 10 MB
                    </p>
                    <div class="flex gap-4 mb-4">
                      <div class="flex flex-col items-center">
                        <input type="file" accept="image/*" class="mb-2" t-on-change="onUploadIdFront" />
                        <img t-if="state.profile.id_front" t-att-src="state.profile.id_front" alt="Front side of Vietnamese citizen identification card" class="object-contain rounded border border-gray-300" style="width:200px; height:120px;"/>
                        <div t-if="!state.profile.id_front" class="w-[200px] h-[120px] border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400">
                          <span>Front ID</span>
                        </div>
                      </div>
                      <div class="flex flex-col items-center">
                        <input type="file" accept="image/*" class="mb-2" t-on-change="onUploadIdBack" />
                        <img t-if="state.profile.id_back" t-att-src="state.profile.id_back" alt="Back side of Vietnamese citizen identification card" class="object-contain rounded border border-gray-300" style="width:200px; height:120px;"/>
                        <div t-if="!state.profile.id_back" class="w-[200px] h-[120px] border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400">
                          <span>Back ID</span>
                        </div>
                      </div>
                    </div>
                    <p class="text-xs text-gray-400 mt-2 italic">(*) Thông tin bắt buộc</p>
                  </fieldset>
                  <div class="flex justify-end gap-4">
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
        console.log("🎯 PersonalProfileWidget - setup called!");

        this.state = useState({
            loading: true,
            profile: {},
            statusInfo: {},
            countries: [],
            formData: {
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
            },
            activeTab: 'personal'
        });

        onMounted(async () => {
            // Hide loading spinner
            const loadingSpinner = document.getElementById('loadingSpinner');
            const widgetContainer = document.getElementById('personalProfileWidget');
            
            if (loadingSpinner && widgetContainer) {
                loadingSpinner.style.display = 'none';
                widgetContainer.style.display = 'block';
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
        // This method will be called only once on mount to initialize formData from state.profile
        console.log("🔄 Loading initial form data from profile:", this.state.profile);
        
        if (this.state.profile && Object.keys(this.state.profile).length > 0) {
            this.state.formData.name = this.state.profile.name || '';
            this.state.formData.gender = this.state.profile.gender || 'male';
            this.state.formData.email = this.state.profile.email || '';
            this.state.formData.phone = this.state.profile.phone || '';
            this.state.formData.id_type = this.state.profile.id_type || 'id_card';
            this.state.formData.id_number = this.state.profile.id_number || '';
            this.state.formData.id_issue_date = this.state.profile.id_issue_date || '';
            this.state.formData.id_issue_place = this.state.profile.id_issue_place || '';
            this.state.formData.birth_date = this.state.profile.birth_date || '';
            this.state.formData.nationality = this.state.profile.nationality ? String(this.state.profile.nationality) : '';
            
            console.log("✅ Form data initialized with existing profile data:", this.state.formData);
        } else {
            console.log("ℹ️ No existing profile data found, using default values");
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
            // Fallback countries
            this.state.countries = [
                { id: 1, name: 'Vietnam' },
                { id: 2, name: 'USA' },
                { id: 3, name: 'UK' },
                { id: 4, name: 'Japan' }
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
            console.log("💾 Saving personal profile data...");
            const profileData = this.state.formData;
            
            // Store current page's data in sessionStorage
            sessionStorage.setItem('personalProfileData', JSON.stringify(profileData));
            
            // Navigate to the next page
            window.location.href = '/bank_info';

        } catch (error) {
            console.error("❌ Error saving personal profile data:", error);
            alert("Failed to save profile. Please try again.");
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
}

// Expose the component globally for the entrypoint to mount
Object.assign(window, { PersonalProfileWidget });

// Auto-mount when script is loaded
if (typeof owl !== 'undefined') {
    const widgetContainer = document.getElementById('personalProfileWidget');
    if (widgetContainer) {
        console.log('Mounting PersonalProfileWidget');
        owl.mount(PersonalProfileWidget, widgetContainer);
    }
} 