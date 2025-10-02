console.log("Loading FeeScheduleWidget component...");

const { Component, xml, useState, onMounted } = window.owl;

class FeeScheduleWidget extends Component {
    static template = xml`
    <div class="fee-schedule-container">
        <!-- Header Section -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
                    <div>
                        <h1 class="h3 fw-bold text-dark mb-2">Biểu phí</h1>
                        <nav aria-label="breadcrumb">
                            <ol class="breadcrumb small mb-0">
                                <li class="breadcrumb-item">
                                    <a href="#" class="text-decoration-none text-muted">
                                        <i class="fas fa-home me-1"></i>Trở về
                                    </a>
                                </li>
                                <li class="breadcrumb-item active text-primary" aria-current="page">
                                    Biểu phí
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
                    <div class="card-body py-3">
                        <div class="row align-items-center">
                            <div class="col-12 col-lg-8">
                                <div class="input-group">
                                    <span class="input-group-text bg-light border-end-0 px-3">
                                        <i class="fas fa-search text-muted"></i>
                                    </span>
                                    <input type="text" 
                                        placeholder="Nhập từ khóa để tìm kiếm..." 
                                        class="form-control border-start-0 px-3"
                                        t-on-input="onSearchInput" 
                                        t-on-keyup="onSearchKeyup" 
                                        t-model="state.searchTerm"
                                    />
                                </div>
                            </div>
                            <div class="col-12 col-lg-4 mt-3 mt-lg-0">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="text-muted small">
                                        Tổng <strong class="text-primary" t-esc="state.totalRecords"/> kết quả
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

        <!-- Fee Schedule Table Section -->
        <div class="row">
            <div class="col-12">
                <div class="card border-0">
                    <div class="card-body p-0">
                        <!-- Desktop Table -->
                        <div class="table-responsive d-none d-lg-block">
                            <table class="table table-hover mb-0">
                                <thead>
                                    <tr>
                                        <th scope="col" class="px-4 py-3 text-uppercase small fw-semibold text-muted border-0">Tên biểu phí</th>
                                        <th scope="col" class="px-4 py-3 text-uppercase small fw-semibold text-muted border-0">Mã VSD</th>
                                        <th scope="col" class="px-4 py-3 text-uppercase small fw-semibold text-muted border-0">Chương trình</th>
                                        <th scope="col" class="px-4 py-3 text-uppercase small fw-semibold text-muted border-0">Loại phí</th>
                                        <th scope="col" class="px-4 py-3 text-uppercase small fw-semibold text-muted border-0">Tỉ lệ (%)</th>
                                        <th scope="col" class="px-4 py-3 text-uppercase small fw-semibold text-muted border-0 text-center">Trạng thái</th>
                                        <th scope="col" class="px-4 py-3 text-center text-uppercase small fw-semibold text-muted border-0">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <t t-if="state.loading">
                                        <tr>
                                            <td colspan="7" class="text-center py-5">
                                                <div class="d-flex flex-column justify-content-center align-items-center">
                                                    <div class="spinner-border text-primary mb-3" role="status">
                                                        <span class="visually-hidden">Loading...</span>
                                                    </div>
                                                    <p class="text-muted mb-0">Đang tải dữ liệu...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    </t>
                                    <t t-if="!state.loading and state.fees.length === 0">
                                        <tr>
                                            <td colspan="7" class="text-center py-5">
                                                <div class="mb-4">
                                                    <i class="fas fa-percentage fa-4x text-muted opacity-50"></i>
                                                </div>
                                                <h5 class="text-muted mb-3">Chưa có Biểu phí nào</h5>
                                                <p class="text-muted mb-4">Bắt đầu bằng cách tạo Biểu phí đầu tiên của bạn.</p>
                                                <button class="btn btn-primary" t-on-click="createNew">
                                                    <i class="fas fa-plus me-2"></i>Tạo biểu phí
                                                </button>
                                            </td>
                                        </tr>
                                    </t>
                                    <t t-foreach="state.fees" t-as="fee" t-key="fee.id">
                                        <tr class="align-middle">
                                            <td class="px-4 py-3">
                                                <div class="fw-semibold text-dark" t-esc="fee.fee_name"/>
                                            </td>
                                            <td class="px-4 py-3">
                                                <span class="badge bg-light text-dark fw-normal" t-esc="fee.fee_code"/>
                                            </td>
                                            <td class="px-4 py-3">
                                                <span class="text-muted" t-esc="fee.scheme_name"/>
                                            </td>
                                            <td class="px-4 py-3">
                                                <span class="badge rounded-pill bg-info-subtle text-info px-3 py-2" t-esc="fee.fee_type"/>
                                            </td>
                                            <td class="px-4 py-3">
                                                <span class="fw-bold text-primary" t-esc="fee.fee_rate"/>%
                                            </td>
                                            <td class="px-4 py-3 text-center">
                                                <span t-if="fee.activate" class="badge bg-success-subtle text-success">Hoạt động</span>
                                                <span t-else="" class="badge bg-danger-subtle text-danger">Không HĐ</span>
                                            </td>
                                            <td class="px-4 py-3 text-center" style="width: 120px;">
                                                <div class="d-flex flex-column align-items-center gap-1">
                                                     <a t-on-click.prevent="() => this.handleEdit(fee.id)" href="#" class="btn btn-sm btn-light border w-100 d-flex align-items-center justify-content-center">
                                                        <i class="fas fa-edit me-2"></i>Sửa
                                                    </a>
                                                    <a t-on-click.prevent="() => this.handleDelete(fee.id, fee.fee_name)" href="#" class="btn btn-sm btn-light border w-100 d-flex align-items-center justify-content-center">
                                                        <i class="fas fa-trash-alt me-2 text-danger"></i>Xóa
                                                    </a>
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
                                <div class="text-center py-5">
                                    <div class="spinner-border text-primary mb-3" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <p class="text-muted mb-0">Đang tải dữ liệu...</p>
                                </div>
                            </t>
                            <t t-if="!state.loading and state.fees.length === 0">
                                <div class="text-center py-5 px-3">
                                    <div class="mb-4">
                                        <i class="fas fa-percentage fa-4x text-muted opacity-50"></i>
                                    </div>
                                    <h5 class="text-muted mb-3">Chưa có biểu phí nào</h5>
                                    <p class="text-muted mb-4">Bắt đầu bằng cách tạo biểu phí đầu tiên của bạn.</p>
                                    <button class="btn btn-primary" t-on-click="createNew">
                                        <i class="fas fa-plus me-2"></i>Tạo biểu phí
                                    </button>
                                </div>
                            </t>
                            <t t-foreach="state.fees" t-as="fee" t-key="fee.id">
                                <div class="card mb-3 border-0 shadow-sm">
                                    <div class="card-body p-3">
                                        <div class="d-flex align-items-start">
                                            <div class="flex-grow-1">
                                                <div class="d-flex justify-content-between align-items-start mb-2">
                                                    <div>
                                                        <h6 class="fw-semibold mb-1" t-esc="fee.fee_name"/>
                                                        <p class="text-muted small mb-0" t-esc="fee.fee_code"/>
                                                    </div>
                                                    <div class="d-flex flex-column gap-1">
                                                        <a t-on-click.prevent="() => this.handleEdit(fee.id)" href="#" class="btn btn-sm btn-light border">
                                                            <i class="fas fa-edit me-1"></i>Sửa
                                                        </a>
                                                        <a t-on-click.prevent="() => this.handleDelete(fee.id, fee.fee_name)" href="#" class="btn btn-sm btn-light border">
                                                            <i class="fas fa-trash-alt me-1 text-danger"></i>Xóa
                                                        </a>
                                                    </div>
                                                </div>
                                                <div class="row g-2 small">
                                                    <div class="col-6">
                                                        <div class="text-muted">Tỉ lệ:</div>
                                                        <div class="fw-bold text-primary" t-esc="fee.fee_rate"/>%
                                                    </div>
                                                    <div class="col-6">
                                                        <div class="text-muted">Trạng thái:</div>
                                                        <span t-if="fee.activate" class="badge bg-success-subtle text-success">Hoạt động</span>
                                                        <span t-else="" class="badge bg-danger-subtle text-danger">Không HĐ</span>
                                                    </div>
                                                    <div class="col-12 mt-2">
                                                        <div class="text-muted">Loại phí:</div>
                                                        <span class="badge bg-info-subtle text-info" t-esc="fee.fee_type"/>
                                                    </div>
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
                            <div class="d-flex justify-content-center justify-content-lg-end">
                                <nav aria-label="Page navigation">
                                    <ul class="pagination mb-0">
                                        <li t-attf-class="page-item #{state.currentPage === 1 ? 'disabled' : ''}">
                                            <a class="page-link" href="#" t-on-click.prevent="() => this.changePage(state.currentPage - 1)">
                                                <i class="fas fa-chevron-left"></i>
                                            </a>
                                        </li>
                                        <t t-foreach="getPaginationRange()" t-as="page" t-key="page">
                                            <li t-if="page === '...'" class="page-item disabled">
                                                <span class="page-link">...</span>
                                            </li>
                                            <li t-else="" t-attf-class="page-item #{page === state.currentPage ? 'active' : ''}">
                                                <a class="page-link" href="#" t-on-click.prevent="() => this.changePage(page)" t-esc="page"/>
                                            </li>
                                        </t>
                                        <li t-attf-class="page-item #{state.currentPage === totalPages ? 'disabled' : ''}">
                                            <a class="page-link" href="#" t-on-click.prevent="() => this.changePage(state.currentPage + 1)">
                                                <i class="fas fa-chevron-right"></i>
                                            </a>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </t>
                </div>
            </div>
        </div>
    </div>
    `;

