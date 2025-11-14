/** @odoo-module **/

import { Component, useState, onMounted, onWillUnmount, xml } from "@odoo/owl";

export class CompletedOrdersComponent extends Component {
    static template = xml`
    <div class="order-book-container" t-attf-style="margin-top: 16px; position: relative; z-index: 0; overflow: visible;">
        <div class="ob-nav" style="display:flex; gap:12px; margin-bottom:16px; flex-wrap:wrap;">
            <a href="/order-book" style="text-decoration:none;"><span class="ob-pill">Khoản đầu tư đang chờ xử lý</span></a>
            <a href="#" style="text-decoration:none;"><span class="ob-pill ob-pill-active">Khoản đầu tư đã khớp</span></a>
            <a href="/negotiated-orders" style="text-decoration:none;"><span class="ob-pill">Khoản đầu tư khớp theo thỏa thuận</span></a>
        </div>
        <style>
            .ob-pill { display:inline-block; padding:8px 14px; border-radius:999px; background:#f3f4f6; color:#111827; font-weight:600; font-size:14px; cursor:pointer; transition:background .15s ease,color .15s ease; }
            .ob-pill:hover { background:#e5e7eb; }
            .ob-pill-active { background:#f97316; color:#fff; }
        </style>

        <div class="order-book-header">
            <div class="header-center">
                <div class="fund-selector">
                    <label for="fund-select-completed">Chọn quỹ:</label>
                    <select id="fund-select-completed" t-on-change="onFundChange" class="form-control">
                        <option t-foreach="state.funds" t-as="fund" t-key="fund.id" t-att-value="fund.id">
                            <t t-esc="fund.name"/> (<t t-esc="fund.ticker"/>)
                        </option>
                    </select>
                </div>
            </div>
            <div class="header-right">
                <div class="last-update"><i class="fa fa-clock-o"></i> Cập nhật: <t t-esc="formatDateTime(state.lastUpdate)"/></div>
                <button class="btn btn-primary btn-sm" t-on-click="refreshData"><i class="fa fa-refresh"></i> Làm mới</button>
            </div>
        </div>

        <div class="order-book-content" t-attf-style="display:block; padding:20px;">
            <div class="order-box" style="background:#fff; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                <div class="order-section-header" style="background:linear-gradient(135deg,#0ea5e9,#2563eb)">
                    <h3><i class="fa fa-check-circle"></i> Danh sách giao dịch đã khớp</h3>
                    <span class="order-count">(<t t-esc="state.orders.length"/> lệnh)</span>
                </div>
                <div class="order-list">
                    <div t-if="state.loading" class="loading-spinner"><i class="fa fa-spinner fa-spin"></i> Đang tải...</div>
                    <div t-if="!state.loading and state.orders.length === 0" class="no-orders"><i class="fa fa-info-circle"></i> Không có dữ liệu</div>
                    <t t-if="!state.loading and state.orders.length > 0">
                        <table class="ob-table ob-table-completed" style="text-align: center; width: 100%;">
                            <thead>
                                <tr>
                                    <th style="text-align: center;">Loại lệnh</th>
                                    <th style="text-align: center;">Giá</th>
                                    <th style="text-align: center;">Số lượng</th>
                                    <th style="text-align: center;">Thành tiền</th>
                                    <th style="text-align: center;">Nhà đầu tư</th>
                                    <th style="text-align: center;">Thời gian</th>
                                    <th style="text-align: center;">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr t-foreach="getOrdersForPage()" t-as="order" t-key="order.id" 
                                    t-attf-class="#{order.type === 'sell' ? 'sell-order' : 'buy-order'}">
                                    <td style="text-align: center;">
                                        <t t-if="order.type === 'sell'">Lệnh bán</t>
                                        <t t-else="">Lệnh mua</t>
                                    </td>
                                    <td style="text-align: center;"><t t-esc="formatPrice(order.price)"/></td>
                                    <td style="text-align: center;"><t t-esc="formatUnits(order.units)"/></td>
                                    <td style="text-align: center;"><t t-esc="formatAmount(order.amount)"/></td>
                                    <td style="text-align: center;"><t t-esc="order.user_name"/></td>
                                    <td style="text-align: center;"><t t-esc="formatDateTime(order.created_at)"/></td>
                                    <td style="text-align: center;"><span class="status-badge status-completed">Khớp lệnh</span></td>
                                </tr>
                            </tbody>
                        </table>
                        <!-- Phân trang -->
                        <div class="pagination-container" style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 16px; padding: 12px;">
                            <button class="btn btn-sm btn-secondary" t-on-click="prevPage" t-att-disabled="isPrevPageDisabled()">
                                <i class="fa fa-chevron-left"></i> Trước
                            </button>
                            <span style="margin: 0 8px;">
                                Trang <t t-esc="state.currentPage"/> / <t t-esc="state.totalPages"/> 
                                (<t t-esc="state.orders.length"/> lệnh)
                            </span>
                            <button class="btn btn-sm btn-secondary" t-on-click="nextPage" t-att-disabled="isNextPageDisabled()">
                                Sau <i class="fa fa-chevron-right"></i>
                            </button>
                        </div>
                    </t>
                </div>
            </div>
        </div>
    </div>`;

