console.log("Loading SchemeTypeWidget...");

const { Component, xml, useState, onMounted } = window.owl;

class SchemeTypeWidget extends Component {
    static template = xml`
    <div class="scheme-type-container">
        <!-- Header Section -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
                    <div>
                        <h1 class="h3 fw-bold text-dark mb-2">Danh mục loại chương trình</h1>
                        <nav aria-label="breadcrumb">
                            <ol class="breadcrumb small mb-0">
                                <li class="breadcrumb-item">
                                    <a href="#" class="text-decoration-none text-muted">
                                        <i class="fas fa-home me-1"></i>Trở về
                                    </a>
                                </li>
                                <li class="breadcrumb-item active text-primary" aria-current="page">
                                    Danh mục loại chương trình
                                </li>
                            </ol>
                        </nav>
                    </div>
                    <button t-on-click="createNew" class="btn btn-primary px-4 py-2 fw-semibold shadow-sm d-flex align-items-center gap-2">
                        <i class="fas fa-plus"></i>
                        <span>Tạo mới</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Search and Filter Section -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card search-container border-0">
                    <div class="card-body p-3">
                        <div class="row g-3 align-items-center">
                            <!-- Search Input -->
                            <div class="col-12 col-lg-5">
                                <div class="input-group">
                                    <span class="input-group-text bg-light border-end-0 px-3">
                                        <i class="fas fa-search text-muted"></i>
                                    </span>
                                    <input type="text" 
                                        placeholder="Tìm theo tên hoặc mã..." 
                                        class="form-control border-start-0 px-2"
                                        t-on-keyup="onSearchKeyup" 
                                        t-model="state.searchTerm"
                                    />
                                </div>
                            </div>
                            <!-- Quick Filters -->
                            <div class="col-12 col-lg-4">
                                <div class="btn-group w-100" role="group">
                                    <input type="radio" class="btn-check" name="statusFilter" id="all" autocomplete="off" t-att-checked="state.statusFilter === 'all'" t-on-click="() => this.filterByStatus('all')"/>
                                    <label class="btn btn-outline-secondary" for="all">Tất cả</label>

                                    <input type="radio" class="btn-check" name="statusFilter" id="active" autocomplete="off" t-att-checked="state.statusFilter === 'active'" t-on-click="() => this.filterByStatus('active')"/>
                                    <label class="btn btn-outline-success" for="active">Kích hoạt</label>

                                    <input type="radio" class="btn-check" name="statusFilter" id="inactive" autocomplete="off" t-att-checked="state.statusFilter === 'inactive'" t-on-click="() => this.filterByStatus('inactive')"/>
                                    <label class="btn btn-outline-danger" for="inactive">Chưa kích hoạt</label>
                                </div>
                            </div>
                            <!-- Search Info and Button -->
                            <div class="col-12 col-lg-3">
                                <div class="d-flex justify-content-between align-items-center">
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
            </div>
        </div>

        <!-- Bulk Actions Toolbar -->
        <div t-if="state.selectedIds.size > 0" class="row mb-3">
            <div class="col-12">
                <div class="bulk-actions-toolbar p-2 d-flex justify-content-between align-items-center">
                    <span class="fw-semibold ms-2">
                        Đã chọn <t t-esc="state.selectedIds.size"/> mục
                    </span>
                    <div>
                        <button class="btn btn-sm btn-danger" t-on-click="handleBulkDelete">
                            <i class="fas fa-trash me-2"></i>Xóa mục đã chọn
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Scheme Type Table Section -->
        <div class="row">
            <div class="col-12">
                <div class="card border-0">
                    <div class="card-body p-0">
                        <!-- Desktop Table -->
                        <div class="table-responsive d-none d-lg-block">
                            <table class="table table-hover mb-0">
                                <thead>
                                    <tr>
                                        <th scope="col" class="px-3 py-3" style="width: 50px;">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" t-on-change="toggleSelectAll" t-att-checked="isAllSelected"/>
                                            </div>
                                        </th>
                                        <th scope="col" t-on-click="() => this.sortColumn('name')" class="px-3 py-3 text-uppercase small fw-semibold text-muted border-0 sortable">
                                            Tên loại sản phẩm
                                            <i t-if="state.sortColumn === 'name'" t-attf-class="fas ms-1 {{state.sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}}" />
                                            <i t-else="" class="fas fa-sort text-black-50 ms-1"/>
                                        </th>
                                        <th scope="col" t-on-click="() => this.sortColumn('name_acronym')" class="px-3 py-3 text-uppercase small fw-semibold text-muted border-0 sortable">
                                            Mã
                                            <i t-if="state.sortColumn === 'name_acronym'" t-attf-class="fas ms-1 {{state.sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}}" />
                                            <i t-else="" class="fas fa-sort text-black-50 ms-1"/>
                                        </th>
                                        <th scope="col" class="px-3 py-3 text-center text-uppercase small fw-semibold text-muted border-0">
                                            Tự động mua?
                                        </th>
                                        <th scope="col" class="px-3 py-3 text-center text-uppercase small fw-semibold text-muted border-0">
                                            Kích hoạt
                                        </th>
                                        <th scope="col" class="px-3 py-3 text-center text-uppercase small fw-semibold text-muted border-0">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <t t-if="state.loading">
                                        <tr>
                                            <td colspan="6" class="text-center py-5">
                                                <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
                                                <p class="text-muted mt-2">Đang tải dữ liệu...</p>
                                            </td>
                                        </tr>
                                    </t>
                                    <t t-if="!state.loading and state.schemeTypes.length === 0">
                                        <tr>
                                            <td colspan="6" class="text-center py-5">
                                                <div class="mb-4">
                                                    <i class="fas fa-layer-group fa-4x text-muted opacity-50"></i>
                                                </div>
                                                <h5 class="text-muted mb-3">Chưa có Loại chương trình nào</h5>
                                                <p class="text-muted mb-4">Bắt đầu bằng cách tạo loại chương trình đầu tiên của bạn.</p>
                                                <button class="btn btn-primary" t-on-click="createNew">
                                                    <i class="fas fa-plus me-2"></i>Tạo loại chương trình
                                                </button>
                                            </td>
                                        </tr>
                                    </t>
                                    <t t-foreach="state.schemeTypes" t-as="st" t-key="st.id">
                                        <tr class="align-middle">
                                            <td class="px-3 py-3">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" t-att-checked="state.selectedIds.has(st.id)" t-on-change="() => this.toggleSelectOne(st.id)"/>
                                                </div>
                                            </td>
                                            <td class="px-3 py-3">
                                                <div class="fw-semibold text-dark" t-esc="st.name"/>
                                                <div class="small text-muted">Loại sản phẩm</div>
                                            </td>
                                            <td class="px-3 py-3">
                                                <span class="badge bg-light text-dark fw-normal" t-esc="st.name_acronym"/>
                                            </td>
                                            <td class="px-3 py-3 text-center">
                                                <i t-if="st.auto_invest" class="fas fa-check-circle text-success fa-lg"/>
                                                <i t-else="" class="fas fa-times-circle text-muted fa-lg"/>
                                            </td>
                                            <td class="px-3 py-3 text-center">
                                                <span t-if="st.activate_scheme" class="badge rounded-pill bg-success-subtle text-success px-3 py-2">Kích hoạt</span>
                                                <span t-else="" class="badge rounded-pill bg-danger-subtle text-danger px-3 py-2">Chưa kích hoạt</span>
                                            </td>
                                            <td class="px-3 py-3 text-center">
                                                <div class="d-flex gap-2 justify-content-center">
                                                    <button t-on-click="() => this.handleEdit(st.id)" class="btn btn-sm btn-light border">
                                                        <i class="fas fa-edit me-1"></i>Sửa
                                                    </button>
                                                    <button t-on-click="() => this.confirmDelete(st.id, st.name)" class="btn btn-sm btn-outline-danger">
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
                        <div class="d-lg-none">
                            <t t-if="state.loading">
                                <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
                            </t>
                            <t t-if="!state.loading and state.schemeTypes.length === 0">
                                <div class="text-center py-5">
                                    <div class="mb-4"><i class="fas fa-layer-group fa-4x text-muted opacity-50"></i></div>
                                    <h5 class="text-muted mb-3">Chưa có loại chương trình nào</h5>
                                    <button class="btn btn-primary" t-on-click="createNew"><i class="fas fa-plus me-2"></i>Tạo mới</button>
                                </div>
                            </t>
                            <t t-foreach="state.schemeTypes" t-as="st" t-key="st.id">
                                <div t-attf-class="card mobile-card mb-3 border-0 shadow-sm {{st.activate_scheme ? 'status-active' : 'status-inactive'}}">
                                    <div class="card-body p-3">
                                        <div class="d-flex">
                                            <div class="form-check me-3 pt-1">
                                                <input class="form-check-input" type="checkbox" t-att-checked="state.selectedIds.has(st.id)" t-on-change="() => this.toggleSelectOne(st.id)"/>
                                            </div>
                                            <div class="flex-grow-1">
                                                <div class="d-flex justify-content-between align-items-start mb-2">
                                                    <div>
                                                        <h6 class="fw-semibold mb-1" t-esc="st.name"/>
                                                        <p class="text-muted small mb-0" t-esc="st.name_acronym"/>
                                                    </div>
                                                    <div class="dropdown">
                                                        <button class="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown"><i class="fas fa-ellipsis-v"></i></button>
                                                        <ul class="dropdown-menu dropdown-menu-end">
                                                            <li><a class="dropdown-item" href="#" t-on-click.prevent="() => this.handleEdit(st.id)"><i class="fas fa-edit me-2"></i>Sửa</a></li>
                                                            <li><a class="dropdown-item text-danger" href="#" t-on-click.prevent="() => this.confirmDelete(st.id, st.name)"><i class="fas fa-trash me-2"></i>Xóa</a></li>
                                                        </ul>
                                                    </div>
                                                </div>
                                                <div class="d-flex justify-content-between align-items-center small mt-2 pt-2 border-top">
                                                    <div class="text-muted">Trạng thái:</div>
                                                    <span t-if="st.activate_scheme" class="badge bg-success-subtle text-success">Kích hoạt</span>
                                                    <span t-else="" class="badge bg-danger-subtle text-danger">Chưa kích hoạt</span>
                                                </div>
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
                            <div class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
                                <span class="text-muted small">
                                    Hiển thị <t t-esc="state.schemeTypes.length"/> trên tổng số <t t-esc="state.totalRecords"/> bản ghi
                                </span>
                                <nav aria-label="Page navigation">
                                    <ul class="pagination pagination-sm mb-0">
                                        <li t-attf-class="page-item #{state.currentPage === 1 ? 'disabled' : ''}">
                                            <a class="page-link" href="#" t-on-click.prevent="() => this.changePage(state.currentPage - 1)">‹</a>
                                        </li>
                                        <t t-foreach="getPaginationRange()" t-as="page" t-key="page">
                                            <li t-if="page === '...'" class="page-item disabled"><span class="page-link">...</span></li>
                                            <li t-else="" t-attf-class="page-item #{page === state.currentPage ? 'active' : ''}">
                                                <a class="page-link" href="#" t-on-click.prevent="() => this.changePage(page)" t-esc="page"/>
                                            </li>
                                        </t>
                                        <li t-attf-class="page-item #{state.currentPage === totalPages ? 'disabled' : ''}">
                                            <a class="page-link" href="#" t-on-click.prevent="() => this.changePage(state.currentPage + 1)">›</a>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </t>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <div class="modal fade" id="deleteConfirmModal" tabindex="-1" aria-labelledby="deleteConfirmModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header border-0 pb-0">
                        <h5 class="modal-title text-danger" id="deleteConfirmModalLabel">
                            <i class="fas fa-exclamation-triangle me-2"></i>Xác nhận xóa
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body pt-2">
                         <p class="mb-3">Bạn có chắc chắn muốn xóa loại chương trình:</p>
                        <div class="bg-light p-3 rounded">
                            <strong t-esc="state.deleteTarget.name"></strong>
                        </div>
                        <p class="mt-3 text-muted small">Hành động này không thể hoàn tác.</p>
                    </div>
                    <div class="modal-footer border-0 pt-0">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Hủy</button>
                        <button type="button" class="btn btn-danger" t-on-click="handleDelete">Xác nhận xóa</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Toast Notification -->
        <div class="position-fixed top-0 end-0 p-3" style="z-index: 1100">
            <div id="notificationToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
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
            schemeTypes: [],
            searchTerm: "",
            loading: true,
            currentPage: 1,
            totalRecords: 0,
            limit: 10,
            sortColumn: 'name',
            sortOrder: 'asc',
            statusFilter: 'all', // 'all', 'active', 'inactive'
            selectedIds: new Set(),
            deleteTarget: { id: null, name: '' },
            toastMessage: '',
        });
        onMounted(() => {
            this.loadSchemeTypes();
        });
    }

    // --- Getters ---
    get isAllSelected() {
        const pageIds = this.state.schemeTypes.map(st => st.id);
        return pageIds.length > 0 && pageIds.every(id => this.state.selectedIds.has(id));
    }

    get totalPages() {
        return Math.ceil(this.state.totalRecords / this.state.limit);
    }

    getPaginationRange() {
        const current = this.state.currentPage;
        const total = this.totalPages;
        const range = [];
        
        if (total <= 7) {
            for (let i = 1; i <= total; i++) range.push(i);
        } else {
            if (current <= 4) {
                range.push(1, 2, 3, 4, 5, '...', total);
            } else if (current >= total - 3) {
                range.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
            } else {
                range.push(1, '...', current - 1, current, current + 1, '...', total);
            }
        }
        return range;
    }

    // --- Data Loading ---
    async loadSchemeTypes() {
        this.state.loading = true;
        this.state.selectedIds.clear();
        
        const params = new URLSearchParams({
            page: this.state.currentPage,
            limit: this.state.limit,
            search: this.state.searchTerm.trim(),
            sort: this.state.sortColumn,
            order: this.state.sortOrder,
            filter: this.state.statusFilter,
        });

        try {
            const url = `/get_scheme_type_data?${params.toString()}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            
            const result = await response.json();
            if (result.error) throw new Error(result.error);
            
