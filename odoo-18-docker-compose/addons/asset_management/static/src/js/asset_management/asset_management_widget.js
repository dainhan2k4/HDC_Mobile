/** @odoo-module */

import { Component, xml, useState, onMounted } from "@odoo/owl";
import { loadJS } from "@web/core/assets";

export class AssetManagementWidget extends Component {
  static template = xml`
    <div class="am-scope s_hero bg-white shadow rounded-4 p-4">
        <main class="container-fluid px-0 px-md-3">
            <!-- Summary Cards -->
            <section class="row g-4 mb-4">
                <!-- Total Asset Card -->
                <div class="col-md-4">
                    <div class="card shadow rounded-4 border-0 h-100">
                        <div class="card-body d-flex flex-column align-items-center">
                            <p class="text-uppercase text-secondary fw-semibold mb-2 small s_paragraph letter-spacing-1">
                                Tổng tài sản
                            </p>
                            <p class="display-4 fw-bold text-dark mb-4 s_title">
                                <t t-esc="this.formatCurrency(state.totalAssets)"/>
                                <span class="fs-4 fw-bold">đ</span>
                            </p>
                            <div class="d-flex align-items-center justify-content-center" style="width:220px; height:220px;">
                                <canvas id="assetOverviewChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Fund Certificates Holding Card -->
                <div class="col-md-8">
                    <div class="card shadow rounded-4 border-0 h-100">
                        <div class="card-body">
                            <h2 class="h5 fw-semibold text-secondary mb-3 s_title">
                                Chứng chỉ quỹ nắm giữ
                            </h2>
                            <div class="table-responsive">
                                <table class="table align-middle table-hover table-bordered mb-0 rounded-4 overflow-hidden">
                                    <thead class="table-light">
                                        <tr>
                                            <th class="text-center">Chứng chỉ quỹ</th>
                                            <th class="text-center">Số lượng</th>
                                            <th class="text-center">Lời/Lỗ %</th>
                                            <th class="text-center">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <t t-if="state.fundCertificates and Array.isArray(state.fundCertificates) and state.fundCertificates.length > 0">
                                            <t t-foreach="state.fundCertificates" t-as="cert" t-key="cert.code or cert_index">
                                                <tr>
                                                    <td class="text-center">
                                                        <div class="d-flex align-items-center gap-2 justify-content-center">
                                                            <span t-attf-style="background-color: #{cert.color or '#2B4BFF'}; width:18px; height:18px; border-radius:50%; display:inline-block;"></span>
                                                            <div>
                                                                <p class="fw-semibold text-dark mb-0"><t t-esc="cert.name or ''"/></p>
                                                                <p class="text-muted small mb-0">
                                                                    <t t-esc="cert.code or ''"/> - FFlex
                                                                    <t t-if="cert.quantity2"><br/><t t-esc="cert.code or ''"/> - FSip</t>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="text-center fw-semibold">
                                                        <t t-esc="cert.quantity or '0'"/> CCQ
                                                        <t t-if="cert.quantity2"><br/><t t-esc="cert.quantity2"/> CCQ</t>
                                                    </td>
                                                    <td class="text-center">
                                                        <span t-attf-class="fw-semibold badge rounded-pill px-2 py-1 fs-7 #{(cert.isProfit === true) ? 'bg-success' : 'bg-danger'}">
                                                            <t t-if="cert.isProfit === true">↑</t>
                                                            <t t-else="">↓</t>
                                                            <t t-esc="cert.change or '0'"/>%
                                                        </span>
                                                    </td>
                                                    <td class="text-center">
                                                        <div class="d-flex align-items-center justify-content-center gap-2" style="min-height: 38px;">
                                                            <a href="/fund_buy" class="btn btn-outline-primary btn-sm rounded-pill p-0 d-flex align-items-center justify-content-center" style="width:32px; height:32px;" title="Mua thêm">
                                                                <i class="fas fa-shopping-cart"></i>
                                                            </a>
                                                            <a href="/fund_compare" class="btn btn-outline-info btn-sm rounded-pill p-0 d-flex align-items-center justify-content-center" style="width:32px; height:32px;" title="So sánh quỹ">
                                                                <i class="fas fa-chart-bar"></i>
                                                            </a>
                                                            <a href="/fund_swap" class="btn btn-outline-warning btn-sm rounded-pill p-0 d-flex align-items-center justify-content-center" style="width:32px; height:32px;" title="Hoán đổi">
                                                                <i class="fas fa-exchange-alt"></i>
                                                            </a>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </t>
                                        </t>
                                        <t t-if="!state.fundCertificates or !Array.isArray(state.fundCertificates) or state.fundCertificates.length === 0">
                                            <tr>
                                                <td colspan="4" class="text-center text-muted">
                                                    Không có dữ liệu chứng chỉ quỹ
                                                </td>
                                            </tr>
                                        </t>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Tabs and Tables -->
            <section class="card shadow rounded-4 mb-4 border-0">
                <div class="card-body">
                    <!-- Tabs -->
                    <ul class="nav nav-tabs mb-4 rounded-3 overflow-hidden">
                        <t t-if="state.fundTabs and Array.isArray(state.fundTabs) and state.fundTabs.length > 0">
                            <t t-foreach="state.fundTabs" t-as="tab" t-key="tab.code or tab_index">
                                <li class="nav-item">
                                    <button t-attf-class="nav-link px-4 py-2 fw-semibold #{(tab.isActive === true) ? 'active' : ''} rounded-top-3"
                                            t-att-data-fund="tab.code or ''"
                                            t-on-click="() => this.changeTab(tab.code or '')">
                                        <t t-esc="tab.name or ''"/>
                                    </button>
                                </li>
                            </t>
                        </t>
                    </ul>

                    <!-- Table 1: Danh sách lệnh mua đang nắm giữ -->
                    <section>
                        <h3 class="h6 fw-bold text-dark mb-3">
                            Danh sách lệnh mua đang nắm giữ
                            <span class="text-primary">
                                <t t-esc="state.selectedFund ? state.selectedFund.name : ''"/>
                            </span>
                        </h3>
                        <!-- Thêm bộ lọc ngày cho Danh sách lệnh mua đang nắm giữ -->
                        <div class="row mb-3">
                            <div class="col-md-3">
                                <label for="holdings-date-from" class="form-label mb-1">Từ ngày</label>
                                <input type="date" id="holdings-date-from" class="form-control" t-model="state.holdingsDateFrom" t-on-change="() => this.filterHoldingsByDate()"/>
                            </div>
                            <div class="col-md-3">
                                <label for="holdings-date-to" class="form-label mb-1">Đến ngày</label>
                                <input type="date" id="holdings-date-to" class="form-control" t-model="state.holdingsDateTo" t-on-change="() => this.filterHoldingsByDate()"/>
                            </div>
                        </div>
                        <div class="table-responsive rounded-4 border mb-3 shadow-sm">
                            <table class="table table-sm align-middle table-striped table-hover mb-0 rounded-4 overflow-hidden">
                                <thead class="custom-red-bg">
                                    <tr>
                                        <th class="text-center">Số tài khoản</th>
                                        <th class="text-center">Quỹ - Chương trình</th>
                                        <th class="text-center">Phiên giao dịch</th>
                                        <th class="text-center">Giá mua</th>
                                        <th class="text-center">Số lượng</th>
                                        <th class="text-center">Giá trị đầu tư</th>
                                        <th class="text-center">NAV kỳ trước</th>
                                        <th class="text-center">Giá trị hiện tại</th>
                                        <th class="text-center">Lỗ/Lãi(%)</th>
                                        <th class="text-center">Lỗ/Lãi(đ)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <t t-if="state.pagedHoldings and Array.isArray(state.pagedHoldings) and state.pagedHoldings.length > 0">
                                        <t t-foreach="state.pagedHoldings" t-as="holding" t-key="(holding.accountNumber or '') + (holding.fund or '') + (holding.tradingDate or '') + holding_index">
                                            <tr>
                                                <td class="text-center fw-semibold">
                                                    <t t-esc="holding.accountNumber or ''"/>
                                                </td>
                                                <td class="text-center fw-semibold">
                                                    <t t-esc="holding.ticker or holding.fund or ''"/>
                                                </td>
                                                <td class="text-center">
                                                    <t t-esc="holding.tradingDate or ''"/>
                                                </td>
                                                <td class="text-center">
                                                    <t t-esc="holding.buyPrice or '0'"/>
                                                </td>
                                                <td class="text-center">
                                                    <t t-esc="holding.quantity or '0'"/>
                                                </td>
                                                <td class="text-center">
                                                    <t t-esc="this.formatCurrency(holding.investmentValue or 0)"/>đ
                                                </td>
                                                <td class="text-center">
                                                    <t t-esc="this.formatCurrency(holding.previousNav or 0)"/>đ
                                                </td>
                                                <td class="text-center">
                                                    <t t-esc="this.formatCurrency(holding.currentValue or 0)"/>đ
                                                </td>
                                                <td class="text-center">
                                                    <span t-attf-class="fw-semibold badge rounded-pill px-2 py-1 fs-7 #{(holding.isProfit === true) ? 'bg-success' : 'bg-danger'}">
                                                        <t t-if="holding.isProfit === true">↑</t>
                                                        <t t-else="">↓</t>
                                                        <t t-esc="holding.profitLossPercent or '0'"/>%
                                                    </span>
                                                </td>
                                                <td class="text-center">
                                                    <span t-attf-class="fw-semibold badge rounded-pill px-2 py-1 fs-7 #{(holding.isProfit === true) ? 'bg-success' : 'bg-danger'}">
                                                        <t t-esc="this.formatCurrency(holding.profitLossAmount or 0)"/>đ
                                                    </span>
                                                </td>
                                            </tr>
                                        </t>
                                    </t>
                                    <t t-if="!state.pagedHoldings or !Array.isArray(state.pagedHoldings) or state.pagedHoldings.length === 0">
                                        <tr>
                                            <td colspan="10" class="text-center text-muted">
                                                Không có dữ liệu holdings
                                            </td>
                                        </tr>
                                    </t>
                                </tbody>
                            </table>
                        </div>

                        <!-- Pagination & Page Size -->
                        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-center mt-3 small text-secondary gap-2">
                            <div>
                                Hiện <t t-esc="state.pagination_start"/> - <t t-esc="state.pagination_end"/> trong số <t t-esc="state.pagination_total"/>
                            </div>
                            <div class="mt-2 mt-sm-0 d-flex align-items-center gap-2">
                                <label for="pageSize" class="form-label mb-0">Số lượng 1 trang:</label>
                                <select id="pageSize" name="pageSize" class="form-select form-select-sm w-auto rounded-pill" t-on-change="(ev) => this.changePageSize(ev.target.value)">
                                    <option value="10" t-att-selected="state.holdingsPageSize == 10">10</option>
                                    <option value="20" t-att-selected="state.holdingsPageSize == 20">20</option>
                                    <option value="50" t-att-selected="state.holdingsPageSize == 50">50</option>
                                </select>
                            </div>
                            <nav class="d-inline-flex align-items-center gap-2 mt-2 mt-sm-0">
                                <button t-attf-class="btn btn-outline-secondary btn-sm rounded-pill #{!state.hasPrevious ? 'disabled' : ''}"
                                        t-att-disabled="!state.hasPrevious"
                                        t-on-click="() => this.changePage(state.holdingsPage - 1)">
                                    <i class="fas fa-chevron-left"></i>
                                </button>
                                <t t-if="state.pages and Array.isArray(state.pages) and state.pages.length > 0">
                                    <t t-foreach="state.pages" t-as="page" t-key="page.number or page_index">
                                        <button t-attf-class="btn btn-sm rounded-pill fw-semibold #{(page.is_current === true) ? 'btn-primary text-white' : 'btn-outline-secondary'}"
                                                t-on-click="() => this.changePage(page.number or 1)">
                                            <t t-esc="page.number or page_index + 1"/>
                                        </button>
                                    </t>
                                </t>
                                <button t-attf-class="btn btn-outline-secondary btn-sm rounded-pill #{!state.hasNext ? 'disabled' : ''}"
                                        t-att-disabled="!state.hasNext"
                                        t-on-click="() => this.changePage(state.holdingsPage + 1)">
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                            </nav>
                        </div>
                    </section>

                    <!-- Table 2: Danh sách lệnh mua hoán đổi -->
                    <section class="mt-5">
                        <h3 class="h6 fw-bold text-dark mb-2">
                            Danh sách lệnh mua hoán đổi
                            <span class="text-primary">
                                <t t-esc="state.selectedFund ? state.selectedFund.name : ''"/>
                            </span>
                        </h3>
                        <!-- Thêm bộ lọc ngày cho Danh sách lệnh mua hoán đổi -->
                        <div class="row mb-3">
                            <div class="col-md-3">
                                <label for="swaporders-date-from" class="form-label mb-1">Từ ngày</label>
                                <input type="date" id="swaporders-date-from" class="form-control" t-model="state.swapOrdersDateFrom" t-on-change="() => this.filterSwapOrdersByDate()"/>
                            </div>
                            <div class="col-md-3">
                                <label for="swaporders-date-to" class="form-label mb-1">Đến ngày</label>
                                <input type="date" id="swaporders-date-to" class="form-control" t-model="state.swapOrdersDateTo" t-on-change="() => this.filterSwapOrdersByDate()"/>
                            </div>
                        </div>
                        <p class="small text-muted mb-3">
                            Tổng số danh sách: <t t-esc="this.props.swapOrders ? this.props.swapOrders.total : 0"/>
                        </p>
                        <div class="table-responsive rounded-4 border shadow-sm">
                            <table class="table table-sm align-middle table-striped table-hover mb-0 rounded-4 overflow-hidden">
                                <thead class="custom-red-bg">
                                    <tr>
                                        <th class="text-center">Số tài khoản</th>
                                        <th class="text-center">Quỹ - Chương trình</th>
                                        <th class="text-center">Phiên giao dịch</th>
                                        <th class="text-center">Loại giao dịch</th>
                                        <th class="text-center">Số tiền</th>
                                        <th class="text-center">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <t t-if="state.pagedSwapOrders and Array.isArray(state.pagedSwapOrders) and state.pagedSwapOrders.length > 0">
                                        <t t-foreach="state.pagedSwapOrders" t-as="order" t-key="(order.accountNumber or '') + (order.fund or '') + (order.tradingDate or '') + order_index">
                                            <tr>
                                                <td class="text-center fw-semibold">
                                                    <t t-esc="order.accountNumber or ''"/>
                                                </td>
                                                <td class="text-center fw-semibold">
                                                    <t t-esc="order.ticker or order.fund or ''"/>
                                                </td>
                                                <td class="text-center">
                                                    <t t-esc="order.tradingDate or ''"/>
                                                </td>
                                                <td class="text-center">
                                                    <span t-attf-class="fw-semibold badge rounded-pill px-2 py-1 fs-7 #{(order.transactionType === 'Mua' || order.transactionType === 'purchase') ? 'bg-success' : (order.transactionType === 'Bán' || order.transactionType === 'sell') ? 'bg-danger' : 'bg-secondary'}">
                                                        <t t-if="order.transactionType === 'sell' or order.transactionType === 'Bán'">Bán</t>
                                                        <t t-elif="order.transactionType === 'purchase' or order.transactionType === 'Mua'">Mua</t>
                                                        <t t-elif="order.transactionType === 'exchange' or order.transactionType === 'Hoán đổi'">Hoán đổi</t>
                                                        <t t-else=""><t t-esc="order.transactionType or 'Mua'"/></t>
                                                    </span>
                                                </td>
                                                <td class="text-center">
                                                    <t t-esc="this.formatCurrency(order.amount or 0)"/>đ
                                                </td>
                                                <td class="text-center">
                                                    <span t-attf-class="badge rounded-pill px-2 py-1 fs-7 fw-semibold ms-2
                                                        #{order.status === 'Đã khớp lệnh' ? 'bg-success' : 
                                                          order.status === 'Chờ khớp lệnh' ? 'bg-warning text-dark' : 
                                                          order.status === 'Đã hủy' ? 'bg-danger' : 'bg-secondary'}">
                                                        <t t-esc="order.status or ''"/>
                                                    </span>
                                                </td>
                                            </tr>
                                        </t>
                                    </t>
                                    <t t-if="!state.pagedSwapOrders or !Array.isArray(state.pagedSwapOrders) or state.pagedSwapOrders.length === 0">
                                        <tr>
                                            <td colspan="6" class="text-center text-muted">
                                                Không có dữ liệu lệnh hoán đổi
                                            </td>
                                        </tr>
                                    </t>
                                </tbody>
                            </table>
                        </div>

                        <!-- Pagination for Swap Orders -->
                        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-center mt-3 small text-secondary gap-2">
                            <div>
                                Hiện
                                <t t-esc="(state.swapPage - 1) * state.swapPageSize + (state.pagedSwapOrders.length ? 1 : 0)"/>
                                -
                                <t t-esc="(state.swapPage - 1) * state.swapPageSize + state.pagedSwapOrders.length"/>
                                trong số
                                <t t-esc="(state.fundScopedSwapOrders &amp;&amp; state.fundScopedSwapOrders.length) ? state.fundScopedSwapOrders.length : (state.allSwapOrders ? state.allSwapOrders.length : 0)"/>
                            </div>
                            <div class="mt-2 mt-sm-0 d-flex align-items-center gap-2">
                                <label for="swapPageSize" class="form-label mb-0">Số lượng 1 trang:</label>
                                <select id="swapPageSize" name="swapPageSize" class="form-select form-select-sm w-auto rounded-pill" t-on-change="(ev) => this.changeSwapPageSize(ev.target.value)">
                                    <option value="10" t-att-selected="state.swapPageSize == 10">10</option>
                                    <option value="20" t-att-selected="state.swapPageSize == 20">20</option>
                                    <option value="50" t-att-selected="state.swapPageSize == 50">50</option>
                                </select>
                            </div>
                            <nav class="d-inline-flex align-items-center gap-2 mt-2 mt-sm-0">
                                <button class="btn btn-outline-secondary btn-sm rounded-pill"
                                        t-att-disabled="state.swapPage &lt;= 1"
                                        t-on-click="() => this.changeSwapPage(state.swapPage - 1)">
                                    <i class="fas fa-chevron-left"></i>
                                </button>
                                <button class="btn btn-outline-secondary btn-sm rounded-pill"
                                        t-on-click="() => this.changeSwapPage(state.swapPage + 1)"
                                        t-att-disabled="(state.swapPage * state.swapPageSize) &gt;= ((state.fundScopedSwapOrders &amp;&amp; state.fundScopedSwapOrders.length) ? state.fundScopedSwapOrders.length : (state.allSwapOrders ? state.allSwapOrders.length : 0))">
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                            </nav>
                        </div>
                    </section>
                </div>
            </section>
        </main>
    </div>
  `;