    setup() {
        this.state = useState({ 
            funds: [], 
            selectedFund: null, 
            orders: [], 
            loading: false, 
            lastUpdate: null,
            // Phân trang
            currentPage: 1,
            pageSize: 10,
            totalPages: 1,
            currentFundIndex: 0 // Track index quỹ hiện tại
        });
        this.autoRotateInterval = null;
        onMounted(async () => {
            await this.loadFunds();
            await this.refreshData();
            this.startAutoRotate();
        });
    }

    async loadFunds() {
        try {
            const res = await fetch('/api/transaction-list/funds', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({}) 
            });
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const data = await res.json();
            
            if (data.success && data.funds) {
                this.state.funds = data.funds || [];
                if (this.state.funds.length > 0) {
                    this.state.currentFundIndex = 0;
                    this.state.selectedFund = this.state.funds[0];
                }
            } else {
                console.error('Error loading funds:', data.message || 'Unknown error');
                this.state.funds = [];
            }
        } catch (error) {
            console.error('Error loading funds:', error);
            this.state.funds = [];
        }
    }

    async refreshData() {
        if (!this.state.selectedFund) return;
        this.state.loading = true;
        try {
            const res = await fetch('/api/transaction-list/completed', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ fund_id: this.state.selectedFund.id }) 
            });
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const data = await res.json();
            
            if (data.success && data.data) {
                this.state.orders = data.data || [];
                // Cập nhật phân trang
                this.updatePagination();
            } else {
                console.error('Error loading completed orders:', data.message || 'Unknown error');
                this.state.orders = [];
                this.updatePagination();
            }
            
            this.state.lastUpdate = new Date();
        } catch (error) {
            console.error('Error refreshing completed orders:', error);
            this.state.orders = [];
        } finally {
            this.state.loading = false;
        }
    }

    async onFundChange(ev) {
        const id = parseInt(ev.target.value);
        const index = this.state.funds.findIndex(f => f.id === id);
        if (index !== -1) {
            this.state.currentFundIndex = index;
            this.state.selectedFund = this.state.funds[index];
            this.state.currentPage = 1; // Reset về trang 1 khi đổi fund
            await this.refreshData();
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
        this.state.currentPage = 1; // Reset về trang 1
        
        // Cập nhật select box để đồng bộ với state
        const selectElement = document.getElementById('fund-select-completed');
        if (selectElement) {
            selectElement.value = this.state.selectedFund.id;
        }
        
        await this.refreshData();
    }

    updatePagination() {
        const total = this.state.orders.length;
        this.state.totalPages = Math.max(1, Math.ceil(total / this.state.pageSize));
        // Đảm bảo currentPage không vượt quá totalPages
        if (this.state.currentPage > this.state.totalPages) {
            this.state.currentPage = this.state.totalPages;
        }
    }

    getOrdersForPage() {
        const page = this.state.currentPage;
        const pageSize = this.state.pageSize;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return this.state.orders.slice(start, end);
    }

    isPrevPageDisabled() {
        return this.state.currentPage <= 1;
    }

    isNextPageDisabled() {
        return this.state.currentPage >= this.state.totalPages;
    }

    prevPage() {
        if (this.state.currentPage > 1) {
            this.state.currentPage--;
        }
    }

    nextPage() {
        if (this.state.currentPage < this.state.totalPages) {
            this.state.currentPage++;
        }
    }

    formatPrice(v) { return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(v || 0); }
    formatUnits(v) { return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(v || 0); }
    formatAmount(v) { return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(v || 0); }
    formatDateTime(d) { if (!d) return ''; try { return new Intl.DateTimeFormat('vi-VN', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' }).format(new Date(d)); } catch { return ''; } }

    onWillUnmount() {
        if (this.autoRotateInterval) {
            clearInterval(this.autoRotateInterval);
            this.autoRotateInterval = null;
        }
    }
}

window.CompletedOrdersComponent = CompletedOrdersComponent;


