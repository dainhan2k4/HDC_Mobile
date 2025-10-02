console.log("Loading Improved FundCertificateWidget component...");

const { Component, xml, useState, onMounted, useRef } = window.owl;

class FundCertificateWidget extends Component {
    static template = xml`
    <div class="fund-certificate-container">
        <!-- Header Section -->
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div>
                <h1 class="h3 fw-bold text-dark mb-1">Chứng chỉ quỹ</h1>
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb small mb-0">
                        <li class="breadcrumb-item"><a href="#" class="text-decoration-none text-muted"><i class="fas fa-home me-1"></i>Trở về</a></li>
                        <li class="breadcrumb-item active text-primary" aria-current="page">Danh mục CCQ</li>
                    </ol>
                </nav>
            </div>
            <button t-on-click="createNewFund" class="btn btn-primary px-4 py-2 fw-semibold shadow-sm d-flex align-items-center gap-2">
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
                                placeholder="Tìm theo tên hoặc mã quỹ..."
                                class="form-control border-start-0"
                                t-ref="searchInput"
                                t-on-input="onSearchInput"
                                t-model="state.searchTerm"
                            />
                        </div>
                    </div>
                    <!-- Filter by Status -->
                    <div class="col-lg-2 col-md-4 col-sm-6">
                        <select class="form-select" t-model="state.filter.status" t-on-change="performSearch">
                            <option value="">Tất cả trạng thái</option>
                            <option value="active">Đã duyệt</option>
                            <option value="inactive">Ngừng hoạt động</option>
                        </select>
                    </div>
                    <!-- Filter by Type -->
                    <div class="col-lg-2 col-md-4 col-sm-6">
                        <select class="form-select" t-model="state.filter.type" t-on-change="performSearch">
                            <option value="">Tất cả loại quỹ</option>
                            <option value="stock">Quỹ Cổ phiếu</option>
                            <option value="bond">Quỹ Trái phiếu</option>
                        </select>
                    </div>
                    <!-- Bulk Actions Dropdown -->
                    <div class="col-lg-3 col-md-4">
                        <div class="d-flex align-items-center justify-content-end gap-2">
                            <span class="text-muted small">
                                Tổng <strong class="text-primary" t-esc="state.totalRecords"/> kết quả
                            </span>
                            <button t-on-click="performSearch" class="btn btn-primary px-4 fw-semibold">
                                Tìm kiếm
                            </button>
                            <div class="dropdown" t-if="state.selectedIds.size > 0">
                                <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                    Hành động (<t t-esc="state.selectedIds.size"/>)
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" href="#" t-on-click="() => handleBulkAction('approve')"><i class="fas fa-check me-2"></i>Duyệt mục đã chọn</a></li>
                                    <li><a class="dropdown-item" href="#" t-on-click="() => handleBulkAction('deactivate')"><i class="fas fa-ban me-2"></i>Ngừng hoạt động</a></li>
                                    <li><hr class="dropdown-divider"/></li>
                                    <li><a class="dropdown-item text-danger" href="#" t-on-click="() => handleBulkAction('delete')"><i class="fas fa-trash me-2"></i>Xóa mục đã chọn</a></li>
                                </ul>
                            </div>
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
                                <th class="px-3 py-3" style="width: 50px;">
                                    <input class="form-check-input" type="checkbox" t-on-change="toggleSelectAll"/>
                                </th>
                                <th class="px-4 py-3 text-uppercase small fw-semibold text-muted">Tên Chứng chỉ quỹ</th>
                                <th class="px-4 py-3 text-uppercase small fw-semibold text-muted">Mã quỹ</th>
                                <th class="px-4 py-3 text-uppercase small fw-semibold text-muted">Màu quỹ</th>
                                <th class="px-4 py-3 text-uppercase small fw-semibold text-muted">Giá trị NAV</th>
                                <th class="px-4 py-3 text-uppercase small fw-semibold text-muted">Loại quỹ</th>
                                <th class="px-4 py-3 text-uppercase small fw-semibold text-muted">Trạng thái</th>
                                <th class="px-4 py-3 text-uppercase small fw-semibold text-muted">Giờ đóng ngân hàng</th>
                                <th class="px-4 py-3 text-uppercase small fw-semibold text-muted">Giờ đóng sổ lệnh</th>
                                <th class="px-4 py-3 text-center text-uppercase small fw-semibold text-muted">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            <t t-if="state.loading">
                                <tr><td colspan="10" class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Đang tải dữ liệu...</p></td></tr>
                            </t>
                            <t t-if="!state.loading and state.certificates.length === 0">
                                <tr>
                                    <td colspan="10" class="text-center py-5">
                                        <div class="mb-4">
                                            <i class="fas fa-file-signature fa-4x text-muted opacity-50"></i>
                                        </div>
                                        <h5 class="text-muted mb-3">Chưa có chứng chỉ quỹ nào</h5>
                                        <p class="text-muted mb-4">Bắt đầu bằng cách tạo chứng chỉ quỹ đầu tiên của bạn.</p>
                                        <button class="btn btn-primary" t-on-click="createNewFund">
                                            <i class="fas fa-plus me-2"></i>Tạo chứng chỉ quỹ
                                        </button>
                                    </td>
                                </tr>
                            </t>
                            <t t-foreach="state.certificates" t-as="cert" t-key="cert.id">
                                <tr class="align-middle" t-att-class="state.selectedIds.has(cert.id) ? 'table-active' : ''">
                                    <td class="px-3">
                                        <input class="form-check-input" type="checkbox" t-att-checked="state.selectedIds.has(cert.id)" t-on-change="() => toggleSelection(cert.id)"/>
                                    </td>
                                    <td class="px-4 py-3">
                                        <div class="d-flex align-items-center">
                                            <div class="flex-shrink-0 me-3">
                                                <t t-if="cert.fund_image">
                                                    <img class="rounded-circle" style="width: 45px; height: 45px; object-fit: cover;" t-att-src="cert.fund_image" alt="Fund Image"/>
                                                </t>
                                                <t t-else="">
                                                    <div class="rounded-circle d-flex align-items-center justify-content-center" t-attf-style="width: 45px; height: 45px; background-color:#{cert.fund_color}1A;">
                                                        <i class="fas fa-chart-line fa-lg" t-attf-style="color:#{cert.fund_color};"></i>
                                                    </div>
                                                </t>
                                            </div>
                                            <div>
                                                <div class="fw-semibold text-dark" t-esc="cert.full_name"/>
                                                <div class="small text-muted" t-esc="cert.english_name"/>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-4 py-3"><span class="badge bg-light text-dark fw-normal" t-esc="cert.short_name"/></td>
                                    
                                    <td class="px-4 py-3">
                                        <div style="width: 50px; height: 6px; border-radius: 3px;" t-attf-style="background-color: #{cert.fund_color};"></div>
                                    </td>
                                    
                                    <td class="px-4 py-3"><span class="fw-semibold text-success" t-esc="formatCurrency(cert.current_nav)"/> <small class="text-muted">VND</small></td> <!-- Giữ lại cho hiển thị, nhưng không dùng để tính toán -->
                                    <td class="px-4 py-3"><span class="text-muted" t-esc="cert.product_type"/></td>
                                    <td class="px-4 py-3">
                                        <span t-if="cert.product_status === 'Đang hoạt động'" class="badge rounded-pill bg-success-subtle text-success px-3 py-2"><i class="fas fa-check-circle me-1"></i>Đã duyệt</span>
                                        <span t-else="" class="badge rounded-pill bg-danger-subtle text-danger px-3 py-2"><i class="fas fa-times-circle me-1"></i>Ngừng hoạt động</span>
                                    </td>
                                    
                                    <td class="px-4 py-3">
                                        <div class="d-flex align-items-center text-muted">
                                            <i class="fas fa-clock me-2"></i>
                                            <span>--:--</span>
                                        </div>
                                    </td>
                                    
                                    <td class="px-4 py-3"><div class="d-flex align-items-center text-muted"><i class="fas fa-clock me-2"></i><span t-esc="cert.inception_time"/></div></td>
                                    <td class="px-4 py-3 text-center">
                                        <div class="d-flex gap-2 justify-content-center">
                                            <button t-on-click="() => this.handleEdit(cert.id)" class="btn btn-sm btn-light border">
                                                <i class="fas fa-edit me-1"></i>Sửa
                                            </button>
                                            <button t-on-click="() => this.confirmDelete(cert.id, cert.full_name)" class="btn btn-sm btn-outline-danger">
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
                        <div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted">Đang tải...</p></div>
                    </t>
                    <t t-if="!state.loading and state.certificates.length === 0">
                        <div class="text-center py-5 px-3">
                            <div class="mb-4">
                                <i class="fas fa-file-signature fa-4x text-muted opacity-50"></i>
                            </div>
                            <h5 class="text-muted mb-3">Chưa có chứng chỉ quỹ nào</h5>
                            <p class="text-muted mb-4">Bắt đầu bằng cách tạo chứng chỉ quỹ đầu tiên của bạn.</p>
                            <button class="btn btn-primary" t-on-click="createNewFund">
                                <i class="fas fa-plus me-2"></i>Tạo chứng chỉ quỹ
                            </button>
                        </div>
                    </t>
                    <t t-foreach="state.certificates" t-as="cert" t-key="cert.id">
                        <div class="card mb-2" t-att-class="state.selectedIds.has(cert.id) ? 'border-primary' : 'border-0 shadow-sm'">
                             <div class="card-body p-3">
                                <div class="d-flex">
                                    <div class="px-2">
                                        <input class="form-check-input mt-1" style="transform: scale(1.2);" type="checkbox" t-att-checked="state.selectedIds.has(cert.id)" t-on-change="() => toggleSelection(cert.id)"/>
                                    </div>
                                    <div class="flex-grow-1">
                                        <div class="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <h6 class="fw-bold mb-0" t-esc="cert.full_name"/>
                                                <small class="text-muted" t-esc="cert.short_name"/>
                                            </div>
                                            <span t-if="cert.product_status === 'Đang hoạt động'" class="badge bg-success-subtle text-success">Đã duyệt</span>
                                            <span t-else="" class="badge bg-danger-subtle text-danger">Ngừng HĐ</span>
                                        </div>
                                        <div class="d-flex justify-content-between align-items-end">
                                            <div>
                                                <div class="small text-muted">NAV</div>
                                                <div class="fw-bold text-success" t-esc="formatCurrency(cert.current_nav)"/> <!-- Giữ lại cho hiển thị, nhưng không dùng để tính toán -->
                                            </div>
                                            <div class="d-flex gap-2">
                                                <button t-on-click="() => this.handleEdit(cert.id)" class="btn btn-sm btn-light border px-3 py-2">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button t-on-click="() => this.confirmDelete(cert.id, cert.full_name)" class="btn btn-sm btn-outline-danger px-3 py-2">
                                                    <i class="fas fa-trash"></i>
                                                </button>
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
                    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <div class="d-flex align-items-center gap-2">
                            <span class="text-muted small">Hiển thị</span>
                            <select class="form-select form-select-sm" style="width: 70px;" t-model="state.limit" t-on-change="() => { state.currentPage = 1; loadFundData(); }">
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
                        <div class="alert alert-danger d-flex align-items-center" role="alert">
                            <i class="fas fa-exclamation-circle me-2"></i>
                            <div>
                                <strong>Cảnh báo:</strong> Hành động này không thể hoàn tác!
                            </div>
                        </div>
                        <p class="mb-3">Bạn có chắc chắn muốn xóa chứng chỉ quỹ:</p>
                        <div class="bg-light p-3 rounded">
                            <strong t-esc="state.deleteTarget.name"></strong>
                        </div>
                        <p class="mt-3 text-muted small">Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.</p>
                    </div>
                    <div class="modal-footer border-0 pt-0">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i>Hủy
                        </button>
                        <button type="button" class="btn btn-danger" t-on-click="handleDelete">
                            <i class="fas fa-trash me-1"></i>Xác nhận xóa
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Toast Notification -->
        <div class="position-fixed top-0 end-0 p-3" style="z-index: 11">
            <div id="deleteToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <i class="fas fa-check-circle text-success me-2"></i>
                    <strong class="me-auto">Thông báo</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body" t-esc="state.toastMessage">
                </div>
            </div>
        </div>
    </div>
    `;