            this.state.schemeTypes = result.records || [];
            this.state.totalRecords = result.total_records || 0;
        } catch (error) {
            console.error("Error fetching scheme types:", error);
            this.state.schemeTypes = [];
            this.state.totalRecords = 0;
            this.showToast(`Lỗi: ${error.message}`);
        } finally {
            this.state.loading = false;
        }
    }

    // --- Event Handlers ---
    changePage(newPage) {
        if (newPage > 0 && newPage <= this.totalPages && newPage !== this.state.currentPage) {
            this.state.currentPage = newPage;
            this.loadSchemeTypes();
        }
    }
    
    onSearchKeyup(ev) {
        if (ev.key === 'Enter') {
            this.performSearch();
        }
    }

    performSearch() {
        this.state.currentPage = 1;
        this.loadSchemeTypes();
    }

    sortColumn(column) {
        if (this.state.sortColumn === column) {
            this.state.sortOrder = this.state.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.state.sortColumn = column;
            this.state.sortOrder = 'asc';
        }
        this.loadSchemeTypes();
    }
    
    filterByStatus(status) {
        this.state.statusFilter = status;
        this.performSearch();
    }

    // --- Selection ---
    toggleSelectOne(id) {
        if (this.state.selectedIds.has(id)) {
            this.state.selectedIds.delete(id);
        } else {
            this.state.selectedIds.add(id);
        }
    }

    toggleSelectAll(ev) {
        const isChecked = ev.target.checked;
        if (isChecked) {
            this.state.schemeTypes.forEach(st => this.state.selectedIds.add(st.id));
        } else {
            this.state.schemeTypes.forEach(st => this.state.selectedIds.delete(st.id));
        }
    }

    // --- CRUD Actions ---
    handleEdit(id) {
        window.location.href = `/scheme_type/edit/${id}`;
    }
    
    createNew() {
        window.location.href = '/scheme_type/new';
    }

    confirmDelete(id, name) {
        this.state.deleteTarget.id = id;
        this.state.deleteTarget.name = name;
        const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        modal.show();
    }

    async handleDelete() {
        if (!this.state.deleteTarget.id) return;

        const modalElement = document.getElementById('deleteConfirmModal');
        const modal = bootstrap.Modal.getInstance(modalElement);

        try {
            const response = await fetch('/scheme_type/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: this.state.deleteTarget.id })
            });

            if (modal) modal.hide();
            
            const result = await response.json();

            if (response.ok && result.success) {
                this.showToast(result.message);
                // Refresh data, go to page 1 if current page becomes empty
                if (this.state.schemeTypes.length === 1 && this.state.currentPage > 1) {
                    this.state.currentPage -= 1;
                }
                await this.loadSchemeTypes();
            } else {
                throw new Error(result.error || 'Lỗi không xác định');
            }
        } catch (error) {
            console.error('Delete failed:', error);
            if (modal && modal._isShown) modal.hide();
            this.showToast(`Lỗi khi xóa: ${error.message}`, 'error');
        } finally {
            this.state.deleteTarget.id = null;
            this.state.deleteTarget.name = '';
        }
    }

    async handleBulkDelete() {
        const ids = Array.from(this.state.selectedIds);
        if (ids.length === 0) return;

        if (!confirm(`Bạn có chắc chắn muốn xóa ${ids.length} mục đã chọn?`)) {
            return;
        }

        // In a real app, you would probably have a separate bulk delete endpoint
        // For now, we delete one by one
        this.state.loading = true;
        let successCount = 0;
        for (const id of ids) {
            try {
                const response = await fetch('/scheme_type/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: id })
                });
                if (response.ok) {
                    successCount++;
                }
            } catch (error) {
                console.error(`Failed to delete item ${id}:`, error);
            }
        }
        this.showToast(`Đã xóa thành công ${successCount}/${ids.length} mục.`);
        await this.loadSchemeTypes(); // Reloads and sets loading to false
    }
    
    showToast(message, type = 'success') {
        this.state.toastMessage = message;
        const toastEl = document.getElementById('notificationToast');
        const toastHeader = toastEl.querySelector('.toast-header');
        const toastIcon = toastHeader.querySelector('i');

        if (type === 'error') {
            toastHeader.classList.remove('text-success');
            toastHeader.classList.add('text-danger');
            toastIcon.className = 'fas fa-exclamation-circle text-danger me-2';
        } else {
            toastHeader.classList.remove('text-danger');
            toastHeader.classList.add('text-success');
            toastIcon.className = 'fas fa-check-circle text-success me-2';
        }

        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }
}

if (!window.SchemeTypeWidget) {
    window.SchemeTypeWidget = SchemeTypeWidget;
    console.log("SchemeTypeWidget component loaded successfully.");
} else {
    console.log("SchemeTypeWidget already exists, skipping registration.");
}