  setup() {
    // Validate props trước khi khởi tạo state
    this.validateProps();
    
    this.state = useState({
      totalAssets: this.safeGetProp('totalAssets', 0),
      fundCertificates: this.safeGetProp('fundCertificates', []),
      holdings: this.safeGetProp('holdings', []),
      allHoldings: this.safeGetProp('holdings', []),
      holdingsPage: 1,
      holdingsPageSize: 10,
      holdingsTotal: (this.safeGetProp('holdings', []) || []).length,
      pagedHoldings: [],
      swapOrders: this.safeGetProp('swapOrders', {}).items || [],
      allSwapOrders: this.safeGetProp('swapOrders', {}).items || [],
      swapPage: 1,
      swapPageSize: 10,
      swapTotal: ((this.safeGetProp('swapOrders', {}).items || [])),
      pagedSwapOrders: [],
      // Danh sách đã lọc theo fund đang chọn (làm nguồn cho filter ngày)
      fundScopedHoldings: [],
      fundScopedSwapOrders: [],
      activeTab: this.safeGetProp('activeTab', ''),
      currentPage: this.safeGetProp('currentPage', 1),
      pageSize: this.safeGetProp('pageSize', 10),
      pagination_total: this.safeGetProp('pagination_total', 0),
      pagination_start: this.safeGetProp('pagination_start', 1),
      pagination_end: this.safeGetProp('pagination_end', 10),
      hasPrevious: this.safeGetProp('hasPrevious', false),
      hasNext: this.safeGetProp('hasNext', false),
      pages: this.safeGetProp('pages', []),
      chartData: this.safeGetProp('chartData', '{}'),
      selectedFund: this.safeGetProp('selectedFund', null),
      fundTabs: this.safeGetProp('fundTabs', []),
      holdingsDateFrom: '',
      holdingsDateTo: '',
      swapOrdersDateFrom: '',
      swapOrdersDateTo: '',
    });

    onMounted(() => {
      try {
        this.filterByTab(this.state.activeTab);
        this.updateHoldingsPagination();
        this.updateSwapPagination();
        this.initChart();
      } catch (error) {
        console.error('Error in onMounted:', error);
      }
    });
  }

