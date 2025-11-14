/** @odoo-module */

import { Component, useState, xml } from "@odoo/owl";

export class MatchedOrdersTab extends Component {
    static template = xml`
        <div class="matched-orders-tab">
            <div class="tab-header">
                <h3>Lệnh khớp thỏa thuận</h3>
                <div class="tab-actions">
                    <button class="btn btn-warning btn-sm" t-att-disabled="state.selectedIds.size === 0" t-on-click="sendToExchange">
                        <i class="fa fa-paper-plane"></i> Gửi lên sàn (<t t-esc="state.selectedIds.size"/>)
                    </button>
                </div>
            </div>
            
            <div class="tab-filters">
                <div class="row g-2 align-items-end">
                    <div class="col-md-4">
                        <label>Quỹ:</label>
                        <select class="form-control filter-fund" t-on-change="onFilterChanged" t-att-value="state.filters.fund_id">
                            <option value="">Tất cả quỹ</option>
                            <option t-foreach="state.funds" t-as="fund" t-key="fund.id" t-att-value="fund.id">
                                <t t-esc="fund.name"/>
                            </option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label>Ngày giao dịch:</label>
                        <input type="date" class="form-control filter-date" t-on-change="onFilterChanged" t-att-value="state.filters.transaction_date"/>
                    </div>
                    <div class="col-md-4">
                        <label>Lọc nhanh:</label>
                        <select class="form-control filter-quick-date" t-on-change="onFilterChanged" t-att-value="state.filters.quick_date">
                            <option value="today">Hôm nay</option>
                            <option value="yesterday">Hôm qua</option>
                            <option value="last7days">7 ngày trước</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Type navigation filter -->
            <div class="type-filter-nav mb-2">
                <nav class="nav nav-pills">
                    <a class="nav-link" t-att-class="state.typeFilter === 'all' ? 'active' : ''" href="#" t-on-click="() => this.changeTypeFilter('all')">Tất cả</a>
                    <a class="nav-link" t-att-class="state.typeFilter === 'investor' ? 'active' : ''" href="#" t-on-click="() => this.changeTypeFilter('investor')">Nhà đầu tư</a>
                    <a class="nav-link" t-att-class="state.typeFilter === 'market_maker' ? 'active' : ''" href="#" t-on-click="() => this.changeTypeFilter('market_maker')">Nhà tạo lập</a>
                </nav>
            </div>
            
            <div class="tab-content">
                <div t-if="state.loading" class="loading-container">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Đang tải...</span>
                    </div>
                    <div class="loading-text">Đang tải dữ liệu...</div>
                </div>
                
                <div t-elif="state.error" class="error-container">
                    <div class="error-icon">
                        <i class="fa fa-exclamation-triangle"></i>
                    </div>
                    <div class="error-message">
                        <t t-esc="state.error"/>
                    </div>
                    <button class="btn btn-primary" t-on-click="refreshData">
                        <i class="fa fa-refresh"></i> Thử lại
                    </button>
                </div>
                
                <div t-else="" class="matched-orders-list">
                    <div t-if="state.matchedOrders.length === 0" class="no-orders">
                        <i class="fa fa-info-circle"></i>
                        Không có lệnh khớp thỏa thuận
                    </div>
                    
                    <div t-else="" class="orders-table table-responsive">
                        <div class="matched-totals d-flex justify-content-end gap-4 mb-2">
                            <div>
                                <strong>Tổng CCQ: </strong>
                                <span><t t-esc="formatUnits(getTotals().totalCCQ)"/></span>
                            </div>
                            <div>
                                <strong>Tổng giá trị lệnh: </strong>
                                <span><t t-esc="formatAmount(getTotals().totalValue)"/></span>
                            </div>
                        </div>
                        <table class="table table-sm table-hover table-striped align-middle matched-table">
                            <thead class="table-light sticky-head">
                                <tr>
                                    <th style="width:36px;" class="text-center">
                                        <input type="checkbox" class="form-check-input" t-att-checked="this.isAllSelectableChecked()" t-att-disabled="this.getSelectableVisibleOrders().length === 0" t-on-change="(ev) => this.toggleSelectAll(ev.target.checked)"/>
                                    </th>
                                    <th style="width:52px;" class="text-center">STT</th>
                                    <th class="text-nowrap">Quỹ</th>
                                    <th>Người mua</th>
                                    <th>Người bán</th>
                                    <th class="text-end">Giá</th>
                                    <th class="text-end">Số CCQ</th>
                                    <th class="text-end">Giá trị lệnh</th>
                                    <th class="text-center d-none d-lg-table-cell">Lãi suất</th>
                                    <th class="text-center d-none d-lg-table-cell">Kỳ hạn</th>
                                    <th class="text-nowrap d-none d-xl-table-cell">Phiên giao dịch</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr t-foreach="getDisplayedOrders()" t-as="order" t-key="order.id" t-att-class="this.isOrderSent(order) ? 'sent-row' : ''">
                                    <td class="text-center">
                                        <input type="checkbox" class="form-check-input" t-att-checked="this.isSelected(order)" t-att-disabled="this.isOrderSent(order)" t-on-change="(ev) => this.toggleSelect(order, ev.target.checked)"/>
                                    </td>
                                    <td class="text-center">
                                        <span class="stt-badge badge bg-secondary"><t t-esc="(state.pagination.currentPage - 1) * state.pagination.perPage + order_index + 1"/></span>
                                    </td>
                                    <td>
                                        <div class="fw-semibold fund-symbol"><t t-esc="this.getFundSymbol(order)"/></div>
                                    </td>
                                    <td>
                                        <div class="fw-semibold text-success"><t t-esc="order.buy_investor || '-'"/></div>
                                        <div class="text-muted sub-info">
                                            CCQ: <t t-esc="formatUnits(order.buy_units)"/> · Giá mua: <t t-esc="formatPrice(order.buy_price)"/>
                                            <t t-if="order.buy_remaining_units !== undefined"> · Còn lại: <t t-esc="formatUnits(order.buy_remaining_units)"/></t>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="fw-semibold text-danger"><t t-esc="order.sell_investor || '-'"/></div>
                                        <div class="text-muted sub-info">
                                            CCQ: <t t-esc="formatUnits(order.sell_units)"/> · Giá bán: <t t-esc="formatPrice(order.sell_price)"/>
                                            <t t-if="order.sell_remaining_units !== undefined"> · Còn lại: <t t-esc="formatUnits(order.sell_remaining_units)"/></t>
                                        </div>
                                    </td>
                                    <td class="text-end">
                                        <t t-esc="formatPrice(order.matched_price)"/>
                                    </td>
                                    <td class="text-end">
                                        <t t-esc="formatUnits(order.matched_quantity)"/>
                                    </td>
                                    <td class="text-end fw-semibold">
                                        <t t-esc="formatAmount(order.total_value)"/>
                                    </td>
                                    <td class="text-center d-none d-lg-table-cell">
                                        <t t-esc="formatInterestRate(order.interest_rate)"/>
                                    </td>
                                    <td class="text-center d-none d-lg-table-cell">
                                        <t t-esc="order.tenor || '-'"/>
                                    </td>
                                    <td class="text-nowrap d-none d-xl-table-cell">
                                        <div class="session-info">
                                            <div class="in-time">In: <t t-esc="formatDateTime(order.buy_in_time || order.match_time || order.created_at)"/></div>
                                            <div class="out-time">Out: <t t-esc="formatDateTime(order.sell_in_time || order.match_time || order.created_at)"/></div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div class="matched-pagination d-flex justify-content-end align-items-center gap-2 mt-2">
                            <button class="btn btn-sm btn-outline-secondary" t-on-click="() => this.changePage(state.pagination.currentPage - 1)" t-att-disabled="state.pagination.currentPage === 1">«</button>
                            <t t-foreach="Array.from({ length: this.getTotalPages() }, (_, i) => i + 1)" t-as="p" t-key="p">
                                <button class="btn btn-sm" t-att-class="p === state.pagination.currentPage ? 'btn-primary' : 'btn-outline-secondary'" t-on-click="() => this.changePage(p)"><t t-esc="p"/></button>
                            </t>
                            <button class="btn btn-sm btn-outline-secondary" t-on-click="() => this.changePage(state.pagination.currentPage + 1)" t-att-disabled="state.pagination.currentPage === this.getTotalPages()">»</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    setup() {
        const todayIso = new Date().toISOString().split('T')[0];
        this.state = useState({
            matchedOrders: [],
            funds: [],
            loading: false,
            error: null,
            selectedIds: new Set(),
            pagination: { currentPage: 1, perPage: 20, totalItems: 0 },
            typeFilter: 'all',
            filters: {
                fund_id: null,
                quick_date: 'today',
                transaction_date: todayIso,
                date_from: null,
                date_to: null
            }
        });
        
        this._loadInitialData();
    }
    
    async _loadInitialData() {
        this.state.loading = true;
        try {
            await Promise.all([
                this._loadFunds(),
                this._loadMatchedOrders()
            ]);
        } catch (error) {
            console.error("Error loading initial data:", error);
            this.state.error = "Lỗi tải dữ liệu: " + error.message;
        } finally {
            this.state.loading = false;
        }
    }
    
    async _loadFunds() {
        try {
            const res = await fetch('/api/transaction-list/funds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({})
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const response = await res.json();
            if (Array.isArray(response)) {
                this.state.funds = response;
            } else if (response && Array.isArray(response.funds)) {
                this.state.funds = response.funds;
            } else if (response && response.result && Array.isArray(response.result.funds)) {
                this.state.funds = response.result.funds;
            } else {
                this.state.funds = [];
            }
        } catch (error) {
            console.error("Error loading funds:", error);
        }
    }
    
    async _loadMatchedOrders() {
        try {
            // derive date_from/date_to: prefer exact transaction_date, else quick_date
            let date_from, date_to;
            if (this.state.filters.transaction_date) {
                const { date_from: df, date_to: dt } = this.computeDateRangeForDate(this.state.filters.transaction_date);
                date_from = df; date_to = dt;
            } else {
                const r = this.computeDateRange(this.state.filters.quick_date);
                date_from = r.date_from; date_to = r.date_to;
            }
            this.state.filters.date_from = date_from;
            this.state.filters.date_to = date_to;
            // normalize fund and ticker like transaction_list_tab
            const fundId = this.state.filters.fund_id ? Number(this.state.filters.fund_id) : null;
            let ticker = null;
            if (fundId && Array.isArray(this.state.funds)) {
                const fo = this.state.funds.find(f => String(f.id) === String(fundId));
                ticker = fo && (fo.ticker || fo.symbol || fo.code) ? String(fo.ticker || fo.symbol || fo.code) : null;
            }

            const res = await fetch('/api/transaction-list/get-matched-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({
                    fund_id: fundId,
                    ticker,
                    date_from,
                    date_to
                })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const response = await res.json();
            let data = [];
            if (response && response.success && Array.isArray(response.data)) {
                data = response.data;
            } else if (Array.isArray(response)) {
                data = response;
            } else if (response && response.result && Array.isArray(response.result.data)) {
                data = response.result.data;
            } else if (response && Array.isArray(response.data)) {
                data = response.data;
            } else {
                throw new Error(response && response.message ? response.message : "Không thể tải dữ liệu lệnh khớp");
            }
            // Client-side ensure filter by fund if backend ignores
            if (fundId) {
                const wantId = Number(fundId);
                const wantTicker = ticker ? String(ticker).toUpperCase() : null;
                data = (data || []).filter(o => {
                    const ids = [o.fund_id, o.buy_fund_id, o.sell_fund_id].map(v => Number(v || 0));
                    const tickers = [o.fund_ticker, o.buy_fund_ticker, o.sell_fund_ticker]
                        .filter(Boolean)
                        .map(t => String(t).toUpperCase());
                    const idMatch = ids.includes(wantId);
                    const tickerMatch = wantTicker ? tickers.includes(wantTicker) : true;
                    return idMatch || tickerMatch;
                });
            }
            // Client-side ensure filter by date range if backend ignores
            const fromTime = new Date(date_from.replace(' ', 'T')).getTime();
            const toTime = new Date(date_to.replace(' ', 'T')).getTime();
            data = (data || []).filter(o => {
                const dtStr = o.match_date || o.match_time || o.created_at || o.create_date;
                const t = dtStr ? new Date(dtStr).getTime() : NaN;
                return !isNaN(t) ? (t >= fromTime && t <= toTime) : true;
            });
            // Không cần mark từ localStorage nữa vì backend đã có field sent_to_exchange
            // Chỉ sync localStorage với backend data để backup
            try {
                const sentFromBackend = (data || []).filter(o => o.sent_to_exchange === true || o.sent_to_exchange === 1).map(o => String(o.id));
                if (sentFromBackend.length > 0) {
                    localStorage.setItem('sentMatchedIds', JSON.stringify(sentFromBackend));
                }
            } catch (_) {}
            this.state.matchedOrders = data;
            this.state.pagination.totalItems = data.length;
            this.state.pagination.currentPage = 1;
        } catch (error) {
            console.error("Error loading matched orders:", error);
            this.state.error = "Lỗi tải lệnh khớp: " + error.message;
        }
    }
    
    async refreshData() {
        this.state.error = null;
        await this._loadMatchedOrders();
    }
    
    isSelected(order) {
        return this.state.selectedIds.has(order.id);
    }

    getSelectableVisibleOrders() {
        // Only current page, not sent
        return this.getDisplayedOrders().filter(o => !this.isOrderSent(o));
    }

    isAllSelectableChecked() {
        const visible = this.getSelectableVisibleOrders();
        if (visible.length === 0) return false;
        return visible.every(o => this.state.selectedIds.has(o.id));
    }

    toggleSelect(order, checked) {
        if (this.isOrderSent(order)) return;
        if (checked) {
            this.state.selectedIds.add(order.id);
        } else {
            this.state.selectedIds.delete(order.id);
        }
        // force state update by reassigning a new Set reference
        this.state.selectedIds = new Set(this.state.selectedIds);
    }

    toggleSelectAll(checked) {
        const selectable = this.getSelectableVisibleOrders();
        if (checked) {
            selectable.forEach(o => this.state.selectedIds.add(o.id));
        } else {
            selectable.forEach(o => this.state.selectedIds.delete(o.id));
        }
        this.state.selectedIds = new Set(this.state.selectedIds);
    }

    // Pagination helpers
    getTotalPages() {
        const { perPage } = this.state.pagination;
        const total = this.getTypeFilteredOrders().length;
        return Math.max(1, Math.ceil((total || 0) / perPage));
    }

    getTypeFilteredOrders() {
        const type = this.state.typeFilter;
        if (type === 'all') return this.state.matchedOrders;
        return (this.state.matchedOrders || []).filter(o => {
            const buyType = (o.buy_user_type || o._buyUserType || '').toString();
            const sellType = (o.sell_user_type || o._sellUserType || '').toString();
            const hasMM = buyType === 'market_maker' || sellType === 'market_maker';
            if (type === 'market_maker') return hasMM;
            // investor: cả hai là investor hoặc không phải market maker
            if (type === 'investor') return !hasMM; 
            return true;
        });
    }

    getDisplayedOrders() {
        const { currentPage, perPage } = this.state.pagination;
        const data = this.getTypeFilteredOrders();
        const start = (currentPage - 1) * perPage;
        return data.slice(start, start + perPage);
    }

    changeTypeFilter(type) {
        this.state.typeFilter = type;
        this.state.pagination.currentPage = 1;
        this.state.pagination.totalItems = this.getTypeFilteredOrders().length;
    }

    getTotals() {
        try {
            const list = this.getTypeFilteredOrders();
            return (list || []).reduce((acc, o) => {
                const ccq = Number(o.matched_quantity || o.matched_ccq || o.matched_volume || 0) || 0;
                const val = Number(o.total_value || (o.matched_price || 0) * ccq || 0) || 0;
                acc.totalCCQ += ccq;
                acc.totalValue += val;
                return acc;
            }, { totalCCQ: 0, totalValue: 0 });
        } catch (_) {
            return { totalCCQ: 0, totalValue: 0 };
        }
    }

    isOrderSent(order) {
        if (!order) return false;
        // Ưu tiên kiểm tra từ backend (field sent_to_exchange từ database)
        if (order.sent_to_exchange === true || order.sent_to_exchange === 1) {
            return true;
        }
        // Fallback: kiểm tra các field liên quan từ buy/sell order
        if (order.buy_sent_to_exchange || order.sell_sent_to_exchange) {
            return true;
        }
        // Không dùng localStorage nữa vì không đồng bộ với database
        // Chỉ dùng localStorage như cache backup nếu backend chưa cập nhật kịp
        try {
            const sent = JSON.parse(localStorage.getItem('sentMatchedIds') || '[]');
            if (sent.includes(String(order.id))) {
                // Nếu có trong localStorage nhưng backend chưa có, có thể là cache cũ
                // Trả về false để cho phép gửi lại (backend sẽ cập nhật khi gửi thành công)
                return false;
            }
        } catch (_) {
            // Ignore localStorage errors
        }
        return false;
    }

    saveSentOrders(ids) {
        try {
            const sent = JSON.parse(localStorage.getItem('sentMatchedIds') || '[]');
            const set = new Set(sent.map(String));
            ids.forEach(id => set.add(String(id)));
            localStorage.setItem('sentMatchedIds', JSON.stringify(Array.from(set)));
        } catch (_) {}
    }

    changePage(page) {
        const total = this.getTotalPages();
        const next = Math.min(Math.max(1, page), total);
        this.state.pagination.currentPage = next;
    }

    async sendToExchange() {
        try {
            if (this.state.selectedIds.size === 0) return;
            const ids = Array.from(this.state.selectedIds);
            // Try bulk endpoint first (JSON-RPC style like transaction_list_tab.js)
            let ok = false;
            try {
                const resBulk = await fetch('/api/transaction-list/bulk-send-to-exchange', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { matched_order_ids: ids, auto_submit: true } })
                });
                if (!resBulk.ok) throw new Error(`HTTP ${resBulk.status}`);
                const rs = await resBulk.json();
                ok = !!(rs?.success || rs?.result?.success);
                if (!ok && rs?.result?.results) {
                    // consider success if at least one sent
                    ok = rs.result.results.some(r => r.success);
                }
            } catch (_) {}

            if (!ok) {
                // Fallback: send sequentially to single endpoint
                let sent = 0;
                for (const id of ids) {
                    const res = await fetch('/api/transaction-list/send-to-exchange', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                        body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { matched_order_id: id, auto_submit: true } })
                    });
                    if (res.ok) {
                        const j = await res.json();
                        if (j?.success || j?.result?.success) sent++;
                    }
                }
                ok = sent > 0;
            }

            if (!ok) throw new Error('Gửi lên sàn thất bại');

            this.showToast(`Đã gửi lên sàn ${this.state.selectedIds.size} cặp lệnh`, 'success');
            // Không cần save vào localStorage nữa vì backend đã cập nhật sent_to_exchange
            // Chỉ sync localStorage với backend sau khi reload
            this.state.selectedIds = new Set();
            await this._loadMatchedOrders();
        } catch (error) {
            console.error('Error sending to exchange:', error);
            this.showToast('Lỗi gửi lên sàn: ' + error.message, 'danger');
        }
    }
    
    async matchOrders() {
        try {
            // Dùng HTTP POST vì endpoint khớp lệnh là type='http'
            const res = await fetch('/api/transaction-list/match-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    match_type: 'all',
                    use_time_priority: true,
                    status_mode: 'pending'
                })
            });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const response = await res.json();
            if (response.success) {
                const total = response.summary?.total_matched || 0;
                const algo = response.algorithm_used || 'Price-Time Priority (FIFO)';
                if (typeof window !== 'undefined' && window.alert) {
                    alert(`Khớp lệnh thành công: ${total} cặp (${algo})`);
                }
                await this._loadMatchedOrders();
            } else {
                throw new Error(response.message || 'Không thể khớp lệnh');
            }
        } catch (error) {
            console.error('Error matching orders:', error);
            if (typeof window !== 'undefined' && window.alert) {
                alert('Lỗi khớp lệnh: ' + error.message);
            }
        }
    }
    
    onFilterChanged(event) {
        const cls = Array.from(event.target.classList).find(c => c.startsWith('filter-')) || '';
        const field = cls.replace('filter-', '');
        const value = event.target.value || null;
        if (field === 'fund') {
            this.state.filters.fund_id = value ? Number(value) : null;
        } else if (field === 'quick-date') {
            this.state.filters.quick_date = value;
            this.state.filters.transaction_date = null;
        } else if (field === 'date') {
            this.state.filters.transaction_date = value;
            // when picking a date manually, ignore quick range
            this.state.filters.quick_date = null;
        }
        // reset pagination on filter change
        this.state.pagination.currentPage = 1;
        this._loadMatchedOrders();
    }
    
    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price || 0);
    }
    
    formatUnits(units) {
        return new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(units || 0);
    }
    
    formatAmount(amount) {
        return new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    }
    
    formatDateTime(date) {
        if (!date) return "";
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }

    getFundSymbol(order) {
        const symbol = order && (order.fund_ticker || order.ticker || order.fund_symbol);
        if (symbol) return String(symbol).toUpperCase();
        // fallback: extract uppercase token from name, else return name
        const name = order && (order.fund_name || '');
        const match = String(name).match(/\b[A-Z0-9]{2,}\b/);
        return match ? match[0] : (name || '-');
    }

    formatInterestRate(rate) {
        if (rate === undefined || rate === null || rate === '') return '-';
        const num = Number(rate);
        if (Number.isNaN(num)) return '-';
        return `${num}%`;
    }

    computeDateRange(mode) {
        const now = new Date();
        const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
        const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
        const fmt = (d) => {
            const pad = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        };
        let from = startOfDay(now), to = endOfDay(now);
        if (mode === 'yesterday') {
            const y = new Date(now);
            y.setDate(y.getDate() - 1);
            from = startOfDay(y);
            to = endOfDay(y);
        } else if (mode === 'last7days') {
            const s = new Date(now);
            s.setDate(s.getDate() - 6);
            from = startOfDay(s);
            to = endOfDay(now);
        }
        return { date_from: fmt(from), date_to: fmt(to) };
    }

    computeDateRangeForDate(dateStr) {
        const [y, m, d] = (() => {
            // accept 'YYYY-MM-DD' or 'DD/MM/YYYY'
            if (dateStr.includes('-')) {
                const parts = dateStr.split('-');
                return [Number(parts[0]), Number(parts[1]), Number(parts[2])];
            }
            const parts = dateStr.split('/');
            return [Number(parts[2]), Number(parts[1]), Number(parts[0])];
        })();
        const day = new Date(y, m - 1, d);
        const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0);
        const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);
        const pad = (n) => String(n).padStart(2, '0');
        const fmt = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
        return { date_from: fmt(start), date_to: fmt(end) };
    }

    // simple toast popup
    showToast(message, type = 'info') {
        try {
            const map = { success: 'success', danger: 'danger', error: 'danger', info: 'info', warning: 'warning' };
            const cls = map[type] || 'info';
            const el = document.createElement('div');
            el.className = `alert alert-${cls} alert-dismissible fade show position-fixed`;
            el.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 280px;';
            el.innerHTML = `${message} <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
            document.body.appendChild(el);
            setTimeout(() => { if (el && el.parentElement) el.parentElement.removeChild(el); }, 3500);
        } catch (_) {
            // fallback
            if (typeof window !== 'undefined' && window.alert) {
                alert(message);
            }
        }
    }
}