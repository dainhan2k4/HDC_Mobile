/** @odoo-module */

import { Component, xml, useState, onMounted } from "@odoo/owl";

export class NavMonthlyWidget extends Component {
  static template = xml`
    <div class="nav-management-fund-overview-container">
      <div class="container-fluid">
        <!-- Stats Cards -->
        <div class="nav-management-stats-grid">
          <div class="nav-management-stat-card">
            <div class="nav-management-stat-icon" style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); color: #1e40af;">
              <i class="fas fa-calendar-alt"></i>
            </div>
            <div class="nav-management-stat-number"><t t-esc="state.totalMonthlyNav"/></div>
            <div class="nav-management-stat-label">Tổng NAV tháng</div>
            <div class="nav-management-stat-description">Số lượng NAV tháng</div>
          </div>
          <div class="nav-management-stat-card">
            <div class="nav-management-stat-icon" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); color: #065f46;">
              <i class="fas fa-arrow-up"></i>
            </div>
            <div class="nav-management-stat-number"><t t-esc="state.positiveChanges"/></div>
            <div class="nav-management-stat-label">Tăng trưởng</div>
            <div class="nav-management-stat-description">Số tháng tăng trưởng</div>
          </div>
          <div class="nav-management-stat-card">
            <div class="nav-management-stat-icon" style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); color: #991b1b;">
              <i class="fas fa-arrow-down"></i>
            </div>
            <div class="nav-management-stat-number"><t t-esc="state.negativeChanges"/></div>
            <div class="nav-management-stat-label">Giảm giá</div>
            <div class="nav-management-stat-description">Số tháng giảm giá</div>
          </div>
          <div class="nav-management-stat-card">
            <div class="nav-management-stat-icon" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); color: #92400e;">
              <i class="fas fa-percentage"></i>
            </div>
            <div class="nav-management-stat-number"><t t-esc="this.formatPercentage(state.averageChangePercent)"/></div>
            <div class="nav-management-stat-label">Tăng trưởng TB</div>
            <div class="nav-management-stat-description">Tăng trưởng trung bình</div>
          </div>
        </div>
                                    
        <!-- Main Content -->
        <div class="main-content">
          <!-- Content Header -->
          <div class="nav-management-content-header">
            <div class="row align-items-center">
              <div class="col-lg-6">
                <h2 class="nav-management-content-title">
                  <i class="fas fa-table me-2"></i>Danh sách NAV tháng
                </h2>
                <p class="nav-management-content-subtitle">
                  Hiển thị <strong><t t-esc="state.filteredMonthlyNav ? state.filteredMonthlyNav.length : 0"/></strong> trong tổng số <strong><t t-esc="state.totalMonthlyNav"/></strong> NAV tháng
                </p>
              </div>
              <div class="col-lg-6">
                <div class="d-flex gap-2 justify-content-end flex-wrap">
                  <button class="nav-management-btn-modern nav-management-btn-secondary-modern me-2" style="--btn-border:#f97316;--btn-color:#f97316" t-on-click="exportData" t-on-mousedown="(ev) => ev.target.classList.add('active')" t-on-mouseup="(ev) => ev.target.classList.remove('active')" t-on-mouseleave="(ev) => ev.target.classList.remove('active')">
                    <i class="fas fa-download me-2"></i>Xuất CSV
                  </button>
                  <button class="nav-management-btn-modern nav-management-btn-primary-modern me-2" style="--btn-bg:#f97316;--btn-hover:#fb923c" t-on-click="openAddModal" t-on-mousedown="(ev) => ev.target.classList.add('active')" t-on-mouseup="(ev) => ev.target.classList.remove('active')" t-on-mouseleave="(ev) => ev.target.classList.remove('active')">
                    <i class="fas fa-plus me-2"></i>Thêm NAV tháng mới
                  </button>
                  <button class="nav-management-btn-modern nav-management-btn-primary-modern me-2" style="--btn-bg:#f97316;--btn-hover:#fb923c" t-on-click="calculateNavValue" t-on-mousedown="(ev) => ev.target.classList.add('active')" t-on-mouseup="(ev) => ev.target.classList.remove('active')" t-on-mouseleave="(ev) => ev.target.classList.remove('active')">
                    <i class="fas fa-calculator me-2"></i>Tính giá trị NAV
                  </button>
                  <button class="nav-management-btn-modern nav-management-btn-primary-modern me-2" style="--btn-bg:#f97316;--btn-hover:#fb923c" t-on-click="refreshData" t-on-mousedown="(ev) => ev.target.classList.add('active')" t-on-mouseup="(ev) => ev.target.classList.remove('active')" t-on-mouseleave="(ev) => ev.target.classList.remove('active')">
                    <i class="fas fa-sync-alt me-2"></i>Làm mới
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Filters Section -->
          <div class="filters-section mb-4">
            <div class="card">
              <div class="card-body">
                <div class="row">
                  <div class="col-md-4">
                    <label for="fundFilter" class="nav-management-form-label">Quỹ:</label>
                    <select id="fundFilter" class="nav-management-form-select" t-on-change="onFundFilterChange">
                      <option value="">Tất cả quỹ</option>
                                  <t t-foreach="state.funds" t-as="fund" t-key="fund.id">
                                    <option t-att-value="fund.id" t-att-selected="state.selectedFundId === fund.id">
                                      <t t-esc="fund.name"/> (<t t-esc="fund.ticker"/>)
                                    </option>
                                  </t>
                    </select>
                  </div>
                  <div class="col-md-4">
                    <label for="fromDateFilter" class="nav-management-form-label">Từ ngày:</label>
                    <input type="date" id="fromDateFilter" class="nav-management-form-control" t-on-change="onDateFilterChange"/>
                  </div>
                  <div class="col-md-4">
                    <label for="toDateFilter" class="nav-management-form-label">Đến ngày:</label>
                    <input type="date" id="toDateFilter" class="nav-management-form-control" t-on-change="onDateFilterChange"/>
                  </div>
                </div>
              </div>
            </div>
          </div>


          <!-- Table Container -->
          <div class="nav-management-table-container">
            <table class="nav-management-modern-table">
              <thead>
                <tr>
                  <th scope="col">
                    <i class="fas fa-hashtag me-1"></i>No
                  </th>
                  <th scope="col">
                    <i class="fas fa-arrow-up me-1"></i>NAV đầu kỳ
                  </th>
                  <th scope="col">
                    <i class="fas fa-arrow-down me-1"></i>NAV cuối kỳ
                  </th>
                  <th scope="col">
                    <i class="fas fa-calendar me-1"></i>Thời gian
                  </th>
                  <th scope="col">
                    <i class="fas fa-upload me-1"></i>Ngày upload
                  </th>
                  <th scope="col">
                    <i class="fas fa-cogs me-1"></i>Thao tác
                  </th>
                </tr>
                <tr class="nav-management-filter-row">
                  <th>
                    <!-- Không có filter cho cột No -->
                  </th>
                  <th>
                    <input type="text" class="nav-management-filter-input" placeholder="Tìm NAV đầu kỳ..." t-on-input="(ev) => this.filterTable('nav_beginning', ev.target.value)" />
                  </th>
                  <th>
                    <input type="text" class="nav-management-filter-input" placeholder="Tìm NAV cuối kỳ..." t-on-input="(ev) => this.filterTable('nav_ending', ev.target.value)" />
                  </th>
                  <th>
                    <input type="text" class="nav-management-filter-input" placeholder="Tìm thời gian..." t-on-input="(ev) => this.filterTable('period', ev.target.value)" />
                  </th>
                  <th>
                    <input type="date" class="nav-management-filter-input" t-on-change="(ev) => this.filterByDate(ev.target.value)" />
                  </th>
                  <th>
                    <!-- Không có filter cho cột thao tác -->
                  </th>
                </tr>
              </thead>
              <tbody>
                <t t-if="state.loading">
                  <tr>
                    <td colspan="6" class="text-center py-4">
                      <div class="nav-management-loading-state">
                        <i class="fas fa-spinner fa-spin nav-management-loading-icon"></i>
                        <h3 class="nav-management-loading-title">Đang tải dữ liệu...</h3>
                        <p class="nav-management-loading-description">Vui lòng chờ trong giây lát.</p>
                      </div>
                    </td>
                  </tr>
                </t>
                <t t-elif="state.error">
                  <tr>
                    <td colspan="6" class="text-center py-4">
                      <div class="nav-management-error-state">
                        <i class="fas fa-exclamation-triangle nav-management-error-icon"></i>
                        <h3 class="nav-management-error-title">Lỗi tải dữ liệu</h3>
                        <p class="nav-management-error-description"><t t-esc="state.error"/></p>
                        <button class="nav-management-btn nav-management-btn-primary mt-3" style="background-color:#f97316;border-color:#f97316" t-on-click="() => this.loadData()">
                          <i class="fas fa-refresh me-2"></i>Thử lại
                        </button>
                      </div>
                    </td>
                  </tr>
                </t>
                <t t-elif="state.filteredMonthlyNav and state.filteredMonthlyNav.length > 0">
                  <t t-foreach="state.filteredMonthlyNav.slice(state.startIndex, state.endIndex)" t-as="nav" t-key="nav.id">
                    <tr>
                      <td><t t-esc="state.startIndex + nav_index + 1"/></td>
                      <td><t t-esc="this.formatCurrency(nav.nav_beginning)"/></td>
                      <td><t t-esc="this.formatCurrency(nav.nav_ending)"/></td>
                      <td><t t-esc="this.getDisplayValue(nav.period)"/></td>
                      <td><t t-esc="this.formatDate(nav.upload_date)"/></td>
                      <td>
                        <div class="d-flex gap-2 align-items-center">
                          <button class="btn btn-sm btn-outline-danger" t-on-click="() => this.deleteNav(nav)" title="Xóa">
                            <i class="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </t>
                </t>
                <t t-else="">
                  <tr>
                    <td colspan="6" class="text-center py-4">
                      <div class="nav-management-empty-state">
                        <i class="fas fa-calendar-alt nav-management-empty-state-icon"></i>
                        <h3 class="nav-management-empty-state-title">Không có dữ liệu</h3>
                        <p class="nav-management-empty-state-description">Vui lòng chọn sản phẩm để xem dữ liệu NAV tháng.</p>
                      </div>
                    </td>
                  </tr>
                </t>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="nav-management-pagination-modern">
            <div class="nav-management-pagination-info">
              Hiển thị <strong><t t-esc="state.startIndex + 1"/></strong> đến <strong><t t-esc="Math.min(state.endIndex, state.filteredMonthlyNav.length)"/></strong> trong tổng số <strong><t t-esc="state.filteredMonthlyNav.length"/></strong> kết quả
            </div>
            <div class="nav-management-pagination-controls">
              <button class="nav-management-page-btn" t-att-disabled="state.currentPage === 1" t-on-click="() => this.changePage(state.currentPage - 1)">
                <i class="fas fa-chevron-left"></i>
              </button>
              <t t-foreach="state.pageNumbers" t-as="page" t-key="page">
                <button t-att-class="'nav-management-page-btn ' + (page === state.currentPage ? 'active' : '')" t-on-click="() => this.changePage(page)">
                  <t t-esc="page"/>
                </button>
              </t>
              <button class="nav-management-page-btn" t-att-disabled="state.currentPage === state.totalPages" t-on-click="() => this.changePage(state.currentPage + 1)">
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit NAV Monthly Modal -->
    <div class="nav-management-modal fade" id="navMonthlyModal" tabindex="-1" aria-labelledby="navMonthlyModalLabel" aria-hidden="true" style="display: none;">
      <div class="nav-management-modal-dialog nav-management-modal-dialog-centered">
        <div class="nav-management-modal-content">
          <div class="nav-management-modal-header">
            <h5 class="nav-management-modal-title" id="navMonthlyModalLabel">
              <i class="fas fa-plus me-2"></i>Thêm NAV tháng mới
            </h5>
            <button type="button" class="nav-management-btn-close" t-on-click="closeModal" aria-label="Close"></button>
          </div>
          <form t-on-submit.prevent="saveNavMonthly">
            <div class="nav-management-modal-body">
              <div class="mb-3">
                <label for="modalFund" class="nav-management-form-label">Quỹ <span class="nav-management-text-danger">*</span></label>
                <select id="modalFund" class="nav-management-form-select" required="required" t-model="state.currentNav.fund_id">
                  <option value="">Chọn quỹ</option>
                              <t t-foreach="state.funds" t-as="fund" t-key="fund.id">
                                <option t-att-value="fund.id"><t t-esc="fund.name"/> (<t t-esc="fund.ticker"/>)</option>
                              </t>
                </select>
              </div>
              <div class="mb-3">
                <label for="modalPeriod" class="nav-management-form-label">Thời gian (MM/YYYY) <span class="nav-management-text-danger">*</span></label>
                <input type="text" class="nav-management-form-control" id="modalPeriod" t-model="state.currentNav.period" pattern="^(0[1-9]|1[0-2])/\d{4}$" title="Định dạng: MM/YYYY (ví dụ: 12/2021)" required="required" placeholder="12/2024"/>
              </div>
              <div class="mb-3">
                <label for="modalNavBeginning" class="nav-management-form-label">NAV đầu kỳ <span class="nav-management-text-danger">*</span></label>
                <input type="number" step="0.01" class="nav-management-form-control" id="modalNavBeginning" t-model="state.currentNav.nav_beginning" required="required" placeholder="Nhập NAV đầu kỳ"/>
              </div>
              <div class="mb-3">
                <label for="modalNavEnding" class="nav-management-form-label">NAV cuối kỳ <span class="nav-management-text-danger">*</span></label>
                <input type="number" step="0.01" class="nav-management-form-control" id="modalNavEnding" t-model="state.currentNav.nav_ending" required="required" placeholder="Nhập NAV cuối kỳ"/>
              </div>
              <div class="mb-3">
                <label for="modalNotes" class="nav-management-form-label">Ghi chú</label>
                <textarea class="nav-management-form-control" id="modalNotes" t-model="state.currentNav.notes" rows="3" placeholder="Nhập ghi chú (tùy chọn)"></textarea>
              </div>
            </div>
            <div class="nav-management-modal-footer">
              <button type="button" class="nav-management-btn nav-management-btn-secondary" t-on-click="closeModal">Hủy</button>
              <button type="submit" class="nav-management-btn nav-management-btn-primary" style="background-color:#f97316;border-color:#f97316">
                <t t-if="state.isSaving">
                  <span class="nav-management-spinner-border nav-management-spinner-border-sm" role="status" aria-hidden="true"></span>
                  Đang lưu...
                </t>
                <t t-else="">
                  <i class="fas fa-save me-1"></i>Lưu
                </t>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  setup() {
    this.state = useState({
      monthlyNav: [],
      filteredMonthlyNav: [],
      funds: this.props.funds || [],
      searchTerm: '',
      currentPage: 1,
      pageSize: 10,
      startIndex: 0,
      endIndex: 10,
      totalPages: 1,
      pageNumbers: [],
      totalMonthlyNav: 0,
      positiveChanges: 0,
      negativeChanges: 0,
      averageChangePercent: 0,
      loading: false,
      error: null,
      selectedFundId: this.props.selectedFundId || null,
      isEditing: false,
      currentNav: {
        id: null,
        fund_id: null,
        period: '',
        nav_beginning: 0,
        nav_ending: 0,
        notes: ''
      },
      isSaving: false,
    });

    // Gọi loadData sau khi component được mount
    onMounted(() => {
      this.loadData();
    });
  }

  onFundFilterChange(event) {
    const fundId = event.target.value;
    this.state.selectedFundId = fundId ? parseInt(fundId) : null;
    this.applyFilters();
  }

  onDateFilterChange() {
    this.applyFilters();
  }

  applyFilters() {
    this.state.currentPage = 1;
    this.loadData();
  }

  openAddModal() {
    this.state.isEditing = false;
    this.state.currentNav = {
      id: null,
      fund_id: null,
      period: '',
      nav_beginning: 0,
      nav_ending: 0,
      notes: ''
    };
    
    // Mở modal bằng vanilla JavaScript
    const modal = document.getElementById('navMonthlyModal');
    if (modal) {
      modal.style.display = 'block';
      modal.classList.add('show');
      document.body.classList.add('modal-open');
      
      // Thêm backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      backdrop.id = 'modalBackdrop';
      backdrop.onclick = () => this.closeModal();
      document.body.appendChild(backdrop);
      
      // Đóng modal khi click vào modal dialog
      const modalDialog = modal.querySelector('.modal-dialog');
      if (modalDialog) {
        modalDialog.onclick = (e) => e.stopPropagation();
      }
      
      // Đóng modal khi click vào modal content
      const modalContent = modal.querySelector('.modal-content');
      if (modalContent) {
        modalContent.onclick = (e) => e.stopPropagation();
      }
      
      // Đóng modal khi nhấn phím ESC
      const handleEscKey = (e) => {
        if (e.key === 'Escape') {
          this.closeModal();
          document.removeEventListener('keydown', handleEscKey);
        }
      };
      document.addEventListener('keydown', handleEscKey);
    }
  }

  async saveNavMonthly(event) {
    event.preventDefault();
    
    try {
      this.state.isSaving = true;
      
      const navData = {
        fund_id: this.state.currentNav.fund_id,
        period: this.state.currentNav.period,
        nav_beginning: parseFloat(this.state.currentNav.nav_beginning),
        nav_ending: parseFloat(this.state.currentNav.nav_ending),
        notes: this.state.currentNav.notes || ''
      };

      // Validate period format (MM/YYYY)
      const periodRegex = /^(0[1-9]|1[0-2])\/\d{4}$/;
      if (!periodRegex.test(navData.period)) {
        alert('Định dạng thời gian không hợp lệ. Vui lòng sử dụng MM/YYYY (ví dụ: 12/2024)');
        return;
      }

      const response = await fetch('/nav_management/api/nav_monthly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: navData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.result && result.result.success) {
        // Đóng modal
        this.closeModal();
        
        // Reload data
        await this.loadData();
        
        alert('Thêm NAV tháng thành công!');
      } else {
        throw new Error(result.error ? result.error.message : 'Có lỗi xảy ra khi lưu dữ liệu');
      }
    } catch (error) {
      console.error('Error saving NAV monthly:', error);
      alert('Có lỗi xảy ra: ' + error.message);
    } finally {
      this.state.isSaving = false;
    }
  }

  closeModal() {
    const modal = document.getElementById('navMonthlyModal');
    const backdrop = document.getElementById('modalBackdrop');
    
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
      document.body.classList.remove('modal-open');
    }
    
    if (backdrop) {
      backdrop.remove();
    }
  }

  async deleteNav(nav) {
    if (!confirm(`Bạn có chắc chắn muốn xóa NAV tháng ${nav.period}?`)) {
      return;
    }

    try {
      const response = await fetch(`/nav_management/api/nav_monthly/${nav.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result && result.success) {
        alert('Xóa NAV tháng thành công!');
        await this.loadData(); // Reload data
      } else {
        throw new Error((result && result.message) || 'Có lỗi xảy ra khi xóa dữ liệu');
      }
    } catch (error) {
      console.error('Error deleting NAV monthly:', error);
      alert('Có lỗi xảy ra: ' + error.message);
    }
  }


  async loadData() {
    try {
      // Đảm bảo state đã được khởi tạo
      if (!this.state) {
        console.error('State chưa được khởi tạo. Component chưa được setup.');
        return;
      }
      
      this.state.loading = true;
      this.state.error = null;
      
      // Load danh sách quỹ từ props
      if (this.props.funds && this.props.funds.length > 0) {
        this.state.funds = this.props.funds;
      }
      
      // Lấy fund_id từ filter hoặc URL parameter
      const urlParams = new URLSearchParams(window.location.search);
      const fundId = this.state.selectedFundId || urlParams.get('fund_id');
      
      if (!fundId) {
        this.state.monthlyNav = [];
        this.state.filteredMonthlyNav = [];
        this.calculateStats();
        this.updatePagination();
        this.state.loading = false;
        if (typeof window.hideSpinner === 'function') {
          window.hideSpinner();
        }
        return;
      }

      const response = await fetch('/nav_management/api/nav_monthly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            fund_id: fundId,
            from_date: document.getElementById('fromDateFilter')?.value,
            to_date: document.getElementById('toDateFilter')?.value
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.result && result.result.nav_monthly) {
        this.state.monthlyNav = result.result.nav_monthly;
        this.state.filteredMonthlyNav = result.result.nav_monthly;
        this.calculateStats();
        this.updatePagination();
      } else {
        this.state.monthlyNav = [];
        this.state.filteredMonthlyNav = [];
        this.calculateStats();
        this.updatePagination();
      }
      
      this.state.loading = false;
      if (typeof window.hideSpinner === 'function') {
        window.hideSpinner();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.state.error = error.message;
      this.state.loading = false;
      if (typeof window.showError === 'function') {
        window.showError(error.message);
      }
    }
  }

  async refreshData() {
    await this.loadData();
  }

  formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(value) {
    if (!value) return '0₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  }

  formatPercentage(value) {
    if (value === null || value === undefined) return '-';
    return value.toFixed(2) + '%';
  }

  getDisplayValue(value) {
    return value || '-';
  }




  async deleteNav(nav) {
    if (!confirm(`Bạn có chắc chắn muốn xóa NAV tháng "${nav.period}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/nav_management/api/nav_monthly/${nav.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {}
        })
      });

      const result = await response.json();
      
      if (result.result && result.result.success) {
        alert('Xóa NAV tháng thành công!');
        this.loadData(); // Reload data
      } else {
        alert('Lỗi: ' + (result.result?.message || 'Không thể xóa NAV tháng'));
      }
    } catch (error) {
      console.error('Error deleting nav:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại!');
    }
  }



  exportData() {
    if (!this.state.filteredMonthlyNav || this.state.filteredMonthlyNav.length === 0) {
      alert('Không có dữ liệu để xuất');
      return;
    }

    const headers = ['STT', 'NAV đầu kỳ', 'NAV cuối kỳ', 'Thời gian', 'Ngày upload'];
    const csvContent = [
      headers.join(','),
      ...this.state.filteredMonthlyNav.map((nav, index) => [
        index + 1,
        this.formatCurrency(nav.nav_beginning),
        this.formatCurrency(nav.nav_ending),
        nav.period,
        this.formatDate(nav.upload_date)
      ].join(','))
    ].join('\n');

    this.downloadCSV(csvContent, 'nav_monthly.csv');
  }

  changePage(page) {
    if (page >= 1 && page <= this.state.totalPages) {
      this.state.currentPage = page;
      this.updatePagination();
    }
  }

  getDisplayValue(value) {
    return value || '-';
  }

  downloadCSV(content, fileName) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open('data:text/csv;charset=utf-8,' + encodeURIComponent(content));
    }
  }

  calculateStats() {
    const navs = this.state.filteredMonthlyNav || [];
    this.state.totalMonthlyNav = navs.length;
    
    let positiveChanges = 0;
    let negativeChanges = 0;
    let totalChangePercent = 0;
    
    navs.forEach(nav => {
      if (nav.change_percent > 0) {
        positiveChanges++;
      } else if (nav.change_percent < 0) {
        negativeChanges++;
      }
      totalChangePercent += nav.change_percent || 0;
    });
    
    this.state.positiveChanges = positiveChanges;
    this.state.negativeChanges = negativeChanges;
    this.state.averageChangePercent = navs.length > 0 ? totalChangePercent / navs.length : 0;
  }

  updatePagination() {
    const totalItems = this.state.filteredMonthlyNav.length;
    this.state.totalPages = Math.ceil(totalItems / this.state.pageSize);
    this.state.startIndex = (this.state.currentPage - 1) * this.state.pageSize;
    this.state.endIndex = Math.min(this.state.startIndex + this.state.pageSize, totalItems);
    
    // Generate page numbers
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.state.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.state.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    this.state.pageNumbers = pageNumbers;
  }

  async calculateNavValue() {
    try {
      console.log('Calculating NAV value...');
      
      // Kiểm tra xem có quỹ được chọn không
      if (!this.state.selectedFundId) {
        alert('Vui lòng chọn quỹ để tính giá trị NAV!');
        return;
      }

      // Hiển thị loading
      this.state.isCalculating = true;
      
      // Gọi API để tính toán NAV
      const response = await fetch('/nav_management/api/calculate_nav_monthly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          fund_id: this.state.selectedFundId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Tính toán NAV tháng thành công!\n\nKết quả:\n- Tổng NAV tháng: ${result.data.total_monthly_nav}\n- Tăng trưởng: ${result.data.positive_changes} tháng\n- Giảm giá: ${result.data.negative_changes} tháng\n- Tăng trưởng trung bình: ${this.formatPercentage(result.data.average_change_percent)}`);
        
        // Làm mới dữ liệu sau khi tính toán
        this.refreshData();
      } else {
        alert('Lỗi khi tính toán NAV: ' + result.message);
      }
    } catch (error) {
      console.error('Error calculating NAV:', error);
      alert('Có lỗi xảy ra khi tính toán NAV: ' + error.message);
    } finally {
      this.state.isCalculating = false;
    }
  }
}
