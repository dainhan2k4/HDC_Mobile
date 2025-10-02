console.log("Loading Enhanced TaxSettingsWidget...");

const { Component, xml, useState, onMounted } = window.owl;

class TaxSettingsWidget extends Component {
    static template = xml`
    <div class="tax-settings-container">
        <!-- Header Section -->
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div>
                <h1 class="h3 fw-bold text-dark mb-1">Cài đặt Thuế</h1>
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb small mb-0">
                        <li class="breadcrumb-item"><a href="#" class="text-decoration-none text-muted"><i class="fas fa-home me-1"></i>Trở về</a></li>
                        <li class="breadcrumb-item active text-primary" aria-current="page">Danh mục Cài đặt Thuế</li>
                    </ol>
                </nav>
            </div>
            <button t-on-click="createNew" class="btn btn-primary px-4 py-2 fw-semibold shadow-sm d-flex align-items-center gap-2">
                <i class="fas fa-plus"></i>
                <span>Tạo mới</span>
            </button>
        </div>

        <!-- Filter and Search Section -->
        <div class="card border-0 mb-4">
            <div class="card-body">
                <div class="row g-2 align-items-center">
                    <!-- Search Input -->
                    <div class="col-lg-5 col-md-12">
                        <div class="input-group">
                            <span class="input-group-text bg-light border-end-0"><i class="fas fa-search text-muted"></i></span>
                            <input type="text" 
                                placeholder="Tìm theo tên hoặc mã thuế..."
                                class="form-control border-start-0"
                                t-on-input="onSearchInput"
                                t-model="state.searchTerm"
                            />
                        </div>
                    </div>
                    <!-- Filter by Status -->
                    <div class="col-lg-4 col-md-8">
                        <div class="btn-group w-100" role="group">
                            <input type="radio" class="btn-check" name="statusFilter" id="all" autocomplete="off" t-att-checked="state.statusFilter === 'all'" t-on-click="() => this.filterByStatus('all')"/>
                            <label class="btn btn-outline-secondary" for="all">Tất cả</label>
                            <input type="radio" class="btn-check" name="statusFilter" id="active" autocomplete="off" t-att-checked="state.statusFilter === 'active'" t-on-click="() => this.filterByStatus('active')"/>
                            <label class="btn btn-outline-success" for="active">Kích hoạt</label>
                            <input type="radio" class="btn-check" name="statusFilter" id="inactive" autocomplete="off" t-att-checked="state.statusFilter === 'inactive'" t-on-click="() => this.filterByStatus('inactive')"/>
                            <label class="btn btn-outline-danger" for="inactive">Chưa kích hoạt</label>
                        </div>
                    </div>
                    <!-- Action Buttons -->
                    <div class="col-lg-3 col-md-4">
                        <div class="d-flex align-items-center justify-content-end gap-2">
                             <span class="text-muted small">
                                Tổng <strong class="text-primary" t-esc="state.totalRecords"/>
                            </span>
                            <button t-on-click="performSearch" class="btn btn-primary px-4 fw-semibold">
                                Tìm kiếm
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Data Table Section -->
        <div class="card border-0">
            <div class="card-body p-0">
                <!-- Desktop Table -->
                <div class="table-responsive d-none d-lg-block">
                    <table class="table table-hover mb-0">
                        <thead>
                            <tr>
                                <th t-on-click="() => this.sortColumn('tax_name')" class="px-4 py-3 text-uppercase small fw-semibold text-muted sortable">Tên Thuế <i t-att-class="this.getSortIcon('tax_name')"/></th>
                                <th t-on-click="() => this.sortColumn('tax_code')" class="px-4 py-3 text-uppercase small fw-semibold text-muted sortable">Mã Thuế <i t-att-class="this.getSortIcon('tax_code')"/></th>
                                <th t-on-click="() => this.sortColumn('rate')" class="px-4 py-3 text-uppercase small fw-semibold text-muted sortable">Tỉ lệ <i t-att-class="this.getSortIcon('rate')"/></th>
                                <th class="px-4 py-3 text-uppercase small fw-semibold text-muted text-center">Trạng thái</th>
                                <th class="px-4 py-3 text-uppercase small fw-semibold text-muted text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            <t t-if="state.loading">
                                <tr><td colspan="5" class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Đang tải dữ liệu...</p></td></tr>
                            </t>
                            <t t-if="!state.loading and state.taxes.length === 0">
                                <tr>
                                    <td colspan="5" class="text-center py-5">
                                        <div class="mb-4"><i class="fas fa-landmark fa-4x text-muted opacity-50"></i></div>
                                        <h5 class="text-muted mb-3">Chưa có cài đặt thuế nào</h5>
                                        <p class="text-muted mb-4">Bắt đầu bằng cách tạo cài đặt thuế đầu tiên của bạn.</p>
                                        <button class="btn btn-primary" t-on-click="createNew"><i class="fas fa-plus me-2"></i>Tạo cài đặt thuế</button>
                                    </td>
                                </tr>
                            </t>
                            <t t-foreach="state.taxes" t-as="tax" t-key="tax.id">
                                <tr class="align-middle">
                                    <td class="px-4 py-3">
                                        <div class="fw-semibold text-dark" t-esc="tax.tax_name"/>
                                        <div class="small text-muted" t-esc="tax.tax_english_name"/>
                                    </td>
                                    <td class="px-4 py-3"><span class="badge bg-light text-dark fw-normal" t-esc="tax.tax_code"/></td>
                                    <td class="px-4 py-3"><span class="fw-bold text-primary" t-esc="tax.rate + '%'"/></td>
                                    <td class="px-4 py-3 text-center">
                                        <span t-if="tax.active" class="badge rounded-pill bg-success-subtle text-success px-3 py-2"><i class="fas fa-check-circle me-1"></i>Kích hoạt</span>
                                        <span t-else="" class="badge rounded-pill bg-danger-subtle text-danger px-3 py-2"><i class="fas fa-times-circle me-1"></i>Chưa kích hoạt</span>
                                    </td>
                                    <td class="px-4 py-3 text-center">
                                        <div class="d-flex gap-2 justify-content-center">
                                            <button t-on-click="() => this.handleEdit(tax.id)" class="btn btn-sm btn-light border">
                                                <i class="fas fa-edit me-1"></i>Sửa
                                            </button>
                                            <button t-on-click="() => this.confirmDelete(tax.id, tax.tax_name)" class="btn btn-sm btn-outline-danger">
                                                <i class="fas fa-trash me-1"></i>Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </t>
                        </tbody>
                    </table>
                </div>

                <!-- Mobile Cards -->
                <div class="d-lg-none p-2">
                    <t t-if="state.loading">
                        <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
                    </t>
                    <t t-if="!state.loading and !state.taxes.length">
                        <div class="text-center py-5 px-3">
                            <div class="mb-4"><i class="fas fa-landmark fa-4x text-muted opacity-50"></i></div>
                            <h5 class="text-muted mb-3">Chưa có cài đặt thuế nào</h5>
                            <button class="btn btn-primary" t-on-click="createNew"><i class="fas fa-plus me-2"></i>Tạo mới</button>
                        </div>
                    </t>
                    <t t-foreach="state.taxes" t-as="tax" t-key="tax.id">
                        <div class="card mb-2 shadow-sm">
                             <div class="card-body p-3">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <h6 class="fw-bold mb-0" t-esc="tax.tax_name"/>
                                        <small class="text-muted" t-esc="tax.tax_code"/>
                                    </div>
                                    <span t-if="tax.active" class="badge bg-success-subtle text-success">Kích hoạt</span>
                                    <span t-else="" class="badge bg-danger-subtle text-danger">Chưa KT</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-end mt-2 pt-2 border-top">
                                    <div>
                                        <div class="small text-muted">Tỉ lệ</div>
                                        <div class="fw-bold text-primary" t-esc="tax.rate + '%'"/>
                                    </div>
                                    <div class="d-flex gap-2">
                                        <button t-on-click="() => this.handleEdit(tax.id)" class="btn btn-sm btn-light border px-3 py-2"><i class="fas fa-edit"></i></button>
                                        <button t-on-click="() => this.confirmDelete(tax.id, tax.tax_name)" class="btn btn-sm btn-outline-danger px-3 py-2"><i class="fas fa-trash"></i></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </t>
                </div>
            </div>
            
            <!-- Pagination Controls -->
            <t t-if="totalPages > 1">
                <div class="card-footer bg-light border-0">
                    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <div class="d-flex align-items-center gap-2">
                            <span class="text-muted small">Hiển thị</span>
                            <select class="form-select form-select-sm" style="width: 70px;" t-model="state.limit" t-on-change="() => { state.currentPage = 1; loadData(); }">
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                            </select>
                             <span class="text-muted small">mỗi trang</span>
                        </div>
                        <nav aria-label="Page navigation">
                            <ul class="pagination pagination-sm mb-0">
                                <li t-attf-class="page-item #{state.currentPage === 1 ? 'disabled' : ''}">
                                    <a class="page-link" href="#" t-on-click.prevent="() => this.changePage(state.currentPage - 1)">«</a>
                                </li>
                                <t t-foreach="getPaginationRange()" t-as="page" t-key="page">
                                    <li t-if="page === '...'" class="page-item disabled"><span class="page-link">...</span></li>
                                    <li t-else="" t-attf-class="page-item #{page === state.currentPage ? 'active' : ''}">
                                        <a class="page-link" href="#" t-on-click.prevent="() => this.changePage(page)" t-esc="page"/>
                                    </li>
                                </t>
                                <li t-attf-class="page-item #{state.currentPage === totalPages ? 'disabled' : ''}">
                                    <a class="page-link" href="#" t-on-click.prevent="() => this.changePage(state.currentPage + 1)">»</a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </t>
        </div>

        <!-- Delete Confirmation Modal -->
        <div class="modal fade" id="deleteTaxConfirmModal" tabindex="-1" aria-labelledby="deleteTaxConfirmModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header border-0 pb-0">
                        <h5 class="modal-title text-danger" id="deleteTaxConfirmModalLabel"><i class="fas fa-exclamation-triangle me-2"></i>Xác nhận xóa</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body pt-2">
                        <p class="mb-3">Bạn có chắc chắn muốn xóa cài đặt thuế:</p>
                        <div class="bg-light p-3 rounded"><strong t-esc="state.deleteTarget.name"></strong></div>
                        <p class="mt-3 text-muted small">Hành động này không thể hoàn tác.</p>
                    </div>
                    <div class="modal-footer border-0 pt-0">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal"><i class="fas fa-times me-1"></i>Hủy</button>
                        <button type="button" class="btn btn-danger" t-on-click="handleDelete"><i class="fas fa-trash me-1"></i>Xác nhận xóa</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Toast Notification -->
        <div class="position-fixed top-0 end-0 p-3" style="z-index: 1100">
            <div id="deleteTaxToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <i class="fas fa-check-circle text-success me-2"></i>
                    <strong class="me-auto">Thông báo</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body" t-esc="state.toastMessage"></div>
            </div>
        </div>
    </div>
    `;