  // Hàm validate props
  validateProps() {
    if (!this.props) {
      throw new Error('Props không được định nghĩa');
    }
    
    // Kiểm tra các trường bắt buộc
    const requiredFields = ['totalAssets', 'fundCertificates', 'holdings', 'swapOrders'];
    for (const field of requiredFields) {
      if (!(field in this.props)) {
        console.warn(`Missing required prop: ${field}`);
      }
    }
  }

  // Hàm an toàn để lấy prop
  safeGetProp(propName, defaultValue) {
    try {
      const value = this.props[propName];
      if (value === null || value === undefined) {
        return defaultValue;
      }
      return value;
    } catch (error) {
      console.warn(`Error getting prop ${propName}:`, error);
      return defaultValue;
    }
  }

    async initChart() {
    try {
        await loadJS('https://cdn.jsdelivr.net/npm/chart.js');
      
        const ctx = document.getElementById('assetOverviewChart');
        if (!ctx) {
            console.warn('Chart canvas element not found');
            return;
        }

        // Kiểm tra xem Chart.js đã load chưa
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }

        let chartData;
        try {
            chartData = JSON.parse(this.state.chartData || '{}');
        } catch (parseError) {
            console.warn('Error parsing chart data:', parseError);
            chartData = { labels: [], datasets: [{ data: [], backgroundColor: [] }] };
        }

        // Validate chart data
        if (!chartData.labels || !Array.isArray(chartData.labels)) {
            chartData.labels = [];
        }
        if (!chartData.datasets || !Array.isArray(chartData.datasets) || !chartData.datasets[0]) {
            chartData.datasets = [{ data: [], backgroundColor: [] }];
        }
        if (!chartData.datasets[0].data || !Array.isArray(chartData.datasets[0].data)) {
            chartData.datasets[0].data = [];
        }
        if (!chartData.datasets[0].backgroundColor || !Array.isArray(chartData.datasets[0].backgroundColor)) {
            chartData.datasets[0].backgroundColor = ['#2B4BFF'];
        }

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartData.labels,
                datasets: [{
                    data: chartData.datasets[0].data,
                    backgroundColor: chartData.datasets[0].backgroundColor,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        display: false,
                    },
                    tooltip: { 
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                return `${label}: ${value.toLocaleString('vi-VN')}đ`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });
    } catch (error) {
        console.error("Error initializing chart:", error);
    }
  }

  changePage(page) {
    try {
      const pageNum = parseInt(page) || 1;
      const maxPages = Array.isArray(this.state.pages) ? this.state.pages.length : 0;
      
      if (pageNum >= 1 && pageNum <= maxPages) {
        this.state.currentPage = pageNum;
        // Có thể thêm logic reload data ở đây
      }
    } catch (error) {
      console.error('Error in changePage:', error);
    }
  }

  changePageSize(size) {
    try {
      const newSize = parseInt(size) || 10;
      this.state.pageSize = newSize;
      this.state.currentPage = 1;
      // Có thể thêm logic reload data ở đây
    } catch (error) {
      console.error('Error in changePageSize:', error);
    }
  }

  changeTab(tabCode) {
    try {
      this.state.activeTab = tabCode || '';
      // Cập nhật lại trạng thái isActive cho các tab
      if (Array.isArray(this.state.fundTabs)) {
        this.state.fundTabs.forEach(tab => {
          if (tab && typeof tab === 'object') {
            tab.isActive = (tab.code === tabCode);
          }
        });
      }
      const fundObj = Array.isArray(this.state.fundTabs) 
        ? this.state.fundTabs.find(f => f && f.code === tabCode) 
        : null;
      this.state.selectedFund = fundObj || null;
      this.filterByTab(tabCode);
      this.state.currentPage = 1;
    } catch (error) {
      console.error('Error in changeTab:', error);
    }
  }

  filterByTab(tabCode) {
    try {
      const fundName = Array.isArray(this.state.fundTabs) 
        ? (this.state.fundTabs.find(f => f && f.code === tabCode)?.name || '')
        : '';
      
      if (Array.isArray(this.state.allHoldings)) {
        const scopedHoldings = this.state.allHoldings.filter(h => {
          return h && h.fund && h.fund === fundName;
        });
        this.state.fundScopedHoldings = scopedHoldings;
        this.state.holdings = scopedHoldings;
        this.state.holdingsTotal = scopedHoldings.length;
        this.state.holdingsPage = 1;
        this.updateHoldingsPagination();
      } else {
        this.state.holdings = [];
        this.state.fundScopedHoldings = [];
        this.state.holdingsTotal = 0;
      }
      
      if (Array.isArray(this.state.allSwapOrders)) {
        const scopedOrders = this.state.allSwapOrders.filter(o => {
          return o && o.fund && o.fund === fundName;
        });
        this.state.fundScopedSwapOrders = scopedOrders;
        this.state.swapOrders = scopedOrders;
        this.state.swapTotal = scopedOrders.length;
        this.state.swapPage = 1;
        this.updateSwapPagination();
      } else {
        this.state.swapOrders = [];
        this.state.fundScopedSwapOrders = [];
        this.state.swapTotal = 0;
      }
    } catch (error) {
      console.error('Error in filterByTab:', error);
      this.state.holdings = [];
      this.state.swapOrders = [];
      this.state.fundScopedHoldings = [];
      this.state.fundScopedSwapOrders = [];
    }
  }

  filterHoldingsByDate() {
    try {
      const from = this.state.holdingsDateFrom;
      const to = this.state.holdingsDateTo;

      // Luôn lọc trong phạm vi fund đang chọn
      const source = Array.isArray(this.state.fundScopedHoldings) ? this.state.fundScopedHoldings : [];
      if (!source.length) {
        this.state.holdings = [];
        return;
      }

      this.state.holdings = source.filter(h => {
        if (!h || !h.transactionDate) return false;
        try {
          const date = new Date(h.transactionDate);
          if (isNaN(date.getTime())) return false;
          
          let valid = true;
          if (from) {
            const fromDate = new Date(from);
            if (!isNaN(fromDate.getTime())) {
              valid = valid && (date >= fromDate);
            }
          }
          if (to) {
            const toDate = new Date(to);
            if (!isNaN(toDate.getTime())) {
              valid = valid && (date <= toDate);
            }
          }
          return valid;
        } catch (error) {
          console.warn('Error filtering holding by date:', error);
          return false;
        }
      });
      this.state.holdingsTotal = this.state.holdings.length;
      this.state.holdingsPage = 1;
      this.updateHoldingsPagination();
    } catch (error) {
      console.error('Error in filterHoldingsByDate:', error);
      this.state.holdings = [];
      this.state.holdingsTotal = 0;
    }
  }

  filterSwapOrdersByDate() {
    try {
      const from = this.state.swapOrdersDateFrom;
      const to = this.state.swapOrdersDateTo;

      // Luôn lọc trong phạm vi fund đang chọn
      const source = Array.isArray(this.state.fundScopedSwapOrders) ? this.state.fundScopedSwapOrders : [];
      if (!source.length) {
        this.state.swapOrders = [];
        return;
      }

      this.state.swapOrders = source.filter(o => {
        if (!o || !o.transactionDate) return false;
        try {
          const date = new Date(o.transactionDate);
          if (isNaN(date.getTime())) return false;
          
          let valid = true;
          if (from) {
            const fromDate = new Date(from);
            if (!isNaN(fromDate.getTime())) {
              valid = valid && (date >= fromDate);
            }
          }
          if (to) {
            const toDate = new Date(to);
            if (!isNaN(toDate.getTime())) {
              valid = valid && (date <= toDate);
            }
          }
          return valid;
        } catch (error) {
          console.warn('Error filtering swap order by date:', error);
          return false;
        }
      });
      this.state.swapTotal = this.state.swapOrders.length;
      this.state.swapPage = 1;
      this.updateSwapPagination();
    } catch (error) {
      console.error('Error in filterSwapOrdersByDate:', error);
      this.state.swapOrders = [];
      this.state.swapTotal = 0;
    }
  }

  // Pagination helpers for holdings
  updateHoldingsPagination() {
    try {
      const page = parseInt(this.state.holdingsPage) || 1;
      const size = parseInt(this.state.holdingsPageSize) || 10;
      const list = Array.isArray(this.state.holdings) ? this.state.holdings : [];
      const start = (page - 1) * size;
      const end = Math.min(start + size, list.length);
      this.state.pagedHoldings = list.slice(start, end);
      // Update summary counters used in template
      this.state.pagination_start = list.length ? start + 1 : 0;
      this.state.pagination_end = end;
      this.state.pagination_total = list.length;
      const totalPages = Math.ceil(list.length / size) || 1;
      this.state.pages = Array.from({ length: totalPages }, (_, i) => ({ number: i + 1, is_current: i + 1 === page }));
      this.state.hasPrevious = page > 1;
      this.state.hasNext = page < totalPages;
    } catch (e) {
      console.warn('updateHoldingsPagination error', e);
      this.state.pagedHoldings = [];
    }
  }

  changePage(page) {
    try {
      const p = parseInt(page) || 1;
      this.state.holdingsPage = p;
      this.updateHoldingsPagination();
    } catch (e) {
      console.warn('changePage error', e);
    }
  }

  changePageSize(size) {
    try {
      this.state.holdingsPageSize = parseInt(size) || 10;
      this.state.holdingsPage = 1;
      this.updateHoldingsPagination();
    } catch (e) {
      console.warn('changePageSize error', e);
    }
  }

  // Pagination helpers for swap orders
  updateSwapPagination() {
    try {
      const page = parseInt(this.state.swapPage) || 1;
      const size = parseInt(this.state.swapPageSize) || 10;
      const list = Array.isArray(this.state.swapOrders) ? this.state.swapOrders : [];
      const start = (page - 1) * size;
      const end = Math.min(start + size, list.length);
      this.state.pagedSwapOrders = list.slice(start, end);
    } catch (e) {
      console.warn('updateSwapPagination error', e);
      this.state.pagedSwapOrders = [];
    }
  }

  changeSwapPage(page) {
    try {
      const p = parseInt(page) || 1;
      this.state.swapPage = p;
      this.updateSwapPagination();
    } catch (e) {
      console.warn('changeSwapPage error', e);
    }
  }

  changeSwapPageSize(size) {
    try {
      this.state.swapPageSize = parseInt(size) || 10;
      this.state.swapPage = 1;
      this.updateSwapPagination();
    } catch (e) {
      console.warn('changeSwapPageSize error', e);
    }
  }

  formatCurrency(value) {
    try {
      if (value === null || value === undefined) {
        return '0';
      }
      
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      
      if (isNaN(numValue)) {
        return '0';
      }
      
      return numValue.toLocaleString('vi-VN', { maximumFractionDigits: 0 });
    } catch (error) {
      console.warn('Error formatting currency:', error);
      return '0';
    }
  }
}

// Make component available globally
window.AssetManagementWidget = AssetManagementWidget;