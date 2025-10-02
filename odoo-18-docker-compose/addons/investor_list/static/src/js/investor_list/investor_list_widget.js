/** @odoo-module */

import { Component, xml, useState, onMounted } from "@odoo/owl";

export class InvestorListWidget extends Component {
  static template = xml`
    <div class="investor-list-container">
      <div class="container-fluid">
        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); color: #1e40af;">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-number"><t t-esc="state.totalInvestors"/></div>
            <div class="stat-label">Danh sách NĐT</div>
            <div class="stat-description">Tổng số nhà đầu tư</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); color: #991b1b;">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="stat-number"><t t-esc="state.incompleteCount || 0"/></div>
            <div class="stat-label">NĐT chưa cập nhật</div>
            <div class="stat-description">Chưa hoàn tất hồ sơ cá nhân</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); color: #92400e;">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stat-number"><t t-esc="state.pendingCount || 0"/></div>
            <div class="stat-label">Chờ KYC</div>
            <div class="stat-description">Đang chờ xác minh</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); color: #065f46;">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-number"><t t-esc="state.kycCount || 0"/></div>
            <div class="stat-label">KYC</div>
            <div class="stat-description">Đã xác minh thành công</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); color: #3730a3;">
              <i class="fas fa-shield-alt"></i>
            </div>
            <div class="stat-number"><t t-esc="state.vsdCount || 0"/></div>
            <div class="stat-label">VSD</div>
            <div class="stat-description">NĐT đã lên VSD</div>
          </div>
        </div>
                                    
        <!-- Tab Navigation -->
        <div class="tab-nav">
          <nav class="nav">
            <a class="nav-link" t-att-class="state.activeTab === 'all' ? 'active' : ''" href="#" t-on-click="() => this.setActiveTab('all')">
              <i class="fas fa-list me-2"></i>Danh sách NĐT
            </a>
            <a class="nav-link" t-att-class="state.activeTab === 'pending' ? 'active' : ''" href="#" t-on-click="() => this.setActiveTab('pending')">
              <i class="fas fa-exclamation-triangle me-2"></i>NĐT chưa cập nhật
            </a>
          </nav>
                                    </div>
                                    
        <!-- Main Content -->
        <div class="main-content">
          <!-- Content Header -->
          <div class="content-header">
            <div class="row align-items-center">
              <div class="col-lg-6">
                <h2 class="content-title">
                  <i class="fas fa-table me-2"></i>Danh sách chi tiết
                </h2>
                <p class="content-subtitle">
                  Hiển thị <strong><t t-esc="state.filteredInvestors ? state.filteredInvestors.length : 0"/></strong> trong tổng số <strong><t t-esc="state.totalInvestors"/></strong> nhà đầu tư
                </p>
                                </div>
              <div class="col-lg-6">
                <div class="d-flex gap-2 justify-content-end flex-wrap">
                  <button class="btn-modern btn-secondary-modern me-2" style="--btn-border:#f97316;--btn-color:#f97316" t-on-click="exportData" t-on-mousedown="(ev) => ev.target.classList.add('active')" t-on-mouseup="(ev) => ev.target.classList.remove('active')" t-on-mouseleave="(ev) => ev.target.classList.remove('active')">
                    <i class="fas fa-download me-2"></i>Xuất CSV
                  </button>
                  <button class="btn-modern btn-primary-modern me-2" style="--btn-bg:#f97316;--btn-hover:#fb923c" t-on-click="refreshData" t-on-mousedown="(ev) => ev.target.classList.add('active')" t-on-mouseup="(ev) => ev.target.classList.remove('active')" t-on-mouseleave="(ev) => ev.target.classList.remove('active')">
                    <i class="fas fa-sync-alt me-2"></i>Làm mới
                  </button>
                  <div class="btn-group me-2" role="group" t-if="state.activeTab !== 'pending'">
                    <button type="button" class="btn-modern btn-secondary-modern" style="--btn-border:#f97316;--btn-color:#f97316" t-att-class="state.statusFilter === 'pending' ? 'btn-primary-modern active' : ''" t-on-click="() => this.setStatusFilter('pending')">
                      <i class="fas fa-clock me-1"></i>Chờ KYC
                    </button>
                    <button type="button" class="btn-modern btn-secondary-modern" style="--btn-border:#f97316;--btn-color:#f97316" t-att-class="state.statusFilter === 'kyc' ? 'btn-primary-modern active' : ''" t-on-click="() => this.setStatusFilter('kyc')">
                      <i class="fas fa-check-circle me-1"></i>KYC
                    </button>
                    <button type="button" class="btn-modern btn-secondary-modern" style="--btn-border:#f97316;--btn-color:#f97316" t-att-class="state.statusFilter === 'vsd' ? 'btn-primary-modern active' : ''" t-on-click="() => this.setStatusFilter('vsd')">
                      <i class="fas fa-shield-alt me-1"></i>VSD
                    </button>
                    </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

          <!-- Date Filter Section -->
          <div class="date-filter-section mb-3">
            <div class="d-flex align-items-center gap-2">
              <label class="form-label fw-semibold mb-0">
                <i class="fas fa-calendar me-2"></i>Ngày mở TK:
              </label>
              <input type="date" class="form-control form-control-sm" style="width: auto;" t-on-change="(ev) => this.filterByDateRange('from', ev.target.value)" />
            </div>
          </div>

          <!-- Table Container -->
          <div class="table-container">
            <table class="modern-table">
              <thead>
                <tr>
                  <th scope="col">
                    <i class="fas fa-calendar me-1"></i>Ngày mở TK
                  </th>
                  <th scope="col">
                    <i class="fas fa-id-card me-1"></i>Số tài khoản
                  </th>
                  <th scope="col">
                    <i class="fas fa-user me-1"></i>Họ tên
                  </th>
                  <th scope="col">
                    <i class="fas fa-id-badge me-1"></i>ĐKSH
                  </th>
                  <th scope="col">
                    <i class="fas fa-phone me-1"></i>Số điện thoại
                  </th>
                  <th scope="col">
                    <i class="fas fa-envelope me-1"></i>Email
                  </th>
                  <th scope="col">
                    <i class="fas fa-map-marker-alt me-1"></i>Tỉnh/Thành phố
                  </th>
                  <th scope="col">
                    <i class="fas fa-tag me-1"></i>Nguồn
                  </th>
                  <th scope="col">
                    <i class="fas fa-user-tie me-1"></i>BDA
                  </th>
                  <th scope="col">
                    <i class="fas fa-cogs me-1"></i>Thao tác
                  </th>
                </tr>
                <tr class="filter-row">
                  <th>
                    <!-- Bỏ filter ngày ở đây vì đã chuyển lên trên -->
                  </th>
                  <th>
                    <input type="text" class="filter-input" placeholder="Tìm số TK..." t-on-input="(ev) => this.filterTable('account_number', ev.target.value)" />
                  </th>
                  <th>
                    <input type="text" class="filter-input" placeholder="Tìm họ tên..." t-on-input="(ev) => this.filterTable('partner_name', ev.target.value)" />
                  </th>
                  <th>
                    <input type="text" class="filter-input" placeholder="Tìm ĐKSH..." t-on-input="(ev) => this.filterTable('id_number', ev.target.value)" />
                  </th>
                  <th>
                    <input type="text" class="filter-input" placeholder="Tìm SĐT..." t-on-input="(ev) => this.filterTable('phone', ev.target.value)" />
                  </th>
                  <th>
                    <input type="text" class="filter-input" placeholder="Tìm email..." t-on-input="(ev) => this.filterTable('email', ev.target.value)" />
                  </th>
                  <th>
                    <input type="text" class="filter-input" placeholder="Tìm tỉnh/thành..." t-on-input="(ev) => this.filterTable('province_city', ev.target.value)" />
                  </th>
                  <th>
                    <select class="filter-input" t-on-change="(ev) => this.filterTable('source', ev.target.value)">
                      <option value="">Tất cả nguồn</option>
                      <option value="tpb2">TPB2</option>
                      <option value="fpla1">FPLA1</option>
                      <option value="scb">SCB</option>
                      <option value="other">Khác</option>
                    </select>
                  </th>
                  <th>
                    <input type="text" class="filter-input" placeholder="Tìm BDA..." t-on-input="(ev) => this.filterTable('bda_user', ev.target.value)" />
                  </th>
                  <th>
                    <!-- Không có filter cho cột thao tác -->
                  </th>
                </tr>
              </thead>
              <tbody>
                <t t-if="state.loading">
                  <tr>
                    <td colspan="10" class="text-center py-4">
                      <div class="loading-state">
                        <i class="fas fa-spinner fa-spin loading-icon"></i>
                        <h3 class="loading-title">Đang tải dữ liệu...</h3>
                        <p class="loading-description">Vui lòng chờ trong giây lát.</p>
                                                </div>
                    </td>
                  </tr>
                </t>
                <t t-elif="state.error">
                  <tr>
                    <td colspan="10" class="text-center py-4">
                      <div class="error-state">
                        <i class="fas fa-exclamation-triangle error-icon"></i>
                        <h3 class="error-title">Lỗi tải dữ liệu</h3>
                        <p class="error-description"><t t-esc="state.error"/></p>
                        <button class="btn btn-primary mt-3" style="background-color:#f97316;border-color:#f97316" t-on-click="() => this.loadData()">
                          <i class="fas fa-refresh me-2"></i>Thử lại
                        </button>
                                        </div>
                    </td>
                  </tr>
                </t>
                <t t-elif="state.filteredInvestors and state.filteredInvestors.length > 0">
                  <t t-foreach="state.filteredInvestors.slice(state.startIndex, state.endIndex)" t-as="investor" t-key="investor.id">
                    <tr>
                      <td><t t-esc="this.formatDate(investor.open_date)"/></td>
                      <td><t t-esc="this.getDisplayValue(investor.account_number)"/></td>
                      <td><t t-esc="this.getDisplayValue(investor.partner_name)"/></td>
                      <td><t t-esc="this.getDisplayValue(investor.id_number)"/></td>
                      <td><t t-esc="this.getDisplayValue(investor.phone)"/></td>
                      <td><t t-esc="this.getDisplayValue(investor.email)"/></td>
                      <td><t t-esc="this.getDisplayValue(investor.province_city)"/></td>
                      <td>
                        <span t-att-class="'status-badge ' + this.getSourceClass(investor.source)">
                          <t t-esc="this.getDisplayValue(investor.source)"/>
                        </span>
                      </td>
                      <td>
                        <span t-if="investor.bda_user" class="badge bg-success">
                          <i class="fas fa-circle me-1"></i><t t-esc="investor.bda_user"/>
                                                </span>
                        <span t-else="" class="text-muted">-</span>
                      </td>
                      <td>
                        <div class="d-flex gap-2 align-items-center">
                          <span t-att-class="'badge ' + this.getStatusClass(investor.status)">
                            <t t-esc="this.getStatusDisplayValue(investor.status)"/>
                          </span>
                          <button class="btn btn-sm btn-outline-primary" t-on-click="() => this.editInvestor(investor)" title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                                    </t>
                                </t>
                <t t-else="">
                  <tr>
                    <td colspan="10" class="text-center py-4">
                      <div class="empty-state">
                        <i class="fas fa-users empty-state-icon"></i>
                        <h3 class="empty-state-title">Không có dữ liệu</h3>
                        <p class="empty-state-description">Chưa có nhà đầu tư nào trong danh sách. Vui lòng đồng bộ tài khoản portal từ backend Odoo.</p>
                        <button class="btn btn-primary mt-3" style="background-color:#f97316;border-color:#f97316" t-on-click="() => this.syncPortalUsers()">
                          <i class="fas fa-sync me-2"></i>Đồng bộ Portal Users
                        </button>
                                    </div>
                    </td>
                  </tr>
                </t>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="pagination-modern">
            <div class="pagination-info">
              Hiển thị <strong><t t-esc="state.startIndex + 1"/></strong> đến <strong><t t-esc="Math.min(state.endIndex, state.filteredInvestors.length)"/></strong> trong tổng số <strong><t t-esc="state.filteredInvestors.length"/></strong> kết quả
                            </div>
            <div class="pagination-controls">
              <button class="page-btn" t-att-disabled="state.currentPage === 1" t-on-click="() => this.changePage(state.currentPage - 1)">
                <i class="fas fa-chevron-left"></i>
              </button>
              <t t-foreach="state.pageNumbers" t-as="page" t-key="page">
                <button t-att-class="'page-btn ' + (page === state.currentPage ? 'active' : '')" t-on-click="() => this.changePage(page)">
                  <t t-esc="page"/>
                </button>
              </t>
              <button class="page-btn" t-att-disabled="state.currentPage === state.totalPages" t-on-click="() => this.changePage(state.currentPage + 1)">
                <i class="fas fa-chevron-right"></i>
              </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Edit Modal -->
    <div t-if="state.showEditModal" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.5); z-index: 9999;">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-edit me-2"></i>Chỉnh sửa thông tin nhà đầu tư
            </h5>
            <button type="button" class="btn-close" t-on-click="closeEditModal"></button>
          </div>
          <div class="modal-body">
            <t t-if="state.editingInvestor">
              <!-- Thông báo về logic trạng thái -->
              <div class="alert alert-info mb-3">
                <h6 class="alert-heading"><i class="fas fa-info-circle me-2"></i>Logic cập nhật trạng thái tự động:</h6>
                <ul class="mb-0 small">
                  <li><strong>NĐT chưa cập nhật:</strong> Hồ sơ gốc chưa nhận + Trạng thái TK chờ duyệt</li>
                  <li><strong>Chờ KYC:</strong> Hồ sơ gốc đã nhận + Trạng thái TK chờ duyệt</li>
                  <li><strong>KYC:</strong> Hồ sơ gốc đã nhận + Trạng thái TK đã duyệt</li>
                  <li><strong>VSD:</strong> Có thể điều chỉnh tự do</li>
                </ul>
              </div>
              <form t-on-submit.prevent="saveInvestor">
                <div class="row g-3">
                  <!-- Thông tin cá nhân -->
                  <div class="col-md-6">
                    <label class="form-label">Họ tên <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" t-model="state.editingInvestor.partner_name" required="required"/>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Số điện thoại</label>
                    <input type="text" class="form-control" t-model="state.editingInvestor.phone"/>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" t-model="state.editingInvestor.email"/>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">ĐKSH</label>
                    <input type="text" class="form-control" t-model="state.editingInvestor.id_number"/>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Tỉnh/Thành phố</label>
                    <input type="text" class="form-control" t-model="state.editingInvestor.province_city"/>
                  </div>
                  
                  <!-- Thông tin bổ sung -->
                  <div class="col-md-6">
                    <label class="form-label">Nguồn <span class="text-danger">*</span></label>
                    <select class="form-select" t-model="state.editingInvestor.source" required="required">
                      <option value="tpb2">TPB2</option>
                      <option value="fpla1">FPLA1</option>
                      <option value="scb">SCB</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">BDA</label>
                    <select class="form-select" t-model="state.editingInvestor.bda_user">
                      <option value="">Chọn BDA</option>
                      <t t-foreach="state.bdaUsers" t-as="user" t-key="user.id">
                        <option t-att-value="user.id"><t t-esc="user.name" /></option>
                      </t>
                    </select>
                  </div>
                  
                  <!-- Trạng thái TK đầu tư -->
                  <div class="col-md-6">
                    <label class="form-label">Trạng thái TK đầu tư <span class="text-danger">*</span></label>
                    <select class="form-select" t-model="state.editingInvestor.trang_thai_tk_dau_tu" required="required" t-on-change="autoUpdateStatus">
                      <option value="da_duyet">Đã duyệt</option>
                      <option value="cho_duyet">Chờ duyệt</option>
                      <option value="tu_choi">Từ chối</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Hồ sơ gốc <span class="text-danger">*</span></label>
                    <select class="form-select" t-model="state.editingInvestor.ho_so_goc" required="required" t-on-change="autoUpdateStatus">
                      <option value="da_nhan">Đã nhận</option>
                      <option value="chua_nhan">Chưa nhận</option>
                    </select>
                  </div>
                  
                  <!-- Trạng thái -->
                  <div class="col-md-6">
                    <label class="form-label">Trạng thái <span class="text-danger">*</span></label>
                    <select class="form-select" t-model="state.editingInvestor.status" required="required">
                      <option value="pending">Chờ KYC</option>
                      <option value="kyc">KYC</option>
                      <option value="vsd">VSD</option>
                      <option value="incomplete">NĐT chưa cập nhật</option>
                    </select>
                  </div>
                </div>
                
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary me-2" t-on-click="closeEditModal">
                    <i class="fas fa-times me-2"></i>Hủy
                  </button>
                  <button type="submit" class="btn btn-primary" style="background-color:#f97316;border-color:#f97316">
                    <i class="fas fa-save me-2"></i>Lưu thay đổi
                  </button>
                </div>
              </form>
            </t>
          </div>
        </div>
      </div>
    </div>
  `;