    setup() {
        this.state = useState({
            taxes: [],
            searchTerm: "",
            loading: true,
            currentPage: 1,
            totalRecords: 0,
            limit: 10,
            sortColumn: 'tax_name',
            sortOrder: 'asc',
            statusFilter: 'all',
            deleteTarget: { id: null, name: '' },
            toastMessage: ''
        });
        this.searchTimeout = null;
        onMounted(() => this.loadData());
    }

    get totalPages() { return Math.ceil(this.state.totalRecords / this.state.limit); }

    getPaginationRange() {
        const current = this.state.currentPage;
        const total = this.totalPages;
        const range = [];
        if (total <= 7) { for (let i = 1; i <= total; i++) range.push(i); }
        else {
            if (current <= 4) { range.push(1, 2, 3, 4, 5, '...', total); }
            else if (current >= total - 3) { range.push(1, '...', total - 4, total - 3, total - 2, total - 1, total); }
            else { range.push(1, '...', current - 1, current, current + 1, '...', total); }
        }
        return range;
    }

    getSortIcon(column) {
        if (this.state.sortColumn !== column) return 'fas fa-sort text-black-50 ms-1';
        return this.state.sortOrder === 'asc' ? 'fas fa-sort-up ms-1' : 'fas fa-sort-down ms-1';
    }

