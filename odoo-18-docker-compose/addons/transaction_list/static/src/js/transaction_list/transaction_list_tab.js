/** @odoo-module */

import { Component, xml, useState, onMounted } from "@odoo/owl";

export class TransactionListTab extends Component {
  static template = xml`
    <div class="tab-content">
      <!-- Sub Tab Navigation -->
      <div class="sub-tab-nav mb-3">
        <nav class="nav nav-pills">
          <a class="nav-link" t-att-class="state.activeSubTab === 'pending' ? 'active' : ''" href="#" t-on-click="() => this.setActiveSubTab('pending')">
            <i class="fas fa-clock me-2"></i>Pending
          </a>
          <a class="nav-link" t-att-class="state.activeSubTab === 'approved' ? 'active' : ''" href="#" t-on-click="() => this.setActiveSubTab('approved')">
            <i class="fas fa-check-circle me-2"></i>Approved
          </a>
          <a class="nav-link" t-att-class="state.activeSubTab === 'matched_orders' ? 'active' : ''" href="#" t-on-click="() => this.setActiveSubTab('matched_orders')">
            <i class="fas fa-handshake me-2"></i>Lệnh khớp thỏa thuận
          </a>
        </nav>
      </div>

      <!-- Content Header -->
      <div class="content-header mb-4">
        <div class="row align-items-center">
          <div class="col-lg-6">
            <h2 class="content-title">
              <i class="fas fa-list me-2"></i>Danh sách lệnh giao dịch
            </h2>
            <p class="content-subtitle">
              Hiển thị <strong><t t-esc="state.displayedTransactions ? state.displayedTransactions.length : 0"/></strong> trong tổng số <strong><t t-esc="state.totalTransactions"/></strong> lệnh giao dịch
            </p>
          </div>
          <div class="col-lg-6">
            <div class="d-flex gap-2 justify-content-end flex-wrap">
              <button class="btn-modern btn-danger-modern" style="background:#f97316" t-on-click="exportData" t-on-mousedown="(ev) => ev.target.classList.add('active')" t-on-mouseup="(ev) => ev.target.classList.remove('active')" t-on-mouseleave="(ev) => ev.target.classList.remove('active')">
                <i class="fas fa-download me-2"></i>Xuất file
              </button>
              <button class="btn-modern btn-danger-modern" style="background:#f97316" t-on-click="refreshData" t-on-mousedown="(ev) => ev.target.classList.add('active')" t-on-mouseup="(ev) => ev.target.classList.remove('active')" t-on-mouseleave="(ev) => ev.target.classList.remove('active')">
                <i class="fas fa-sync-alt me-2"></i>Làm mới
              </button>
              <button class="btn-modern btn-outline-secondary" t-on-click="() => this.state.showColumnModal = true" title="Chọn cột hiển thị">
                <i class="fas fa-cog"></i>
              </button>
              <div class="dropdown test-api-dropdown">
                <button class="btn-modern btn-primary-modern dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <i class="fas fa-flask me-2"></i>Khớp Lệnh Thỏa Thuận
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li>
                    <button class="dropdown-item" t-on-click="createRandomTransactions">
                      <i class="fas fa-dice"></i>
                      <span>Tạo Random</span>
                    </button>
                  </li>
                  <li>
                    <button class="dropdown-item" t-on-click="matchOrders">
                      <i class="fas fa-link"></i>
                      <span>Khớp Lệnh</span>
                    </button>
                  </li>
                  <li>
                    <button class="dropdown-item" t-on-click="marketMakerHandleRemainingFromMenu">
                      <i class="fas fa-exchange-alt"></i>
                      <span>Nhà tạo lập Mua/Bán</span>
                    </button>
                  </li>
                  <li>
                    <button class="dropdown-item" t-on-click="importExcel">
                      <i class="fas fa-file-excel"></i>
                      <span>Import Excel</span>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Filters Section for Regular Transactions (Pending/Approved) -->
      <div t-if="state.activeSubTab !== 'matched_orders'" class="filters-section mb-4">
        <div class="card">
          <div class="card-header">
            <h6 class="card-title mb-0">
              <i class="fas fa-filter me-2"></i>Bộ lọc
            </h6>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-4">
                <label for="fundFilter" class="form-label">Quỹ:</label>
                <select id="fundFilter" class="form-select form-select-sm" t-on-change="onFundFilterChange" t-att-value="state.selectedFundId">
                  <option value="">Tất cả quỹ</option>
                  <t t-foreach="state.fundOptions" t-as="fund" t-key="fund.value">
                    <option t-att-value="fund.value" t-att-selected="state.selectedFundId == fund.value">
                      <t t-esc="fund.label"/>
                    </option>
                  </t>
                </select>
              </div>
              <div class="col-md-4">
                <label for="dateFilter" class="form-label">Ngày giao dịch:</label>
                <input type="date" id="dateFilter" class="form-control form-control-sm" t-on-change="onDateFilterChange" t-att-value="state.selectedDate"/>
              </div>
              <div class="col-md-4">
                <label for="quickDateFilter" class="form-label">Lọc nhanh:</label>
                <select id="quickDateFilter" class="form-select form-select-sm" t-on-change="onQuickDateFilterChange">
                  <option value="">Chọn thời gian...</option>
                  <option value="today" t-att-selected="state.selectedQuickDate === 'today'">Hôm nay</option>
                  <option value="yesterday" t-att-selected="state.selectedQuickDate === 'yesterday'">Hôm qua</option>
                  <option value="last7days" t-att-selected="state.selectedQuickDate === 'last7days'">7 ngày gần nhất</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Matched Orders Content -->
      <div t-if="state.activeSubTab === 'matched_orders'" class="matched-orders-container">
        
        <!-- Filter Tabs and Bulk Actions -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="sub-tab-nav">
            <nav class="nav nav-pills">
              <a class="nav-link" t-att-class="state.matchedOrdersFilter === 'all' ? 'active' : ''" href="#" t-on-click="() => this.filterMatchedOrders('all')">
                Tất cả
              </a>
              <a class="nav-link" t-att-class="state.matchedOrdersFilter === 'investor' ? 'active' : ''" href="#" t-on-click="() => this.filterMatchedOrders('investor')">
                Nhà đầu tư
              </a>
              <a class="nav-link" t-att-class="state.matchedOrdersFilter === 'market_maker' ? 'active' : ''" href="#" t-on-click="() => this.filterMatchedOrders('market_maker')">
                Nhà tạo lập
              </a>
            </nav>
          </div>
          <div class="bulk-actions">
            <button class="btn-modern btn-primary-modern" 
                    t-att-disabled="state.selectedPairIds.size === 0"
                    t-on-click="bulkSendToExchange"
                    title="Gửi các cặp lệnh đã chọn lên sàn">
              <i class="fas fa-paper-plane me-2"></i>
              Gửi lên sàn (<t t-esc="state.selectedPairIds.size"/>)
            </button>
          </div>
        </div>
        
        <!-- Filters Section for Matched Orders -->
        <div class="row mb-3">
          <div class="col-md-4">
            <label for="matchedFundFilter" class="form-label">Quỹ:</label>
            <select id="matchedFundFilter" class="form-select form-select-sm" t-on-change="onMatchedFundFilterChange" t-att-value="state.selectedMatchedFundId">
              <option value="">Tất cả quỹ</option>
              <t t-foreach="state.fundOptions" t-as="fund" t-key="fund.value">
                <option t-att-value="fund.value" t-att-selected="state.selectedMatchedFundId == fund.value">
                  <t t-esc="fund.label"/>
                </option>
              </t>
            </select>
          </div>
          <div class="col-md-4">
            <label for="matchedDateFilter" class="form-label">Ngày giao dịch:</label>
            <input type="date" id="matchedDateFilter" class="form-control form-control-sm" t-on-change="onMatchedDateFilterChange" t-att-value="state.selectedMatchedDate"/>
          </div>
          <div class="col-md-4">
            <label for="matchedQuickDateFilter" class="form-label">Lọc nhanh:</label>
            <select id="matchedQuickDateFilter" class="form-select form-select-sm" t-on-change="onMatchedQuickDateFilterChange">
              <option value="">Chọn thời gian...</option>
              <option value="today" t-att-selected="state.selectedMatchedQuickDate === 'today'">Hôm nay</option>
              <option value="yesterday" t-att-selected="state.selectedMatchedQuickDate === 'yesterday'">Hôm qua</option>
              <option value="last7days" t-att-selected="state.selectedMatchedQuickDate === 'last7days'">7 ngày gần nhất</option>
            </select>
          </div>
        </div>
        
        <!-- Matched Orders Table -->
      <div class="table-container" style="font-size: 0.7rem;">
        <table class="transaction-table table table-sm table-bordered table-hover" style="margin-bottom: 0; font-size: 0.7rem;">
          <thead class="table-dark">
            <tr>
              <th style="font-size: 0.65rem; font-weight: 600; width: 35px;">
                  <input type="checkbox" 
                         class="form-check-input" 
                         t-on-change="(ev) => this.toggleSelectAllPairs(ev.target.checked)"
                         title="Chọn tất cả"/>
                </th>
              <th style="font-size: 0.65rem; font-weight: 600; width: 35px;">STT</th>
              <th style="font-size: 0.65rem; font-weight: 600; width: 140px;">QUỸ</th>
                <th style="font-size: 0.65rem; font-weight: 600; width: 150px;">NGƯỜI MUA</th>
                <th style="font-size: 0.65rem; font-weight: 600; width: 150px;">NGƯỜI BÁN</th>
                <th style="font-size: 0.65rem; font-weight: 600; width: 80px;">GIÁ</th>
                <th style="font-size: 0.65rem; font-weight: 600; width: 70px;">SỐ CCQ</th>
                <th style="font-size: 0.65rem; font-weight: 600; width: 100px;">GIÁ TRỊ LỆNH</th>
                <th style="font-size: 0.65rem; font-weight: 600; width: 60px;">LÃI SUẤT</th>
                <th style="font-size: 0.65rem; font-weight: 600; width: 60px;">KỲ HẠN</th>
                <th style="font-size: 0.65rem; font-weight: 600; width: 120px;">PHIÊN GIAO DỊCH</th>
                <th style="font-size: 0.65rem; font-weight: 600; width: 60px;">THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              <t t-if="state.loading">
                <tr>
                  <td colspan="12" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Đang tải...</span>
                    </div>
                    <div class="mt-2">Đang tải dữ liệu...</div>
                  </td>
                </tr>
              </t>
              <t t-elif="state.error">
                <tr>
                  <td colspan="12" class="text-center py-4 text-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <t t-esc="state.error"/>
                  </td>
                </tr>
              </t>
              <t t-elif="!state.filteredMatchedOrders or state.filteredMatchedOrders.length === 0">
                <tr>
                  <td colspan="12" class="text-center py-4 text-muted">
                    <i class="fas fa-inbox me-2"></i>
                    Chưa có lệnh khớp thỏa thuận nào
                  </td>
                </tr>
              </t>
              <t t-else="">
                <t t-foreach="state.displayedTransactions" t-as="pair" t-key="pair.id">
                  <tr t-att-class="this.isPairSentToExchange(pair) ? 'sent-to-exchange' : ''" 
                      t-att-style="this.isPairSentToExchange(pair) ? 'opacity: 0.6;' : ''">
                    <!-- Checkbox -->
                    <td class="text-center">
                      <input type="checkbox" 
                             class="form-check-input pair-checkbox" 
                             t-att-data-pair-id="(pair.buy_id || '') + '-' + (pair.sell_id || '')"
                             t-att-disabled="this.isPairSentToExchange(pair)"
                             t-att-checked="this.isPairSelected(pair)"
                             t-on-change="(ev) => this.toggleSelectPair(pair, ev.target.checked)"/>
                    </td>
                    <!-- STT -->
                    <td class="text-center" style="font-size: 0.65rem; font-weight: 600;">
                      <t t-esc="(state.matchedOrdersPagination.currentPage - 1) * state.matchedOrdersPagination.itemsPerPage + pair_index + 1"/>
                    </td>
                    <!-- QUỸ -->
                    <td class="text-start" style="font-size: 0.65rem;">
                      <t t-esc="this.getFundNameFromPair(pair)"/>
                    </td>
                    
                    <!-- NGƯỜI MUA -->
                    <td>
                      <div class="investor-info">
                        <div class="investor-name" style="color: #28a745; font-weight: 600; font-size: 0.65rem;">
                          <t t-esc="pair.buy_investor || 'N/A'"/>
                        </div>
                        <div class="investor-details" style="font-size: 0.6rem; color: #6c757d;">
                          CCQ: <t t-esc="this.formatNumber(pair.buy_units || 0)"/>
                          <div>
                            Giá mua: <span class="text-success" style="font-weight:600;">
                              <t t-esc="this.formatNumber(pair.buy_price || 0)"/> VND
                            </span>
                          </div>
                          <t t-if="(pair.buy_user_type || '') !== 'market_maker'">
                            <div>
                              Còn lại: <span class="text-muted" style="font-weight:600;">
                                <t t-esc="this.formatNumber(pair.buy_remaining_units || 0)"/>
                              </span>
                            </div>
                          </t>
                        </div>
                      </div>
                    </td>
                    
                    <!-- NGƯỜI BÁN -->
                    <td>
                      <div class="investor-info">
                        <div class="investor-name" style="color: #dc3545; font-weight: 600; font-size: 0.65rem;">
                          <t t-esc="pair.sell_investor || 'N/A'"/>
                        </div>
                        <div class="investor-details" style="font-size: 0.6rem; color: #6c757d;">
                          CCQ: <t t-esc="this.formatNumber(pair.sell_units || 0)"/>
                          <div>
                            Giá bán: <span class="text-danger" style="font-weight:600;">
                              <t t-esc="this.formatNumber(pair.sell_price || 0)"/> VND
                            </span>
                          </div>
                          <t t-if="(pair.sell_user_type || '') !== 'market_maker'">
                            <div>
                              Còn lại: <span class="text-muted" style="font-weight:600;">
                                <t t-esc="this.formatNumber(pair.sell_remaining_units || 0)"/>
                              </span>
                            </div>
                          </t>
                        </div>
                      </div>
                    </td>
                    
                    <!-- GIÁ (lấy trực tiếp từ bản ghi matched_orders) -->
                    <td class="text-center">
                      <div class="price-info" style="font-weight: 600; color: #28a745; font-size: 0.65rem; text-align: center;">
                        <t t-esc="this.formatNumber(pair.matched_price || 0)"/> VND
                      </div>
                    </td>
                    
                    <!-- SỐ CCQ (lấy trực tiếp từ bản ghi matched_orders) -->
                    <td class="text-center">
                      <div style="font-size: 0.6rem; color: #6c757d;">
                        Khớp: <t t-esc="this.formatNumber(pair.matched_quantity || 0)"/>
                      </div>
                    </td>

                    <!-- GIÁ TRỊ LỆNH (lấy trực tiếp từ bản ghi matched_orders) -->
                    <td class="text-center">
                      <div style="font-size: 0.6rem; color: #6c757d; font-weight: 600;">
                        <t t-esc="this.formatAmountVND(pair.total_value || 0)"/>
                      </div>
                    </td>
                    
                    
                    
                    <!-- LÃI SUẤT -->
                    <td class="text-center" style="font-size: 0.6rem; color: #6c757d;">
                      -
                    </td>
                    
                    <!-- KỲ HẠN -->
                    <td class="text-center" style="font-size: 0.6rem; color: #6c757d;">
                      -
                    </td>
                    
                    <!-- PHIÊN GIAO DỊCH -->
                    <td class="text-center">
                      <div class="transaction-time-info" style="font-size: 0.6rem;">
                        <div style="color: #28a745; font-weight: 600;">
                          In: <t t-esc="this.formatDateTime(pair.buy_in_time || pair.match_time || pair.created_at)"/>
                        </div>
                        <div style="color: #dc3545; font-weight: 600;">
                          Out: <t t-esc="this.formatDateTime(pair.sell_in_time || pair.match_time || pair.created_at)"/>
                        </div>
                      </div>
                    </td>
                    
                    <!-- Action Button -->
                    <td class="text-center">
                      <button class="btn-send-exchange" 
                              t-att-data-pair-id="pair.buy_id + '-' + pair.sell_id"
                              t-att-disabled="this.isPairSentToExchange(pair)"
                              t-att-style="this.isPairSentToExchange(pair) ? 'background: #28a745; color: white;' : 'background:#f97316;color:white;border:1px solid #f97316;border-radius:4px;padding:5px 8px;cursor:pointer;'"
                              title="Gửi lên sàn">
                        <i t-att-class="this.isPairSentToExchange(pair) ? 'fas fa-check' : 'fas fa-paper-plane'"></i>
                      </button>
                    </td>
                  </tr>
                </t>
              </t>
            </tbody>
            <tfoot t-if="state.filteredMatchedOrders and state.filteredMatchedOrders.length > 0">
              <t t-set="totals" t-value="this.getMatchedOrdersTotals()"/>
              <tr class="matched-orders-totals-row">
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td class="text-center">TỔNG CCQ: <strong><t t-esc="this.formatNumber(totals.totalCCQ)"/></strong></td>
                <td class="text-center"><strong>TỔNG TIỀN: <t t-esc="this.formatAmountVND(totals.totalValue)"/></strong></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <!-- Pagination -->
        <div t-if="state.filteredMatchedOrders.length > 0" class="pagination-container mt-3">
          <div class="d-flex justify-content-end align-items-center">
            <div class="pagination-controls">
              <button class="page-btn" t-att-disabled="state.matchedOrdersPagination.currentPage === 1" t-on-click="() => this.changeMatchedOrdersPage(state.matchedOrdersPagination.currentPage - 1)">
                <i class="fas fa-chevron-left"></i>
              </button>
              
              <t t-foreach="Array.from({length: this.getMatchedOrdersTotalPages()}, (_, i) => i + 1)" t-as="page" t-key="page">
                <button class="page-btn" t-att-class="page === state.matchedOrdersPagination.currentPage ? 'active' : ''" t-on-click="() => this.changeMatchedOrdersPage(page)">
                  <t t-esc="page"/>
                </button>
              </t>
              
              <button class="page-btn" t-att-disabled="state.matchedOrdersPagination.currentPage === this.getMatchedOrdersTotalPages()" t-on-click="() => this.changeMatchedOrdersPage(state.matchedOrdersPagination.currentPage + 1)">
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Regular Table Container -->
      <div t-if="state.activeSubTab !== 'matched_orders'" class="table-container" style="font-size: 0.7rem;">
        <table class="transaction-table table table-sm table-bordered table-hover" style="margin-bottom: 0; font-size: 0.7rem;">
          <thead class="table-dark">
            <tr>
              <th t-if="state.visibleColumns.transaction_date">
                <div class="column-header">
                  <div class="column-title" style="font-size: 0.65rem; font-weight: 600;">Phiên giao dịch</div>
                  <input type="date" class="header-filter form-control form-control-sm" style="font-size: 0.6rem; padding: 0.15rem;" t-on-change="(ev) => this.filterTable('transaction_date', ev.target.value)"/>
                </div>
              </th>
              <th t-if="state.visibleColumns.account_number">
                <div class="column-header">
                  <div class="column-title" style="font-size: 0.65rem; font-weight: 600;">STK</div>
                  <input type="text" class="header-filter form-control form-control-sm" style="font-size: 0.6rem; padding: 0.15rem;" placeholder="Tìm..." t-on-input="(ev) => this.filterTable('account_number', ev.target.value)"/>
                </div>
              </th>
              <th t-if="state.visibleColumns.investor_name">
                <div class="column-header">
                          <div class="column-title" style="font-size: 0.65rem; font-weight: 600;">Nhà đầu tư</div>
                          <input type="text" class="header-filter form-control form-control-sm" style="font-size: 0.6rem; padding: 0.15rem;" placeholder="Tìm..." t-on-input="(ev) => this.filterTable('investor_name', ev.target.value)"/>
                </div>
              </th>
              <th t-if="state.visibleColumns.investor_phone">
                <div class="column-header">
                  <div class="column-title" style="font-size: 0.65rem; font-weight: 600;">ĐKSH</div>
                  <input type="text" class="header-filter form-control form-control-sm" style="font-size: 0.6rem; padding: 0.15rem;" placeholder="Tìm..." t-on-input="(ev) => this.filterTable('investor_phone', ev.target.value)"/>
                </div>
              </th>
              <th t-if="state.visibleColumns.fund_name">
                <div class="column-header">
                  <div class="column-title" style="font-size: 0.65rem; font-weight: 600;">Quỹ</div>
                  <input type="text" class="header-filter form-control form-control-sm" style="font-size: 0.6rem; padding: 0.15rem;" placeholder="Tìm..." t-on-input="(ev) => this.filterTable('fund_name', ev.target.value)"/>
                </div>
              </th>
              <th t-if="state.visibleColumns.fund_ticker">
                <div class="column-header">
                  <div class="column-title" style="font-size: 0.65rem; font-weight: 600;">Chương trình</div>
                  <input type="text" class="header-filter form-control form-control-sm" style="font-size: 0.6rem; padding: 0.15rem;" placeholder="Tìm..." t-on-input="(ev) => this.filterTable('fund_ticker', ev.target.value)"/>
                </div>
              </th>
              <th t-if="state.visibleColumns.transaction_code">
                <div class="column-header">
                  <div class="column-title" style="font-size: 0.65rem; font-weight: 600;">Mã GD</div>
                  <input type="text" class="header-filter form-control form-control-sm" style="font-size: 0.6rem; padding: 0.15rem;" placeholder="Tìm..." t-on-input="(ev) => this.filterTable('transaction_code', ev.target.value)"/>
                </div>
              </th>
              <th t-if="state.visibleColumns.transaction_type">
                <div class="column-header">
                  <div class="column-title" style="font-size: 0.65rem; font-weight: 600;">Loại Lệnh</div>
                  <select class="header-filter form-select form-select-sm" style="font-size: 0.6rem; padding: 0.15rem;" t-on-change="(ev) => this.filterTable('transaction_type', ev.target.value)">
                    <option value="">Tất cả</option>
                    <option value="purchase">Lệnh mua</option>
                    <option value="sell">Lệnh bán</option>
                    <option value="exchange">Lệnh chuyển đổi</option>
                  </select>
                </div>
              </th>
              <th t-if="state.visibleColumns.target_fund">
                <div class="column-header">
                  <div class="column-title" style="font-size: 0.65rem; font-weight: 600;">Quỹ Mục Tiêu</div>
                  <input type="text" class="header-filter form-control form-control-sm" style="font-size: 0.6rem; padding: 0.15rem;" placeholder="Tìm..." t-on-input="(ev) => this.filterTable('target_fund', ev.target.value)"/>
                </div>
              </th>
              <th t-if="state.visibleColumns.units">
                <div class="column-header">
                  <div class="column-title" style="font-size: 0.65rem; font-weight: 600;">Số CCQ</div>
                  <input type="text" class="header-filter form-control form-control-sm" style="font-size: 0.6rem; padding: 0.15rem;" placeholder="Tìm..." t-on-input="(ev) => this.filterTable('units', ev.target.value)"/>
                </div>
              </th>
              <th t-if="state.visibleColumns.unit_price">
                <div class="column-header">
                  <div class="column-title" style="font-size: 0.65rem; font-weight: 600;">Giá</div>
                  <input type="text" class="header-filter form-control form-control-sm" style="font-size: 0.6rem; padding: 0.15rem;" placeholder="Tìm..." t-on-input="(ev) => this.filterTable('unit_price', ev.target.value)"/>
                </div>
              </th>
              <th t-if="state.visibleColumns.amount">
                <div class="column-header">
                  <div class="column-title" style="font-size: 0.65rem; font-weight: 600;">Tổng Số Tiền</div>
                  <input type="text" class="header-filter form-control form-control-sm" style="font-size: 0.6rem; padding: 0.15rem;" placeholder="Tìm..." t-on-input="(ev) => this.filterTable('amount', ev.target.value)"/>
                </div>
              </th>
              <th t-if="state.visibleColumns.matched_units and state.activeSubTab === 'approved'">
                <div class="column-header">
                  <div class="column-title" style="font-size: 0.6rem; font-weight: 600;">Số lượng khớp</div>
                  <input type="text" class="header-filter form-control form-control-sm" style="font-size: 0.55rem; padding: 0.12rem;" placeholder="Tìm..." t-on-input="(ev) => this.filterTable('matched_units', ev.target.value)"/>
                </div>
              </th>
              <th t-if="state.visibleColumns.actions">
                <div class="column-header">
                  <div class="column-title"></div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <t t-if="state.loading">
              <tr>
                <td t-att-colspan="this.getVisibleColumnsCount()" class="text-center py-4">
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
                <td t-att-colspan="this.getVisibleColumnsCount()" class="text-center py-4">
                  <div class="error-state">
                    <i class="fas fa-exclamation-triangle error-icon"></i>
                    <h3 class="error-title">Lỗi tải dữ liệu</h3>
                    <p class="error-description"><t t-esc="state.error"/></p>
                    <button class="btn btn-primary mt-3" t-on-click="() => this.loadData()">
                      <i class="fas fa-refresh me-2"></i>Thử lại
                    </button>
                  </div>
                </td>
              </tr>
            </t>
            <t t-elif="state.displayedTransactions and state.displayedTransactions.length > 0">
              <t t-foreach="state.displayedTransactions" t-as="transaction" t-key="transaction.id">
                <tr>
                  <td t-if="state.visibleColumns.transaction_date" class="text-center">
                    <div class="transaction-time-info">
                      <div class="time-entry" style="font-size: 0.6rem; line-height: 1.1;">
                        <div class="time-label" style="color: #6c757d; font-weight: 500;">In:</div>
                        <div class="time-value" style="color: #28a745; font-weight: 600;">
                          <t t-esc="this.formatDateTime(transaction.first_in_time || transaction.in_time || transaction.transaction_date)"/>
                        </div>
                      </div>
                      <t t-if="transaction.out_time">
                        <div class="time-entry" style="font-size: 0.6rem; line-height: 1.1;">
                          <div class="time-label" style="color: #6c757d; font-weight: 500;">Out:</div>
                          <div class="time-value" style="color: #dc3545; font-weight: 600;">
                            <t t-esc="this.formatDateTime(transaction.out_time)"/>
                          </div>
                        </div>
                      </t>
                    </div>
                  </td>
                  <td t-if="state.visibleColumns.account_number"><t t-esc="transaction.account_number or '-'"/></td>
                  <td t-if="state.visibleColumns.investor_name"><t t-esc="transaction.investor_name or '-'"/></td>
                  <td t-if="state.visibleColumns.investor_phone"><t t-esc="transaction.investor_phone or '-'"/></td>
                  <td t-if="state.visibleColumns.fund_name"><t t-esc="transaction.fund_name or '-'"/></td>
                  <td t-if="state.visibleColumns.fund_ticker" class="text-center"><t t-esc="transaction.fund_ticker or '-'"/></td>
                  <td t-if="state.visibleColumns.transaction_code" class="text-center"><t t-esc="transaction.transaction_code or '-'"/></td>
                  <td t-if="state.visibleColumns.transaction_type" class="text-center">
                    <span class="status-badge" t-att-class="this.getTransactionTypeClass(transaction.transaction_type)">
                      <t t-esc="this.getTransactionTypeDisplay(transaction.transaction_type)"/>
                    </span>
                  </td>
                  <td t-if="state.visibleColumns.target_fund"><t t-esc="transaction.target_fund or '-'"/></td>
                  <td t-if="state.visibleColumns.units" class="text-right"><t t-esc="this.formatNumber(transaction.units)"/></td>
                  <td t-if="state.visibleColumns.unit_price" class="text-right"><t t-esc="this.formatUnitPrice(transaction)"/></td>
                  <td t-if="state.visibleColumns.amount" class="text-right"><t t-esc="this.formatAmount(transaction.amount, transaction.currency)"/></td>
                  <td t-if="state.visibleColumns.matched_units and state.activeSubTab === 'approved'" class="text-center">
                    <span class="badge bg-success" style="font-size: 0.5rem; padding: 1px 3px; min-width: 18px;">
                      <t t-esc="this.formatNumber(transaction.matched_units || 0)"/>
                    </span>
                  </td>
                  <td t-if="state.visibleColumns.actions" class="text-center">
                    <div class="action-buttons d-flex justify-content-center gap-1">
                      <t t-if="transaction.has_contract">
                        <button class="btn-action btn-view" title="Xem hợp đồng" t-on-click="() => this.viewContract(transaction)">
                          <i class="fas fa-eye"></i>
                        </button>
                      </t>
                      <button class="btn-action btn-approve" t-if="this.state.activeSubTab !== 'approved'" t-on-click="() => this.marketMakerHandleOne(transaction.id)" title="Market">
                        <i class="fas fa-exchange-alt"></i>
                      </button>
                      <button class="btn-action btn-delete" t-on-click="() => this.deleteTransaction(transaction.id)" title="Xóa" t-att-data-id="transaction.id">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </t>
            </t>
            <t t-else="">
              <tr>
                <td t-att-colspan="this.getVisibleColumnsCount()" class="text-center py-4">
                  <div class="empty-state">
                    <div class="empty-state-icon">
                      <i class="fas fa-inbox"></i>
                    </div>
                    <div class="empty-state-title">Không có dữ liệu</div>
                    <div class="empty-state-message">Không tìm thấy lệnh giao dịch nào</div>
                  </div>
                </td>
              </tr>
            </t>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination for Regular Transactions -->
      <div t-if="state.activeSubTab !== 'matched_orders' and state.displayedTransactions.length > 0" class="pagination-container mt-3">
        <div class="d-flex justify-content-between align-items-center">
          <div class="pagination-info">
            <span class="text-muted">
              Hiển thị <strong><t t-esc="this.getRegularPaginationStart()"/></strong> - <strong><t t-esc="this.getRegularPaginationEnd()"/></strong> 
              trong tổng số <strong><t t-esc="state.regularPagination.totalItems"/></strong> giao dịch
            </span>
          </div>
          <div class="pagination-controls">
            <button class="page-btn" t-att-disabled="state.regularPagination.currentPage === 1" t-on-click="() => this.changeRegularPage(state.regularPagination.currentPage - 1)">
              <i class="fas fa-chevron-left"></i>
            </button>
            
            <t t-foreach="Array.from({length: this.getRegularTotalPages()}, (_, i) => i + 1)" t-as="page" t-key="page">
              <button class="page-btn" t-att-class="page === state.regularPagination.currentPage ? 'active' : ''" t-on-click="() => this.changeRegularPage(page)">
                <t t-esc="page"/>
              </button>
            </t>
            
            <button class="page-btn" t-att-disabled="state.regularPagination.currentPage === this.getRegularTotalPages()" t-on-click="() => this.changeRegularPage(state.regularPagination.currentPage + 1)">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
      
      
      <!-- Contract Modal -->
      <t t-if="state.showContractModal">
        <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.5);">
          <div class="modal-dialog modal-xl modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">
                  <i class="fas fa-file-contract me-2"></i>
                  Hợp đồng giao dịch - <t t-esc="state.selectedContract?.name || 'N/A'"/>
                </h5>
                <button type="button" class="btn-close" t-on-click="() => this.closeContractModal()"></button>
              </div>
              <div class="modal-body p-0">
                <div class="contract-info p-3 border-bottom">
                  <div class="row">
                    <div class="col-md-6">
                      <strong>Mã giao dịch:</strong> <t t-esc="state.selectedContract?.transaction_code || 'N/A'"/><br/>
                      <strong>Nhà đầu tư:</strong> <t t-esc="state.selectedContract?.investor_name || 'N/A'"/><br/>
                      <strong>Số tài khoản:</strong> <t t-esc="state.selectedContract?.account_number || 'N/A'"/>
                    </div>
                    <div class="col-md-6">
                      <strong>Quỹ:</strong> <t t-esc="state.selectedContract?.fund_name || 'N/A'"/><br/>
                      <strong>Loại lệnh:</strong> <t t-esc="this.getTransactionTypeDisplay(state.selectedContract?.transaction_type) || 'N/A'"/><br/>
                      <strong>Số tiền:</strong> <t t-esc="this.formatAmount(state.selectedContract?.amount, state.selectedContract?.currency)"/>
                    </div>
                  </div>
                </div>
                <div class="contract-viewer" style="height: 70vh;">
                  <iframe t-att-src="state.selectedContract?.contract_url" 
                          style="width: 100%; height: 100%; border: none;"
                          title="Contract Viewer"/>
                </div>
              </div>
              <div class="modal-footer">
                <a t-att-href="state.selectedContract?.contract_download_url" 
                   class="btn btn-primary">
                  <i class="fas fa-download me-2"></i>Tải về
                </a>
                <button type="button" class="btn btn-secondary" t-on-click="() => this.closeContractModal()">
                  <i class="fas fa-times me-2"></i>Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      </t>
      
      <!-- Modal chọn cột hiển thị -->
      <t t-if="state.showColumnModal">
        <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content rounded-4 shadow">
              <div class="modal-header bg-primary text-white rounded-top-4">
                <h3 class="modal-title h5 fw-bold mb-0">Chọn cột hiển thị</h3>
                <button type="button" class="btn-close btn-close-white" t-on-click="() => this.state.showColumnModal = false"></button>
              </div>
              <div class="modal-body">
                <div class="row g-2 mb-3">
                  <div class="col-12">
                    <label><input type="checkbox" t-on-change="(ev) => this.toggleAllColumns(ev)"/> Chọn tất cả</label>
                  </div>
                  <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.transaction_date"/> Phiên giao dịch</label></div>
                  <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.account_number"/> Số tài khoản</label></div>
                  <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.investor_name"/> Nhà đầu tư</label></div>
                  <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.investor_phone"/> ĐKSH</label></div>
                  <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.fund_name"/> Quỹ</label></div>
                  <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.fund_ticker"/> Chương trình</label></div>
                  <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.transaction_code"/> Mã GD</label></div>
                  <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.transaction_type"/> Loại lệnh</label></div>
                  <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.target_fund"/> Quỹ mục tiêu</label></div>
                  <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.units"/> Số CCQ</label></div>
                  <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.unit_price"/>Giá</label></div>
                  <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.amount"/> Tổng số tiền</label></div>
                  <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.matched_units"/> Số lượng khớp</label></div>
                  <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.actions"/> Thao tác</label></div>
                </div>
                <div class="d-flex justify-content-end gap-2">
                  <button class="btn btn-secondary" t-on-click="() => this.state.showColumnModal = false">Đóng</button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-backdrop fade show" t-on-click="() => this.state.showColumnModal = false"></div>
        </div>
      </t>
    </div>
  `;

