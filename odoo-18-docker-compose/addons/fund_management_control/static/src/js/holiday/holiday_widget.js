/** @odoo-module **/
// holiday_widget.js cho holiday
console.log("Loading HolidayWidget...");

const { Component, xml, useState, onMounted } = window.owl;

class HolidayWidget extends Component {
    static template = xml`
    <div class="container-fluid p-1">
        <!-- Search and Filter Section -->
        <div class="card shadow-sm mb-4">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <div>
                        <button t-on-click="createNew" class="btn btn-success fw-bold shadow-sm d-flex align-items-center gap-2">
                            <i class="fas fa-plus"></i>
                            Tạo mới
                        </button>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <label class="form-label m-0 text-muted">Năm</label>
                        <input type="number" min="1900" max="2100" class="form-control" style="width: 110px;"
                            t-model="state.syncYear"
                        />
                        <button t-on-click="syncFromApi" t-att-disabled="state.syncingApi" class="btn btn-outline-primary fw-bold">
                            <t t-if="state.syncingApi">API...</t>
                            <t t-else="">Đồng bộ API</t>
                        </button>
                        <button t-on-click="syncInternal" t-att-disabled="state.syncingInternal" class="btn btn-outline-secondary fw-bold">
                            <t t-if="state.syncingInternal">Nội bộ...</t>
                            <t t-else="">Đồng bộ nội bộ</t>
                        </button>
                    </div>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <div class="input-group" style="max-width: 450px;">
                        <span class="input-group-text bg-light border-end-0"><i class="fas fa-search text-muted"></i></span>
                        <input type="text" placeholder="Nhập từ khóa để tìm kiếm" class="form-control border-start-0"
                            t-model="state.searchTerm"
                            t-on-keyup="onSearchKeyup"
                        />
                    </div>
                    <div class="d-flex align-items-center text-muted">
                        <span class="me-3">Tổng <b t-esc="state.totalRecords"/> kết quả</span>
                        <button t-on-click="performSearch" class="btn btn-primary fw-bold">
                            Tìm kiếm
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Holiday Table Section -->
        <div class="card shadow-sm">
          <div class="card-body p-0">
            <table class="table table-hover mb-0">
                <thead class="table-light">
                    <tr>
                        <th scope="col" class="px-3 py-2 text-uppercase small text-muted">Tên ngày lễ</th>
                        <th scope="col" class="px-3 py-2 text-uppercase small text-muted">Mã ngày lễ</th>
                        <th scope="col" class="px-3 py-2 text-uppercase small text-muted">Ngày trong năm</th>
                        <th scope="col" class="px-3 py-2 text-uppercase small text-muted">Giá trị trong năm</th>
                        <th scope="col" class="px-3 py-2 text-uppercase small text-muted">Trạng thái</th>
                        <th scope="col" class="px-3 py-2 text-center text-uppercase small text-muted">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    <t t-if="state.loading">
                        <tr>
                            <td colspan="6" class="text-center p-5">
                                <div class="d-flex justify-content-center align-items-center">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <p class="ms-3 text-muted">Đang tải dữ liệu...</p>
                                </div>
                            </td>
                        </tr>
                    </t>
                    <t t-if="!state.loading and state.holidays.length === 0">
                        <tr>
                            <td colspan="6" class="text-center p-5 text-muted">
                                Không tìm thấy ngày lễ nào.
                            </td>
                        </tr>
                    </t>
                    <t t-foreach="state.holidays" t-as="holiday" t-key="holiday.id">
                        <tr class="align-middle">
                            <td class="px-3 py-2 fw-bold" t-esc="holiday.name"/>
                            <td class="px-3 py-2 text-muted" t-esc="holiday.code"/>
                            <td class="px-3 py-2" t-esc="holiday.date"/>
                            <td class="px-3 py-2" t-esc="holiday.value"/>
                            <td class="px-3 py-2">
                                <span t-if="holiday.active" class="badge rounded-pill bg-success-subtle text-success-emphasis p-2">
                                    Kích hoạt
                                </span>
                                <span t-else="" class="badge rounded-pill bg-danger-subtle text-danger-emphasis p-2">
                                    Không kích hoạt
                                </span>
                            </td>
                            <td class="px-3 py-2 text-center">
                                <a href="#" t-on-click.prevent="() => this.handleEdit(holiday.id)" class="btn btn-sm btn-link text-primary text-decoration-none">
                                    <i class="fas fa-pencil-alt fa-lg"></i>
                                </a>
                                <a href="#" t-on-click.prevent="() => this.handleDelete(holiday.id)" class="btn btn-sm btn-link text-danger text-decoration-none">
                                    <i class="fas fa-trash fa-lg"></i>
                                </a>
                            </td>
                        </tr>
                    </t>
                </tbody>
            </table>
          </div>
          <!-- Pagination Controls -->
          <div t-if="totalPages > 1" class="card-footer d-flex justify-content-end">
            <nav aria-label="Page navigation">
              <ul class="pagination mb-0">
                <li t-attf-class="page-item #{state.currentPage === 1 ? 'disabled' : ''}">
                  <a class="page-link" href="#" t-on-click.prevent="() => this.changePage(state.currentPage - 1)">Previous</a>
                </li>
                <t t-foreach="Array.from({ length: totalPages }, (_, i) => i + 1)" t-as="page" t-key="page">
                    <li t-attf-class="page-item #{page === state.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" t-on-click.prevent="() => this.changePage(page)" t-esc="page"/>
                    </li>
                </t>
                <li t-attf-class="page-item #{state.currentPage === totalPages ? 'disabled' : ''}">
                  <a class="page-link" href="#" t-on-click.prevent="() => this.changePage(state.currentPage + 1)">Next</a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
    </div>
    `;

