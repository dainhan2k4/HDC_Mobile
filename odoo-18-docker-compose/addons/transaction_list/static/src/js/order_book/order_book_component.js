/** @odoo-module */

import { Component, useState, onMounted, onWillUnmount, xml } from "@odoo/owl";

export class OrderBookComponent extends Component {
    static template = xml`
        <div class="order-book-container">
            <!-- Top Navigation Pills -->
            <div class="ob-nav">
                <a href="#">
                    <span class="ob-pill ob-pill-active">Khoản đầu tư đang chờ xử lý</span>
                </a>
                <a href="/completed-orders">
                    <span class="ob-pill">Khoản đầu tư đã khớp</span>
                </a>
                <a href="/negotiated-orders">
                    <span class="ob-pill">Khoản đầu tư khớp theo thỏa thuận</span>
                </a>
            </div>
            <!-- Header -->
            <div class="order-book-header">
                <div class="header-left">
                    <h2 class="order-book-title">
                        <i class="fa fa-book"></i>
                        Sổ lệnh giao dịch
                    </h2>
                </div>
                <div class="header-center">
                    <div class="fund-selector">
                        <label for="fund-select">Chọn quỹ:</label>
                        <select id="fund-select" name="fund-select" t-on-change="onFundChange" class="form-control">
                            <option t-foreach="state.funds" t-as="fund" t-key="fund.id" t-att-value="fund.id">
                                <t t-esc="fund.name"/> (<t t-esc="fund.ticker"/>)
                            </option>
                        </select>
                    </div>
                </div>
                <div class="header-right">
                    <div class="last-update">
                        <i class="fa fa-clock-o"></i>
                        Cập nhật: <t t-esc="formatDateTime(state.lastUpdate)"/>
                    </div>
                    <button class="btn btn-primary btn-sm" title="Làm mới dữ liệu" t-on-click="refreshData">
                        <i class="fa fa-refresh"></i>
                        Làm mới
                    </button>
                    <div class="dropdown test-api-dropdown" style="display: inline-block; margin-left: 8px;">
                        <button class="btn btn-primary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
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
                            <li><hr class="dropdown-divider"/></li>
                            <li>
                                <button class="dropdown-item" t-on-click="sendMaturityNotifications">
                                    <i class="fas fa-bell"></i>
                                    <span>Gửi thông báo đáo hạn</span>
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item text-warning" t-on-click="sendMaturityNotificationsTest">
                                    <i class="fas fa-flask"></i>
                                    <span>[TEST] Gửi thông báo cho tất cả lệnh</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Main Content: 2 cột (mua/bán) + 1 box khớp một phần bên dưới -->
            <div class="order-book-content">
                <!-- Left: Buy Orders -->
                <div class="order-book-left">
                    <div class="order-section-header buy-header">
                        <h3><i class="fa fa-shopping-cart"></i>Lệnh mua chờ xử lý</h3>
                        <span class="order-count">(<t t-esc="state.buyOrders.length"/> lệnh)</span>
                    </div>
                    <div class="order-list buy-orders" style="max-height: 500px; overflow-y: auto;">
                        <div t-if="state.loading" class="loading-spinner">
                            <i class="fa fa-spinner fa-spin"></i>
                            Đang tải...
                        </div>
                        <div t-if="!state.loading and state.buyOrders.length === 0" class="no-orders">
                            <i class="fa fa-info-circle"></i>
                            Không có lệnh mua
                        </div>
                        <t t-if="!state.loading and state.buyOrders.length > 0">
                            <table class="ob-table ob-table-buy">
                                <thead>
                                    <tr>
                                        <th>Giá</th>
                                        <th>Số lượng</th>
                                        <th>Đã khớp</th>
                                        <th>Còn lại</th>
                                        <th>Thành tiền</th>
                                        <th>Nhà đầu tư</th>
                                        <th>Thời gian</th>
                                        <th>Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr t-foreach="state.buyOrders" t-as="order" t-key="order.id" class="buy-order" t-att-data-id="order.id">
                                        <td><t t-esc="formatPrice(order.price)"/></td>
                                        <td><t t-esc="formatUnits(order.units)"/></td>
                                        <td><t t-esc="formatUnits(order.matched_units || 0)"/></td>
                                        <td><t t-esc="formatUnits(order.remaining_units || order.units)"/></td>
                                        <td><t t-esc="formatAmount(order.amount)"/></td>
                                        <td><t t-esc="order.user_name"/></td>
                                        <td><t t-esc="formatDateTime(order.created_at)"/></td>
                                        <td>
                                            <span t-attf-class="status-badge status-#{order.status}"><t t-esc="formatStatus(order.status)"/></span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </t>
                    </div>
                </div>

                <!-- Right: Sell Orders -->
                <div class="order-book-right">
                    <div class="order-section-header sell-header">
                        <h3><i class="fa fa-shopping-basket"></i>Lệnh bán chờ xử lý</h3>
                        <span class="order-count">(<t t-esc="state.sellOrders.length"/> lệnh)</span>
                    </div>
                    <div class="order-list sell-orders" style="max-height: 500px; overflow-y: auto;">
                        <div t-if="state.loading" class="loading-spinner">
                            <i class="fa fa-spinner fa-spin"></i>
                            Đang tải...
                        </div>
                        <div t-if="!state.loading and state.sellOrders.length === 0" class="no-orders">
                            <i class="fa fa-info-circle"></i>
                            Không có lệnh bán
                        </div>
                        <t t-if="!state.loading and state.sellOrders.length > 0">
                            <table class="ob-table ob-table-sell">
                                <thead>
                                    <tr>
                                        <th>Giá</th>
                                        <th>Số lượng</th>
                                        <th>Đã khớp</th>
                                        <th>Còn lại</th>
                                        <th>Thành tiền</th>
                                        <th>Nhà đầu tư</th>
                                        <th>Thời gian</th>
                                        <th>Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr t-foreach="state.sellOrders" t-as="order" t-key="order.id" class="sell-order" t-att-data-id="order.id">
                                        <td><t t-esc="formatPrice(order.price)"/></td>
                                        <td><t t-esc="formatUnits(order.units)"/></td>
                                        <td><t t-esc="formatUnits(order.matched_units || 0)"/></td>
                                        <td><t t-esc="formatUnits(order.remaining_units || order.units)"/></td>
                                        <td><t t-esc="formatAmount(order.amount)"/></td>
                                        <td><t t-esc="order.user_name"/></td>
                                        <td><t t-esc="formatDateTime(order.created_at)"/></td>
                                        <td>
                                            <span t-attf-class="status-badge status-#{order.status}"><t t-esc="formatStatus(order.status)"/></span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </t>
                    </div>
                </div>

                <!-- Bottom: Partial matched orders -->
                <div class="order-box order-box-bottom">
                    <div class="order-section-header">
                        <h3><i class="fa fa-random"></i> Lệnh đầu tư khớp một phần</h3>
                        <span class="order-count">(<t t-esc="state.partialOrders.length"/> lệnh)</span>
                    </div>
                    <div class="order-list" style="max-height: 500px; overflow-y: auto;">
                        <div t-if="state.loading" class="loading-spinner">
                            <i class="fa fa-spinner fa-spin"></i>
                            Đang tải...
                        </div>
                        <div t-if="!state.loading and state.partialOrders.length === 0" class="no-orders">
                            <i class="fa fa-info-circle"></i>
                            Không có lệnh khớp một phần
                        </div>
                        <t t-if="!state.loading and state.partialOrders.length > 0">
                            <table class="ob-table ob-table-partial" style="text-align: center;">
                                <thead>
                                    <tr>
                                        <th style="text-align: center;">Loại lệnh</th>
                                        <th style="text-align: center;">Giá</th>
                                        <th style="text-align: center;">Tổng số lượng</th>
                                        <th style="text-align: center;">Đã khớp</th>
                                        <th style="text-align: center;">Còn lại</th>
                                        <th style="text-align: center;">Thành tiền</th>
                                        <th style="text-align: center;">Nhà đầu tư</th>
                                        <th style="text-align: center;">Thời gian</th>
                                        <th style="text-align: center;">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr t-foreach="state.partialOrders" t-as="order" t-key="order.id" 
                                        t-attf-class="partial-order #{order.transaction_type === 'sell' ? 'sell-order' : 'buy-order'}">
                                        <td style="text-align: center;">
                                            <t t-if="order.transaction_type === 'sell'">Lệnh bán</t>
                                            <t t-else="">Lệnh mua</t>
                                        </td>
                                        <td style="text-align: center;"><t t-esc="formatPrice(order.price)"/></td>
                                        <td style="text-align: center;"><t t-esc="formatUnits(order.units)"/></td>
                                        <td style="text-align: center;"><t t-esc="formatUnits(order.matched_units || 0)"/></td>
                                        <td style="text-align: center;"><t t-esc="formatUnits(order.remaining_units || 0)"/></td>
                                        <td style="text-align: center;"><t t-esc="formatAmount(order.amount)"/></td>
                                        <td style="text-align: center;"><t t-esc="order.user_name"/></td>
                                        <td style="text-align: center;"><t t-esc="formatDateTime(order.created_at)"/></td>
                                        <td style="text-align: center;"><span t-attf-class="status-badge status-#{order.status || 'pending'}"><t t-esc="formatStatus(order.status)"/></span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </t>
                    </div>
                </div>
            </div>
        </div>
    `;
    static props = {};