  setup() {
    this.state = useState({
      investors: [],
      filteredInvestors: [],
      searchTerm: '',
      statusFilter: null,
      activeTab: 'all',
      currentPage: 1,
      pageSize: 10,
      startIndex: 0,
      endIndex: 10,
      totalPages: 1,
      pageNumbers: [],
      totalInvestors: 0,
      incompleteCount: 0,
      pendingCount: 0,
      kycCount: 0,
      vsdCount: 0,
      dateFrom: '',
      loading: false,
      error: null,
      // Modal states
      showEditModal: false,
      editingInvestor: null,
      bdaUsers: [],
      error: null
    });

    this.loadData();
  }

  async loadData() {
    try {
      this.state.loading = true;
      this.state.error = null;
      
      console.log('Loading investor data from controller...');
      
      // Kiểm tra xem có dữ liệu từ controller không
      if (window.allDashboardData && window.allDashboardData.investors) {
        console.log('Found data from controller:', window.allDashboardData.investors.length);
        this.state.investors = window.allDashboardData.investors;
        this.calculateStats();
        this.applyFilters();
        this.updatePagination();
        this.state.loading = false;
        return;
      }

      // Nếu không có dữ liệu từ controller, thử lấy từ API
      console.log('No data from controller, trying API...');
      await this.loadDataFromAPI();
      
    } catch (error) {
      console.error('Error loading data:', error);
      this.state.error = error.message;
      this.state.loading = false;
    }
  }