    setup() {
        this.state = useState({
            holidays: [],
            searchTerm: "",
            loading: true,
            currentPage: 1,
            totalRecords: 0,
            limit: 10,
            syncYear: String(new Date().getFullYear()),
            syncingApi: false,
            syncingInternal: false,
        });

        onMounted(() => {
            console.log("HolidayWidget mounted, loading data...");
            this.loadData();
        });
    }

    get totalPages() {
        return Math.ceil(this.state.totalRecords / this.state.limit);
    }

    async loadData() {
        console.log("Loading holiday data...");
        this.state.loading = true;
        const searchTerm = encodeURIComponent(this.state.searchTerm.trim());
        try {
            const url = `/get_holiday_data?page=${this.state.currentPage}&limit=${this.state.limit}&search=${searchTerm}`;
            console.log("Fetching from URL:", url);
            
            const response = await fetch(url);
            console.log("Response status:", response.status);
            
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log("API Response:", result);
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            this.state.holidays = result.records || [];
            this.state.totalRecords = result.total_records || 0;
            console.log("Loaded holidays:", this.state.holidays.length);
            
        } catch (error) {
            console.error("Error fetching holidays:", error);
            this.state.holidays = [];
            this.state.totalRecords = 0;
        } finally {
            this.state.loading = false;
            console.log("Loading finished, loading state:", this.state.loading);
        }
    }

    changePage(newPage) {
        if (newPage > 0 && newPage <= this.totalPages && newPage !== this.state.currentPage) {
            this.state.currentPage = newPage;
            this.loadData();
        }
    }
    
    onSearchKeyup(ev) {
        if (ev.key === 'Enter') {
            this.performSearch();
        }
    }

    performSearch() {
        this.state.currentPage = 1;
        this.loadData();
    }
    
    handleEdit(holidayId) { 
        window.location.href = `/holiday/edit/${holidayId}`; 
    }
    
    handleDelete(holidayId) {
        if (confirm('Bạn có chắc muốn xóa ngày lễ này?')) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = `/holiday/delete/${holidayId}`;
            document.body.appendChild(form);
            form.submit();
        }
    }
    
    createNew() { 
        window.location.href = '/holiday/new';
    }

    async _sync(endpoint, stateKey, successLabel) {
        const year = parseInt(this.state.syncYear, 10);
        if (Number.isNaN(year)) {
            window.alert('Vui lòng nhập năm hợp lệ.');
            return;
        }
        this.state[stateKey] = true;
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ year }),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            if (!result.success) {
                const message = result.error || 'Không thể đồng bộ ngày lễ.';
                window.alert(message);
                return;
            }

            const created = result.created || 0;
            const updated = result.updated || 0;
            window.alert(`${successLabel} năm ${result.year}. Thêm mới: ${created}, cập nhật: ${updated}.`);
            this.state.currentPage = 1;
            await this.loadData();
        } catch (error) {
            console.error('Sync holiday error:', error);
            window.alert('Có lỗi xảy ra khi đồng bộ ngày lễ. Vui lòng thử lại.');
        } finally {
            this.state[stateKey] = false;
        }
    }

    async syncFromApi() {
        await this._sync('/holiday/sync', 'syncingApi', 'Đã đồng bộ ngày lễ từ API');
    }

    async syncInternal() {
        await this._sync('/holiday/sync/internal', 'syncingInternal', 'Đã đồng bộ ngày lễ nội bộ');
    }
}

window.HolidayWidget = HolidayWidget;
export default HolidayWidget;
console.log("HolidayWidget component loaded successfully."); 