    setup() {
        this.state = useState({
            buyOrders: [],
            sellOrders: [],
            partialOrders: [],
            fundInfo: null,
            selectedFund: null,
            funds: [],
            loading: false,
            lastUpdate: null,
            priceChange: 0,
            priceChangePercent: 0,
            // Track previous order IDs theo từng phía; reset khi đổi quỹ
            previousOrderIds: { buy: new Set(), sell: new Set() },
            // Chặn animation khi vừa đổi quỹ
            suppressAnimations: false,
            matchedOrders: [], // Track matched orders for animation
            lastMatchedUnits: { buy: new Map(), sell: new Map() }, // Track matched_units per order id
            currentFundIndex: 0 // Track index quỹ hiện tại
        });

        this.refreshInterval = null;
        this.autoRotateInterval = null;
        this.setupEventListeners();
        this.loadInitialData();
        
        // Component mounted
        onMounted(() => {
("Order Book component mounted successfully");
        });
    }

    setupEventListeners() {
        // Auto refresh mỗi 5 giây
        this.refreshInterval = setInterval(() => {
            this.refreshData();
        }, 5000);
        
        // Auto match orders mỗi 1 giây (realtime)
        this.matchInterval = setInterval(() => {
            this.autoMatchOrders();
        }, 1000);
    }