    async loadData() {
        this.state.loading = true;
        const { currentPage, limit, searchTerm, sortColumn, sortOrder, statusFilter } = this.state;
        const params = new URLSearchParams({
            page: currentPage,
            limit: limit,
            search: searchTerm.trim(),
            sort: sortColumn,
            order: sortOrder,
            filter: statusFilter,
        });
        const url = `/get_tax_settings_data?${params.toString()}`;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error("Tải dữ liệu thất bại");
            const data = await res.json();
            this.state.taxes = data.records || [];
            this.state.totalRecords = data.total_records || 0;
        } catch (e) {
            console.error(e);
            this.state.taxes = [];
            this.state.totalRecords = 0;
        } finally {
            this.state.loading = false;
        }
    }

    changePage(page) {
        if (page > 0 && page <= this.totalPages && page !== this.state.currentPage) {
            this.state.currentPage = page;
            this.loadData();
        }
    }
    
    onSearchInput() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.performSearch();
        }, 300);
    }

    performSearch() { 
        this.state.currentPage = 1; 
        this.loadData(); 
    }

    sortColumn(column) {
        if (this.state.sortColumn === column) {
            this.state.sortOrder = this.state.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.state.sortColumn = column;
            this.state.sortOrder = 'asc';
        }
        this.loadData();
    }

    filterByStatus(status) {
        this.state.statusFilter = status;
        this.performSearch();
    }

    handleEdit(id) { 
        window.location.href = `/tax_settings/edit/${id}`; 
    }

    confirmDelete(id, name) {
        this.state.deleteTarget.id = id;
        this.state.deleteTarget.name = name;
        const modal = new bootstrap.Modal(document.getElementById('deleteTaxConfirmModal'));
        modal.show();
    }

    async handleDelete() {
        if (!this.state.deleteTarget.id) return;
        const modalElement = document.getElementById('deleteTaxConfirmModal');
        const modal = bootstrap.Modal.getInstance(modalElement);

        try {
            const response = await fetch('/tax_settings/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: this.state.deleteTarget.id })
            });
            
            if (modal) modal.hide();
            const result = await response.json();

            if (response.ok && result.success) {
                this.state.toastMessage = result.message || `Đã xóa thành công "${this.state.deleteTarget.name}"`;
                this.showToast();
                await this.loadData();
            } else {
                alert(`Lỗi khi xóa: ${result.error || 'Lỗi không xác định'}`);
            }
        } catch (error) {
            if (modal) modal.hide();
            alert(`Có lỗi xảy ra: ${error.message}`);
        } finally {
            this.state.deleteTarget.id = null;
            this.state.deleteTarget.name = '';
        }
    }

    showToast() {
        const toastElement = document.getElementById('deleteTaxToast');
        if (toastElement) {
            const toast = new bootstrap.Toast(toastElement);
            toast.show();
        }
    }

    createNew() { 
        window.location.href = '/tax_settings/new'; 
    }
}

if (!window.TaxSettingsWidget) {
    window.TaxSettingsWidget = TaxSettingsWidget;
    console.log("Enhanced TaxSettingsWidget component loaded successfully.");
} else {
    console.log("TaxSettingsWidget already exists, skipping registration.");
}