    setup() {
        this.state = useState({
            fees: [],
            searchTerm: "",
            loading: true,
            currentPage: 1,
            totalRecords: 0,
            limit: 10,
        });

        onMounted(() => {
            console.log("FeeScheduleWidget mounted, loading data...");
            this.loadData();
        });
    }

    get totalPages() {
        return Math.ceil(this.state.totalRecords / this.state.limit);
    }

    getPaginationRange() {
        const current = this.state.currentPage;
        const total = this.totalPages;
        const range = [];
        
        if (total <= 7) {
            for (let i = 1; i <= total; i++) {
                range.push(i);
            }
        } else {
            if (current <= 4) {
                for (let i = 1; i <= 5; i++) {
                    range.push(i);
                }
                range.push('...');
                range.push(total);
            } else if (current >= total - 3) {
                range.push(1);
                range.push('...');
                for (let i = total - 4; i <= total; i++) {
                    range.push(i);
                }
            } else {
                range.push(1);
                range.push('...');
                for (let i = current - 1; i <= current + 1; i++) {
                    range.push(i);
                }
                range.push('...');
                range.push(total);
            }
        }
        
        return range;
    }

    async loadData() {
        console.log("Loading fee schedule data...");
        this.state.loading = true;
        const searchTerm = encodeURIComponent(this.state.searchTerm.trim());
        try {
            const url = `/get_fee_schedule_data?page=${this.state.currentPage}&limit=${this.state.limit}&search=${searchTerm}`;
            console.log("Fetching from URL:", url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            this.state.fees = result.records || [];
            this.state.totalRecords = result.total_records || 0;
            
        } catch (error) {
            console.error("Error fetching fee schedules:", error);
            this.state.fees = [];
            this.state.totalRecords = 0;
        } finally {
            this.state.loading = false;
        }
    }

    changePage(newPage) {
        if (newPage > 0 && newPage <= this.totalPages && newPage !== this.state.currentPage) {
            this.state.currentPage = newPage;
            this.loadData();
        }
    }
    
    onSearchInput(ev) {
        this.state.searchTerm = ev.target.value;
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
    
    handleEdit(feeId) { 
        window.location.href = `/fee_schedule/edit/${feeId}`;
    }

    async handleDelete(feeId, feeName) {
        if (confirm(`Bạn có chắc chắn muốn xóa biểu phí "${feeName}" không?`)) {
            try {
                const response = await fetch('/fee_schedule/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: feeId }),
                });

                const result = await response.json();
                if (result.success) {
                    alert(result.message || 'Đã xóa thành công!');
                    this.loadData();
                } else {
                    alert(`Lỗi: ${result.error}`);
                }
            } catch (error) {
                console.error('Error deleting fee schedule:', error);
                alert('Đã xảy ra lỗi khi cố gắng xóa biểu phí.');
            }
        }
    }
    
    createNew() { 
        window.location.href = '/fee_schedule/new';
    }
    
    formatCurrency(value) {
        if (typeof value !== 'number') return value;
        return new Intl.NumberFormat('vi-VN', { style: 'decimal' }).format(value);
    }
}

if (!window.FeeScheduleWidget) {
    window.FeeScheduleWidget = FeeScheduleWidget;
    console.log("FeeScheduleWidget component loaded successfully.");
} else {
    console.log("FeeScheduleWidget already exists, skipping registration.");
}