    async loadInitialData() {
        this.state.loading = true;
("Loading initial data...");
        try {
            // Load danh sách funds
("Fetching funds from /api/transaction-list/funds");
            const response = await fetch("/api/transaction-list/funds", {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({})
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const funds = await response.json();
("Funds response:", funds);
            this.state.funds = funds.funds || [];
("Loaded funds:", this.state.funds.length);
            
            if (this.state.funds.length > 0) {
                this.state.currentFundIndex = 0;
                this.state.selectedFund = this.state.funds[0];
("Selected fund:", this.state.selectedFund);
                await this.loadOrderBook();
                this.startAutoRotate();
            } else {
("No funds found");
            }
            
            // Component loaded successfully
("Order Book data loaded successfully");
        } catch (error) {
            console.error("Error loading initial data:", error);
            if (window.showError) {
                window.showError("Lỗi tải dữ liệu ban đầu: " + error.message);
            }
        } finally {
            this.state.loading = false;
        }
    }

    async loadOrderBook() {
        if (!this.state.selectedFund) {
("No selected fund, skipping order book load");
            return;
        }

("Loading order book for fund:", this.state.selectedFund.id);
        try {
            const response = await fetch("/api/transaction-list/order-book", {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    fund_id: this.state.selectedFund.id
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
("Order book response:", data);

            if (data.success) {
                // Phát hiện orders mới bị khớp (disappeared)
                this.detectMatchedOrders(data.buy_orders || [], data.sell_orders || []);
                // Phát hiện tăng matched_units để kích hoạt animation ngay khi khớp
                this.detectMatchedIncrements(data.buy_orders || [], data.sell_orders || []);
                
                this.state.buyOrders = data.buy_orders || [];
                this.state.sellOrders = data.sell_orders || [];
                // Sử dụng partial_orders từ backend (đã query từ transaction.matched.orders với status = 'confirmed')
                this.state.partialOrders = data.partial_orders || [];
                this.state.fundInfo = data.fund_info || null;
                this.state.priceChange = data.price_change || 0;
                this.state.priceChangePercent = data.price_change_percent || 0;
                this.state.lastUpdate = new Date();

                // Loại bỏ các lệnh đã khớp hoàn toàn khỏi box chờ xử lý
                this.reconcileOrders();
("Loaded orders - Buy:", this.state.buyOrders.length, "Sell:", this.state.sellOrders.length);
                // Cho phép animation trở lại sau khi đã đồng bộ danh sách theo quỹ mới
                this.state.suppressAnimations = false;
            } else {
                throw new Error(data.message || "Không thể tải dữ liệu sổ lệnh");
            }
        } catch (error) {
            console.error("Error loading order book:", error);
            if (window.showError) {
                window.showError("Lỗi tải sổ lệnh: " + error.message);
            }
        }
    }

    async refreshData() {
        await this.loadOrderBook();
    }

    async onFundChange(event) {
        const fundId = parseInt(event.target.value);
        const index = this.state.funds.findIndex(f => f.id === fundId);
        if (index !== -1) {
            this.state.currentFundIndex = index;
            this.state.selectedFund = this.state.funds[index];
            // Khi đổi quỹ: không nháy màu do thay đổi filter
            this.state.suppressAnimations = true;
            // Reset bộ nhớ để không coi sự biến mất do filter là khớp lệnh
            this.state.previousOrderIds = { buy: new Set(), sell: new Set() };
            this.state.lastMatchedUnits.buy.clear();
            this.state.lastMatchedUnits.sell.clear();
            await this.loadOrderBook();
        }
    }

    startAutoRotate() {
        // Dừng interval cũ nếu có
        if (this.autoRotateInterval) {
            clearInterval(this.autoRotateInterval);
        }
        // Tự động chuyển quỹ mỗi 10 giây
        this.autoRotateInterval = setInterval(() => {
            this.rotateToNextFund();
        }, 10000);
    }

    async rotateToNextFund() {
        if (!this.state.funds || this.state.funds.length <= 1) {
            return; // Không có quỹ hoặc chỉ có 1 quỹ thì không cần rotate
        }
        
        // Tăng index và loop lại từ đầu nếu đến cuối
        this.state.currentFundIndex = (this.state.currentFundIndex + 1) % this.state.funds.length;
        this.state.selectedFund = this.state.funds[this.state.currentFundIndex];
        
        // Khi đổi quỹ: không nháy màu do thay đổi filter
        this.state.suppressAnimations = true;
        // Reset bộ nhớ để không coi sự biến mất do filter là khớp lệnh
        this.state.previousOrderIds = { buy: new Set(), sell: new Set() };
        this.state.lastMatchedUnits.buy.clear();
        this.state.lastMatchedUnits.sell.clear();
        
        // Cập nhật select box để đồng bộ với state
        const selectElement = document.getElementById('fund-select');
        if (selectElement) {
            selectElement.value = this.state.selectedFund.id;
        }
        
        await this.loadOrderBook();
    }

    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }

    formatUnits(units) {
        return new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(units);
    }

    formatAmount(amount) {
        return new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    getPriceChangeClass() {
        if (this.state.priceChange > 0) return "price-up";
        if (this.state.priceChange < 0) return "price-down";
        return "price-neutral";
    }

    getPriceChangeIcon() {
        if (this.state.priceChange > 0) return "fa-arrow-up";
        if (this.state.priceChange < 0) return "fa-arrow-down";
        return "fa-minus";
    }

    // Lấy danh sách lệnh khớp một phần dựa vào bảng matched orders
    async loadPartialOrdersFromMatched() {
        try {
            // Gọi endpoint get-matched-orders (đã tồn tại) để lấy danh sách các cặp confirmed/done
            const resp = await fetch('/api/transaction-list/get-matched-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fund_id: this.state.selectedFund && this.state.selectedFund.id ? this.state.selectedFund.id : undefined,
                    status: ['confirmed', 'done']
                })
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            const rows = data && (data.data || data.matched_orders || []);
            // Gom số lượng theo từng transaction (mua/bán)
            const agg = new Map(); // key: txId -> { id, user_name, fund_id, price, units, matched_units, remaining_units, status, created_at }

            const normalizeTx = (raw) => {
                if (!raw) return null;
                // Tương thích nhiều cấu trúc trả về khác nhau
                const units = Number(raw.units ?? 0);
                const matchedUnits = Number(raw.matched_units ?? 0);
                const remainingUnitsField = raw.remaining_units;
                const remainingUnitsProvided = typeof remainingUnitsField === 'number';
                const fundId = (raw.fund && raw.fund.id) || raw.fund_id || (raw.fund_id && raw.fund_id[0]) || null;
                return {
                    id: raw.id,
                    user_name: raw.user_name || (raw.user && raw.user.name) || '',
                    fund_id: fundId,
                    price: Number(raw.price ?? raw.current_nav ?? 0),
                    units,
                    matched_units: matchedUnits,
                    remaining_units: remainingUnitsProvided ? Number(remainingUnitsField) : null,
                    status: raw.status || 'pending',
                    created_at: raw.created_at || raw.create_date || null,
                };
            };

            const accumulate = (rawTx, qty) => {
                const tx = normalizeTx(rawTx);
                if (!tx || !tx.id) return;
                // Lọc theo quỹ đang chọn nếu có
                if (this.state.selectedFund && this.state.selectedFund.id && tx.fund_id && tx.fund_id !== this.state.selectedFund.id) {
                    return;
                }
                const k = tx.id;
                const cur = agg.get(k) || {
                    id: k,
                    user_name: tx.user_name,
                    fund_id: tx.fund_id,
                    price: tx.price,
                    units: tx.units,
                    matched_units: 0,
                    // Nếu backend đã cung cấp remaining/matched hiện tại thì ưu tiên số liệu đó làm baseline
                    remaining_units: typeof tx.remaining_units === 'number' ? tx.remaining_units : tx.units,
                    status: tx.status,
                    created_at: tx.created_at,
                };
                // Nếu backend có matched_units và remaining_units hiện tại, đồng bộ trước khi cộng dồn từ lịch sử cặp
                if (tx.matched_units && typeof tx.remaining_units === 'number') {
                    cur.matched_units = Number(tx.matched_units);
                    cur.remaining_units = Number(tx.remaining_units);
                }
                // Cộng thêm matched từ bản ghi cặp (đảm bảo không vượt quá tổng units)
                const added = Number(qty || 0);
                cur.matched_units = Math.min((cur.matched_units || 0) + added, cur.units || 0);
                cur.remaining_units = Math.max((cur.units || 0) - (cur.matched_units || 0), 0);
                agg.set(k, cur);
            };

            rows.forEach((m) => {
                const qty = m.matched_quantity || m.quantity || 0;
                // Chuẩn hóa các field buy/sell trong nhiều cấu trúc trả về
                const buyOrder = m.buy_order || m.buy_order_id || (m.buy_order && m.buy_order.id ? m.buy_order : null);
                const sellOrder = m.sell_order || m.sell_order_id || (m.sell_order && m.sell_order.id ? m.sell_order : null);
                if (buyOrder) accumulate(buyOrder, qty);
                if (sellOrder) accumulate(sellOrder, qty);
            });

            // Chỉ giữ các lệnh đang pending và khớp một phần
            const partial = Array.from(agg.values()).filter(r => r.status === 'pending' && r.matched_units > 0 && r.remaining_units > 0);
            this.state.partialOrders = partial;
        } catch (e) {
            console.error('[LOAD PARTIAL FROM MATCHED ERROR]', e);
            // Fallback: giữ nguyên partialOrders cũ
        }
    }

    formatStatus(status) {
        const s = (status || '').toString().toLowerCase();
        if (s === 'pending') return 'Chờ khớp';
        if (s === 'completed') return 'Khớp lệnh';
        if (s === 'cancelled') return 'Đã hủy';
        return status || '';
    }

    formatDateTime(date) {
        if (!date) return "";
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(new Date(date));
    }

    detectMatchedOrders(newBuyOrders, newSellOrders) {
        // Nếu đang đổi quỹ, bỏ qua animation do thay đổi filter
        if (this.state.suppressAnimations) {
            const currentBuyIdsOnly = new Set(newBuyOrders.map(o => o.id));
            const currentSellIdsOnly = new Set(newSellOrders.map(o => o.id));
            this.state.previousOrderIds = {
                buy: currentBuyIdsOnly,
                sell: currentSellIdsOnly,
            };
            return;
        }
        // Tạo Set các order IDs hiện tại
        const currentBuyIds = new Set(newBuyOrders.map(o => o.id));
        const currentSellIds = new Set(newSellOrders.map(o => o.id));
        
        // Phát hiện buy orders bị khớp (disappeared)
        const matchedBuyIds = [...this.state.previousOrderIds.buy || []].filter(id => !currentBuyIds.has(id));
        const matchedSellIds = [...this.state.previousOrderIds.sell || []].filter(id => !currentSellIds.has(id));
        
        // Hiển thị animation cho matched orders
        if (matchedBuyIds.length > 0 || matchedSellIds.length > 0) {
            this.showMatchAnimation(matchedBuyIds, matchedSellIds);
        }
        
        // Cập nhật previous order IDs
        this.state.previousOrderIds = {
            buy: currentBuyIds,
            sell: currentSellIds
        };
    }
    
    showMatchAnimation(matchedBuyIds, matchedSellIds) {
        // Hiển thị notification
        const totalMatched = matchedBuyIds.length + matchedSellIds.length;
        this.showMatchNotification(`🎉 Đã khớp ${totalMatched} lệnh! (${matchedBuyIds.length} mua, ${matchedSellIds.length} bán)`);
        
        // Trigger animation cho các orders còn lại (nếu có)
        setTimeout(() => {
            this.triggerMatchAnimation();
        }, 100);
    }
    
    showMatchNotification(message, type = 'success') {
        // Xóa notification cũ nếu có
        const existingNotifications = document.querySelectorAll('.match-notification');
        existingNotifications.forEach(n => n.remove());
        
        // Tạo notification element
        const notification = document.createElement('div');
        notification.className = 'match-notification';
        notification.textContent = message;
        
        // Thêm style theo type
        if (type === 'error') {
            notification.style.background = '#dc3545';
        } else if (type === 'info') {
            notification.style.background = '#17a2b8';
        } else {
            notification.style.background = '#28a745';
        }
        
        // Đảm bảo z-index cao nhất
        notification.style.zIndex = '9999';
        notification.style.position = 'fixed';
        notification.style.top = '80px';
        notification.style.right = '20px';
        
        document.body.appendChild(notification);
        
        // Auto remove sau 4 giây (tăng thời gian để người dùng đọc được)
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 4000);
    }
    
    triggerMatchAnimation() {
        // Thêm class animation cho orders (nếu cần)
        const buyOrders = document.querySelectorAll('.buy-order');
        const sellOrders = document.querySelectorAll('.sell-order');
        
        // Random animation cho một số orders để tạo hiệu ứng
        [...buyOrders].slice(0, 2).forEach(order => {
            order.classList.add('matched-buy');
            setTimeout(() => order.classList.remove('matched-buy'), 2000);
        });
        
        [...sellOrders].slice(0, 2).forEach(order => {
            order.classList.add('matched-sell');
            setTimeout(() => order.classList.remove('matched-sell'), 2000);
        });
    }

    // Phát hiện tăng matched_units và nháy ngay lập tức
    detectMatchedIncrements(newBuyOrders, newSellOrders) {
        try {
            // Nếu đang đổi quỹ, bỏ qua nháy do matched_units khác fund
            if (this.state.suppressAnimations) {
                return;
            }
            // BUY
            newBuyOrders.forEach(o => {
                const id = o.id;
                const prev = this.state.lastMatchedUnits.buy.get(id) || 0;
                const cur = typeof o.matched_units === 'number' ? o.matched_units : 0;
                if (cur > prev) {
                    const el = document.querySelector(`.buy-order[data-id="${id}"]`);
                    if (el) {
                        el.classList.add('matched-buy');
                        setTimeout(() => el.classList.remove('matched-buy'), 2000);
                    }
                }
                this.state.lastMatchedUnits.buy.set(id, cur);
            });
            // SELL
            newSellOrders.forEach(o => {
                const id = o.id;
                const prev = this.state.lastMatchedUnits.sell.get(id) || 0;
                const cur = typeof o.matched_units === 'number' ? o.matched_units : 0;
                if (cur > prev) {
                    const el = document.querySelector(`.sell-order[data-id="${id}"]`);
                    if (el) {
                        el.classList.add('matched-sell');
                        setTimeout(() => el.classList.remove('matched-sell'), 2000);
                    }
                }
                this.state.lastMatchedUnits.sell.set(id, cur);
            });

            // Sau khi phát hiện tăng matched_units, cập nhật lại danh sách để loại bỏ lệnh đã khớp hoàn toàn
            this.reconcileOrders();
        } catch (e) {
            console.error('[DETECT MATCHED INCREMENTS ERROR]', e);
        }
    }

    // Đồng bộ danh sách: bỏ lệnh đã khớp hoàn toàn khỏi box chờ
    // Lưu ý: partialOrders đã được set từ backend (từ transaction.matched.orders với status = 'confirmed')
    reconcileOrders() {
        const isFullyMatched = (o) => {
            if (typeof o.remaining_units === 'number') {
                return o.remaining_units <= 0;
            }
            const units = Number(o.units || 0);
            const matched = Number(o.matched_units || 0);
            return units > 0 && matched >= units;
        };

        // Lọc bỏ lệnh đã khớp hoàn toàn khỏi danh sách chờ
        // Không cần ghi đè partialOrders nữa vì đã được set từ backend
        this.state.buyOrders = this.state.buyOrders.filter(o => !isFullyMatched(o));
        this.state.sellOrders = this.state.sellOrders.filter(o => !isFullyMatched(o));
    }

    async autoMatchOrders() {
        try {
            // Chỉ khớp lệnh nếu có lệnh pending
            if (this.state.buyOrders.length === 0 && this.state.sellOrders.length === 0) {
('[AUTO MATCH] Không có lệnh pending, skip');
                return;
            }
            
(`[AUTO MATCH] Có ${this.state.buyOrders.length} lệnh mua, ${this.state.sellOrders.length} lệnh bán`);
('[AUTO MATCH] Đang khớp lệnh tự động...');
            
            const response = await fetch('/api/transaction-list/match-orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    match_type: 'all',
                    use_time_priority: true,
                    status_mode: 'pending'
                })
            });

            if (!response.ok) {
                console.error('[AUTO MATCH] HTTP Error:', response.status, response.statusText);
                return;
            }

            const result = await response.json();
('[AUTO MATCH] Kết quả:', result);
            
            if (result.success && result.summary && result.summary.total_matched > 0) {
(`[AUTO MATCH] Đã khớp ${result.summary.total_matched} cặp lệnh!`);
                
                // Có khớp lệnh, refresh data để hiển thị animation
                await this.refreshData();
                
                // Hiển thị notification
                this.showMatchNotification(`🎉 Đã khớp ${result.summary.total_matched} cặp lệnh tự động!`);
            } else {
('[AUTO MATCH] Không có lệnh nào được khớp:', result.message || 'Không có lệnh phù hợp');
            }
        } catch (error) {
            console.error('[AUTO MATCH ERROR]', error);
        }
    }

    async matchNow() {
        try {
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
            const result = await res.json();
            if (result.success) {
                await this.refreshData();
                this.showMatchNotification(`🎉 Đã khớp ${result.summary?.total_matched || 0} cặp lệnh!`);
            }
        } catch (e) {
            console.error('[MATCH NOW ERROR]', e);
        }
    }

    // Methods từ transaction_list_tab.js để tái sử dụng dropdown
    async createRandomTransactions() {
        try {
            const response = await fetch('/api/transaction-list/create-random', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await response.json();
            if (result.success) {
                this.showMatchNotification(`Tạo thành công ${result.created_count || 0} giao dịch random`, 'success');
                await this.refreshData();
            } else {
                this.showMatchNotification('Lỗi tạo random transactions: ' + result.message, 'error');
            }
        } catch (error) {
            this.showMatchNotification('Lỗi kết nối: ' + error.message, 'error');
        }
    }

    async matchOrders() {
        try {
            const payload = {
                match_type: 'all',
                use_time_priority: true,
                status_mode: 'pending'
            };
            const response = await fetch('/api/transaction-list/match-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.success) {
                const algorithmUsed = result.algorithm_used || 'Price-Time Priority (FIFO)';
                this.showMatchNotification(`Khớp lệnh thành công: ${result.summary?.total_matched || 0} cặp (${algorithmUsed})`);
                await this.refreshData();
            } else {
                this.showMatchNotification('Lỗi khớp lệnh: ' + result.message, 'error');
            }
        } catch (error) {
            this.showMatchNotification('Lỗi kết nối: ' + error.message, 'error');
        }
    }

    async marketMakerHandleRemainingFromMenu() {
        try {
            const remaining_buys = (this.state.buyOrders || []).map(o => o.id).filter(id => id);
            const remaining_sells = (this.state.sellOrders || []).map(o => o.id).filter(id => id);
            
            if (remaining_buys.length === 0 && remaining_sells.length === 0) {
                this.showMatchNotification('ℹ️ Không có lệnh hợp lệ để xử lý.', 'info');
                return;
            }

            const res = await fetch('/api/transaction-list/market-maker/handle-remaining', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ remaining_buys, remaining_sells })
            });

            if (!res.ok) {
                const txt = await res.text().catch(() => '');
                throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`);
            }

            const data = await res.json();
            const ok = !!(data && data.success);
            this.showMatchNotification(
                ok ? '✅ Đã xử lý Nhà tạo lập' : ('❌ Lỗi: ' + (data && data.message || 'Không xác định')),
                ok ? 'success' : 'error'
            );

            if (ok) {
                await this.refreshData();
            }
        } catch (error) {
            this.showMatchNotification('❌ Lỗi Market Maker: ' + error.message, 'error');
        }
    }

    async importExcel() {
        try {
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
                this.showMatchNotification('⚠️ Bạn chưa chọn file. Thao tác bị hủy.', 'info');
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
                this.showMatchNotification(`📊 Import thành công: ${result.transactions.length} lệnh (trạng thái pending)`, 'success');
                await this.refreshData();
            } else {
                this.showMatchNotification('❌ Lỗi khi import: ' + (result.message || 'Không xác định'), 'error');
            }
        } catch (error) {
            this.showMatchNotification('❌ Lỗi kết nối: ' + error.message, 'error');
        }
    }

    async sendMaturityNotifications() {
        try {
            this.showMatchNotification('🔔 Đang kiểm tra và gửi thông báo đáo hạn...', 'info');
            
            const response = await fetch('/api/transaction-list/send-maturity-notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            
            const result = await response.json();
            
            if (result && result.success) {
                const created = result.notifications_created || 0;
                const sent = result.notifications_sent || 0;
                this.showMatchNotification(
                    `✅ ${result.message || `Đã tạo ${created} thông báo và gửi ${sent} thông báo qua websocket thành công.`}`,
                    'success'
                );
            } else {
                this.showMatchNotification(
                    `❌ ${result.message || 'Không thể gửi thông báo đáo hạn'}`,
                    'error'
                );
            }
        } catch (error) {
            console.error('Error sending maturity notifications:', error);
            this.showMatchNotification(`❌ Lỗi kết nối: ${error.message}`, 'error');
        }
    }

    async sendMaturityNotificationsTest() {
        try {
            if (!confirm('⚠️ CẢNH BÁO: Bạn có chắc muốn gửi thông báo đáo hạn cho TẤT CẢ lệnh?\n\nTính năng này chỉ dùng để TEST và sẽ gửi thông báo qua websocket cho tất cả lệnh mua đã hoàn thành, không kiểm tra ngày đáo hạn.')) {
                return;
            }
            
            this.showMatchNotification('🧪 [TEST] Đang gửi thông báo đáo hạn cho tất cả lệnh...', 'info');
            
            const response = await fetch('/api/transaction-list/send-maturity-notifications-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            
            const result = await response.json();
            
            if (result && result.success) {
                const created = result.notifications_created || 0;
                const sent = result.notifications_sent || 0;
                this.showMatchNotification(
                    `✅ [TEST] ${result.message || `Đã tạo ${created} thông báo và gửi ${sent} thông báo qua websocket thành công.`}`,
                    'success'
                );
            } else {
                this.showMatchNotification(
                    `❌ ${result.message || 'Không thể gửi thông báo đáo hạn'}`,
                    'error'
                );
            }
        } catch (error) {
            console.error('Error sending maturity notifications (TEST):', error);
            this.showMatchNotification(`❌ Lỗi kết nối: ${error.message}`, 'error');
        }
    }

    onWillUnmount() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        if (this.matchInterval) {
            clearInterval(this.matchInterval);
        }
        if (this.autoRotateInterval) {
            clearInterval(this.autoRotateInterval);
            this.autoRotateInterval = null;
        }
    }
}