  setup() {
    const todayStr = new Date().toISOString().split('T')[0];
    this.state = useState({
      activeSubTab: 'pending',
      transactions: [],
      filteredTransactions: [],
      displayedTransactions: [],
      totalTransactions: 0,
      loading: false,
      error: null,
      showContractModal: false,
      selectedContract: null,
      showColumnModal: false,
      matchedOrders: [], // Dữ liệu lệnh khớp thỏa thuận
      filteredMatchedOrders: [], // Dữ liệu lệnh khớp đã filter
      matchedOrdersFilter: 'all', // Filter hiện tại cho matched orders
      matchedOrdersPagination: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0
      },
      // Phân trang cho regular transactions (pending/approved)
      regularPagination: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0
      },
      // State cho bulk send
      selectedPairIds: new Set(),
      transactionById: {},
      // Filter state
      fundOptions: [],
      selectedFundId: '',
      selectedDate: todayStr,
      selectedQuickDate: 'today',
      selectedMatchedFundId: '',
      selectedMatchedDate: todayStr,
      selectedMatchedQuickDate: 'today',
      visibleColumns: {
        transaction_date: true,
        account_number: true,
        investor_name: true,
        investor_phone: true,
        fund_name: true,
        fund_ticker: true,
        transaction_code: true,
        transaction_type: true,
        target_fund: true,
        units: true,
        unit_price: true,
        amount: true,
        matched_units: true,
        actions: true
      },
      filters: {
        account_number: '',
        investor_name: '',
        investor_phone: '',
        fund_name: '',
        fund_ticker: '',
        transaction_code: '',
        transaction_type: '',
        target_fund: '',
        units: '',
        unit_price: '',
        amount: '',
        matched_units: '',
        transaction_date: ''
      }
    });

    onMounted(async () => {
      await this.loadData();
      await this.loadFundOptions();
      
      // Thêm event listener cho button gửi lên sàn
      document.addEventListener('click', (e) => {
        if (e.target.closest('.btn-send-exchange')) {
          e.preventDefault();
          e.stopPropagation();
          const btn = e.target.closest('.btn-send-exchange');
          const pairId = btn.getAttribute('data-pair-id');
          
          // Kiểm tra xem đã gửi chưa
          if (btn.classList.contains('sent')) {
            this.showNotification('Cặp lệnh này đã được gửi lên sàn!', 'warning');
            return;
          }
          
          console.log(`[DEBUG] Gửi lên sàn cho pair: ${pairId}`);
          
          // Hiển thị thông báo gửi lên sàn
          this.showNotification(`📤 Đang gửi cặp lệnh ${pairId} lên sàn...`, 'info');
          
          // Simulate gửi lên sàn (có thể thay bằng API call thực tế)
          setTimeout(() => {
            // Lưu trạng thái vào localStorage
            this.saveSentPairState(pairId);
            
            // Làm mờ row
            const row = btn.closest('tr');
            if (row) {
              row.style.opacity = '0.5';
            }
            
            // Thay đổi icon và text
            btn.innerHTML = '<i class="fas fa-check"></i>';
            btn.classList.add('sent');
            btn.title = 'Đã gửi lên sàn';
            
            // Hiển thị thông báo thành công
            this.showNotification(`✅ Đã gửi cặp lệnh ${pairId} lên sàn thành công!`, 'success');
          }, 1500);
        }
      });
      
    // Khôi phục trạng thái đã gửi khi load trang
    this.restoreSentPairStates();
    
    // Thêm vào window để có thể test
    window.clearSentPairStates = () => this.clearSentPairStates();
    window.getSentPairStates = () => {
      try {
        return JSON.parse(localStorage.getItem('sentPairs') || '[]');
      } catch (error) {
        console.error('Error getting sent pair states:', error);
        return [];
      }
    };
    
    // Test API functions
    window.testAPI = async () => {
      console.log('=== TESTING API ===');
      try {
        const response = await this.rpc('/api/transaction-list/data', {});
        console.log('API Response:', response);
        return response;
      } catch (error) {
        console.error('API Error:', error);
        return error;
      }
    };
    
    window.testAPIWithFilter = async (statusFilter) => {
      console.log(`=== TESTING API WITH FILTER: ${statusFilter} ===`);
      try {
        const response = await this.rpc('/api/transaction-list/data', { status_filter: statusFilter });
        console.log('API Response:', response);
        return response;
      } catch (error) {
        console.error('API Error:', error);
        return error;
      }
    };
    
    // Force refresh display
    window.forceRefreshDisplay = () => {
      console.log('=== FORCE REFRESH DISPLAY ===');
      console.log('Current state:', {
        transactions: this.state.transactions.length,
        filteredTransactions: this.state.filteredTransactions.length,
        displayedTransactions: this.state.displayedTransactions.length,
        totalTransactions: this.state.totalTransactions,
        activeSubTab: this.state.activeSubTab
      });
      
      // Force update displayedTransactions
      this.state.displayedTransactions = [...this.state.filteredTransactions];
      this.state.totalTransactions = this.state.filteredTransactions.length;
      
      console.log('After force refresh:', {
        displayedTransactions: this.state.displayedTransactions.length,
        totalTransactions: this.state.totalTransactions
      });
    };
  });
  }

  // ===== Helpers: Date range & normalization =====
  getDateRangeFromFilters(dateStr, quickKey) {
    try {
      if (dateStr) {
        const d = new Date(dateStr);
        const from = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const to = from + (24 * 60 * 60 * 1000) - 1;
        return { from, to };
      }
      if (quickKey) {
        const today = new Date();
        let from, to;
        switch (quickKey) {
          case 'today':
            from = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
            to = from + (24 * 60 * 60 * 1000) - 1;
            return { from, to };
          case 'yesterday':
            const y = new Date(today);
            y.setDate(today.getDate() - 1);
            from = new Date(y.getFullYear(), y.getMonth(), y.getDate()).getTime();
            to = from + (24 * 60 * 60 * 1000) - 1;
            return { from, to };
          case 'last7days':
            const seven = new Date(today);
            seven.setDate(today.getDate() - 7);
            from = new Date(seven.getFullYear(), seven.getMonth(), seven.getDate()).getTime();
            to = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() + (24 * 60 * 60 * 1000) - 1;
            return { from, to };
        }
      }
    } catch (_) {}
    return { from: null, to: null };
  }

  normalizeMatchedApiData(list) {
    if (!Array.isArray(list)) return [];
    return list.map(it => ({
      ...it,
      fund_id: it.fund_id || it.buy_fund_id || it.sell_fund_id || null,
      fund_name: it.fund_name || it.buy_fund_name || it.sell_fund_name || '',
    }));
  }

  setActiveSubTab(tab) {
    console.log('Switching to tab:', tab);
    this.state.activeSubTab = tab;
    // Reset filters khi chuyển tab
    Object.keys(this.state.filters).forEach(key => {
      this.state.filters[key] = '';
    });
    
    // Reset pagination khi chuyển tab
    this.state.regularPagination.currentPage = 1;
    this.state.matchedOrdersPagination.currentPage = 1;
    this.state.selectedPairIds.clear();
    
    if (tab === 'matched_orders') {
      this.loadMatchedOrders();
    } else {
    this.loadTransactions();
    }
  }

  async loadData() {
    try {
      this.state.loading = true;
      this.state.error = null;
      
      // Load initial data based on active tab
      if (this.state.activeSubTab === 'pending' || this.state.activeSubTab === 'approved') {
      await this.loadTransactions();
      } else if (this.state.activeSubTab === 'matched_orders') {
        await this.loadMatchedOrders();
      }
      
      // Extract fund options from loaded data
      this.extractFundOptionsFromTransactions();
      
      this.state.loading = false;
    } catch (error) {
      console.error('Error loading data:', error);
      this.state.error = error.message;
      this.state.loading = false;
    }
  }

  // Helpers cho matched orders
  getMatchedPrice(pair) {
    const direct = Number(pair && (pair.matched_price || pair.sell_price || pair.sell_nav || 0));
    return isNaN(direct) ? 0 : direct;
  }

  getMatchedCCQ(pair) {
    const direct = Number(pair && (pair.matched_quantity || pair.matched_ccq || pair.matched_volume || 0));
    return isNaN(direct) ? 0 : direct;
  }

  getMatchedOrderValue(pair) {
    const tv = Number(pair && pair.total_value);
    if (!isNaN(tv) && tv > 0) return tv;
    const price = this.getMatchedPrice(pair);
    const ccq = this.getMatchedCCQ(pair);
    return price * ccq;
  }

  // Suy luận Giá mua/bán của nhà đầu tư từ nhiều nguồn
  getBuyPrice(pair) {
    if (!pair) return 0;
    // 1) Ưu tiên lấy trực tiếp từ pair
    const direct = Number(pair.buy_nav || pair.buy_price || pair.buy_current_nav); // Giữ lại cho hiển thị, nhưng không dùng để tính toán
    if (!isNaN(direct) && direct > 0) return direct;
    // 2) Lấy từ bản đồ transactionById nếu có buy_id
    const tx = this.state.transactionById && pair.buy_id ? this.state.transactionById[pair.buy_id] : null;
    if (tx && !isNaN(tx.unitPrice) && tx.unitPrice > 0) return tx.unitPrice;
    // 3) fallback từ amount/units
    const amount = Number(pair.buy_amount || pair.amount);
    const units = Number(pair.buy_units || pair.units);
    if (!isNaN(amount) && !isNaN(units) && units > 0) {
      return amount / units;
    }
    return 0;
  }

  getSellPrice(pair) {
    if (!pair) return 0;
    // 1) Ưu tiên lấy trực tiếp từ pair
    const direct = Number(pair.sell_nav || pair.sell_price || pair.sell_current_nav); // Giữ lại cho hiển thị, nhưng không dùng để tính toán
    if (!isNaN(direct) && direct > 0) return direct;
    // 2) Lấy từ bản đồ transactionById nếu có sell_id
    const tx = this.state.transactionById && pair.sell_id ? this.state.transactionById[pair.sell_id] : null;
    if (tx && !isNaN(tx.unitPrice) && tx.unitPrice > 0) return tx.unitPrice;
    // 3) fallback từ amount/units
    const amount = Number(pair.sell_amount);
    const units = Number(pair.sell_units);
    if (!isNaN(amount) && !isNaN(units) && units > 0) {
      return amount / units;
    }
    return 0;
  }

  // CCQ sau khớp: Mua cộng, Bán trừ
  getBuyAfterCCQ(pair) {
    const buyUnits = Number(pair && (pair.buy_units || 0));
    const matched = this.getMatchedCCQ(pair);
    const safeBuy = isNaN(buyUnits) ? 0 : buyUnits;
    return Math.max(0, safeBuy + matched);
  }

  getSellAfterCCQ(pair) {
    const sellUnits = Number(pair && (pair.sell_units || 0));
    const matched = this.getMatchedCCQ(pair);
    const safeSell = isNaN(sellUnits) ? 0 : sellUnits;
    return Math.max(0, safeSell - matched);
  }

  getMatchedOrdersTotals() {
    try {
      const list = this.state.filteredMatchedOrders || [];
      return list.reduce((acc, p) => {
        const ccq = Number(p.matched_quantity || p.matched_ccq || 0) || 0;
        const value = Number(p.total_value || 0) || 0;
        acc.totalCCQ += ccq;
        acc.totalValue += value;
        return acc;
      }, { totalCCQ: 0, totalValue: 0 });
    } catch (_) {
      return { totalCCQ: 0, totalValue: 0 };
    }
  }

  async loadMatchedOrders() {
    try {
      this.state.loading = true;
      this.state.error = null;
      
      // Build server-side filters from UI state
      const params = { limit: 1000 };
      if (this.state.selectedMatchedFundId) {
        params.fund_id = this.state.selectedMatchedFundId;
        // Try to also pass ticker to avoid cross-fund keyword collisions
        try {
          const fo = (this.state.fundOptions || []).find(f => String(f.value) === String(this.state.selectedMatchedFundId));
          if (fo && fo.ticker) {
            params.ticker = fo.ticker;
          }
        } catch (_) {}
      }
      const { from, to } = this.getDateRangeFromFilters(this.state.selectedMatchedDate, this.state.selectedMatchedQuickDate);
      if (from && to) {
        const pad = (n) => String(n).padStart(2, '0');
        const toStr = (t) => {
          const d = new Date(t);
          return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        };
        params.date_from = toStr(from);
        params.date_to = toStr(to);
      }

      // Gọi API matched-orders (chuẩn hóa đủ fund fields)
      const response = await this.rpc('/api/transaction-list/matched-orders', params);
      if (response && response.success) {
        const raw = Array.isArray(response.data) ? response.data : [];
        let normalized = this.normalizeMatchedApiData(raw);
        // Extra safety: client-side strict filter by fund id/ticker to avoid any backend ambiguity
        if (this.state.selectedMatchedFundId) {
          const fo = (this.state.fundOptions || []).find(f => String(f.value) === String(this.state.selectedMatchedFundId));
          const wantTicker = fo && fo.ticker ? String(fo.ticker).toUpperCase() : null;
          const wantId = Number(this.state.selectedMatchedFundId);
          normalized = normalized.filter(o => {
            const ids = [o.fund_id, o.buy_fund_id, o.sell_fund_id].map(v => Number(v || 0));
            const tickers = [o.fund_ticker, o.buy_fund_ticker, o.sell_fund_ticker]
              .filter(Boolean)
              .map(t => String(t).toUpperCase());
            const idMatch = ids.includes(wantId);
            const tickerMatch = wantTicker ? tickers.includes(wantTicker) : true;
            return idMatch && tickerMatch;
          });
        }
        this.state.matchedOrders = normalized;
        this.state.filteredMatchedOrders = this.state.matchedOrders;
        
        // Update pagination
        this.state.matchedOrdersPagination.totalItems = this.state.matchedOrders.length;
        this.state.matchedOrdersPagination.currentPage = 1;
        
        // Debug: Log matched orders data structure
        console.log('[DEBUG] ===== MATCHED ORDERS DATA STRUCTURE =====');
        if (this.state.matchedOrders.length > 0) {
          console.log('[DEBUG] Sample matched order:', this.state.matchedOrders[0]);
          console.log('[DEBUG] Available keys:', Object.keys(this.state.matchedOrders[0]));
          console.log('[DEBUG] fund_id:', this.state.matchedOrders[0].fund_id);
          console.log('[DEBUG] fund_name:', this.state.matchedOrders[0].fund_name);
          console.log('[DEBUG] match_date:', this.state.matchedOrders[0].match_date);
          console.log('[DEBUG] match_time:', this.state.matchedOrders[0].match_time);
        }
        console.log('[DEBUG] =======================================');
        
        // Extract fund options & apply current filters locally (type tabs)
        this.extractFundOptionsFromTransactions();
        this.filterMatchedOrders(this.state.matchedOrdersFilter || 'all');
        
        // Tải danh sách giao dịch để ánh xạ giá theo transaction id (giúp lấy đúng giá mua/bán)
        try {
          const allTxResp = await this.rpc('/api/transaction-list/data', {});
          if (allTxResp && allTxResp.success && Array.isArray(allTxResp.data)) {
            const map = {};
            allTxResp.data.forEach(tx => {
              const id = tx && tx.id;
              if (id !== undefined && id !== null) {
                const amount = Number(tx.amount);
                const units = Number(tx.units);
                // Ưu tiên current_nav hoặc unit_price, fallback amount/units (giữ lại cho hiển thị, nhưng không dùng để tính toán)
                const unitPrice = !isNaN(Number(tx.current_nav)) && Number(tx.current_nav) > 0
                  ? Number(tx.current_nav)
                  : (!isNaN(Number(tx.unit_price)) && Number(tx.unit_price) > 0
                    ? Number(tx.unit_price)
                    : (!isNaN(amount) && !isNaN(units) && units > 0 ? amount / units : 0));
                map[id] = {
                  unitPrice,
                  amount: isNaN(amount) ? 0 : amount,
                  units: isNaN(units) ? 0 : units,
                  raw: tx
                };
              }
            });
            this.state.transactionById = map;
          } else {
            this.state.transactionById = {};
          }
        } catch (_) {
          this.state.transactionById = {};
        }

        console.log('Loaded matched orders:', this.state.matchedOrders.length);
        console.log('Sample matched order:', this.state.matchedOrders[0]);
      } else {
        this.state.matchedOrders = [];
        this.state.filteredMatchedOrders = [];
        this.state.matchedOrdersPagination.totalItems = 0;
        this.state.matchedOrdersPagination.currentPage = 1;
        this.state.displayedTransactions = [];
        this.state.totalTransactions = 0;
        console.log('No matched orders found');
        console.log('Response:', response);
      }
      
      this.state.loading = false;
      
      // Khôi phục trạng thái đã gửi lên sàn sau khi load xong
      this.restoreSentPairStates();
    } catch (error) {
      console.error('Error loading matched orders:', error);
      this.state.error = 'Không thể tải danh sách lệnh khớp thỏa thuận';
      this.state.loading = false;
    }
  }

  async refreshMatchedOrders() {
    console.log('Refreshing matched orders...');
    await this.loadMatchedOrders();
  }

  filterMatchedOrders(filterType) {
    console.log('Filtering matched orders by:', filterType);
    this.state.matchedOrdersFilter = filterType;
    this.state.matchedOrdersPagination.currentPage = 1; // Reset về trang 1
    
    if (filterType === 'all') {
      this.state.filteredMatchedOrders = this.state.matchedOrders;
    } else if (filterType === 'investor') {
      // Chỉ hiển thị cặp lệnh có nhà đầu tư (không có market maker)
      this.state.filteredMatchedOrders = this.state.matchedOrders.filter(pair => {
        const buyIsInvestor = pair.buy_user_type === 'investor';
        const sellIsInvestor = pair.sell_user_type === 'investor';
        return buyIsInvestor && sellIsInvestor;
      });
    } else if (filterType === 'market_maker') {
      // Hiển thị cặp lệnh có market maker
      this.state.filteredMatchedOrders = this.state.matchedOrders.filter(pair => {
        const buyIsMM = pair.buy_user_type === 'market_maker';
        const sellIsMM = pair.sell_user_type === 'market_maker';
        return buyIsMM || sellIsMM;
      });
    }
    
    // Apply additional dropdown filters (fund, date) on top of type filter
    this.applyAdditionalMatchedFilters(this.state.filteredMatchedOrders);
  }

  applyAdditionalMatchedFilters(filtered) {
    console.log('[DEBUG] Applying additional matched filters to', filtered.length, 'orders');
    
    // Filter by fund - check both buy and sell fund
    if (this.state.selectedMatchedFundId) {
      console.log('[DEBUG] Filtering matched orders by fund:', this.state.selectedMatchedFundId);
      const beforeLength = filtered.length;
      
      // Debug: Check data structure first
      if (filtered.length > 0) {
        const sampleOrder = filtered[0];
        console.log('[DEBUG] Sample matched order:', sampleOrder);
        console.log('[DEBUG] Available keys:', Object.keys(sampleOrder));
        console.log('[DEBUG] buy_fund_id:', sampleOrder.buy_fund_id);
        console.log('[DEBUG] sell_fund_id:', sampleOrder.sell_fund_id);
        console.log('[DEBUG] fund_id:', sampleOrder.fund_id);
      }
      
      filtered = filtered.filter(order => {
        // Check if selected fund matches buy fund OR sell fund
        const buyFundMatches = Number(order.buy_fund_id || order.fund_id) === Number(this.state.selectedMatchedFundId);
        const sellFundMatches = Number(order.sell_fund_id || order.fund_id) === Number(this.state.selectedMatchedFundId);
        const matches = buyFundMatches || sellFundMatches;
        
        if (!matches) {
          console.log(`[DEBUG] Matched order ${order.id || 'N/A'} buy_fund_id ${order.buy_fund_id} and sell_fund_id ${order.sell_fund_id} do not match selected ${this.state.selectedMatchedFundId}`);
        }
        return matches;
      });
      console.log(`[DEBUG] After matched fund filter: ${filtered.length} (from ${beforeLength})`);
    }

    // Filter by date
    if (this.state.selectedMatchedDate) {
      const beforeLength = filtered.length;

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.match_date || order.match_time || order.created_at || order.create_date);
        if (!orderDate) return false;
        
        // So sánh ngày không tính timezone
        const orderDateStr = orderDate.getFullYear() + '-' + 
          String(orderDate.getMonth() + 1).padStart(2, '0') + '-' + 
          String(orderDate.getDate()).padStart(2, '0');
        
        const matches = orderDateStr === this.state.selectedMatchedDate;
        if (!matches) {
          console.log(`[DEBUG] Matched order ${order.id || 'N/A'} date ${order.match_date || order.match_time} (${orderDateStr}) does not match selected date (${this.state.selectedMatchedDate})`);
        }
        return matches;
      });
      console.log(`[DEBUG] After additional date filter: ${filtered.length} (from ${beforeLength})`);
    }

    // Filter by quick date
    if (this.state.selectedMatchedQuickDate) {
      const today = new Date();
      let fromTime, toTime;
      const beforeLength = filtered.length;

      switch (this.state.selectedMatchedQuickDate) {
        case 'today':
          fromTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
          toTime = fromTime + (24 * 60 * 60 * 1000) - 1;
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          fromTime = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).getTime();
          toTime = fromTime + (24 * 60 * 60 * 1000) - 1;
          break;
        case 'last7days':
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          fromTime = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate()).getTime();
          toTime = today.getTime() + (24 * 60 * 60 * 1000) - 1;
          break;
      }

      if (fromTime && toTime) {
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.match_date || order.match_time || order.created_at || order.create_date);
          const orderTime = orderDate.getTime();
          return orderTime >= fromTime && orderTime <= toTime;
        });
        console.log(`[DEBUG] After additional quick date filter: ${filtered.length} (from ${beforeLength})`);
      }
    }

    this.state.filteredMatchedOrders = filtered;
    this.state.matchedOrdersPagination.totalItems = filtered.length;
    this.state.matchedOrdersPagination.currentPage = 1;
    this.updateMatchedOrdersDisplay();
    
    // Khôi phục trạng thái đã gửi lên sàn sau khi filter
    this.restoreSentPairStates();
    
    console.log(`Filtered to ${this.state.filteredMatchedOrders.length} pairs`);
  }

  updateMatchedOrdersDisplay() {
    const { currentPage, itemsPerPage } = this.state.matchedOrdersPagination;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    this.state.displayedTransactions = this.state.filteredMatchedOrders.slice(startIndex, endIndex);
    this.state.totalTransactions = this.state.filteredMatchedOrders.length;
  }

  changeMatchedOrdersPage(page) {
    if (page < 1 || page > this.getMatchedOrdersTotalPages()) return;
    this.state.matchedOrdersPagination.currentPage = page;
    this.updateMatchedOrdersDisplay();
  }

  getMatchedOrdersTotalPages() {
    return Math.ceil(this.state.matchedOrdersPagination.totalItems / this.state.matchedOrdersPagination.itemsPerPage);
  }

  // Phân trang cho Regular Transactions
  getRegularTotalPages() {
    return Math.ceil(this.state.regularPagination.totalItems / this.state.regularPagination.itemsPerPage);
  }

  getRegularPaginationStart() {
    return (this.state.regularPagination.currentPage - 1) * this.state.regularPagination.itemsPerPage + 1;
  }

  getRegularPaginationEnd() {
    const end = this.state.regularPagination.currentPage * this.state.regularPagination.itemsPerPage;
    return Math.min(end, this.state.regularPagination.totalItems);
  }

  changeRegularPage(page) {
    const totalPages = this.getRegularTotalPages();
    if (page < 1 || page > totalPages) return;
    this.state.regularPagination.currentPage = page;
    this.updateRegularDisplay();
  }

  updateRegularDisplay() {
    const { currentPage, itemsPerPage } = this.state.regularPagination;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    this.state.displayedTransactions = this.state.filteredTransactions.slice(startIndex, endIndex);
  }

  // Checkbox management functions
  toggleSelectAllPairs(checked) {
    if (checked) {
      // Chọn tất cả pairs hiện tại đang hiển thị
      this.state.displayedTransactions.forEach(pair => {
        if (!this.isPairSentToExchange(pair)) {
          const pairId = `${pair.buy_id}-${pair.sell_id}`;
          this.state.selectedPairIds.add(pairId);
        }
      });
    } else {
      // Bỏ chọn tất cả
      this.state.selectedPairIds.clear();
    }
  }

  toggleSelectPair(pair, checked) {
    const pairId = `${pair.buy_id}-${pair.sell_id}`;
    if (checked) {
      this.state.selectedPairIds.add(pairId);
    } else {
      this.state.selectedPairIds.delete(pairId);
    }
  }

  isPairSelected(pair) {
    const pairId = `${pair.buy_id}-${pair.sell_id}`;
    return this.state.selectedPairIds.has(pairId);
  }

  isPairSentToExchange(pair) {
    // Kiểm tra từ state backend nếu có
    if (pair.buy_sent_to_exchange || pair.sell_sent_to_exchange) {
      return true;
    }
    
    // Fallback: kiểm tra từ localStorage
    const pairId = `${pair.buy_id}-${pair.sell_id}`;
    try {
      const sentPairs = JSON.parse(localStorage.getItem('sentPairs') || '[]');
      return sentPairs.includes(pairId);
    } catch (e) {
      return false;
    }
  }

  async bulkSendToExchange() {
    if (this.state.selectedPairIds.size === 0) {
      this.showNotification('Vui lòng chọn ít nhất một cặp lệnh để gửi lên sàn', 'warning');
      return;
    }

    try {
      const pairIds = Array.from(this.state.selectedPairIds);
      
      this.showNotification(`Đang gửi ${pairIds.length} cặp lệnh lên sàn...`, 'info');

      const response = await fetch('/api/transaction-list/bulk-send-to-exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            pair_ids: pairIds
          }
        })
      });

      const result = await response.json();
      
      if (result.result && result.result.success) {
        // Thành công
        const { sent_count, failed_count, failed_pairs } = result.result;
        
        // Clear selected pairs
        this.state.selectedPairIds.clear();
        
        // Refresh data để cập nhật trạng thái
        await this.loadMatchedOrders();
        
        let message = `Đã gửi ${sent_count} cặp lệnh lên sàn thành công!`;
        if (failed_count > 0) {
          message += ` (Thất bại: ${failed_count} cặp)`;
        }
        
        this.showNotification(message, sent_count > 0 ? 'success' : 'warning');
        
        if (failed_pairs && failed_pairs.length > 0) {
          console.log('Failed pairs:', failed_pairs);
        }
      } else {
        // Thất bại
        this.showNotification(result.result?.message || 'Có lỗi xảy ra khi gửi lên sàn', 'error');
      }
    } catch (error) {
      console.error('Error bulk sending to exchange:', error);
      this.showNotification(`Có lỗi xảy ra: ${error.message}`, 'error');
    }
  }

  // Lưu trạng thái đã gửi lên sàn vào localStorage
  saveSentPairState(pairId) {
    try {
      const sentPairs = JSON.parse(localStorage.getItem('sentPairs') || '[]');
      if (!sentPairs.includes(pairId)) {
        sentPairs.push(pairId);
        localStorage.setItem('sentPairs', JSON.stringify(sentPairs));
        console.log(`[DEBUG] Đã lưu trạng thái gửi lên sàn cho pair: ${pairId}`);
      }
    } catch (error) {
      console.error('Error saving sent pair state:', error);
    }
  }

  // Khôi phục trạng thái đã gửi lên sàn từ localStorage
  restoreSentPairStates() {
    try {
      const sentPairs = JSON.parse(localStorage.getItem('sentPairs') || '[]');
      console.log(`[DEBUG] Khôi phục trạng thái cho ${sentPairs.length} cặp lệnh đã gửi`);
      
      // Sử dụng setTimeout để đảm bảo DOM đã render xong
      setTimeout(() => {
        sentPairs.forEach(pairId => {
          const btn = document.querySelector(`[data-pair-id="${pairId}"]`);
          if (btn && !btn.classList.contains('sent')) {
            // Làm mờ row
            const row = btn.closest('tr');
            if (row) {
              row.style.opacity = '0.5';
            }
            
            // Thay đổi icon và text
            btn.innerHTML = '<i class="fas fa-check"></i>';
            btn.classList.add('sent');
            btn.title = 'Đã gửi lên sàn';
            
            console.log(`[DEBUG] Đã khôi phục trạng thái cho pair: ${pairId}`);
          }
        });
      }, 100);
    } catch (error) {
      console.error('Error restoring sent pair states:', error);
    }
  }

  // Xóa trạng thái đã gửi (có thể dùng khi cần reset)
  clearSentPairStates() {
    try {
      localStorage.removeItem('sentPairs');
      console.log('[DEBUG] Đã xóa tất cả trạng thái gửi lên sàn');
      
      // Reset tất cả button về trạng thái ban đầu
      const sentButtons = document.querySelectorAll('.btn-send-exchange.sent');
      sentButtons.forEach(btn => {
        btn.classList.remove('sent');
        btn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        btn.title = 'Gửi lên sàn';
        
        const row = btn.closest('tr');
        if (row) {
          row.style.opacity = '1';
        }
      });
      
      console.log(`[DEBUG] Đã reset ${sentButtons.length} button về trạng thái ban đầu`);
    } catch (error) {
      console.error('Error clearing sent pair states:', error);
    }
  }


  showNotification(message, type = 'info') {
    // Tạo notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Tự động ẩn sau 3 giây
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  async loadTransactions() {
    try {
      this.state.loading = true;
      this.state.error = null;
      
      // Map tab to correct status filter
      let statusFilter;
      if (this.state.activeSubTab === 'pending') {
        statusFilter = 'pending';
      } else if (this.state.activeSubTab === 'approved') {
        statusFilter = 'approved'; // This will be mapped to 'completed' in backend
      }
      
      console.log('Loading transactions with filter:', statusFilter);
      console.log('Active tab:', this.state.activeSubTab);
      
      const params = {
        status_filter: statusFilter
      };
      console.log('Sending params:', params);
      
      const response = await this.rpc('/api/transaction-list/data', params);
      
      // Debug: Log full response
      console.log('=== DEBUG API RESPONSE ===');
      console.log('Response:', response);
      console.log('Response success:', response?.success);
      console.log('Response data:', response?.data);
      console.log('Response data length:', response?.data?.length);
      console.log('Response message:', response?.message);
      console.log('========================');
      
      // Nếu không có dữ liệu với status_filter, thử lấy tất cả dữ liệu
      if (response && response.success && (!response.data || response.data.length === 0) && statusFilter) {
        console.log(`[DEBUG] No data with status_filter '${statusFilter}', trying to get all data`);
        const allDataResponse = await this.rpc('/api/transaction-list/data', {});
        if (allDataResponse && allDataResponse.success && allDataResponse.data) {
          console.log(`[DEBUG] Got ${allDataResponse.data.length} transactions from all data`);
          response.data = allDataResponse.data;
        }
      }

      console.log('API Response:', response);
      console.log('Response success:', response?.success);
      console.log('Response data length:', response?.data?.length);
      if (response?.data && response.data.length > 0) {
        console.log('First transaction status:', response.data[0].status);
        console.log('All transaction statuses:', response.data.map(t => t.status));
        console.log('All transaction IDs:', response.data.map(t => t.id));
        console.log('All transaction sources:', response.data.map(t => t.source));
      }

      if (response && response.success) {
        // Lọc dữ liệu theo status ngay tại đây để đảm bảo đúng
        let filteredData = response.data || [];
        
        console.log('Raw data from API:', filteredData);
        console.log('Number of transactions from API:', filteredData.length);
        
        // Nếu API không lọc đúng, lọc lại ở frontend
        if (statusFilter) {
          const expectedStatus = statusFilter === 'approved' ? 'completed' : statusFilter; // Map approved -> completed
          console.log(`[DEBUG] Filtering data with expected status: ${expectedStatus} (original filter: ${statusFilter})`);
          console.log(`[DEBUG] Available statuses in data:`, [...new Set(filteredData.map(t => t.status))]);
          
          filteredData = filteredData.filter(transaction => {
            const matches = transaction.status === expectedStatus;
            if (!matches) {
              console.log(`[DEBUG] Transaction ${transaction.id} status '${transaction.status}' does not match expected '${expectedStatus}'`);
            }
            return matches;
          });
          console.log(`Filtered to ${filteredData.length} transactions with status: ${expectedStatus}`);
        }
        
        this.state.transactions = filteredData;
        this.state.totalTransactions = this.state.transactions.length;
        console.log('Final loaded transactions:', this.state.transactions.length);
        if (this.state.transactions.length > 0) {
          console.log('Sample transaction:', this.state.transactions[0]);
          console.log('Sample transaction ID:', this.state.transactions[0].id);
          console.log('Sample transaction status:', this.state.transactions[0].status);
          console.log('All transaction IDs:', this.state.transactions.map(t => t.id));
        }
        
        // Áp dụng các filter từ form nếu có
        this.applyAllFilters();
        
        // Cập nhật phân trang
        this.state.regularPagination.totalItems = this.state.filteredTransactions.length;
        this.state.regularPagination.currentPage = 1;
        this.updateRegularDisplay();
        
        // Debug: Log final state
        console.log('=== DEBUG FINAL STATE ===');
        console.log('transactions.length:', this.state.transactions.length);
        console.log('filteredTransactions.length:', this.state.filteredTransactions.length);
        console.log('displayedTransactions.length:', this.state.displayedTransactions.length);
        console.log('totalTransactions:', this.state.totalTransactions);
        console.log('========================');
      } else {
        console.error('Error loading transactions:', response ? response.message : 'No response');
        this.state.transactions = [];
        this.state.totalTransactions = 0;
        this.state.filteredTransactions = [];
        this.state.displayedTransactions = [];
      }
      
      this.state.loading = false;
    } catch (error) {
      console.error('Error loading transactions:', error);
      this.state.error = error.message;
      this.state.transactions = [];
      this.state.totalTransactions = 0;
      this.state.filteredTransactions = [];
      this.state.displayedTransactions = [];
      this.state.loading = false;
    }
  }


  filterTable(field, value) {
    this.state.filters[field] = value;
    this.applyFilters();
  }

  applyFormFilters() {
    let filtered = [...this.state.transactions];

    Object.keys(this.state.filters).forEach(field => {
      const value = this.state.filters[field];
      if (value && value.trim() !== '') {
        filtered = filtered.filter(item => {
          const itemValue = String(item[field] || '').toLowerCase();
          
          // Special handling for date filter
          if (field === 'transaction_date' && value) {
            const itemDate = item[field] ? new Date(item[field]) : null;
            if (!itemDate) return false;
            // So sánh ngày không tính timezone
            const itemDateStr = itemDate.getFullYear() + '-' + 
              String(itemDate.getMonth() + 1).padStart(2, '0') + '-' + 
              String(itemDate.getDate()).padStart(2, '0');
            return itemDateStr === value;
          }
          
          return itemValue.includes(value.toLowerCase());
        });
      }
    });

    this.state.filteredTransactions = filtered;
    
    // Cập nhật phân trang khi filter thay đổi
    this.state.regularPagination.totalItems = filtered.length;
    this.state.regularPagination.currentPage = 1;
    this.updateRegularDisplay();
  }

  applyFilters() {
    // Kết hợp cả filter cũ (text filters) và filter mới (dropdown filters)
    this.applyAllFilters();
  }

  applyAllFilters() {
    console.log('[DEBUG] ===== APPLY ALL FILTERS DEBUG START =====');
    console.log('[DEBUG] selectedFundId:', this.state.selectedFundId);
    console.log('[DEBUG] selectedDate:', this.state.selectedDate);
    console.log('[DEBUG] selectedQuickDate:', this.state.selectedQuickDate);
    console.log('[DEBUG] form filters:', this.state.filters);
    console.log('[DEBUG] Original transactions length:', this.state.transactions.length);
    
    let filtered = [...this.state.transactions];

    // 1. Apply dropdown filters first (fund, date)
    if (this.state.selectedFundId) {
      console.log('[DEBUG] Filtering by fund:', this.state.selectedFundId);
      const beforeLength = filtered.length;
      filtered = filtered.filter(tx => {
        const matches = Number(tx.fund_id) === Number(this.state.selectedFundId);
        if (!matches) {
          console.log(`[DEBUG] Transaction ${tx.id} fund_id ${tx.fund_id} (${typeof tx.fund_id}) does not match selected ${this.state.selectedFundId} (${typeof this.state.selectedFundId})`);
        }
        return matches;
      });
      console.log(`[DEBUG] After fund filter: ${filtered.length} (from ${beforeLength})`);
    }

    // Filter by specific date
    if (this.state.selectedDate) {
      console.log('[DEBUG] Filtering by date:', this.state.selectedDate);
      const beforeLength = filtered.length;

      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.transaction_date || tx.created_at || tx.create_date);
        if (!txDate) return false;
        
        // So sánh ngày không tính timezone
        const txDateStr = txDate.getFullYear() + '-' + 
          String(txDate.getMonth() + 1).padStart(2, '0') + '-' + 
          String(txDate.getDate()).padStart(2, '0');
        
        const matches = txDateStr === this.state.selectedDate;
        if (!matches) {
          console.log(`[DEBUG] Transaction ${tx.id} date ${tx.transaction_date} (${txDateStr}) does not match selected date (${this.state.selectedDate})`);
        }
        return matches;
      });
      console.log(`[DEBUG] After date filter: ${filtered.length} (from ${beforeLength})`);
    }

    // Filter by quick date
    if (this.state.selectedQuickDate) {
      console.log('[DEBUG] Filtering by quick date:', this.state.selectedQuickDate);
      const today = new Date();
      let fromTime, toTime;
      const beforeLength = filtered.length;

      switch (this.state.selectedQuickDate) {
        case 'today':
          fromTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
          toTime = fromTime + (24 * 60 * 60 * 1000) - 1;
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          fromTime = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).getTime();
          toTime = fromTime + (24 * 60 * 60 * 1000) - 1;
          break;
        case 'last7days':
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          fromTime = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate()).getTime();
          toTime = today.getTime() + (24 * 60 * 60 * 1000) - 1;
          break;
      }

      if (fromTime && toTime) {
        console.log('[DEBUG] Quick date range:', new Date(fromTime), 'to', new Date(toTime));
        filtered = filtered.filter(tx => {
          const txDate = new Date(tx.transaction_date || tx.created_at || tx.create_date);
          const txTime = txDate.getTime();
          const matches = txTime >= fromTime && txTime <= toTime;
          if (!matches) {
            console.log(`[DEBUG] Transaction ${tx.id} date ${tx.transaction_date} does not match quick date range`);
          }
          return matches;
        });
        console.log(`[DEBUG] After quick date filter: ${filtered.length} (from ${beforeLength})`);
      }
    }

    // 2. Apply text filters from form (existing logic)
    Object.keys(this.state.filters).forEach(field => {
      const value = this.state.filters[field];
      if (value && value.trim() !== '') {
        console.log(`[DEBUG] Applying text filter ${field}:`, value);
        const beforeLength = filtered.length;
        filtered = filtered.filter(item => {
          const itemValue = String(item[field] || '').toLowerCase();
          
          // Special handling for date filter
          if (field === 'transaction_date' && value) {
            const itemDate = item[field] ? new Date(item[field]) : null;
            if (!itemDate) return false;
            // So sánh ngày không tính timezone
            const itemDateStr = itemDate.getFullYear() + '-' + 
              String(itemDate.getMonth() + 1).padStart(2, '0') + '-' + 
              String(itemDate.getDate()).padStart(2, '0');
            return itemDateStr === value;
          }
          
          return itemValue.includes(value.toLowerCase());
        });
        console.log(`[DEBUG] After text filter ${field}: ${filtered.length} (from ${beforeLength})`);
      }
    });

    console.log('[DEBUG] Final filtered length:', filtered.length);
    console.log('[DEBUG] ===== APPLY ALL FILTERS DEBUG END =====');

    this.state.filteredTransactions = filtered;
    this.state.regularPagination.totalItems = filtered.length;
    this.state.regularPagination.currentPage = 1;
    this.updateRegularDisplay();
  }


  getTransactionTypeDisplay(type) {
    const types = {
      'purchase': 'Lệnh mua',
      'sell': 'Lệnh bán',
      'exchange': 'Lệnh chuyển đổi'
    };
    return types[type] || type;
  }

  getTransactionTypeClass(type) {
    const classes = {
      'purchase': 'status-buy',
      'sell': 'status-sell',
      'exchange': 'status-pending'
    };
    return classes[type] || 'status-pending';
  }

  async deleteTransaction(transactionId) {
    console.log('Delete transaction called with ID:', transactionId);
    console.log('Transaction ID type:', typeof transactionId);
    
    if (!confirm('Bạn có chắc chắn muốn xóa giao dịch này? Hành động này không thể hoàn tác.')) {
      console.log('User cancelled deletion');
      return;
    }

    try {
      console.log('Sending delete request for transaction ID:', transactionId);
      
      // Đảm bảo transactionId là số
      const numericId = parseInt(transactionId);
      console.log('Numeric ID:', numericId);
      
      // Thử phương thức đơn giản trước
      const formData = new FormData();
      formData.append('transaction_id', numericId);
      
      console.log('Using simple HTTP delete method');
      
      const response = await fetch('/api/transaction-list/delete-simple', {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Delete result:', result);

      if (result.success) {
        console.log('Transaction deleted successfully');
        alert('Giao dịch đã được xóa thành công!');
        this.loadTransactions(); // Reload data
      } else {
        const errorMessage = result.message || 'Không thể xóa giao dịch';
        console.error('Delete failed:', errorMessage);
        alert('Lỗi: ' + errorMessage);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Fallback to original method if simple method fails
      console.log('Trying fallback method...');
      try {
        const params = {
          transaction_id: parseInt(transactionId)
        };
        
        const response = await this.rpc('/api/transaction-list/delete', params);
        console.log('Fallback response:', response);
        
        if (response && response.success) {
          console.log('Transaction deleted successfully via fallback');
          alert('Giao dịch đã được xóa thành công!');
          this.loadTransactions();
        } else {
          const errorMessage = response?.message || 'Không thể xóa giao dịch';
          alert('Lỗi: ' + errorMessage);
        }
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
        alert('Có lỗi xảy ra khi xóa giao dịch: ' + error.message);
      }
    }
  }

  async exportData() {
    try {
      const statusFilter = this.state.activeSubTab === 'pending' ? 'pending' : 'approved';
      const response = await this.rpc('/api/transaction-list/export', {
        status_filter: statusFilter
      });

      if (response.success) {
        this.downloadCSV(response.data, response.filename);
      } else {
        alert('Lỗi: ' + response.message);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Có lỗi xảy ra khi xuất dữ liệu');
    }
  }

  downloadCSV(content, fileName) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  refreshData() {
    this.loadData();
  }

  // ==== TEST API METHODS ====
  async createRandomTransactions() {
    try {
      const response = await fetch('/api/transaction-list/create-random', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (result.success) {
        this.showNotification('🎲 Tạo Random Transactions Thành Công! (12 giao dịch: Lệnh mua từ current NAV trở lên, Lệnh bán từ giá trung bình NAV đầu ngày × chi phí vốn, làm tròn bội số 50)', 'success');
        
        // Hiển thị danh sách giao dịch được tạo
        if (result.transactions) {
          console.log('Giao dịch được tạo (sắp xếp theo thời gian):', result.transactions);
        }
        
        // Debug: Log current tab before reload
        console.log('=== DEBUG BEFORE RELOAD ===');
        console.log('Current activeSubTab:', this.state.activeSubTab);
        console.log('========================');
        
        // Reload data để hiển thị transactions mới
        this.loadData();
      } else {
        this.showNotification('❌ Lỗi khi tạo random transactions: ' + result.message, 'error');
      }
    } catch (error) {
      this.showNotification('❌ Lỗi kết nối: ' + error.message, 'error');
    }
  }


  async matchOrders() {
    try {
      const payload = {
        status_mode: 'auto',
        use_time_priority: true,
        match_type: 'investor_investor', // Chỉ khớp investor-investor
      };
      // Nếu có filter fund đang chọn, gửi kèm để khớp theo quỹ
      if (this.state?.filters?.matchedFundId) {
        payload.fund_id = this.state.filters.matchedFundId;
      }
      const response = await fetch('/api/transaction-list/match-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('[DEBUG] Khớp lệnh thành công:', result);
        console.log('[DEBUG] Số cặp lệnh khớp:', result.matched_pairs?.length || 0);
        
        this.showNotification(`✅ Khớp Lệnh Thành Công! Đã khớp ${result.matched_pairs?.length || 0} cặp lệnh`, 'success');
        
        // Hiển thị popup với các cặp lệnh khớp (sẽ lấy từ backend)
        this.showMatchingResults(result);
        
        // Reload data để hiển thị trạng thái mới
        this.loadData();
      } else {
        console.error('[DEBUG] Khớp lệnh thất bại:', result);
        this.showNotification('❌ Lỗi khi khớp lệnh: ' + result.message, 'error');
      }
    } catch (error) {
      this.showNotification('❌ Lỗi kết nối: ' + error.message, 'error');
    }
  }

  async marketMakerHandleRemainingFromMenu() {
    try {
      // BẮT BUỘC: lọc theo lợi nhuận dựa trên NAV hiện tại và cap chặn trên/dưới
      const selectedFundId = this.state.selectedFundId || this.state.selectedMatchedFundId;
      if (!selectedFundId) {
        this.showNotification('⚠️ Vui lòng chọn Quỹ trước khi Market Maker xử lý.', 'warning');
        return;
      }

      // Xác định khoảng ngày theo filter UI (ưu tiên selectedMatchedDate để đồng bộ với bảng khớp lệnh)
      const dateStr = this.state.selectedMatchedDate || this.state.selectedDate || '';
      let fromDate = null, toDate = null;
      if (dateStr) {
        fromDate = `${dateStr}`;
        toDate = `${dateStr}`;
      }

      // Sử dụng API từ nav_management để tính toán và lọc lệnh có lãi
      let profitableData;
      let profitableTransactions = [];
      
      try {
        const profitableResponse = await fetch('/nav_management/api/calculate_nav_transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            params: {
              fund_id: Number(selectedFundId),
              from_date: fromDate,
              to_date: toDate
            }
          })
        });

        console.log('[DEBUG] Profitable API response status:', profitableResponse.status);
        console.log('[DEBUG] Profitable API response ok:', profitableResponse.ok);

        if (!profitableResponse.ok) {
          const errorText = await profitableResponse.text();
          console.error('[DEBUG] API response error:', errorText);
          console.warn('[DEBUG] Fallback to old getProfitableTxIds method');
          // Fallback to old method
          const profitableIds = await this.getProfitableTxIds(selectedFundId, fromDate, toDate);
          profitableTransactions = Array.from(profitableIds).map(id => ({ id: id }));
        } else {
          profitableData = await profitableResponse.json();
          console.log('[DEBUG] Profitable API response data:', profitableData);

          // Kiểm tra JSON-RPC response format
          if (profitableData.result && profitableData.result.success) {
            // API trả về success=true trong result
            profitableTransactions = profitableData.result.transactions || [];
            console.log('[DEBUG] API success=true, transactions:', profitableTransactions.length);
          } else if (profitableData.result && !profitableData.result.success) {
            // API trả về success=false trong result
            console.error('[DEBUG] API returned success=false in result:', profitableData.result);
            console.warn('[DEBUG] Fallback to old getProfitableTxIds method');
            const profitableIds = await this.getProfitableTxIds(selectedFundId, fromDate, toDate);
            profitableTransactions = Array.from(profitableIds).map(id => ({ id: id }));
          } else if (profitableData.success === false) {
            // API trả về success=false ở root level
            console.error('[DEBUG] API returned success=false at root:', profitableData);
            console.warn('[DEBUG] Fallback to old getProfitableTxIds method');
            const profitableIds = await this.getProfitableTxIds(selectedFundId, fromDate, toDate);
            profitableTransactions = Array.from(profitableIds).map(id => ({ id: id }));
          } else {
            // Không có success field, thử lấy transactions trực tiếp
            profitableTransactions = profitableData.transactions || profitableData.result?.transactions || [];
            console.log('[DEBUG] No success field, using transactions directly:', profitableTransactions.length);
          }
        }
      } catch (error) {
        console.error('[DEBUG] Exception when calling profitable API:', error);
        console.warn('[DEBUG] Fallback to old getProfitableTxIds method');
        // Fallback to old method
        try {
          const profitableIds = await this.getProfitableTxIds(selectedFundId, fromDate, toDate);
          profitableTransactions = Array.from(profitableIds).map(id => ({ id: id }));
        } catch (fallbackError) {
          console.error('[DEBUG] Fallback method also failed:', fallbackError);
          this.showNotification('❌ Lỗi tính toán lãi: Không thể kết nối API', 'error');
          return;
        }
      }

      if (profitableTransactions.length === 0) {
        this.showNotification('ℹ️ Không có lệnh nào thỏa điều kiện lãi để Market Maker xử lý.', 'info');
        return;
      }

      // Lấy danh sách ID các lệnh có lãi
      const profitableIds = new Set(profitableTransactions.map(tx => Number(tx.id)));

      // Gọi khớp lệnh trước để lấy remaining
      const matchResp = await fetch('/api/transaction-list/match-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const matchData = await matchResp.json();
      if (!matchData.success) {
        this.showNotification('❌ Lỗi khớp lệnh: ' + (matchData.message || 'Không xác định'), 'error');
        return;
      }

      // Gắn nhãn nguồn cho cặp từ engine khớp lệnh
      const enginePairs = (matchData.matched_pairs || []).map(p => ({ ...p, _sourceType: 'investor' }));

      const remainingBuys = (matchData.remaining?.buys || []).map(b => b.id);
      const remainingSells = (matchData.remaining?.sells || []).map(s => s.id);

      if (remainingBuys.length === 0 && remainingSells.length === 0) {
        this.showNotification('ℹ️ Không còn lệnh chờ để Market Maker xử lý.', 'info');
        // Hiển thị popup với thông tin lệnh có lãi nhưng không có lệnh pending
        this.showMatchingResults({
          matched_pairs: enginePairs,
          remaining: matchData.remaining || { buys: [], sells: [] },
          algorithm_used: matchData.algorithm_used || 'Best Price First',
          profitable_info: {
            total_profitable: profitableTransactions.length,
            profitable_transactions: profitableTransactions,
            is_fallback: !profitableData || (!profitableData.result?.success && !profitableData.success)
          }
        });
        return;
      }

      // Lọc chỉ các lệnh CÓ LÃI để Market Maker xử lý
      const filteredBuys = remainingBuys.filter(id => profitableIds.has(Number(id)));
      const filteredSells = remainingSells.filter(id => profitableIds.has(Number(id)));
      
      if (filteredBuys.length === 0 && filteredSells.length === 0) {
        this.showNotification('ℹ️ Không có lệnh pending nào thỏa điều kiện lãi để Market Maker xử lý.', 'info');
        // Hiển thị popup với thông tin lệnh có lãi nhưng không có lệnh pending
        this.showMatchingResults({
          matched_pairs: enginePairs,
          remaining: matchData.remaining || { buys: [], sells: [] },
          algorithm_used: matchData.algorithm_used || 'Best Price First',
          profitable_info: {
            total_profitable: profitableTransactions.length,
            profitable_transactions: profitableTransactions,
            is_fallback: !profitableData || (!profitableData.result?.success && !profitableData.success)
          }
        });
        return;
      }

      // Gọi xử lý phần còn lại bằng Market Maker chỉ với các lệnh CÓ LÃI
      const resp = await fetch('/api/transaction-list/market-maker/handle-remaining', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remaining_buys: filteredBuys, remaining_sells: filteredSells })
      });
      const data = await resp.json();
      if (data.success) {
        this.showNotification('✅ Market Maker đã xử lý phần còn lại', 'success');
        // Kết hợp cặp từ matchData và từ market maker để hiển thị đầy đủ
        const mmPairs = (data.matched_pairs || []).map(p => ({ ...p, _sourceType: 'market_maker' }));
        const combinedPairs = [
          ...enginePairs,
          ...mmPairs
        ];
        const modalPayload = {
          matched_pairs: combinedPairs,
          remaining: data.remaining || matchData.remaining || { buys: [], sells: [] },
          algorithm_used: `Market Maker + ${matchData.algorithm_used || 'Best Price First'}`,
          match_type: 'market_maker_investor', // Chỉ hiển thị market maker-investor
          profitable_info: {
            total_profitable: profitableTransactions.length,
            profitable_transactions: profitableTransactions,
            filtered_buys: filteredBuys,
            filtered_sells: filteredSells
          }
        };
        this.showMatchingResults(modalPayload);
        this.loadData();

        // Recalc tồn kho cho statcard (today hoặc theo ngày đã chọn)
        try {
          await fetch('/nav_management/api/inventory/recalc_after_match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', params: { fund_id: Number(selectedFundId), inventory_date: dateStr || undefined } })
          });
        } catch (_) {}
      } else {
        this.showNotification('❌ Lỗi: ' + (data.message || 'Không xác định'), 'error');
      }
    } catch (e) {
      this.showNotification('❌ Lỗi kết nối: ' + e.message, 'error');
    }
  }

  async showMatchingResults(result) {
    const remainingBuys = result.remaining?.buys?.length || 0;
    const remainingSells = result.remaining?.sells?.length || 0;
    const algorithmUsed = result.algorithm_used || 'Best Price First';

    // Lấy dữ liệu từ backend, nhưng fallback về dữ liệu từ lần khớp hiện tại nếu cần
    let allMatchedPairs = [];
    
    try {
      console.log('[DEBUG] Bắt đầu gọi API matched-pairs để lấy tất cả cặp lệnh thực tế');
      
      // Gọi API đúng endpoint để lấy tất cả cặp lệnh đã khớp từ backend
      const body = {
        page: 1,
        limit: 1000,
        source_type: 'all'
      };
      if (this.state?.filters?.matchedFundId) {
        body.fund_id = this.state.filters.matchedFundId;
      }
      const response = await fetch('/api/transaction-list/get-matched-pairs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });
      
      console.log('[DEBUG] API response status:', response.status);
      console.log('[DEBUG] API response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[DEBUG] API response data:', data);
        console.log('[DEBUG] API success:', data?.success);
        console.log('[DEBUG] API matched_pairs length:', data?.matched_pairs?.length);
        
        if (data.success && data.matched_pairs) {
          // Lọc theo loại khớp lệnh
          allMatchedPairs = data.matched_pairs.filter(pair => {
            const isSingle = pair._pairType === 'investor_single' || 
                            pair._pairType === 'market_maker_single' ||
                            !pair.buy_id || !pair.sell_id ||
                            pair.buy_id === 'N/A' || pair.sell_id === 'N/A';
            
            if (isSingle) return false;
            
            // Kiểm tra loại khớp lệnh dựa trên context
            const isInvestorInvestor = pair._buyUserType === 'investor' && pair._sellUserType === 'investor';
            const isMarketMakerInvestor = (pair._buyUserType === 'market_maker' && pair._sellUserType === 'investor') ||
                                        (pair._buyUserType === 'investor' && pair._sellUserType === 'market_maker');
            
            // Nếu từ button "Khớp lệnh" -> chỉ hiển thị investor-investor
            if (result.match_type === 'investor_investor') {
              return isInvestorInvestor;
            }
            // Nếu từ button "NTL ma bán" -> chỉ hiển thị market maker-investor
            else if (result.match_type === 'market_maker_investor') {
              return isMarketMakerInvestor;
            }
            // Mặc định: hiển thị tất cả
            return true;
          });
          console.log(`[DEBUG] Lấy được ${data.matched_pairs.length} cặp lệnh từ backend, sau khi lọc theo loại khớp còn ${allMatchedPairs.length} cặp`);
        } else {
          console.warn('[DEBUG] API trả về không thành công:', data);
          allMatchedPairs = [];
        }
      } else {
        const errorText = await response.text();
        console.warn('[DEBUG] Lỗi khi gọi API matched-pairs:', response.status, errorText);
        allMatchedPairs = [];
      }
    } catch (error) {
      console.error('[DEBUG] Lỗi khi lấy dữ liệu từ backend:', error);
      allMatchedPairs = [];
    }
    
    // Đảm bảo dữ liệu nhất quán: nếu có dữ liệu từ lần khớp hiện tại, kết hợp với dữ liệu từ backend
    const currentMatchedPairs = result.matched_pairs || [];
    if (currentMatchedPairs.length > 0) {
      console.log(`[DEBUG] Có ${currentMatchedPairs.length} cặp lệnh từ lần khớp hiện tại`);
      
      // Lọc theo loại khớp lệnh từ current match
      const currentFilteredPairs = currentMatchedPairs.filter(pair => {
        const isSingle = pair._pairType === 'investor_single' || 
                        pair._pairType === 'market_maker_single' ||
                        !pair.buy_id || !pair.sell_id ||
                        pair.buy_id === 'N/A' || pair.sell_id === 'N/A';
        
        if (isSingle) return false;
        
        // Kiểm tra loại khớp lệnh dựa trên context
        const isInvestorInvestor = pair._buyUserType === 'investor' && pair._sellUserType === 'investor';
        const isMarketMakerInvestor = (pair._buyUserType === 'market_maker' && pair._sellUserType === 'investor') ||
                                    (pair._buyUserType === 'investor' && pair._sellUserType === 'market_maker');
        
        // Nếu từ button "Khớp lệnh" -> chỉ hiển thị investor-investor
        if (result.match_type === 'investor_investor') {
          return isInvestorInvestor;
        }
        // Nếu từ button "NTL ma bán" -> chỉ hiển thị market maker-investor
        else if (result.match_type === 'market_maker_investor') {
          return isMarketMakerInvestor;
        }
        // Mặc định: hiển thị tất cả
        return true;
      });
      
      console.log(`[DEBUG] Current match sau khi lọc single: ${currentFilteredPairs.length} cặp`);
      
      // Kết hợp dữ liệu: ưu tiên dữ liệu từ backend, nhưng đảm bảo có dữ liệu từ current match
      if (allMatchedPairs.length === 0) {
        allMatchedPairs = currentFilteredPairs;
        console.log(`[DEBUG] Sử dụng dữ liệu từ current match: ${allMatchedPairs.length} cặp`);
      } else {
        // Kết hợp và loại bỏ trùng lặp
        const combinedPairs = [...allMatchedPairs];
        currentFilteredPairs.forEach(currentPair => {
          const exists = combinedPairs.some(backendPair => 
            backendPair.buy_id === currentPair.buy_id && 
            backendPair.sell_id === currentPair.sell_id
          );
          if (!exists) {
            combinedPairs.push(currentPair);
          }
        });
        allMatchedPairs = combinedPairs;
        console.log(`[DEBUG] Kết hợp dữ liệu: ${allMatchedPairs.length} cặp (${allMatchedPairs.length - currentFilteredPairs.length} từ backend + ${currentFilteredPairs.length} từ current match)`);
      }
    }
    
    // Tính toán thống kê tổng quan (từ lần khớp hiện tại cho chi tiết, từ backend cho bảng tổng hợp)
    const totalMatched = currentMatchedPairs.length;
    const totalCCQ = currentMatchedPairs.reduce((sum, pair) => sum + (pair.matched_ccq || pair.matched_volume || Math.min(pair.buy_units || 0, pair.sell_units || 0)), 0);
    const totalValue = currentMatchedPairs.reduce((sum, pair) => {
      const matchedCCQ = pair.matched_ccq || pair.matched_volume || Math.min(pair.buy_units || 0, pair.sell_units || 0);
      const matchedPrice = pair.matched_price || pair.sell_nav;
      return sum + (matchedPrice * matchedCCQ);
    }, 0);
    const avgPrice = totalCCQ > 0 ? totalValue / totalCCQ : 0;
    
    console.log(`[DEBUG] Thống kê từ lần khớp hiện tại: ${totalMatched} cặp lệnh, ${totalCCQ.toLocaleString()} CCQ, ${totalValue.toLocaleString()} VND`);
    console.log(`[DEBUG] Bảng tổng hợp sẽ hiển thị ${allMatchedPairs.length} cặp lệnh từ backend`);
    
    // Lấy warnings từ result
    const warnings = result.warnings || [];
    console.log(`[DEBUG] Warnings: ${warnings.length} cảnh báo`, warnings);

    // Helper: lấy tên quỹ từ pair hoặc từ filter hiện tại
    const getFundNameFromPair = (pair) => {
      console.log('[DEBUG] getFundNameFromPair called with pair:', pair);
      
      // 1. Thử lấy trực tiếp từ pair data
      const direct = pair.fund_name || pair.buy_fund_name || pair.sell_fund_name || '';
      if (direct) {
        console.log('[DEBUG] Found direct fund name:', direct);
        return direct;
      }
      
      // 2. Thử lấy từ fund_id trong pair
      const fundId = pair.fund_id || pair.buy_fund_id || pair.sell_fund_id;
      if (fundId && this.state?.fundOptions?.length) {
        const fundOption = this.state.fundOptions.find(f => String(f.id) === String(fundId));
        if (fundOption && fundOption.name) {
          console.log('[DEBUG] Found fund name from fund_id:', fundOption.name);
          return fundOption.name;
        }
      }
      
      // 3. Fallback theo filter quỹ đang chọn
      const selectedFundId = this.state?.filters?.matchedFundId;
      if (selectedFundId && this.state?.fundOptions?.length) {
        const fo = this.state.fundOptions.find(f => String(f.id) === String(selectedFundId));
        if (fo && fo.name) {
          console.log('[DEBUG] Found fund name from filter:', fo.name);
          return fo.name;
        }
      }
      
      console.log('[DEBUG] No fund name found, returning N/A');
      return 'N/A';
    };

    // Nhóm dữ liệu theo quỹ cho layout phân bổ (allocation-style)
    let allocationPairs = (allMatchedPairs && allMatchedPairs.length ? allMatchedPairs : currentMatchedPairs).map(p => ({
      fund_name: getFundNameFromPair(p),
      buy_id: p.buy_id,
      sell_id: p.sell_id,
      buy_investor: p.buy_investor || p.buy_name || '',
      sell_investor: p.sell_investor || p.sell_name || '',
      matched_ccq: Number(p.matched_ccq || p.matched_volume || 0),
      matched_price: Number(p.matched_price || p.sell_nav || 0),
      // buyer/seller details
      buy_units: Number(p.buy_units || 0),
      sell_units: Number(p.sell_units || 0),
      buy_price: Number(this.getBuyPrice ? this.getBuyPrice(p) : (p.buy_nav || p.buy_price || 0)),
      sell_price: Number(this.getSellPrice ? this.getSellPrice(p) : (p.sell_nav || p.sell_price || 0)),
      buy_remaining_units: (p.buy_remaining_units !== undefined ? Number(p.buy_remaining_units) : null),
      sell_remaining_units: (p.sell_remaining_units !== undefined ? Number(p.sell_remaining_units) : null),
      buy_in_time: p.buy_in_time || p.match_time || '',
      sell_in_time: p.sell_in_time || p.match_time || '',
      match_time: p.match_time || p.match_date || ''
    }));

    // Enrich investor names via API if missing
    const getInvestorName = async (transactionId) => {
      try {
        if (!transactionId) return '';
        const resp = await fetch(`/api/transaction-list/get-investor-name/${transactionId}`);
        const data = await resp.json();
        return data && data.success ? (data.investor_name || '') : '';
      } catch (_) {
        return '';
      }
    };

    try {
      const enriched = await Promise.all(allocationPairs.map(async (it) => {
        let buyName = it.buy_investor && it.buy_investor !== 'N/A' ? it.buy_investor : '';
        let sellName = it.sell_investor && it.sell_investor !== 'N/A' ? it.sell_investor : '';
        if (!buyName && it.buy_id) {
          buyName = await getInvestorName(it.buy_id);
        }
        if (!sellName && it.sell_id) {
          sellName = await getInvestorName(it.sell_id);
        }
        return { ...it, buy_investor: buyName || (`#${it.buy_id || 'N/A'}`), sell_investor: sellName || (`#${it.sell_id || 'N/A'}`) };
      }));
      allocationPairs = enriched;
    } catch (_) {}

    const groupByFund = allocationPairs.reduce((acc, it) => {
      const k = it.fund_name || 'N/A';
      if (!acc[k]) acc[k] = [];
      acc[k].push(it);
      return acc;
    }, {});

    const fmtVN = n => (Number(n || 0)).toLocaleString('vi-VN');
    const buildAllocationCard = (fundName, rows) => {
      const gQty = rows.reduce((s, it) => s + (it.matched_ccq || 0), 0);
      const gVal = rows.reduce((s, it) => s + (it.matched_ccq || 0) * (it.matched_price || 0), 0);
      const body = rows.map(it => {
        const buyUnits = Number(it.buy_units || 0);
        const sellUnits = Number(it.sell_units || 0);
        const matched = Number(it.matched_ccq || 0);
        const buyRemaining = (it.buy_remaining_units != null) ? Number(it.buy_remaining_units) : Math.max(buyUnits - matched, 0);
        const sellRemaining = (it.sell_remaining_units != null) ? Number(it.sell_remaining_units) : Math.max(sellUnits - matched, 0);
        const buyPrice = Number(it.buy_price || it.matched_price || 0);
        const sellPrice = Number(it.sell_price || it.matched_price || 0);
        const buyValue = buyUnits * buyPrice;
        const sellValue = sellUnits * sellPrice;
        const matchTime = it.match_time || it.sell_in_time || it.buy_in_time || '';
        return `
        <div class=\"allocation-row\">
          <div class=\"allocation-col buyer\">
            <div class=\"party-box\">
              <div class=\"party-name\">
                ${it.buy_investor}
                ${result.profitable_info && result.profitable_info.profitable_transactions && result.profitable_info.profitable_transactions.some(tx => tx.id == it.buy_id) ? 
                  '<span class=\"badge bg-success ms-1\"><i class=\"fas fa-chart-line\"></i></span>' : ''}
              </div>
              <div class=\"party-meta\">
                <span class=\"label\">Giá mua:</span><span class=\"value\">${fmtVN(buyPrice)}</span>
                <span class=\"sep\">|</span>
                <span class=\"label\">CCQ mua:</span><span class=\"value\">${fmtVN(buyUnits)}</span>
                <span class=\"sep\">|</span>
                <span class=\"label\">Giá trị:</span><span class=\"value\">${fmtVN(buyValue)}</span>
              </div>
              <div class=\"party-time small text-muted\">
                <span class=\"label\">In:</span><span class=\"value\">${it.buy_in_time || ''}</span>
                <span class=\"sep\">|</span>
                <span class=\"label\">Còn lại:</span><span class=\"value remaining ${buyRemaining>0?'pos':(buyRemaining===0?'zero':'neg')}\">${fmtVN(buyRemaining)}</span>
              </div>
            </div>
          </div>
          <div class=\"allocation-col match text-center\">
            <div class=\"match-qty\">${fmtVN(matched)}</div>\n            <div class=\"match-value\">Giá trị lệnh: ${fmtVN(it.total_value || (it.matched_price * matched))}</div>\n            <div class=\"match-price\">Giá khớp: ${fmtVN(it.matched_price)}</div>\n            <div class=\"match-time small text-muted\">${matchTime}</div>
            ${result.profitable_info && result.profitable_info.profitable_transactions ? `
              <div class=\"profitable-indicator mt-2\">
                ${result.profitable_info.profitable_transactions.some(tx => tx.id == it.buy_id || tx.id == it.sell_id) ? 
                  '<span class=\"badge bg-success\"><i class=\"fas fa-chart-line me-1\"></i>Lệnh có lãi</span>' : 
                  '<span class=\"badge bg-secondary\"><i class=\"fas fa-user me-1\"></i>Nhà đầu tư</span>'}
              </div>
            ` : ''}
          </div>
          <div class=\"allocation-col seller text-center\">\n            <div class=\"party-box\">\n              <div class=\"party-name\">
                ${it.sell_investor}
                ${result.profitable_info && result.profitable_info.profitable_transactions && result.profitable_info.profitable_transactions.some(tx => tx.id == it.sell_id) ? 
                  '<span class=\"badge bg-success ms-1\"><i class=\"fas fa-chart-line\"></i></span>' : ''}
              </div>\n              <div class=\"party-meta\">
                <span class=\"label\">Giá bán:</span><span class=\"value\">${fmtVN(sellPrice)}</span>\n                <span class=\"sep\">|</span>\n                <span class=\"label\">CCQ bán:</span><span class=\"value\">${fmtVN(sellUnits)}</span>\n                <span class=\"sep\">|</span>\n                <span class=\"label\">Giá trị:</span><span class=\"value\">${fmtVN(sellValue)}</span>\n              </div>\n              <div class=\"party-time small text-muted\">\n                <span class=\"label\">In:</span><span class=\"value\">${it.sell_in_time || ''}</span>\n                <span class=\"sep\">|</span>\n                <span class=\"label\">Còn lại:</span><span class=\"value remaining ${sellRemaining>0?'pos':(sellRemaining===0?'zero':'neg')}\">${fmtVN(sellRemaining)}</span>\n              </div>\n            </div>\n          </div>
        </div>
      `;}).join('');
      return `
        <div class=\"card mb-3\">
          <div class=\"card-header d-flex justify-content-between align-items-center\">
            <div><strong>${fundName}</strong></div>
            <div class=\"small text-muted\">CCQ: ${fmtVN(gQty)} | Giá trị: ${fmtVN(gVal)}</div>
          </div>
          <div class=\"card-body\">
            ${rows.length ? body : '<div class=\"text-muted\">Không có dữ liệu</div>'}
          </div>
        </div>
      `;
    };

    const allocationHTML = Object.keys(groupByFund).map(fn => buildAllocationCard(fn, groupByFund[fn])).join('');

    // Chuẩn hóa dữ liệu cặp & render bảng cặp với tab lọc (bỏ single pairs)
    const normalizedPairs = allMatchedPairs
      .filter((pair, idx) => {
        // Bỏ đi các single pairs
        const isSingle = pair._pairType === 'investor_single' || 
                        pair._pairType === 'market_maker_single' ||
                        !pair.buy_id || !pair.sell_id ||
                        pair.buy_id === 'N/A' || pair.sell_id === 'N/A';
        
        if (isSingle) {
          console.log(`[DEBUG] Bỏ qua single pair ${idx + 1}:`, {
            buy_id: pair.buy_id,
            sell_id: pair.sell_id,
            _pairType: pair._pairType
          });
          return false;
        }
        
        return true;
      })
      .map((pair, idx) => {
        // Debug: Log dữ liệu pair gốc
        console.log(`[DEBUG] Original pair ${idx + 1}:`, {
          buy_id: pair.buy_id,
          sell_id: pair.sell_id,
          _pairType: pair._pairType,
          _buyUserType: pair._buyUserType,
          _sellUserType: pair._sellUserType,
          _sourceType: pair._sourceType,
          buy_source: pair.buy_source,
          sell_source: pair.sell_source,
          buy_user_type: pair.buy_user_type,
          sell_user_type: pair.sell_user_type,
          buy_is_market_maker: pair.buy_is_market_maker,
          sell_is_market_maker: pair.sell_is_market_maker,
          // Log tất cả keys để xem có field nào khác
          all_keys: Object.keys(pair)
        });
        
        // Nếu đã có _stt từ localStorage, giữ nguyên, nếu không thì tạo mới
        const stt = pair._stt || (idx + 1);
        const matchedCCQ = pair._matched_ccq || pair.matched_ccq || pair.matched_volume || Math.min(pair.buy_units || 0, pair.sell_units || 0);
        const matchedPrice = pair._matched_price || pair.matched_price || pair.sell_nav;
        const inTime = pair._in_time || pair.buy_in_time || pair.sell_in_time || pair.match_time || '';
        const outTime = pair._out_time || pair.sell_out_time || pair.buy_out_time || pair.match_time || '';
        
        // Xác định loại cặp lệnh (chỉ cho actual pairs)
        let pairTypeText = 'N/A';
        let determinedPairType = pair._pairType;
        
        // Nếu không có _pairType, cố gắng xác định từ các field khác
        if (!determinedPairType) {
          const buyUserType = pair._buyUserType || pair.buy_user_type || '';
          const sellUserType = pair._sellUserType || pair.sell_user_type || '';
          const buySource = pair.buy_source || '';
          const sellSource = pair.sell_source || '';
          const buyIsMM = pair.buy_is_market_maker === true || pair.buy_is_market_maker === 1;
          const sellIsMM = pair.sell_is_market_maker === true || pair.sell_is_market_maker === 1;
          
          // Ưu tiên: Xác định pair type từ source field
          if (buySource || sellSource) {
            const buyIsInvestor = buySource === 'portal' || buySource === '';
            const sellIsInvestor = sellSource === 'portal' || sellSource === '';
            const buyIsMMFromSource = buySource === 'sale' || buySource === 'portfolio';
            const sellIsMMFromSource = sellSource === 'sale' || sellSource === 'portfolio';
            
            if (buyIsInvestor && sellIsInvestor) {
              determinedPairType = 'investor_investor';
            } else if (buyIsMMFromSource && sellIsInvestor) {
              determinedPairType = 'market_maker_investor';
            } else if (buyIsInvestor && sellIsMMFromSource) {
              determinedPairType = 'investor_market_maker';
            }
          }
          // Fallback: Xác định pair type từ user types
          else if (buyUserType && sellUserType) {
            if (buyUserType === 'investor' && sellUserType === 'investor') {
              determinedPairType = 'investor_investor';
            } else if (buyUserType === 'market_maker' && sellUserType === 'investor') {
              determinedPairType = 'market_maker_investor';
            } else if (buyUserType === 'investor' && sellUserType === 'market_maker') {
              determinedPairType = 'investor_market_maker';
            }
          }
          // Fallback cuối: sử dụng is_market_maker field
          else if (buyIsMM !== undefined || sellIsMM !== undefined) {
            if (!buyIsMM && !sellIsMM) {
              determinedPairType = 'investor_investor';
            } else if (buyIsMM && !sellIsMM) {
              determinedPairType = 'market_maker_investor';
            } else if (!buyIsMM && sellIsMM) {
              determinedPairType = 'investor_market_maker';
            }
          }
        }
        
        if (determinedPairType) {
          switch(determinedPairType) {
            case 'investor_investor':
              pairTypeText = 'Nhà đầu tư ↔ Nhà đầu tư';
              break;
            case 'market_maker_investor':
              pairTypeText = 'Nhà tạo lập → Nhà đầu tư';
              break;
            case 'investor_market_maker':
              pairTypeText = 'Nhà đầu tư → Nhà tạo lập';
              break;
            default:
              pairTypeText = 'Khác';
          }
        }
        
        const normalizedPair = {
          ...pair,
          _stt: stt,
          _matched_ccq: matchedCCQ,
          _matched_price: matchedPrice,
          _in_time: inTime,
          _out_time: outTime,
          _sourceType: pair._sourceType || 'investor',
          _pairType: determinedPairType || pair._pairType, // Sử dụng determinedPairType
          _pairTypeText: pairTypeText,
          buy_investor: pair.buy_investor || pair.buy_name || `#${pair.buy_id || 'N/A'}`,
          sell_investor: pair.sell_investor || pair.sell_name || `#${pair.sell_id || 'N/A'}`,
          interest_rate: pair.interest_rate || '-',
          term: pair.term || '-'
        };
        
        // Debug: Log normalized pair
        console.log(`[DEBUG] Normalized pair ${idx + 1}:`, {
          buy_id: normalizedPair.buy_id,
          sell_id: normalizedPair.sell_id,
          _pairType: normalizedPair._pairType,
          _buyUserType: normalizedPair._buyUserType,
          _sellUserType: normalizedPair._sellUserType,
          _sourceType: normalizedPair._sourceType
        });
        
        return normalizedPair;
      });

    const buildFilteredPairs = (filter) => {
      console.log(`[DEBUG] ===== FILTER DEBUG START =====`);
      console.log(`[DEBUG] Filtering with: ${filter}`);
      console.log(`[DEBUG] normalizedPairs available:`, !!normalizedPairs);
      console.log(`[DEBUG] Total pairs before filter: ${normalizedPairs ? normalizedPairs.length : 'undefined'}`);
      
      if (!normalizedPairs || normalizedPairs.length === 0) {
        console.log(`[DEBUG] ERROR: normalizedPairs is empty or undefined!`);
        return [];
      }
      
      // Debug: Log tất cả pairs để kiểm tra
      console.log(`[DEBUG] All pairs data:`, normalizedPairs.map(p => ({
        buy_id: p.buy_id,
        sell_id: p.sell_id,
        buy_investor: p.buy_investor,
        sell_investor: p.sell_investor,
        _pairType: p._pairType,
        _buyUserType: p._buyUserType,
        _sellUserType: p._sellUserType,
        buy_source: p.buy_source,
        sell_source: p.sell_source
      })));
      
      if (filter === 'all') {
        console.log(`[DEBUG] Showing all pairs: ${normalizedPairs.length}`);
        return normalizedPairs;
      }
      
      if (filter === 'investor') {
        // Hiển thị cặp có nhà đầu tư (chỉ investor_investor, KHÔNG bao gồm market_maker_investor)
        const filtered = normalizedPairs.filter(p => {
          const pairType = p._pairType || '';
          const buyUserType = p._buyUserType || p.buy_user_type || '';
          const sellUserType = p._sellUserType || p.sell_user_type || '';
          const sourceType = p._sourceType || '';
          const buySource = p.buy_source || p._buySource || '';
          const sellSource = p.sell_source || p._sellSource || '';
          const buyInvestor = p.buy_investor || p.buy_name || '';
          const sellInvestor = p.sell_investor || p.sell_name || '';
          
          console.log(`[DEBUG] Pair ${p.buy_id}-${p.sell_id}: pairType=${pairType}, buyUserType=${buyUserType}, sellUserType=${sellUserType}, sourceType=${sourceType}, buySource=${buySource}, sellSource=${sellSource}, buyInvestor=${buyInvestor}, sellInvestor=${sellInvestor}`);
          
          // Logic chính: kiểm tra userType trước (từ backend logic mới)
          let hasInvestor = false;
          
          if (buyUserType && sellUserType) {
            // Sử dụng userType từ backend logic mới: dựa trên user_id và partner_id
            hasInvestor = (buyUserType === 'investor' && sellUserType === 'investor');
            console.log(`[DEBUG] Using userType logic: buyUserType=${buyUserType}, sellUserType=${sellUserType}, hasInvestor=${hasInvestor}`);
          } else if (pairType) {
            // Có _pairType: CHỈ lấy investor_investor, LOẠI BỎ market_maker_investor
            hasInvestor = pairType === 'investor_investor';
            console.log(`[DEBUG] Using pairType logic: ${hasInvestor} (only investor_investor)`);
          } else {
            // Không có _pairType: sử dụng userType nếu có
            if (buyUserType || sellUserType) {
              hasInvestor = (buyUserType === 'investor' && sellUserType === 'investor');
              console.log(`[DEBUG] Using userType fallback: ${hasInvestor} (both must be investor)`);
            } else if (buySource && sellSource) {
              // Fallback: sử dụng source field từ transaction.py
              hasInvestor = (buySource === 'portal' && sellSource === 'portal');
              console.log(`[DEBUG] Using source field fallback: buySource=${buySource}, sellSource=${sellSource}, hasInvestor=${hasInvestor}`);
            } else {
              // Fallback: sử dụng tên nhà đầu tư để phân biệt
              // Market maker thường có tên đặc biệt hoặc pattern khác
              const isMarketMakerName = (name) => {
                if (!name || name === 'N/A') return false;
                const lowerName = name.toLowerCase();
                return lowerName.includes('market') || 
                       lowerName.includes('maker') || 
                       lowerName.includes('system') ||
                       lowerName.includes('auto') ||
                       lowerName.includes('bot') ||
                       lowerName.includes('admin') ||
                       lowerName.includes('internal');
              };
              
              const buyIsMM = isMarketMakerName(buyInvestor);
              const sellIsMM = isMarketMakerName(sellInvestor);
              
              // CHỈ lấy cặp có cả 2 bên đều KHÔNG phải market maker (dựa trên tên)
              hasInvestor = !buyIsMM && !sellIsMM;
              console.log(`[DEBUG] Using name-based logic: buyIsMM=${buyIsMM}, sellIsMM=${sellIsMM}, hasInvestor=${hasInvestor}`);
            }
          }
          
          // Fallback cuối cùng: kiểm tra _sourceType nếu có
          if (!hasInvestor && sourceType) {
            hasInvestor = sourceType === 'investor';
            console.log(`[DEBUG] Using sourceType fallback: ${hasInvestor}`);
          }
          
          console.log(`[DEBUG] Final hasInvestor: ${hasInvestor}`);
          return hasInvestor;
        });
        
        console.log(`[DEBUG] Investor filter result: ${filtered.length} pairs`);
        console.log(`[DEBUG] ===== FILTER DEBUG END =====`);
        return filtered;
      }
      
      if (filter === 'market_maker') {
        // Hiển thị cặp có nhà tạo lập (market_maker_investor và investor_market_maker)
        const filtered = normalizedPairs.filter(p => {
          const pairType = p._pairType || '';
          const buyUserType = p._buyUserType || p.buy_user_type || '';
          const sellUserType = p._sellUserType || p.sell_user_type || '';
          const sourceType = p._sourceType || '';
          const buySource = p.buy_source || p._buySource || '';
          const sellSource = p.sell_source || p._sellSource || '';
          const buyInvestor = p.buy_investor || p.buy_name || '';
          const sellInvestor = p.sell_investor || p.sell_name || '';
          
          console.log(`[DEBUG] Pair ${p.buy_id}-${p.sell_id}: pairType=${pairType}, buyUserType=${buyUserType}, sellUserType=${sellUserType}, sourceType=${sourceType}, buySource=${buySource}, sellSource=${sellSource}, buyInvestor=${buyInvestor}, sellInvestor=${sellInvestor}`);
          
          // Logic chính: kiểm tra userType trước (từ backend logic mới)
          let hasMarketMaker = false;
          
          if (buyUserType && sellUserType) {
            // Sử dụng userType từ backend logic mới: dựa trên user_id và partner_id
            hasMarketMaker = (buyUserType === 'market_maker' || sellUserType === 'market_maker');
            console.log(`[DEBUG] Using userType logic: buyUserType=${buyUserType}, sellUserType=${sellUserType}, hasMarketMaker=${hasMarketMaker}`);
          } else if (pairType) {
            // Có _pairType: lấy cả market_maker_investor và investor_market_maker
            hasMarketMaker = pairType === 'market_maker_investor' || pairType === 'investor_market_maker';
            console.log(`[DEBUG] Using pairType logic: ${hasMarketMaker} (market_maker_investor or investor_market_maker)`);
          } else {
            // Không có _pairType: sử dụng userType nếu có
            if (buyUserType || sellUserType) {
              hasMarketMaker = (buyUserType === 'market_maker' || sellUserType === 'market_maker');
              console.log(`[DEBUG] Using userType fallback: ${hasMarketMaker}`);
            } else if (buySource && sellSource) {
              // Fallback: sử dụng source field từ transaction.py
              hasMarketMaker = (buySource !== 'portal' || sellSource !== 'portal');
              console.log(`[DEBUG] Using source field fallback: buySource=${buySource}, sellSource=${sellSource}, hasMarketMaker=${hasMarketMaker}`);
            } else {
              // Fallback: sử dụng tên nhà đầu tư để phân biệt
              // Market maker thường có tên đặc biệt hoặc pattern khác
              const isMarketMakerName = (name) => {
                if (!name || name === 'N/A') return false;
                const lowerName = name.toLowerCase();
                return lowerName.includes('market') || 
                       lowerName.includes('maker') || 
                       lowerName.includes('system') ||
                       lowerName.includes('auto') ||
                       lowerName.includes('bot') ||
                       lowerName.includes('admin') ||
                       lowerName.includes('internal');
              };
              
              const buyIsMM = isMarketMakerName(buyInvestor);
              const sellIsMM = isMarketMakerName(sellInvestor);
              
              // Lấy cặp có ÍT NHẤT 1 bên là market maker (dựa trên tên)
              hasMarketMaker = buyIsMM || sellIsMM;
              console.log(`[DEBUG] Using name-based logic: buyIsMM=${buyIsMM}, sellIsMM=${sellIsMM}, hasMarketMaker=${hasMarketMaker}`);
            }
          }
          
          // Fallback cuối cùng: kiểm tra _sourceType nếu có
          if (!hasMarketMaker && sourceType) {
            hasMarketMaker = sourceType === 'market_maker';
            console.log(`[DEBUG] Using sourceType fallback: ${hasMarketMaker}`);
          }
          
          console.log(`[DEBUG] Final hasMarketMaker: ${hasMarketMaker}`);
          return hasMarketMaker;
        });
        
        console.log(`[DEBUG] Market maker filter result: ${filtered.length} pairs`);
        console.log(`[DEBUG] ===== FILTER DEBUG END =====`);
        return filtered;
      }
      
      console.log(`[DEBUG] No filter matched, returning all pairs`);
      console.log(`[DEBUG] ===== FILTER DEBUG END =====`);
      return normalizedPairs;
    };

    const renderMatchedPairsDetails = async (pairs) => {
      if (pairs.length === 0) {
        return `
          <div class="empty-pairs-state">
            <div class="empty-pairs-icon">
              <i class="fas fa-inbox"></i>
            </div>
            <div class="empty-pairs-title">Chưa có cặp lệnh nào</div>
            <div class="empty-pairs-message">
              Chưa có cặp lệnh nào được khớp trong lần khớp hiện tại. Hãy thử khớp lệnh để xem kết quả.
                </div>
          </div>
        `;
      }
      
      // Hàm lấy tên nhà đầu tư từ API
      const getInvestorName = async (transactionId) => {
        if (!transactionId || transactionId === 'N/A') return 'N/A';
        
        try {
          const response = await fetch(`/api/transaction-list/get-investor-name/${transactionId}`);
          const data = await response.json();
          if (data.success) {
            return data.investor_name;
          }
        } catch (error) {
          console.error(`[DEBUG] Error getting investor name for ${transactionId}:`, error);
        }
        return 'N/A';
      };
      
      // Lấy tên cho tất cả pairs
      const pairsWithNames = await Promise.all(pairs.map(async (pair, index) => {
        // Debug: Log dữ liệu pair để kiểm tra
        console.log(`[DEBUG] Pair ${index + 1}:`, pair);
        console.log(`[DEBUG] Buy fields:`, {
          buy_investor: pair.buy_investor,
          buy_name: pair.buy_name,
          buy_id: pair.buy_id,
          buy_nav: pair.buy_nav,
          buy_source: pair.buy_source,
          _buySource: pair._buySource
        });
        console.log(`[DEBUG] Sell fields:`, {
          sell_investor: pair.sell_investor,
          sell_name: pair.sell_name,
          sell_id: pair.sell_id,
          sell_nav: pair.sell_nav,
          sell_source: pair.sell_source,
          _sellSource: pair._sellSource
        });
        console.log(`[DEBUG] Source fields:`, {
          buy_source: pair.buy_source,
          sell_source: pair.sell_source,
          _buySource: pair._buySource,
          _sellSource: pair._sellSource,
          _pairType: pair._pairType,
          _buyUserType: pair._buyUserType,
          _sellUserType: pair._sellUserType
        });
        
        // Lấy tên nhà đầu tư từ API nếu có transaction_id
        let buyName = pair.buy_investor || pair.buy_name || 'N/A';
        let sellName = pair.sell_investor || pair.sell_name || 'N/A';
        
        // Luôn lấy tên từ API nếu có transaction_id (để đảm bảo tên chính xác)
        if (pair.buy_id && pair.buy_id !== 'N/A') {
          console.log(`[DEBUG] Getting buy name for transaction ${pair.buy_id}`);
          const apiBuyName = await getInvestorName(pair.buy_id);
          console.log(`[DEBUG] API returned buy name: ${apiBuyName}`);
          if (apiBuyName && apiBuyName !== 'N/A') {
            buyName = apiBuyName;
            console.log(`[DEBUG] Updated buy name to: ${buyName}`);
          } else {
            // Fallback: nếu API không trả về tên, sử dụng tên có sẵn hoặc tạo tên từ ID
            if (buyName === 'N/A' || !buyName) {
              buyName = `Investor #${pair.buy_id}`;
              console.log(`[DEBUG] Using fallback buy name: ${buyName}`);
            }
          }
        }
        
        if (pair.sell_id && pair.sell_id !== 'N/A') {
          console.log(`[DEBUG] Getting sell name for transaction ${pair.sell_id}`);
          const apiSellName = await getInvestorName(pair.sell_id);
          console.log(`[DEBUG] API returned sell name: ${apiSellName}`);
          if (apiSellName && apiSellName !== 'N/A') {
            sellName = apiSellName;
            console.log(`[DEBUG] Updated sell name to: ${sellName}`);
          } else {
            // Fallback: nếu API không trả về tên, sử dụng tên có sẵn hoặc tạo tên từ ID
            if (sellName === 'N/A' || !sellName) {
              sellName = `Investor #${pair.sell_id}`;
              console.log(`[DEBUG] Using fallback sell name: ${sellName}`);
            }
          }
        }
        
        return {
          ...pair,
          buy_investor: buyName,
          buy_name: buyName,
          sell_investor: sellName,
          sell_name: sellName
        };
      }));
      
      return pairsWithNames.map((pair, index) => {
        
        // Tính toán các giá trị
        const matchedCCQ = pair.matched_ccq || pair.matched_volume || Math.min(pair.buy_units || 0, pair.sell_units || 0);
        const matchedPrice = pair.matched_price || pair.sell_nav;
        const matchedValue = matchedPrice * matchedCCQ;
        const priceDiff = (pair.buy_nav || 0) - (pair.sell_nav || 0);
        const priceDiffPercent = pair.sell_nav > 0 ? (priceDiff / pair.sell_nav * 100) : 0;
        const matchTime = pair.match_time || new Date().toLocaleString('vi-VN');
        
        return `
          <div class="matched-pair-card">
            <div class="matched-pair-header">
              <div class="matched-pair-header-content">
                <div class="matched-pair-info">
                  <div class="matched-pair-number">${index + 1}</div>
                <div>
                    <h6 class="matched-pair-title">Cặp Lệnh #${index + 1}</h6>
                    <p class="matched-pair-time">
                      <i class="fas fa-clock me-1"></i>${matchTime}
                  </p>
                </div>
              </div>
                <div class="matched-pair-summary">
                  <div class="matched-pair-ccq">${matchedCCQ.toLocaleString()}</div>
                  <div class="matched-pair-ccq-label">CCQ Khớp</div>
                </div>
              </div>
              </div>
              
            <div class="matched-pair-body">
              <div class="matched-pair-orders">
                <!-- Lệnh MUA -->
                <div class="order-section buy">
                  <div class="order-header">
                    <div class="order-icon buy">
                      <i class="fas fa-arrow-up"></i>
                    </div>
                    <h6 class="order-title buy">Lệnh MUA</h6>
                      </div>
                  <div class="order-details">
                    <div class="order-detail-row">
                      <span class="order-detail-label">Người mua:</span>
                      <span class="order-detail-value buy">${pair.buy_investor || pair.buy_name || pair.buy_investor_name || pair.buy_user_name || pair.buyer_name || 'N/A'}</span>
                    </div>
                    <div class="order-detail-row">
                      <span class="order-detail-label">ID Lệnh:</span>
                      <span class="order-detail-value buy">#${pair.buy_id || 'N/A'}</span>
                  </div>
                    <div class="order-detail-row">
                      <span class="order-detail-label">NAV:</span>
                      <span class="order-nav-badge">${(pair.buy_nav || 0).toLocaleString('vi-VN')} VND</span>
                      </div>
                    ${pair.buy_base_nav ? `
                      <div class="order-variation ${pair.buy_variation >= 0 ? 'positive' : 'negative'}">
                        Gốc: ${pair.buy_base_nav.toLocaleString('vi-VN')} VND
                        (${pair.buy_variation >= 0 ? '+' : ''}${pair.buy_variation}%)
                      </div>
                    ` : ''}
                    <div class="order-detail-row">
                      <span class="order-detail-label">Số tiền:</span>
                      <span class="order-detail-value buy">${(pair.buy_amount || 0).toLocaleString('vi-VN')} VND</span>
                    </div>
                    <div class="order-detail-row">
                      <span class="order-detail-label">Số CCQ:</span>
                      <span class="order-detail-value buy">${(pair.buy_units || 0).toLocaleString('vi-VN')}</span>
                  </div>
                    <div class="order-detail-row">
                      <span class="order-detail-label">Thời gian vào:</span>
                      <span class="order-detail-value buy">${pair.buy_in_time || 'N/A'}</span>
                      </div>
                      </div>
                    </div>
                
                <!-- Lệnh BÁN -->
                <div class="order-section sell">
                  <div class="order-header">
                    <div class="order-icon sell">
                      <i class="fas fa-arrow-down"></i>
                  </div>
                    <h6 class="order-title sell">Lệnh BÁN</h6>
                      </div>
                  <div class="order-details">
                    <div class="order-detail-row">
                      <span class="order-detail-label">Người bán:</span>
                      <span class="order-detail-value sell">${pair.sell_investor || pair.sell_name || pair.sell_investor_name || pair.sell_user_name || pair.seller_name || 'N/A'}</span>
                      </div>
                    <div class="order-detail-row">
                      <span class="order-detail-label">ID Lệnh:</span>
                      <span class="order-detail-value sell">#${pair.sell_id || 'N/A'}</span>
                    </div>
                    <div class="order-detail-row">
                      <span class="order-detail-label">NAV:</span>
                      <span class="order-nav-badge sell">${(pair.sell_nav || 0).toLocaleString('vi-VN')} VND</span>
                  </div>
                    ${pair.sell_base_nav ? `
                      <div class="order-variation ${pair.sell_variation >= 0 ? 'positive' : 'negative'}">
                        Gốc: ${pair.sell_base_nav.toLocaleString('vi-VN')} VND
                        (${pair.sell_variation >= 0 ? '+' : ''}${pair.sell_variation}%)
                      </div>
                    ` : ''}
                    <div class="order-detail-row">
                      <span class="order-detail-label">Số tiền:</span>
                      <span class="order-detail-value sell">${(pair.sell_amount || 0).toLocaleString('vi-VN')} VND</span>
                      </div>
                    <div class="order-detail-row">
                      <span class="order-detail-label">Số CCQ:</span>
                      <span class="order-detail-value sell">${(pair.sell_units || 0).toLocaleString('vi-VN')}</span>
                    </div>
                    <div class="order-detail-row">
                      <span class="order-detail-label">Thời gian vào:</span>
                      <span class="order-detail-value sell">${pair.sell_in_time || 'N/A'}</span>
                  </div>
                </div>
              </div>
                </div>

              <!-- Thông tin khớp lệnh -->
              <div class="match-info">
                <h6 class="match-info-title">Thông Tin Khớp Lệnh</h6>
                <div class="match-info-grid">
                  <div class="match-info-item">
                    <div class="match-info-value price">${matchedPrice.toLocaleString('vi-VN')} VND</div>
                    <div class="match-info-label">Giá Khớp</div>
                              </div>
                  <div class="match-info-item">
                    <div class="match-info-value ccq">${matchedCCQ.toLocaleString('vi-VN')}</div>
                    <div class="match-info-label">CCQ Khớp</div>
                              </div>
                  <div class="match-info-item">
                    <div class="match-info-value diff">${priceDiff >= 0 ? '+' : ''}${priceDiff.toLocaleString('vi-VN')} VND</div>
                    <div class="match-info-label">Chênh Lệch NAV</div>
                            </div>
                  <div class="match-info-item">
                    <div class="match-info-value percent">${priceDiffPercent >= 0 ? '+' : ''}${priceDiffPercent.toFixed(2)}%</div>
                    <div class="match-info-label">% Chênh Lệch</div>
                            </div>
                  <div class="match-info-item">
                    <div class="match-info-value value">${matchedValue.toLocaleString('vi-VN')} VND</div>
                    <div class="match-info-label">Giá Trị Giao Dịch</div>
                          </div>
                        </div>
                                  </div>
                                </div>
                            </div>
        `;
      }).join('');
    };

    const renderPairsTable = (pairs, currentPage = 1, itemsPerPage = 10) => {
      if (pairs.length === 0) {
        return `
          <div class="empty-pairs-state">
            <div class="empty-pairs-icon">
              <i class="fas fa-inbox"></i>
                                      </div>
            <div class="empty-pairs-title">Chưa có cặp lệnh nào</div>
            <div class="empty-pairs-message">
              Chưa có cặp lệnh nào được khớp. Hãy thử khớp lệnh để xem kết quả.
              <br><small class="text-muted">Dữ liệu được lấy từ backend và chỉ hiển thị các cặp lệnh thực tế (bỏ single pairs).</small>
                          </div>
                        </div>
        `;
      }
      
      // Tính toán phân trang
      const totalPages = Math.ceil(pairs.length / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const pagePairs = pairs.slice(startIndex, endIndex);
      
      const rows = pagePairs.map((p, idx) => {
        // Debug: Log thông tin cặp lệnh để kiểm tra
        console.log(`[DEBUG] Rendering pair ${idx + 1}:`, {
          buy_id: p.buy_id,
          sell_id: p.sell_id,
          buy_investor: p.buy_investor,
          sell_investor: p.sell_investor,
          buy_name: p.buy_name,
          sell_name: p.sell_name,
          pair_id: `${p.buy_id}-${p.sell_id}`
        });
        
        // Tính CCQ còn lại cho từng người
        const buyUnits = p.buy_units || 0;
        const sellUnits = p.sell_units || 0;
        const matchedCCQ = p._matched_ccq || 0;
        const buyRemainingCCQ = buyUnits - matchedCCQ;
        const sellRemainingCCQ = sellUnits - matchedCCQ;
        
        // Lấy thông tin STK và CCQ đặt
        const buySTK = p.buy_account_number || p.buy_stk || 'N/A';
        const sellSTK = p.sell_account_number || p.sell_stk || 'N/A';
        
        // Lấy giá mua và bán
        const buyPrice = p.buy_nav || p.buy_current_nav || 0; // Giữ lại cho hiển thị, nhưng không dùng để tính toán
        const sellPrice = p.sell_nav || p.sell_current_nav || 0; // Giữ lại cho hiển thị, nhưng không dùng để tính toán
        const matchedPrice = p._matched_price || 0;
        
        // Xác định giá nào khớp
        const isBuyPriceMatched = Math.abs(buyPrice - matchedPrice) < 0.01;
        const isSellPriceMatched = Math.abs(sellPrice - matchedPrice) < 0.01;
        
        // Lấy thời gian in/out đúng
        const buyInTime = p.buy_in_time || p.buy_created_at || p._in_time || '-';
        const sellInTime = p.sell_in_time || p.sell_created_at || p._in_time || '-';
        const buyOutTime = p.buy_out_time || p.buy_updated_at || p._out_time || '-';
        const sellOutTime = p.sell_out_time || p.sell_updated_at || p._out_time || '-';
        
        return `
        <tr class="pairs-table-row" data-pair-id="${p.buy_id}-${p.sell_id}">
          <td class="text-center">${startIndex + idx + 1}</td>
          <td class="text-center buyer-cell">
            <div class="investor-info">
                <div class="investor-name">${p.buy_investor || p.buy_name || 'N/A'}</div>
                <div class="investor-details">
                  ${buySTK && buySTK !== 'N/A' && !p.buy_investor?.includes('Market Maker') ? `<small class="text-muted">STK: ${buySTK}</small><br>` : ''}
                  <small class="text-muted">CCQ: ${buyUnits.toLocaleString('vi-VN')}</small>
                </div>
            </div>
          </td>
          <td class="text-center seller-cell">
            <div class="investor-info">
              <div class="investor-name">${p.sell_investor || p.sell_name || 'N/A'}</div>
              <div class="investor-details">
                ${sellSTK && sellSTK !== 'N/A' && !p.sell_investor?.includes('Market Maker') ? `<small class="text-muted">STK: ${sellSTK}</small><br>` : ''}
                <small class="text-muted">CCQ: ${sellUnits.toLocaleString('vi-VN')}</small>
              </div>
            </div>
          </td>
          <td class="text-center price-cell">
            <div class="price-info">
              <div class="price-row">
                <span class="price-value matched">
                  ${matchedPrice.toLocaleString('vi-VN')} VND
                </span>
              </div>
            </div>
          </td>
          <td class="text-center ccq-cell">
            <div class="ccq-info">
              <div class="ccq-row">
                <span class="ccq-label">Khớp:</span>
                <span class="ccq-value">${matchedCCQ.toLocaleString('vi-VN')}</span>
              </div>
            </div>
          </td>
          <td class="text-center remaining-ccq-cell">
            <div class="remaining-ccq-info">
              <div class="ccq-row">
                <span class="ccq-label">Mua:</span>
                <span class="ccq-value">
                  <span class="${buyRemainingCCQ > 0 ? 'ccq-remaining-positive' : buyRemainingCCQ < 0 ? 'ccq-remaining-negative' : 'ccq-remaining-zero'}">
                    ${buyRemainingCCQ.toLocaleString('vi-VN')}
                  </span>
                  ${matchedCCQ > 0 ? `<span class="ccq-change-negative">(-${matchedCCQ.toLocaleString('vi-VN')})</span>` : ''}
                </span>
              </div>
              <div class="ccq-row">
                <span class="ccq-label">Bán:</span>
                <span class="ccq-value">
                  <span class="${sellRemainingCCQ > 0 ? 'ccq-remaining-positive' : sellRemainingCCQ < 0 ? 'ccq-remaining-negative' : 'ccq-remaining-zero'}">
                    ${sellRemainingCCQ.toLocaleString('vi-VN')}
                  </span>
                  ${matchedCCQ > 0 ? `<span class="ccq-change-negative">(-${matchedCCQ.toLocaleString('vi-VN')})</span>` : ''}
                </span>
              </div>
            </div>
          </td>
          <td class="text-center">${p.interest_rate || '-'}</td>
          <td class="text-center">${p.term || '-'}</td>
          <td class="text-center time-cell">
            <div class="time-info">
              <div class="time-row">
                <span class="time-label">In:</span>
                <span class="time-value">${buyInTime}</span>
              </div>
              <div class="time-row">
                <span class="time-label">Out:</span>
                <span class="time-value">${buyOutTime}</span>
              </div>
            </div>
          </td>
          <td class="text-center send-to-exchange-cell">
            <button class="btn-send-exchange" 
                    data-pair-id="${p.buy_id}-${p.sell_id}"
                    title="Gửi lên sàn">
              <i class="fas fa-paper-plane"></i>
            </button>
          </td>
        </tr>
      `;
      }).join('');
      
      // Tạo HTML phân trang
      const paginationHTML = totalPages > 1 ? `
        <div class="pairs-pagination">
          <button class="pagination-btn" onclick="changePairsPage(${currentPage - 1}); return false;" onmousedown="event.stopPropagation();" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
          </button>
          ${Array.from({length: Math.min(5, totalPages)}, (_, i) => {
            const pageNum = Math.max(1, currentPage - 2) + i;
            if (pageNum > totalPages) return '';
            return `
              <button class="pagination-btn ${pageNum === currentPage ? 'active' : ''}" onclick="changePairsPage(${pageNum}); return false;" onmousedown="event.stopPropagation();">
                ${pageNum}
              </button>
            `;
          }).join('')}
          <button class="pagination-btn" onclick="changePairsPage(${currentPage + 1}); return false;" onmousedown="event.stopPropagation();" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
          </button>
                                  </div>
      ` : '';
      
      return `
        <table class="pairs-table">
          <thead>
            <tr>
              <th class="text-center">STT</th>
              <th class="text-center">Người mua</th>
              <th class="text-center">Người bán</th>
              <th class="text-center">Giá</th>
              <th class="text-center">Số CCQ</th>
              <th class="text-center">CCQ Còn lại</th>
              <th class="text-center">Lãi suất</th>
              <th class="text-center">Kỳ hạn</th>
              <th class="text-center">Phiên giao dịch</th>
              <th class="text-center">-</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        ${paginationHTML}
      `;
    };

    // Tạo modal HTML với thiết kế hiện đại và chuyên nghiệp
    const modalHTML = `
      <div class="modal fade" id="matchingResultsModal" tabindex="-1" aria-labelledby="matchingResultsModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <!-- Modern Header -->
            <div class="modal-header">
              <div class="d-flex align-items-center">
                <div class="me-3">
                  <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-chart-line" style="font-size: 28px;"></i>
                                  </div>
                                </div>
                <div>
                  <h4 class="modal-title">Kết Quả Khớp Lệnh</h4>
                  <p class="modal-subtitle">
                    <i class="fas fa-cog me-1"></i>Thuật toán: ${algorithmUsed}
                  </p>
                              </div>
              </div>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            
            <!-- Modern Body -->
            <div class="modal-body">
              <!-- Statistics Cards -->
              <div class="stats-container">
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-icon pairs">
                      <i class="fas fa-handshake"></i>
                                  </div>
                    <div class="stat-value">${totalMatched}</div>
                    <div class="stat-label">Cặp Lệnh Khớp</div>
                                </div>
                  <div class="stat-card">
                    <div class="stat-icon ccq">
                      <i class="fas fa-coins"></i>
                            </div>
                    <div class="stat-value">${totalCCQ.toLocaleString('vi-VN')}</div>
                    <div class="stat-label">Tổng CCQ</div>
                                      </div>
                  <div class="stat-card">
                    <div class="stat-icon value">
                      <i class="fas fa-dollar-sign"></i>
                          </div>
                    <div class="stat-value">${totalValue.toLocaleString('vi-VN')}</div>
                    <div class="stat-label">Tổng Giá Trị (VND)</div>
                        </div>
                  <div class="stat-card">
                    <div class="stat-icon avg">
                      <i class="fas fa-chart-bar"></i>
                      </div>
                    <div class="stat-value">${avgPrice.toLocaleString('vi-VN')}</div>
                    <div class="stat-label">Giá Trung Bình (VND)</div>
                              </div>
                            </div>
                          </div>

              ${warnings.length > 0 ? `
              <!-- Warnings Section -->
              <div class="content-section">
                <div class="section-header">
                  <h5 class="section-title">
                    <i class="fas fa-exclamation-triangle text-warning"></i>
                    Cảnh báo
                  </h5>
                </div>
                <div class="warnings-container">
                  ${warnings.map(warning => `
                    <div class="alert alert-warning d-flex align-items-center" role="alert">
                      <i class="fas fa-exclamation-triangle me-2"></i>
                      <div>${warning}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
              ` : ''}

              ${result.profitable_info ? `
              <!-- Profitable Info Alert -->
              <div class="content-section">
                <div class="alert ${result.profitable_info.is_fallback ? 'alert-warning' : 'alert-info'}">
                  <i class="fas fa-info-circle me-2"></i>
                  <strong>Thông tin lệnh có lãi:</strong> Đã tìm thấy ${result.profitable_info.total_profitable} lệnh thỏa điều kiện lãi theo cấu hình chặn trên/chặn dưới.
                  ${result.profitable_info.filtered_buys ? ` (${result.profitable_info.filtered_buys.length} lệnh mua, ${result.profitable_info.filtered_sells.length} lệnh bán được khớp với nhà tạo lập)` : ''}
                  ${result.profitable_info.is_fallback ? '<br/><small class="text-muted"><i class="fas fa-exclamation-triangle me-1"></i>Sử dụng phương pháp dự phòng do API nav_management không khả dụng</small>' : ''}
                </div>
              </div>
              ` : ''}

              <!-- Allocation-style Section (Group by Fund) -->
              <div class="content-section">
                <div class="section-header">
                  <h5 class="section-title">
                    <i class="fas fa-sitemap"></i>
                    Danh sách lệnh khớp
                  </h5>
                </div>
                <div class="allocation-container">
                  ${allocationHTML || '<div class="text-muted">Không có dữ liệu khớp để hiển thị</div>'}
                </div>
              </div>

              <!-- Pending Orders Section -->
              <div class="content-section">
                <div class="section-header">
                  <h5 class="section-title">
                    <i class="fas fa-clock"></i>
                    Lệnh Chờ Khớp
                  </h5>
                </div>
                <div class="row">
                  <!-- Pending Buy Orders -->
                  <div class="col-md-6">
                    <div class="pending-orders-card">
                      <div class="card-header bg-success text-white">
                        <h6 class="mb-0">
                          <i class="fas fa-shopping-cart me-2"></i>
                          Lệnh Mua Chờ Khớp (${remainingBuys})
                        </h6>
                      </div>
                      <div class="card-body">
                        <div class="pending-orders-list" id="pendingBuyOrders">
                          <div class="text-center text-muted">
                            <i class="fas fa-spinner fa-spin"></i>
                            Đang tải dữ liệu...
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Pending Sell Orders -->
                  <div class="col-md-6">
                    <div class="pending-orders-card">
                      <div class="card-header bg-danger text-white">
                        <h6 class="mb-0">
                          <i class="fas fa-shopping-bag me-2"></i>
                          Lệnh Bán Chờ Khớp (${remainingSells})
                        </h6>
                      </div>
                      <div class="card-body">
                        <div class="pending-orders-list" id="pendingSellOrders">
                          <div class="text-center text-muted">
                            <i class="fas fa-spinner fa-spin"></i>
                            Đang tải dữ liệu...
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Modern Footer -->
            <div class="modal-footer">
              <div class="modal-footer-left">
                <button type="button" class="modal-btn modal-btn-secondary" data-bs-dismiss="modal">
                  <i class="fas fa-times"></i>
                  Đóng
              </button>
                <button type="button" class="modal-btn modal-btn-primary" onclick="window.exportToPDF()">
                  <i class="fas fa-file-pdf"></i>
                  Xuất PDF
              </button>
                </div>
              <div class="modal-footer-right">
                <button type="button" class="modal-btn modal-btn-success" onclick="window.location.reload()">
                  <i class="fas fa-sync-alt"></i>
                  Làm Mới Trang
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // CSS đã được tích hợp vào file CSS chính, không cần thêm inline CSS

    // Thêm modal vào body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modalEl = document.getElementById('matchingResultsModal');

    // Tạo backdrop thủ công (không phụ thuộc bootstrap JS)
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop fade show';

    const openModal = () => {
      document.body.appendChild(backdrop);
      document.body.classList.add('modal-open');
      modalEl.style.display = 'block';
      // force reflow để kích hoạt transition
      // eslint-disable-next-line no-unused-expressions
      modalEl.offsetHeight;
      modalEl.classList.add('show');
      modalEl.setAttribute('aria-hidden', 'false');
    };

    const cleanup = () => {
      modalEl.classList.remove('show');
      modalEl.setAttribute('aria-hidden', 'true');
      setTimeout(() => {
        if (modalEl && modalEl.parentElement) modalEl.parentElement.removeChild(modalEl);
        if (backdrop && backdrop.parentElement) backdrop.parentElement.removeChild(backdrop);
        document.body.classList.remove('modal-open');
        
        // CSS đã được tích hợp vào file CSS chính, không cần xóa
        
        // Xóa function exportToPDF khỏi window
        if (window.exportToPDF) {
          delete window.exportToPDF;
        }
        
        // Không cần xóa clearMatchedPairsHistory nữa vì không sử dụng localStorage
        
        // Xóa biến global phân trang
        if (window.currentPairsData) {
          delete window.currentPairsData;
        }
        if (window.changePairsPage) {
          delete window.changePairsPage;
        }
      }, 150);
    };

    // Đóng khi click nút close hoặc các phần tử có data-bs-dismiss="modal"
    modalEl.querySelectorAll('[data-bs-dismiss="modal"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        cleanup();
      });
    });

    // Đóng khi click ra ngoài nội dung modal (overlay)
    modalEl.addEventListener('click', (e) => {
      // Chỉ đóng khi click vào backdrop, không phải vào nội dung modal
      if (e.target === modalEl) {
        cleanup();
      }
    });
    
    // Thêm event delegation để xử lý tất cả click trong modal
    modalEl.addEventListener('click', (e) => {
      // Xử lý click vào tab navigation
      if (e.target.closest('.pairs-tab')) {
        e.preventDefault();
        e.stopPropagation();
        const btn = e.target.closest('.pairs-tab');
        const filter = btn.getAttribute('data-filter');
        
        console.log(`[DEBUG] Tab clicked: ${filter}`);
        console.log(`[DEBUG] Button element:`, btn);
        console.log(`[DEBUG] Current filter data:`, filter);
        
        if (filter) {
          console.log(`[DEBUG] ===== CLICK FILTER DEBUG START =====`);
          console.log(`[DEBUG] Filter clicked: ${filter}`);
          console.log(`[DEBUG] window.currentPairsData:`, window.currentPairsData);
          
          window.currentPairsData.currentFilter = filter;
          window.currentPairsData.currentPage = 1;
          
          console.log(`[DEBUG] Before filtering - total pairs: ${window.currentPairsData.allPairs.length}`);
          const pairs = buildFilteredPairs(filter);
          console.log(`[DEBUG] After filtering - filtered pairs: ${pairs.length}`);
          console.log(`[DEBUG] ===== CLICK FILTER DEBUG END =====`);
          
          const tableContainer = document.getElementById('pairs-table-container');
          if (tableContainer) {
            console.log(`[DEBUG] Updating table with ${pairs.length} pairs`);
            tableContainer.innerHTML = renderPairsTable(pairs, 1);
            
            // Update active tab
            const btns = tableContainer.closest('.pairs-table-container').querySelectorAll('.pairs-tab');
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update pairs count
            const pairsCount = document.getElementById('pairs-count');
            if (pairsCount) {
              pairsCount.textContent = `${pairs.length} cặp lệnh`;
              console.log(`[DEBUG] Updated pairs count to: ${pairs.length}`);
            }
          } else {
            console.error(`[DEBUG] Table container not found!`);
          }
        } else {
          console.error(`[DEBUG] No filter attribute found on button!`);
        }
        return;
      }
      
      // Xử lý click vào phân trang
      if (e.target.closest('.pagination-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const btn = e.target.closest('.pagination-btn');
        const page = parseInt(btn.getAttribute('onclick')?.match(/changePairsPage\((\d+)\)/)?.[1]);
        if (page && !isNaN(page)) {
          changePairsPage(page);
        }
        return;
      }
      
      // Xử lý click vào nút "Gửi lên sàn"
      if (e.target.closest('.btn-send-exchange')) {
        e.preventDefault();
        e.stopPropagation();
        const btn = e.target.closest('.btn-send-exchange');
        const pairId = btn.getAttribute('data-pair-id');
        
        console.log(`[DEBUG] Gửi lên sàn cho pair: ${pairId}`);
        
        // Hiển thị thông báo gửi lên sàn
        this.showNotification(`📤 Đang gửi cặp lệnh ${pairId} lên sàn...`, 'info');
        
        // Simulate gửi lên sàn (có thể thay bằng API call thực tế)
        setTimeout(() => {
          // Làm mờ row
          const row = btn.closest('.pairs-table-row');
          if (row) {
            row.style.opacity = '0.5';
            row.style.pointerEvents = 'none';
          }
          
          // Thay đổi icon và text
          btn.innerHTML = '<i class="fas fa-check"></i>';
          btn.classList.add('sent');
          btn.title = 'Đã gửi lên sàn';
          
          // Hiển thị thông báo thành công
          this.showNotification(`✅ Đã gửi cặp lệnh ${pairId} lên sàn thành công!`, 'success');
        }, 1500);
        
        return;
      }
      
      // Ngăn event bubble cho các element khác trong modal
      if (e.target.closest('.pairs-pagination') || e.target.closest('.pairs-tabs')) {
        e.stopPropagation();
      }
    }, true); // Sử dụng capture phase

    // Đóng khi nhấn ESC
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        cleanup();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    // Thêm function exportToPDF vào window
    window.exportToPDF = this.exportToPDF.bind(this);
    
    // Không cần function xóa lịch sử nữa vì không sử dụng localStorage
    
    // Biến global để quản lý trạng thái phân trang
    window.currentPairsData = {
      allPairs: normalizedPairs,
      currentFilter: 'all',
      currentPage: 1,
      itemsPerPage: 10
    };
    
    console.log(`[DEBUG] Initialized currentPairsData:`, {
      totalPairs: window.currentPairsData.allPairs.length,
      currentFilter: window.currentPairsData.currentFilter,
      samplePairTypes: window.currentPairsData.allPairs.slice(0, 3).map(p => ({
        buy_id: p.buy_id,
        sell_id: p.sell_id,
        _pairType: p._pairType
      }))
    });
    
    // Hàm thay đổi trang
    window.changePairsPage = (page) => {
      if (page < 1 || page > Math.ceil(window.currentPairsData.allPairs.length / window.currentPairsData.itemsPerPage)) return;
      window.currentPairsData.currentPage = page;
      const filteredPairs = buildFilteredPairs(window.currentPairsData.currentFilter);
      const tableContainer = document.getElementById('pairs-table-container');
      if (tableContainer) {
        tableContainer.innerHTML = renderPairsTable(filteredPairs, page, window.currentPairsData.itemsPerPage);
        
        // Không cần attach event listeners nữa vì đã dùng event delegation
      }
    };
    
    // Test function để debug filter
    window.testFilter = (filterType) => {
      console.log(`[DEBUG] ===== TEST FILTER START =====`);
      console.log(`[DEBUG] Testing filter: ${filterType}`);
      console.log(`[DEBUG] window.currentPairsData:`, window.currentPairsData);
      
      if (window.currentPairsData && window.currentPairsData.allPairs) {
        const testResult = buildFilteredPairs(filterType);
        console.log(`[DEBUG] Test result: ${testResult.length} pairs`);
        console.log(`[DEBUG] Test result sample:`, testResult.slice(0, 2));
      } else {
        console.log(`[DEBUG] ERROR: window.currentPairsData not available!`);
      }
      
      console.log(`[DEBUG] ===== TEST FILTER END =====`);
    };
    
    // Test function để debug matched orders API
    window.testMatchedOrdersAPI = async () => {
      console.log(`[DEBUG] ===== TEST MATCHED ORDERS API START =====`);
      try {
        const response = await this.rpc('/api/transaction-list/get-matched-pairs', {});
        console.log(`[DEBUG] API Response:`, response);
        console.log(`[DEBUG] Success:`, response?.success);
        console.log(`[DEBUG] Data length:`, response?.data?.length);
        console.log(`[DEBUG] Sample data:`, response?.data?.[0]);
        
        if (response?.data?.length > 0) {
          console.log(`[DEBUG] First pair details:`, {
            buy_investor: response.data[0].buy_investor,
            sell_investor: response.data[0].sell_investor,
            matched_volume: response.data[0].matched_volume,
            matched_price: response.data[0].matched_price
          });
        }
      } catch (error) {
        console.error(`[DEBUG] API Error:`, error);
      }
      console.log(`[DEBUG] ===== TEST MATCHED ORDERS API END =====`);
    };
    
    // Test function để kiểm tra dữ liệu trong state
    window.testMatchedOrdersState = () => {
      console.log(`[DEBUG] ===== TEST MATCHED ORDERS STATE START =====`);
      console.log(`[DEBUG] state.matchedOrders:`, this.state.matchedOrders);
      console.log(`[DEBUG] state.filteredMatchedOrders:`, this.state.filteredMatchedOrders);
      console.log(`[DEBUG] state.matchedOrders.length:`, this.state.matchedOrders.length);
      console.log(`[DEBUG] state.filteredMatchedOrders.length:`, this.state.filteredMatchedOrders.length);
      console.log(`[DEBUG] ===== TEST MATCHED ORDERS STATE END =====`);
    };

    // Bỏ nút xử lý phần còn lại trong modal

    // Mở modal
    openModal();

    // Render chi tiết và bảng sau khi modal mở
    setTimeout(async () => {
      // Render chi tiết cặp lệnh (CHỈ từ lần khớp hiện tại, không phải từ backend)
      const detailsContainer = document.getElementById('matched-pairs-details-container');
      if (detailsContainer) {
        // Sử dụng result.matched_pairs từ lần khớp hiện tại thay vì allMatchedPairs từ backend
        const currentMatchedPairs = result.matched_pairs || [];
        console.log(`[DEBUG] Rendering details with current matched pairs: ${currentMatchedPairs.length}`);
        detailsContainer.innerHTML = await renderMatchedPairsDetails(currentMatchedPairs);
      }
      
      // Debug: Log dữ liệu trước khi render
      console.log(`[DEBUG] ===== RENDER DEBUG START =====`);
      console.log(`[DEBUG] normalizedPairs length: ${normalizedPairs.length}`);
      console.log(`[DEBUG] normalizedPairs sample:`, normalizedPairs.slice(0, 2));
      console.log(`[DEBUG] ===== RENDER DEBUG END =====`);
      
      // Render bảng tổng hợp (vẫn sử dụng tất cả dữ liệu từ backend)
      const tableContainer = document.getElementById('pairs-table-container');
      if (tableContainer) {
        tableContainer.innerHTML = renderPairsTable(normalizedPairs, 1);
        
        // Update pairs count
        const pairsCount = document.getElementById('pairs-count');
        if (pairsCount) {
          pairsCount.textContent = `${normalizedPairs.length} cặp lệnh`;
        }
        
        // Update active tab
        const pairsTabs = document.querySelectorAll('.pairs-tab');
        pairsTabs.forEach(tab => tab.classList.remove('active'));
        const activeTab = document.querySelector('.pairs-tab[data-filter="all"]');
        if (activeTab) activeTab.classList.add('active');
      }
      
      // Load pending orders data
      await this.loadPendingOrders();
    }, 100);
  }

  async loadPendingOrders() {
    try {
      console.log('[DEBUG] Loading pending orders...');
      
      // Load all pending orders
      const response = await fetch('/api/transaction-list/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            status_filter: 'pending'
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const allOrders = data.result?.data || [];
        
        // Filter buy orders (purchase, buy)
        const buyOrders = allOrders.filter(order => 
          order.transaction_type === 'purchase' || 
          order.transaction_type === 'buy'
        );
        
        // Filter sell orders
        const sellOrders = allOrders.filter(order => 
          order.transaction_type === 'sell'
        );
        
        console.log(`[DEBUG] Found ${buyOrders.length} buy orders, ${sellOrders.length} sell orders`);
        
        // Cập nhật số lượng trong header
        this.updatePendingOrdersCount(buyOrders.length, sellOrders.length);
        
        this.renderPendingOrders('pendingBuyOrders', buyOrders, 'buy');
        this.renderPendingOrders('pendingSellOrders', sellOrders, 'sell');
      } else {
        console.error('[DEBUG] API response not ok:', response.status);
        this.updatePendingOrdersCount(0, 0);
        this.showErrorInContainers();
      }
      
    } catch (error) {
      console.error('[DEBUG] Error loading pending orders:', error);
      this.updatePendingOrdersCount(0, 0);
      this.showErrorInContainers();
    }
  }

  showErrorInContainers() {
    const errorHTML = '<div class="text-center text-danger"><i class="fas fa-exclamation-triangle"></i> Lỗi tải dữ liệu</div>';
    const buyContainer = document.getElementById('pendingBuyOrders');
    const sellContainer = document.getElementById('pendingSellOrders');
    
    if (buyContainer) buyContainer.innerHTML = errorHTML;
    if (sellContainer) sellContainer.innerHTML = errorHTML;
  }

  updatePendingOrdersCount(buyCount, sellCount) {
    // Cập nhật số lượng trong header của card
    const buyHeader = document.querySelector('.card-header.bg-success h6');
    const sellHeader = document.querySelector('.card-header.bg-danger h6');
    
    if (buyHeader) {
      buyHeader.innerHTML = `
        <i class="fas fa-shopping-cart me-2"></i>
        Lệnh Mua Chờ Khớp (${buyCount})
      `;
    }
    
    if (sellHeader) {
      sellHeader.innerHTML = `
        <i class="fas fa-shopping-bag me-2"></i>
        Lệnh Bán Chờ Khớp (${sellCount})
      `;
    }
    
    console.log(`[DEBUG] Updated counts: Buy=${buyCount}, Sell=${sellCount}`);
  }

  getFundNameFromPair(pair) {
    console.log('[DEBUG] ===== getFundNameFromPair DEBUG =====');
    console.log('[DEBUG] Pair object:', pair);
    console.log('[DEBUG] Pair keys:', Object.keys(pair));
    console.log('[DEBUG] fundOptions available:', this.state?.fundOptions?.length || 0);
    console.log('[DEBUG] fundOptions sample:', this.state?.fundOptions?.slice(0, 3));
    console.log('[DEBUG] filters.matchedFundId:', this.state?.filters?.matchedFundId);
    
    // 1. Thử lấy trực tiếp từ pair data (từ matched orders record)
    const direct = pair.fund_name || pair.buy_fund_name || pair.sell_fund_name || '';
    console.log('[DEBUG] Direct fund names check:', {
      'pair.fund_name': pair.fund_name,
      'pair.buy_fund_name': pair.buy_fund_name,
      'pair.sell_fund_name': pair.sell_fund_name,
      'direct result': direct
    });
    
    if (direct) {
      console.log('[DEBUG] ✅ Found direct fund name:', direct);
      return direct;
    }
    
    // 2. Thử lấy từ fund_id trong pair (từ matched orders record)
    const fundId = pair.fund_id || pair.buy_fund_id || pair.sell_fund_id;
    console.log('[DEBUG] Fund IDs check:', {
      'pair.fund_id': pair.fund_id,
      'pair.buy_fund_id': pair.buy_fund_id,
      'pair.sell_fund_id': pair.sell_fund_id,
      'selected fundId': fundId
    });
    
    if (fundId && this.state?.fundOptions?.length) {
      console.log('[DEBUG] Looking up fund_id:', fundId, 'in fundOptions');
      console.log('[DEBUG] fundOptions length:', this.state.fundOptions.length);
      const fundOption = this.state.fundOptions.find(f => String(f.id) === String(fundId));
      console.log('[DEBUG] Found fundOption:', fundOption);
      if (fundOption && fundOption.name) {
        console.log('[DEBUG] ✅ Found fund name from matched orders fund_id:', fundOption.name);
        return fundOption.name;
      } else {
        console.log('[DEBUG] ❌ fundOption not found or no name');
      }
    } else {
      console.log('[DEBUG] ❌ No fundId or fundOptions not available');
    }
    
    // 3. Fallback theo filter quỹ đang chọn
    const selectedFundId = this.state?.filters?.matchedFundId;
    console.log('[DEBUG] Selected fund ID from filter:', selectedFundId);
    if (selectedFundId && this.state?.fundOptions?.length) {
      const fo = this.state.fundOptions.find(f => String(f.id) === String(selectedFundId));
      console.log('[DEBUG] Found fund from filter:', fo);
      if (fo && fo.name) {
        console.log('[DEBUG] ✅ Found fund name from filter:', fo.name);
        return fo.name;
      } else {
        console.log('[DEBUG] ❌ Filter fund not found or no name');
      }
    } else {
      console.log('[DEBUG] ❌ No selectedFundId or fundOptions not available');
    }
    
    console.log('[DEBUG] ❌ No fund name found, returning N/A');
    console.log('[DEBUG] ===== END getFundNameFromPair DEBUG =====');
    return 'N/A';
  }

  renderPendingOrders(containerId, orders, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (orders.length === 0) {
      container.innerHTML = '<div class="text-center text-muted"><i class="fas fa-inbox"></i> Không có lệnh chờ</div>';
      return;
    }
    
    const typeLabel = type === 'buy' ? 'Mua' : 'Bán';
    const typeClass = type === 'buy' ? 'success' : 'danger';
    const typeIcon = type === 'buy' ? 'shopping-cart' : 'shopping-bag';
    
    const ordersHTML = orders.map(order => `
      <div class="pending-order-item">
        <div class="d-flex justify-content-between align-items-start">
          <div class="order-info">
            <div class="order-investor">
              <i class="fas fa-user me-1"></i>
              <strong>${order.investor_name || 'N/A'}</strong>
            </div>
            <div class="order-details">
              <small class="text-muted">
                <i class="fas fa-building me-1"></i>${order.fund_name || 'N/A'}
                <span class="ms-2">
                  <i class="fas fa-coins me-1"></i>${this.formatNumber(order.units || 0)} CCQ
                </span>
              </small>
            </div>
            <div class="order-price">
              <small class="text-muted">
                <i class="fas fa-dollar-sign me-1"></i>${this.formatAmount(order.amount || 0, order.currency || 'VND')}
                <span class="ms-2">
                  <i class="fas fa-tag me-1"></i>${this.formatNumber(order.price || 0)} VND/CCQ
                </span>
              </small>
            </div>
          </div>
          <div class="order-status">
            <span class="badge bg-${typeClass}">
              <i class="fas fa-${typeIcon} me-1"></i>${typeLabel}
            </span>
          </div>
        </div>
        <div class="order-time">
          <small class="text-muted">
            <i class="fas fa-clock me-1"></i>${order.created_at || 'N/A'}
          </small>
        </div>
      </div>
    `).join('');
    
    container.innerHTML = ordersHTML;
  }

  async importExcel() {
    try {
      // Tạo input file ẩn và trigger chọn
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx,.xls,.csv';
      input.style.display = 'none';
      document.body.appendChild(input);

      const file = await new Promise((resolve) => {
        input.addEventListener('change', () => {
          resolve(input.files && input.files[0] ? input.files[0] : null);
        }, { once: true });
        input.click();
      });

      document.body.removeChild(input);

      if (!file) {
        this.showNotification('⚠️ Bạn chưa chọn file. Thao tác bị hủy.', 'info');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/transaction-list/import-excel', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        this.showNotification(`📊 Import thành công: ${result.transactions.length} dòng`, 'success');
        // Hiển thị danh sách id đã tạo trong modal đơn giản
        const pairs = result.transactions.map((t, idx) => ({
          buy_id: t.id,
          buy_nav: t.current_nav, // Giữ lại cho hiển thị, nhưng không dùng để tính toán
          buy_base_nav: t.base_nav,
          buy_variation: t.variation_percent,
          buy_amount: t.amount,
          sell_id: '-',
          sell_nav: 0,
          sell_amount: 0,
        }));
        this.showMatchingResults({ matched_pairs: pairs, remaining: { buys: [], sells: [] } });
        this.loadData();
      } else {
        this.showNotification('❌ Lỗi khi import: ' + (result.message || 'Không xác định'), 'error');
      }
    } catch (error) {
      this.showNotification('❌ Lỗi kết nối: ' + error.message, 'error');
    }
  }

  async marketMakerHandleOne(transactionId) {
    try {
      // Kiểm tra điều kiện CÓ LÃI trước khi tạo lệnh đối ứng
      // 1) Lấy thông tin giao dịch để biết fund_id
      const detailResp = await fetch(`/api/transaction-list/get-transaction-details/${transactionId}`, { method: 'GET' });
      const detail = await detailResp.json();
      if (!detail || !detail.success || !detail.transaction || !detail.transaction.fund_name) {
        this.showNotification('❌ Không lấy được thông tin giao dịch.', 'error');
        return;
      }
      const fundId = detail.transaction.fund_id || this.state.selectedFundId || this.state.selectedMatchedFundId;
      if (!fundId) {
        this.showNotification('⚠️ Thiếu Fund để kiểm tra điều kiện lãi.', 'warning');
        return;
      }
      const dateStr = this.state.selectedDate || this.state.selectedMatchedDate || '';
      const profitableIds = await this.getProfitableTxIds(fundId, dateStr || null, dateStr || null);
      if (!profitableIds.has(Number(transactionId))) {
        this.showNotification('ℹ️ Lệnh không thỏa điều kiện lãi theo cấu hình hiện hành.', 'info');
        return;
      }

      // 2) Tạo lệnh đối ứng
      const resp = await fetch('/api/transaction-list/market-maker/handle-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: transactionId })
      });
      const data = await resp.json();
      if (data.success) {
        this.showNotification('✅ Đã tạo lệnh đối ứng', 'success');
        // Hiển thị popup cặp khớp
        if (data.matched_pairs) {
          const annotated = (data.matched_pairs || []).map(p => ({ ...p, _sourceType: 'market_maker' }));
          this.showMatchingResults({ matched_pairs: annotated, remaining: data.remaining || { buys: [], sells: [] }, algorithm_used: data.algorithm_used || 'Market Maker Manual' });
        }
        // Reload dữ liệu để phản ánh giao dịch mới (nhưng chưa approve)
        this.loadData();

        // Recalc tồn kho cho statcard (today hoặc theo ngày đã chọn)
        try {
          await fetch('/nav_management/api/inventory/recalc_after_match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', params: { fund_id: Number(fundId), inventory_date: dateStr || undefined } })
          });
        } catch (_) {}
      } else {
        this.showNotification('❌ Lỗi: ' + (data.message || 'Không xác định'), 'error');
      }
    } catch (e) {
      this.showNotification('❌ Lỗi kết nối: ' + e.message, 'error');
    }
  }

  // Helper: lấy danh sách transaction IDs có lãi theo cap hiện hành (server-side)
  async getProfitableTxIds(fundId, fromDate = null, toDate = null) {
    try {
      const payload = { jsonrpc: '2.0', params: { fund_id: Number(fundId) } };
      if (fromDate) payload.params.from_date = fromDate;
      if (toDate) payload.params.to_date = toDate;
      const resp = await fetch('/nav_management/api/calculate_nav_transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (data && data.success && Array.isArray(data.transactions)) {
        const ids = new Set(data.transactions.map(it => Number(it.id)).filter(Boolean));
        return ids;
      }
      return new Set();
    } catch (_) {
      return new Set();
    }
  }



  showNotification(message, type = 'info') {
    // Tạo notification đơn giản
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-hide sau 5 giây
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  formatAmountVND(amount) {
    if (amount === null || amount === undefined || amount === '' || isNaN(Number(amount))) {
      return '-';
    }
    try {
      const value = Number(amount);
      return new Intl.NumberFormat('vi-VN').format(value) + ' VND';
    } catch (e) {
      return String(amount) + ' VND';
    }
  }

  formatNumber(number) {
    if (number === null || number === undefined || number === '' || isNaN(Number(number))) {
      return '-';
    }
    const value = Number(number);
    return new Intl.NumberFormat('vi-VN').format(value);
  }

  getCCQRemainingColorClass(value) {
    if (value > 0) return 'ccq-remaining-positive';
    if (value < 0) return 'ccq-remaining-negative';
    return 'ccq-remaining-zero';
  }

  getCCQChangeColorClass(value) {
    if (value > 0) return 'ccq-change-positive';
    if (value < 0) return 'ccq-change-negative';
    return '';
  }

  formatDate(dateString) {
    if (!dateString) {
      return '-';
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '-';
      }
      return date.toLocaleDateString('vi-VN');
    } catch (e) {
      return '-';
    }
  }

  formatDateTime(dateString) {
    if (!dateString) {
      return '-';
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '-';
      }
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (e) {
      return '-';
    }
  }

  getVisibleColumnsCount() {
    let count = 0;
    Object.keys(this.state.visibleColumns).forEach(key => {
      if (this.state.visibleColumns[key]) {
        // Cột "Số lượng khớp" chỉ hiển thị ở tab "Approved"
        if (key === 'matched_units' && this.state.activeSubTab !== 'approved') {
          return; // Bỏ qua cột này nếu không ở tab approved
        }
        count++;
      }
    });
    return count;
  }

  toggleAllColumns(ev) {
    const checked = ev.target.checked;
    Object.keys(this.state.visibleColumns).forEach(key => {
      this.state.visibleColumns[key] = checked;
    });
  }

  formatUnitPrice(transaction) {
    // Ưu tiên unit_price, sau đó current_nav, cuối cùng tính từ amount/units (giữ lại cho hiển thị, nhưng không dùng để tính toán)
    let unitPrice = transaction.unit_price || transaction.current_nav;
    
    // Nếu không có unit_price và current_nav, tính từ amount/units
    if (!unitPrice && transaction.amount && transaction.units && transaction.units > 0) {
      unitPrice = transaction.amount / transaction.units;
    }
    
    if (!unitPrice || unitPrice === 0 || isNaN(Number(unitPrice))) {
      return '-';
    }
    
    return this.formatPriceWithDot(unitPrice, transaction.currency);
  }

  formatPriceWithDot(price, currency) {
    if (price === null || price === undefined || price === '' || isNaN(Number(price))) {
      return '-';
    }
    const value = Number(price);
    const cur = (currency || '').toString().trim().toUpperCase();
    
    try {
      if (cur === 'USD' || cur === '$' || cur === 'US$' || cur === 'US DOLLAR') {
        // Format USD với dấu chấm phân cách hàng nghìn
        return '$' + value.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }
      if (cur === 'VND' || cur === '₫' || cur === 'VND₫' || cur === '') {
        // Format VND với dấu chấm phân cách hàng nghìn, không có số thập phân
        return value.toLocaleString('vi-VN', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }) + ' VND';
      }
      // Mặc định: hiển thị theo mã tiền tệ với dấu chấm
      try {
        return value.toLocaleString('vi-VN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + ' ' + cur;
      } catch (e) {
        return value.toLocaleString('vi-VN', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }) + ' VND';
      }
    } catch (e) {
      return value.toLocaleString('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }) + ' VND';
    }
  }

  formatAmount(amount, currency) {
    if (amount === null || amount === undefined || amount === '' || isNaN(Number(amount))) {
      return '-';
    }
    const value = Number(amount);
    const cur = (currency || '').toString().trim().toUpperCase();
    try {
      if (cur === 'USD' || cur === '$' || cur === 'US$' || cur === 'US DOLLAR') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);
      }
      if (cur === 'VND' || cur === '₫' || cur === 'VND₫' || cur === '') {
        return new Intl.NumberFormat('vi-VN').format(value) + ' VND';
      }
      // Mặc định: hiển thị theo mã tiền tệ nếu hợp lệ, fallback VND style
      try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(value);
      } catch (_) {
        return new Intl.NumberFormat('vi-VN').format(value) + (cur ? ' ' + cur : ' VND');
      }
    } catch (e) {
      return value + (cur ? ' ' + cur : ' VND');
    }
  }

  viewContract(transaction) {
    this.state.selectedContract = transaction;
    this.state.showContractModal = true;
  }

  closeContractModal() {
    this.state.showContractModal = false;
    this.state.selectedContract = null;
  }

  exportToPDF() {
    // Tạo nội dung HTML cho PDF
    const modalContent = document.querySelector('#matchingResultsModal .modal-content');
    if (modalContent) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Báo Cáo Khớp Lệnh</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .modal-content { box-shadow: none !important; border: 1px solid #ddd; }
              .modal-header { background: #1e3c72 !important; color: white !important; }
              .stat-card { margin-bottom: 20px; }
              .matched-pair-card { page-break-inside: avoid; margin-bottom: 20px; }
              @media print { .modal-footer { display: none !important; } }
            </style>
          </head>
          <body>
            ${modalContent.outerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  async rpc(route, params) {
    try {
      console.log('RPC call to:', route);
      console.log('RPC params:', params);
      
      const response = await fetch(route, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(params)
      });
      
      console.log('RPC response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('RPC response data:', data);
      
      // Handle JSON-RPC format
      if (data && data.jsonrpc && data.result) {
        console.log('Returning JSON-RPC result:', data.result);
        return data.result;
      }
      
      // Handle direct response format
      if (data && typeof data === 'object') {
        console.log('Returning direct response:', data);
        return data;
      }
      
      console.log('Returning raw data:', data);
      return data;
    } catch (error) {
      console.error('RPC Error:', error);
      throw error;
    }
  }

  // Filter functions
  async loadFundOptions() {
    try {
      console.log('[DEBUG] Loading fund options...');
      
      // First try the funds API
      const response = await fetch('/api/transaction-list/funds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({})
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[DEBUG] Funds API response:', data);
        
        if (data && data.success && data.data && data.data.length > 0) {
          this.state.fundOptions = data.data.map(fund => ({
            value: fund.id,
            label: `${fund.name} (${fund.ticker || fund.symbol || ''})`
          }));
          console.log('[DEBUG] Loaded fund options:', this.state.fundOptions);
          return;
        }
      }
      
      // Fallback: extract from transactions
      console.log('[DEBUG] Using fallback: extract from transactions');
      this.extractFundOptionsFromTransactions();
      
    } catch (error) {
      console.error('Error loading fund options:', error);
      this.extractFundOptionsFromTransactions();
    }
  }

  extractFundOptionsFromTransactions() {
    const funds = new Map();
    
    // Extract from regular transactions
    this.state.transactions.forEach(tx => {
      if (tx.fund_id && tx.fund_name) {
        funds.set(tx.fund_id, {
          value: tx.fund_id,
          label: tx.fund_name + (tx.fund_ticker ? ` (${tx.fund_ticker})` : '')
        });
      }
    });
    
    // Extract from matched orders - check both buy and sell funds
    this.state.matchedOrders.forEach(order => {
      // Add buy fund
      if (order.buy_fund_id && order.buy_fund_name) {
        funds.set(order.buy_fund_id, {
          value: order.buy_fund_id,
          label: order.buy_fund_name
        });
      }
      // Add sell fund
      if (order.sell_fund_id && order.sell_fund_name) {
        funds.set(order.sell_fund_id, {
          value: order.sell_fund_id,
          label: order.sell_fund_name
        });
      }
      // Fallback to shared fund_id (for backward compatibility)
      if (order.fund_id && order.fund_name) {
        funds.set(order.fund_id, {
          value: order.fund_id,
          label: order.fund_name
        });
      }
    });
    
    this.state.fundOptions = Array.from(funds.values());
    console.log('[DEBUG] Extracted fund options from transactions:', this.state.fundOptions);
  }

  onFundFilterChange(ev) {
    this.state.selectedFundId = ev.target.value;
    this.applyFilters();
  }

  onDateFilterChange(ev) {
    this.state.selectedDate = ev.target.value;
    this.state.selectedQuickDate = '';
    // Đồng bộ với bảng khớp lệnh thỏa thuận
    this.state.selectedMatchedDate = ev.target.value;
    this.state.selectedMatchedQuickDate = '';
    this.applyFilters();
    // Reload matched orders với ngày mới
    this.loadMatchedOrders();
  }

  onQuickDateFilterChange(ev) {
    this.state.selectedQuickDate = ev.target.value;
    this.state.selectedDate = '';
    // Đồng bộ với bảng khớp lệnh thỏa thuận
    this.state.selectedMatchedQuickDate = ev.target.value;
    this.state.selectedMatchedDate = '';
    this.applyFilters();
    // Reload matched orders với ngày mới
    this.loadMatchedOrders();
  }

  onMatchedFundFilterChange(ev) {
    this.state.selectedMatchedFundId = ev.target.value;
    // Re-fetch from server to avoid client-side mismatch
    this.loadMatchedOrders();
  }

  onMatchedDateFilterChange(ev) {
    this.state.selectedMatchedDate = ev.target.value;
    this.state.selectedMatchedQuickDate = '';
    // Đồng bộ với filter chính
    this.state.selectedDate = ev.target.value;
    this.state.selectedQuickDate = '';
    // Re-fetch with new date
    this.loadMatchedOrders();
    // Cập nhật filter chính
    this.applyFilters();
  }

  onMatchedQuickDateFilterChange(ev) {
    this.state.selectedMatchedQuickDate = ev.target.value;
    this.state.selectedMatchedDate = '';
    // Đồng bộ với filter chính
    this.state.selectedQuickDate = ev.target.value;
    this.state.selectedDate = '';
    // Re-fetch with quick date
    this.loadMatchedOrders();
    // Cập nhật filter chính
    this.applyFilters();
  }


  applyMatchedFilters() {
    console.log('[DEBUG] ===== APPLY MATCHED FILTERS DEBUG START =====');
    console.log('[DEBUG] selectedMatchedFundId:', this.state.selectedMatchedFundId);
    console.log('[DEBUG] selectedMatchedDate:', this.state.selectedMatchedDate);
    console.log('[DEBUG] selectedMatchedQuickDate:', this.state.selectedMatchedQuickDate);
    console.log('[DEBUG] Current filter type:', this.state.matchedOrdersFilter);
    
    // Start with current filtered data based on type filter
    let filtered = [...this.state.filteredMatchedOrders];
    
    // Apply additional dropdown filters
    this.applyAdditionalMatchedFilters(filtered);
  }
}

// Add CSS for pending orders
const pendingOrdersCSS = `
<style>
.pending-orders-card {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 1rem;
}

.pending-orders-card .card-header {
  padding: 0.75rem 1rem;
  border-bottom: none;
  font-weight: 600;
}

.pending-orders-card .card-body {
  padding: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.pending-order-item {
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: #f8f9fa;
  transition: all 0.2s ease;
}

.pending-order-item:hover {
  background: #e9ecef;
  border-color: #dee2e6;
}

.pending-order-item:last-child {
  margin-bottom: 0;
}

.order-info {
  flex: 1;
}

.order-investor {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.order-details {
  margin-bottom: 0.25rem;
}

.order-price {
  margin-bottom: 0.25rem;
}

.order-time {
  margin-top: 0.25rem;
  padding-top: 0.25rem;
  border-top: 1px solid #dee2e6;
}

.order-status {
  margin-left: 0.5rem;
}

.order-status .badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

/* Scrollbar styling for pending orders */
.pending-orders-list::-webkit-scrollbar {
  width: 6px;
}

.pending-orders-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.pending-orders-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.pending-orders-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
`;

// Inject CSS into document head
if (!document.getElementById('pending-orders-css')) {
  const styleElement = document.createElement('div');
  styleElement.id = 'pending-orders-css';
  styleElement.innerHTML = pendingOrdersCSS;
  document.head.appendChild(styleElement);
} 