  async loadDataFromAPI() {
    try {
      console.log('Loading data from API...');
      
      const response = await fetch('/web/dataset/call_kw/investor.list/search_read', {
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
            model: 'investor.list',
            method: 'search_read',
            args: [],
            kwargs: {
              fields: ['open_date', 'account_number', 'partner_name', 'id_number', 'phone', 'email', 'province_city', 'source', 'bda_user', 'status'],
              limit: 1000
            }
          }
        })
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('API Response:', result);
      
      if (result.result && result.result.records && result.result.records.length > 0) {
        console.log('Found records from API:', result.result.records.length);
        this.state.investors = result.result.records;
        this.calculateStats();
        this.applyFilters();
        this.updatePagination();
        this.state.loading = false;
      } else {
        console.log('No records found in database, trying to sync portal users...');
        // Thử đồng bộ portal users nếu chưa có dữ liệu
        await this.syncPortalUsers();
        // Thử lấy lại dữ liệu sau khi đồng bộ
        await this.loadDataAfterSync();
      }
      
    } catch (error) {
      console.error('Error loading data from API:', error);
      this.state.error = error.message;
      this.state.loading = false;
    }
  }

  async loadDataAfterSync() {
    try {
      console.log('Loading data after sync...');
      
      const response = await fetch('/web/dataset/call_kw/investor.list/search_read', {
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
            model: 'investor.list',
            method: 'search_read',
            args: [],
            kwargs: {
              fields: ['open_date', 'account_number', 'partner_name', 'id_number', 'phone', 'email', 'province_city', 'source', 'bda_user', 'status'],
              limit: 1000
            }
          }
        })
      });

      const result = await response.json();
      console.log('Data after sync:', result);
      
      if (result.result && result.result.records && result.result.records.length > 0) {
        console.log('Found records after sync:', result.result.records.length);
        this.state.investors = result.result.records;
        this.calculateStats();
        this.applyFilters();
        this.updatePagination();
      } else {
        console.log('Still no records, showing empty state');
        this.state.investors = [];
        this.calculateStats();
        this.applyFilters();
        this.updatePagination();
      }
      
      this.state.loading = false;
    } catch (error) {
      console.error('Error loading data after sync:', error);
      this.state.error = error.message;
      this.state.loading = false;
    }
  }

  async syncPortalUsers() {
    try {
      console.log('Syncing portal users...');
      
      const response = await fetch('/web/dataset/call_kw/investor.list/sync_portal_users', {
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
            model: 'investor.list',
            method: 'sync_portal_users',
            args: [],
            kwargs: {}
          }
        })
      });

      const result = await response.json();
      console.log('Sync result:', result);
      
      if (result.result) {
        console.log('Portal users synced successfully');
      }
    } catch (error) {
      console.error('Error syncing portal users:', error);
    }
  }

  formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  }

  getDisplayValue(value) {
    return value || '-';
  }

  getSourceClass(source) {
    switch (source) {
      case 'tpb2': return 'status-pending';
      case 'fpla1': return 'status-active';
      case 'scb': return 'status-inactive';
      default: return 'status-pending';
    }
  }

  updatePagination() {
    const totalItems = this.state.filteredInvestors.length;
    this.state.totalPages = Math.ceil(totalItems / this.state.pageSize);
    this.state.startIndex = (this.state.currentPage - 1) * this.state.pageSize;
    this.state.endIndex = Math.min(this.state.startIndex + this.state.pageSize, totalItems);
    
    // Generate page numbers
    const pages = [];
    const maxPages = 5;
    let startPage = Math.max(1, this.state.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.state.totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    this.state.pageNumbers = pages;
  }

  filterTable(field, value) {
    this.state.searchTerm = value;
    this.applyFilters();
  }

  filterByDateRange(type, value) {
    this.state.dateFrom = value;
    this.applyDateRangeFilter();
  }

  applyDateRangeFilter() {
    // Áp dụng tất cả các filter bao gồm cả date filter
    let filtered = this.state.investors;

    // Áp dụng tab filter trước
    if (this.state.activeTab === 'pending') {
      filtered = filtered.filter(investor => 
        investor.status === 'incomplete'
      );
    } else {
      filtered = filtered.filter(investor => 
        ['pending', 'kyc', 'vsd'].includes(investor.status)
      );
      
      // Áp dụng status filter nếu có
      if (this.state.statusFilter && this.state.statusFilter !== null) {
        filtered = filtered.filter(investor => investor.status === this.state.statusFilter);
      }
    }

    // Apply date filter
    if (this.state.dateFrom) {
      filtered = filtered.filter(investor => {
        if (!investor.open_date) return false;
        
        const investorDate = new Date(investor.open_date);
        const selectedDate = new Date(this.state.dateFrom);
        
        // So sánh ngày (bỏ qua giờ phút giây)
        return investorDate.toDateString() === selectedDate.toDateString();
      });
    }

    // Apply search filter
    if (this.state.searchTerm) {
      const searchTerm = this.state.searchTerm.toLowerCase();
      filtered = filtered.filter(investor => 
        (investor.partner_name && investor.partner_name.toLowerCase().includes(searchTerm)) ||
        (investor.account_number && investor.account_number.toLowerCase().includes(searchTerm)) ||
        (investor.phone && investor.phone.includes(searchTerm)) ||
        (investor.email && investor.email.toLowerCase().includes(searchTerm)) ||
        (investor.id_number && investor.id_number.includes(searchTerm)) ||
        (investor.province_city && investor.province_city.toLowerCase().includes(searchTerm))
      );
    }

    this.state.filteredInvestors = filtered;
    this.state.currentPage = 1;
    this.updatePagination();
    this.calculateStats();
  }

  applyFilters() {
    // Áp dụng tất cả các filter (tab, status, search)
    let filtered = this.state.investors;

    // Áp dụng tab filter trước
    if (this.state.activeTab === 'pending') {
      filtered = filtered.filter(investor => 
        investor.status === 'incomplete'
      );
    } else {
      filtered = filtered.filter(investor => 
        ['pending', 'kyc', 'vsd'].includes(investor.status)
      );
      
      // Áp dụng status filter nếu có
      if (this.state.statusFilter && this.state.statusFilter !== null) {
        filtered = filtered.filter(investor => investor.status === this.state.statusFilter);
      }
    }

    // Apply search filter
    if (this.state.searchTerm) {
      const searchTerm = this.state.searchTerm.toLowerCase();
      filtered = filtered.filter(investor => 
        (investor.partner_name && investor.partner_name.toLowerCase().includes(searchTerm)) ||
        (investor.account_number && investor.account_number.toLowerCase().includes(searchTerm)) ||
        (investor.phone && investor.phone.includes(searchTerm)) ||
        (investor.email && investor.email.toLowerCase().includes(searchTerm)) ||
        (investor.id_number && investor.id_number.includes(searchTerm)) ||
        (investor.province_city && investor.province_city.toLowerCase().includes(searchTerm))
      );
    }

    this.state.filteredInvestors = filtered;
    this.state.currentPage = 1;
    this.updatePagination();
    this.calculateStats();
  }

  changePage(page) {
    if (page >= 1 && page <= this.state.totalPages) {
      this.state.currentPage = page;
      this.updatePagination();
    }
  }

  setStatusFilter(status) {
    // Nếu đang filter theo status này rồi thì bỏ filter (hiển thị tất cả)
    if (this.state.statusFilter === status) {
      this.state.statusFilter = null;
    } else {
      this.state.statusFilter = status;
    }
    this.applyStatusFilter();
  }

  setActiveTab(tab) {
    this.state.activeTab = tab;
    // Reset statusFilter khi chuyển sang tab "NĐT chưa cập nhật"
    if (tab === 'pending') {
      this.state.statusFilter = null;
    }
    this.applyTabFilter();
  }

  applyStatusFilter() {
    this.applyFilters();
  }

  applyTabFilter() {
    this.applyFilters();
  }



  calculateStats() {
    // Tổng số NĐT (tất cả portal users)
    this.state.totalInvestors = this.state.investors.length;
    
    // Số NĐT chưa cập nhật (trạng thái "incomplete")
    this.state.incompleteCount = this.state.investors.filter(investor => 
      investor.status === 'incomplete'
    ).length;
    
    // Số NĐT chờ KYC (trạng thái "pending")
    this.state.pendingCount = this.state.investors.filter(investor => 
      investor.status === 'pending'
    ).length;
    
    // Số NĐT đã KYC (trạng thái "kyc")
    this.state.kycCount = this.state.investors.filter(investor => 
      investor.status === 'kyc'
    ).length;
    
    // Số NĐT đã VSD (trạng thái "vsd")
    this.state.vsdCount = this.state.investors.filter(investor => 
      investor.status === 'vsd'
    ).length;
  }

  exportData() {
    // Lấy dữ liệu đã được filter để export
    const dataToExport = this.state.filteredInvestors || [];
    
    if (dataToExport.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }

    // Định nghĩa headers cho CSV
    const headers = [
      'Ngày mở TK',
      'Số tài khoản',
      'Họ tên',
      'ĐKSH',
      'Số điện thoại',
      'Email',
      'Tỉnh/Thành phố',
      'Nguồn',
      'BDA',
      'Trạng thái',
      'Trạng thái TK đầu tư',
      'Hồ sơ gốc'
    ];

    // Chuyển đổi dữ liệu thành format CSV
    const csvData = dataToExport.map(investor => [
      this.formatDate(investor.open_date),
      this.getDisplayValue(investor.account_number),
      this.getDisplayValue(investor.partner_name),
      this.getDisplayValue(investor.id_number),
      this.getDisplayValue(investor.phone),
      this.getDisplayValue(investor.email),
      this.getDisplayValue(investor.province_city),
      this.getDisplayValue(investor.source),
      this.getDisplayValue(investor.bda_user),
      this.getStatusDisplayValue(investor.status),
      this.getDisplayValue(investor.trang_thai_tk_dau_tu),
      this.getDisplayValue(investor.ho_so_goc)
    ]);

    // Tạo nội dung CSV
    const csvContent = this.convertToCSV([headers, ...csvData]);
    
    // Tạo tên file với timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fileName = `danh_sach_nha_dau_tu_${timestamp}.csv`;
    
    // Tạo và download file
    this.downloadCSV(csvContent, fileName);
  }

  getStatusDisplayValue(status) {
    const statusMap = {
      'pending': 'Chờ KYC',
      'kyc': 'KYC',
      'vsd': 'VSD',
      'incomplete': 'NĐT chưa cập nhật'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status) {
    const statusClassMap = {
      'pending': 'bg-warning text-dark',
      'kyc': 'bg-success',
      'vsd': 'bg-info',
      'incomplete': 'bg-secondary'
    };
    return statusClassMap[status] || 'bg-secondary';
  }

  convertToCSV(data) {
    return data.map(row => 
      row.map(cell => {
        // Escape quotes và wrap trong quotes nếu có comma hoặc quotes
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');
  }

  downloadCSV(content, fileName) {
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
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
      // Fallback cho các browser cũ
      window.open('data:text/csv;charset=utf-8,' + encodeURIComponent(content));
    }
  }

  refreshData() {
    console.log('Refreshing data...');
    // Reload trang để lấy dữ liệu mới từ controller
    window.location.reload();
  }

  async editInvestor(investor) {
    // Load danh sách BDA users trước khi mở modal
    await this.loadBdaUsers();
    
    // Tạo bản copy của investor để edit
    this.state.editingInvestor = { ...investor };
    this.state.showEditModal = true;
  }

  async loadBdaUsers() {
    try {
      const response = await fetch('/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const users = await response.json();
        this.state.bdaUsers = users;
      }
    } catch (error) {
      console.error('Error loading BDA users:', error);
    }
  }

  closeEditModal() {
    this.state.showEditModal = false;
    this.state.editingInvestor = null;
  }



  autoUpdateStatus() {
    // Tự động cập nhật trạng thái khi thay đổi hồ sơ gốc hoặc trạng thái TK đầu tư
    if (this.state.editingInvestor) {
      // Kiểm tra xem có đủ thông tin cơ bản không
      const hasBasicInfo = (
        this.state.editingInvestor.partner_name && 
        this.state.editingInvestor.phone && 
        this.state.editingInvestor.email && 
        this.state.editingInvestor.id_number && 
        this.state.editingInvestor.province_city
      );
      
      if (!hasBasicInfo) {
        this.state.editingInvestor.status = 'incomplete';
      } else {
        // Logic mới dựa trên hồ sơ gốc và trạng thái TK đầu tư
        if (this.state.editingInvestor.ho_so_goc === 'chua_nhan' && this.state.editingInvestor.trang_thai_tk_dau_tu === 'cho_duyet') {
          // Nếu hồ sơ gốc và trạng thái đều chưa duyệt thì cập nhật trạng thái NĐT chưa cập nhật
          this.state.editingInvestor.status = 'incomplete';
        } else if (this.state.editingInvestor.ho_so_goc === 'da_nhan' && this.state.editingInvestor.trang_thai_tk_dau_tu === 'cho_duyet') {
          // Nếu hồ sơ gốc đã duyệt và trạng thái đang chờ duyệt thì cập nhật trạng thái Chờ KYC
          this.state.editingInvestor.status = 'pending';
        } else if (this.state.editingInvestor.ho_so_goc === 'da_nhan' && this.state.editingInvestor.trang_thai_tk_dau_tu === 'da_duyet') {
          // Nếu hồ sơ gốc và trạng thái đều được duyệt thì cập nhật trạng thái KYC
          this.state.editingInvestor.status = 'kyc';
        } else if (this.state.editingInvestor.trang_thai_tk_dau_tu === 'tu_choi') {
          // Từ chối: vẫn hiển thị trong danh sách nhưng có thể filter riêng
          this.state.editingInvestor.status = 'pending';
        } else {
          // Mặc định
          this.state.editingInvestor.status = 'incomplete';
        }
      }
    }
  }



  async saveInvestor() {
    if (!this.state.editingInvestor) return;

    try {
      // Chuẩn bị dữ liệu để gửi
      const updateData = {
        // Thông tin cá nhân
        partner_name: this.state.editingInvestor.partner_name,
        phone: this.state.editingInvestor.phone,
        email: this.state.editingInvestor.email,
        id_number: this.state.editingInvestor.id_number,
        province_city: this.state.editingInvestor.province_city,
        // Thông tin bổ sung
        source: this.state.editingInvestor.source,
        bda_user: this.state.editingInvestor.bda_user || false,
        trang_thai_tk_dau_tu: this.state.editingInvestor.trang_thai_tk_dau_tu,
        ho_so_goc: this.state.editingInvestor.ho_so_goc,
        status: this.state.editingInvestor.status
      };

      const response = await fetch(`/api/investor_list/${this.state.editingInvestor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        // Đóng modal trước
        this.closeEditModal();
        
        // Hiển thị thông báo thành công
        alert('Cập nhật thông tin thành công!');
        
        // Làm mới trang để load tất cả thay đổi
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Lỗi: ${error.message || 'Không thể cập nhật thông tin'}`);
      }
    } catch (error) {
      console.error('Error updating investor:', error);
      alert('Lỗi kết nối. Vui lòng thử lại!');
    }
  }

  async deleteInvestor(investor) {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhà đầu tư "${investor.partner_name}" khỏi danh sách?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/investor_list/${investor.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        // Hiển thị thông báo thành công
        alert('Xóa nhà đầu tư thành công!');
        
        // Làm mới trang để load tất cả thay đổi
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Lỗi: ${error.message || 'Không thể xóa nhà đầu tư'}`);
      }
    } catch (error) {
      console.error('Error deleting investor:', error);
      alert('Lỗi kết nối. Vui lòng thử lại!');
    }
  }
}