    setup() {
        this.state = useState({
            certificates: [],
            searchTerm: "",
            filter: {
                status: "",
                type: ""
            },
            loading: true,
            currentPage: 1,
            totalRecords: 0,
            limit: 10,
            selectedIds: new Set(),
            deleteTarget: {
                id: null,
                name: ''
            },
            toastMessage: ''
        });

        this.searchTimeout = null;
        
        onMounted(() => {
            this.loadFundData();
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
            for (let i = 1; i <= total; i++) range.push(i);
        } else {
            if (current < 5) {
                range.push(1, 2, 3, 4, 5, '...', total);
            } else if (current > total - 4) {
                range.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
            } else {
                range.push(1, '...', current - 1, current, current + 1, '...', total);
            }
        }
        return range;
    }

    async loadFundData() {
        this.state.loading = true;
        this.state.selectedIds.clear(); // Clear selection on data load
        const params = new URLSearchParams({
            page: this.state.currentPage,
            limit: this.state.limit,
            search: this.state.searchTerm.trim(),
            status: this.state.filter.status,
            type: this.state.filter.type,
        });

        try {
            const response = await fetch(`/get_fund_certificate_data?${params.toString()}`);
            if (!response.ok) throw new Error(`Network response was not ok`);
            const result = await response.json();
            if (result.error) throw new Error(result.error);
            
            this.state.certificates = result.records || [];
            this.state.totalRecords = result.total_records || 0;
        } catch (error) {
            console.error("Error fetching fund certificates:", error);
            this.state.certificates = [];
            this.state.totalRecords = 0;
            // You should show an error message to the user here
        } finally {
            this.state.loading = false;
        }
    }

    changePage(newPage) {
        if (newPage > 0 && newPage <= this.totalPages && newPage !== this.state.currentPage) {
            this.state.currentPage = newPage;
            this.loadFundData();
        }
    }
    
    onSearchInput() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.performSearch();
        }, 300); // Debounce time: 300ms
    }

    performSearch() {
        this.state.currentPage = 1;
        this.loadFundData();
    }

    toggleSelection(certId) {
        if (this.state.selectedIds.has(certId)) {
            this.state.selectedIds.delete(certId);
        } else {
            this.state.selectedIds.add(certId);
        }
    }

    toggleSelectAll(ev) {
        const isChecked = ev.target.checked;
        this.state.selectedIds.clear();
        if (isChecked) {
            this.state.certificates.forEach(cert => this.state.selectedIds.add(cert.id));
        }
    }

    handleBulkAction(action) {
        const selectedCount = this.state.selectedIds.size;
        if (selectedCount === 0) {
            alert("Vui lòng chọn ít nhất một mục.");
            return;
        }
        
        const selectedIds = Array.from(this.state.selectedIds);
        // In a real app, you would show a custom modal instead of confirm()
        if (confirm(`Bạn có chắc muốn ${action} ${selectedCount} mục đã chọn?`)) {
            console.log(`Performing action '${action}' on IDs:`, selectedIds);
            // TODO: Call backend API to perform the bulk action
            // After success, reload data:
            // this.loadFundData();
        }
    }

    confirmDelete(certId, certName) {
        this.state.deleteTarget.id = certId;
        this.state.deleteTarget.name = certName;
        
        // Show Bootstrap modal
        const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        modal.show();
    }

    async handleDelete() {
        if (!this.state.deleteTarget.id) return;

        // Lấy modal instance trước khi gọi async
        const modalElement = document.getElementById('deleteConfirmModal');
        const modal = bootstrap.Modal.getInstance(modalElement);

        try {
            const response = await fetch('/fund_certificate/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    cert_id: this.state.deleteTarget.id
                })
            });

            // Luôn ẩn modal sau khi có phản hồi
            if (modal) {
                modal.hide();
            }

            // Cố gắng phân tích nội dung JSON từ phản hồi
            const result = await response.json().catch(() => null);

            // Kiểm tra nếu request thành công (status 2xx) và nội dung trả về báo thành công
            if (response.ok && result && result.success) {
                this.state.toastMessage = result.message || `Đã xóa thành công "${this.state.deleteTarget.name}"`;
                this.showToast();
                await this.loadFundData();
            } else {
                // Xử lý các trường hợp lỗi
                const errorMessage = result ? result.error : `Lỗi từ máy chủ (HTTP ${response.status})`;
                console.error('Delete failed:', errorMessage);
                alert(`Lỗi khi xóa: ${errorMessage || 'Không thể kết nối hoặc phản hồi không hợp lệ.'}`);
            }

        } catch (error) {
            console.error('Error during delete operation:', error);
            // Đảm bảo modal được đóng nếu có lỗi mạng xảy ra
            if (modal && modal._isShown) {
                modal.hide();
            }
            alert(`Có lỗi ngoại lệ xảy ra khi xóa: ${error.message}`);
        } finally {
            // Luôn reset mục tiêu xóa
            this.state.deleteTarget.id = null;
            this.state.deleteTarget.name = '';
        }
    }

    showToast() {
        const toastElement = document.getElementById('deleteToast');
        if (toastElement) {
            const toast = new bootstrap.Toast(toastElement);
            toast.show();
        }
    }
    
    handleEdit(certId) { 
        window.location.href = `/fund_certificate/edit/${certId}`;
    }
    
    createNewFund() { 
        window.location.href = '/fund_certificate/new';
    }
    
    formatCurrency(value) {
        if (typeof value !== 'number') return value;
        return new Intl.NumberFormat('vi-VN', { style: 'decimal' }).format(value);
    }
}

if (!window.FundCertificateWidget) {
    window.FundCertificateWidget = FundCertificateWidget;
    console.log("Improved FundCertificateWidget component loaded successfully.");
} else {
    console.log("FundCertificateWidget already exists, skipping registration.");
}
