/** @odoo-module **/
import { Component, useState, xml } from "@odoo/owl";

export class OrderWidget extends Component {
    static template = xml`
        <div class="bg-light text-dark">
            <main class="container py-4">
                <!-- Tabs -->
                <ul class="nav nav-tabs mb-4">
                    <li class="nav-item">
                        <a href="/transaction_management/pending" class="nav-link">Lệnh chờ xử lý</a>
                    </li>
                    <li class="nav-item">
                        <a href="/transaction_management/order" class="nav-link active fw-semibold">Lịch sử giao dịch</a>
                    </li>
                    <li class="nav-item">
                        <a href="/transaction_management/periodic" class="nav-link">Quản lý định kỳ</a>
                    </li>
                </ul>

                <!-- Section header + Search/Filter -->
                <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
                    <h2 class="h4 fw-bold mb-0">Lịch sử giao dịch</h2>
                    <div class="d-flex flex-column flex-md-row align-items-md-center gap-2 ms-md-auto">
                        <p class="mb-0 text-secondary">Tổng số lệnh: <span class="fw-semibold"><t t-esc="state.orders.length"/></span></p>
                        <form class="d-flex flex-wrap gap-2 align-items-center" t-on-submit.prevent="() => this.search()">
                            <input type="text" placeholder="Nhập mã lệnh"
                                   class="form-control form-control-sm rounded-pill px-3 py-1 text-secondary"
                                   t-model="state.searchOrderCode"/>
                            <select class="form-select form-select-sm rounded-pill px-3 py-1 text-secondary"
                                    t-model="state.searchFund" t-on-change="() => this.filterOrders()">
                                <option value="">Chọn sản phẩm</option>
                                <t t-foreach="state.uniqueFunds" t-as="fund" t-key="fund">
                                    <option t-att-value="fund"><t t-esc="fund"/></option>
                                </t>
                            </select>
                            <select class="form-select form-select-sm rounded-pill px-3 py-1 text-secondary"
                                    t-model="state.searchType" t-on-change="() => this.filterOrders()">
                                <option value="">Chọn loại lệnh</option>
                                <option value="Mua">Lệnh mua</option>
                                <option value="Bán">Lệnh bán</option>
                                <option value="Hoán đổi">Lệnh hoán đổi</option>
                            </select>
                            <input type="date" class="form-control form-control-sm rounded-pill px-3 py-1 text-secondary" t-model="state.fromDate"/>
                            <input type="date" class="form-control form-control-sm rounded-pill px-3 py-1 text-secondary" t-model="state.toDate"/>
                            <button type="submit" class="btn btn-warning btn-sm rounded-pill d-flex align-items-center gap-2 px-3 py-1 fw-semibold shadow-sm" aria-label="Search">
                                <i class="fas fa-search"></i>
                                <span>Tìm kiếm</span>
                            </button>
                            <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill p-2" aria-label="Settings" t-on-click="() => this.state.showColumnModal = true">
                                <i class="fas fa-cog"></i>
                            </button>
                        </form>
                    </div>
                </div>

                <!-- Table container -->
                <div class="card shadow-sm rounded-4 border-0 mb-4 overflow-auto">
                    <div class="table-responsive">
                        <table class="table table-bordered table-hover align-middle mb-0 text-center">
                            <thead class="custom-red-bg" style="background-color:#f97316;color:white">
                                <tr>
                                    <th t-if="state.visibleColumns.account_number">Số tài khoản</th>
                                    <th t-if="state.visibleColumns.fund_name">Quỹ - Chương trình</th>
                                    <th t-if="state.visibleColumns.order_code">Mã lệnh</th>
                                    <th t-if="state.visibleColumns.transaction_type">Loại lệnh</th>
                                    <th t-if="state.visibleColumns.session_date">Ngày giao dịch</th>
                                    <th t-if="state.visibleColumns.units">Số lượng</th>
                                    <th t-if="state.visibleColumns.nav">NAV</th>
                                    <th t-if="state.visibleColumns.amount">Tổng tiền</th>
                                    <th t-if="state.visibleColumns.purchase_fee">Phí</th>
                                    <th t-if="state.visibleColumns.tax">Thuế</th>
                                    <th t-if="state.visibleColumns.total_after_fee">Số tiền sau thuế/phí</th>
                                    <th t-if="state.visibleColumns.status">Trạng thái</th>
                                    <th t-if="state.visibleColumns.contract">Hợp đồng</th>
                                </tr>
                            </thead>
                            <tbody>
                                <t t-if="state.filteredOrders and state.filteredOrders.length > 0">
                                    <t t-foreach="state.filteredOrders" t-as="order" t-key="order.order_code">
                                        <tr>
                                            <td t-if="state.visibleColumns.account_number"><t t-esc="order.account_number"/></td>
                                            <td t-if="state.visibleColumns.fund_name"><t t-esc="order.fund_name"/><t t-if="order.fund_ticker"> (<t t-esc="order.fund_ticker"/>)</t></td>
                                            <td t-if="state.visibleColumns.order_code"><t t-esc="order.order_code"/></td>
                                            <td t-if="state.visibleColumns.transaction_type">
                                                <span t-attf-class="badge rounded-pill px-2 py-1 fw-semibold #{ this.typeClass(order.transaction_type) }">
                                                    <t t-if="order.transaction_type === 'buy'">Mua</t>
                                                    <t t-elif="order.transaction_type === 'sell'">Bán</t>
                                                    <t t-elif="order.transaction_type === 'exchange'">Hoán đổi</t>
                                                    <t t-else=""><t t-esc="order.transaction_type"/></t>
                                                </span>
                                            </td>
                                            <td t-if="state.visibleColumns.session_date"><t t-esc="order.session_date"/></td>
                                            <td t-if="state.visibleColumns.units"><t t-esc="order.units"/></td>
                                            <td t-if="state.visibleColumns.nav"><t t-esc="order.nav"/></td>
                                            <td t-if="state.visibleColumns.amount"><t t-esc="order.amount"/><t t-esc="order.currency"/></td>
                                            <td t-if="state.visibleColumns.purchase_fee"><t t-esc="formatCurrency(order.fee)"/></td>
                                            <td t-if="state.visibleColumns.tax"><t t-esc="formatCurrency(order.tax)"/></td>
                                            <td t-if="state.visibleColumns.total_after_fee"><t t-esc="formatCurrency(order.total_after_fee)"/></td>
                                            <td t-if="state.visibleColumns.status">
                                                <div class="d-flex flex-column align-items-center">
                                                    <span t-attf-class="badge rounded-pill px-2 py-1 fw-semibold mb-1 #{ this.statusClass(order.status) }">
                                                        <t t-esc="order.status"/>
                                                    </span>
                                                </div>
                                            </td>
                                            <td t-if="state.visibleColumns.contract">
                                                <t t-if="order.has_contract">
                                                    <div class="d-flex justify-content-center align-items-center gap-2">
                                                        <a t-att-href="order.contract_url" target="_blank" class="btn btn-sm rounded-pill fw-semibold px-3" style="background-color:#f97316;border-color:#f97316;color:white;min-width:72px;text-align:center">Xem</a>
                                                        <a t-att-href="order.contract_download_url" class="btn btn-sm rounded-pill fw-semibold px-3" style="background-color:#f97316;border-color:#f97316;color:white;min-width:72px;text-align:center">Tải</a>
                                                    </div>
                                                </t>
                                                <t t-else="">—</t>
                                            </td>
                                        </tr>
                                    </t>
                                </t>
                                <t t-if="!state.filteredOrders or state.filteredOrders.length === 0">
                                    <tr>
                                        <td colspan="12" class="text-center text-muted py-4">
                                            Không có dữ liệu lịch sử giao dịch
                                        </td>
                                    </tr>
                                </t>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Pagination and info -->
                <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 small text-secondary">
                    <div>
                        Hiện 1 - <t t-esc="state.filteredOrders.length"/> trong số <t t-esc="state.filteredOrders.length"/>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <label for="perPage" class="form-label mb-0">Số lượng 1 trang:</label>
                        <select id="perPage" name="perPage" class="form-select form-select-sm w-auto rounded-pill" t-on-change="(ev) => this.changePageSize(ev.target.value)">
                            <option value="10" t-att-selected="state.pageSize == 10">10</option>
                            <option value="20" t-att-selected="state.pageSize == 20">20</option>
                            <option value="50" t-att-selected="state.pageSize == 50">50</option>
                        </select>
                    </div>
                </div>

                <!-- Modal chọn cột -->
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
                                            <label><input type="checkbox" t-on-change="toggleAllColumns"/> Chọn tất cả</label>
                                        </div>
                                        <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.account_number"/> Số tài khoản</label></div>
                                        <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.fund_name"/> Quỹ - Chương trình</label></div>
                                        <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.order_code"/> Mã lệnh</label></div>
                                        <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.transaction_type"/> Loại lệnh</label></div>
                                        <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.session_date"/> Ngày giao dịch</label></div>
                                        <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.units"/> Số lượng</label></div>
                                        <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.nav"/> NAV</label></div>
                                        <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.amount"/> Tổng tiền</label></div>
                                        <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.purchase_fee"/> Phí</label></div>
                                        <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.tax"/> Thuế</label></div>
                                        <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.total_after_fee"/> Số tiền sau thuế/phí</label></div>
                                        <div class="col-6"><label><input type="checkbox" t-model="state.visibleColumns.status"/> Trạng thái</label></div>
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
                <!-- Popup chi tiết giao dịch -->
                <t t-if="state.showDetailPopup">
                    <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
                        <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                            <div class="modal-content rounded-4 shadow">
                                <div class="modal-header bg-primary text-white rounded-top-4">
                                    <h2 class="modal-title h5 fw-bold mb-0">Thông tin giao dịch</h2>
                                    <button type="button" class="btn-close btn-close-white" t-on-click="() => this.state.showDetailPopup = false"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="mb-4 pb-3 border-bottom">
                                        <div class="fw-semibold mb-2 text-danger">Thông tin đầu tư</div>
                                        <div class="row g-2 small">
                                            <div class="col-4 text-secondary">Quỹ đầu tư:</div><div class="col-8 fw-medium"><t t-esc="state.selectedOrder.fund_full_name || state.selectedOrder.fund_name"/></div>
                                            <div class="col-4 text-secondary">Chương trình:</div><div class="col-8 fw-medium"><t t-esc="state.selectedOrder.fund_name"/></div>
                                            <div class="col-4 text-secondary">Loại lệnh:</div><div class="col-8 fw-medium"><t t-esc="state.selectedOrder.transaction_type"/></div>
                                            <div class="col-4 text-secondary">Ngày đặt lệnh:</div><div class="col-8 fw-medium"><t t-esc="state.selectedOrder.order_date || state.selectedOrder.session_date"/></div>
                                            <div class="col-4 text-secondary">Phiên giao dịch:</div><div class="col-8 fw-medium"><t t-esc="state.selectedOrder.session_date"/></div>
                                            <div class="col-4 text-secondary">Số lượng (CCQ):</div><div class="col-8 fw-bold text-primary"><t t-esc="state.selectedOrder.units || 0"/> CCQ</div>
                                            <div class="col-4 text-secondary">Số tiền:</div><div class="col-8 fw-bold text-danger"><t t-esc="state.selectedOrder.amount"/> <t t-esc="state.selectedOrder.currency || 'đ'"/></div>
                                        </div>
                                    </div>
                                    <t t-if="state.selectedOrder.has_contract">
                                        <div class="mb-2">
                                            <div class="fw-semibold mb-2 text-danger">Hợp đồng</div>
                                            <a t-att-href="state.selectedOrder.contract_url" target="_blank" class="btn btn-link btn-sm">Xem hợp đồng</a>
                                            <a t-att-href="state.selectedOrder.contract_download_url" class="btn btn-link btn-sm">Tải về</a>
                                        </div>
                                    </t>
                                </div>
                            </div>
                        </div>
                        <div class="modal-backdrop fade show" t-on-click="() => this.state.showDetailPopup = false"></div>
                    </div>
                </t>
            </main>
        </div>
    `;

    setup() {
        const safeOrders = Array.isArray(this.props.orders) ? this.props.orders.filter(Boolean) : [];
        this.state = useState({
            orders: safeOrders,
            filteredOrders: [],
            searchOrderCode: '',
            searchFund: '',
            searchType: '',
            fromDate: '',
            toDate: '',
            pageSize: 10,
            currentPage: 1,
            uniqueFunds: [...new Set(safeOrders.map(order => order.fund_name))],
            showColumnModal: false,
            showDetailPopup: false,
            selectedOrder: null,
            visibleColumns: {
                account_number: true,
                fund_name: true,
                order_code: true,
                transaction_type: true,
                session_date: true,
                units: true,
                nav: true,
                amount: true,
                purchase_fee: true,
                tax: true,
                total_after_fee: true,
                status: true,
                contract: true,
            }
        });
        this.filterOrders();
    }

    toDateString(dateStr) {
        if (!dateStr) return '';
        // Nếu đã đúng dạng YYYY-MM-DD thì trả về luôn
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        // Nếu có dạng YYYY-MM-DD HH:mm:ss
        if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.slice(0, 10);
        // Nếu dạng DD/MM/YYYY
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
            const [d, m, y] = dateStr.split('/');
            return `${y}-${m}-${d}`;
        }
        // Nếu dạng MM/DD/YYYY
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
            const [m, d, y] = dateStr.split('/');
            return `${y}-${m}-${d}`;
        }
        return dateStr;
    }

    filterOrders() {
        let filtered = this.state.orders;
        // Lọc theo mã lệnh
        if (this.state.searchOrderCode) {
            filtered = filtered.filter(order =>
                order.order_code && order.order_code.toLowerCase().includes(this.state.searchOrderCode.toLowerCase())
            );
        }
        // Lọc theo quỹ/sản phẩm
        if (this.state.searchFund) {
            filtered = filtered.filter(order => order.fund_name === this.state.searchFund);
        }
        // Lọc theo loại lệnh
        if (this.state.searchType) {
            filtered = filtered.filter(order => order.transaction_type === this.state.searchType);
        }
        // Lọc theo ngày giao dịch
        if (this.state.fromDate) {
            filtered = filtered.filter(order => this.toDateString(order.session_date) >= this.state.fromDate);
        }
        if (this.state.toDate) {
            filtered = filtered.filter(order => this.toDateString(order.session_date) <= this.state.toDate);
        }
        this.state.filteredOrders = Array.isArray(filtered) ? filtered.filter(Boolean).map(order => {
            // Đảm bảo amount là số, không phải string có dấu phẩy
            const amount = Number(String(order.amount).replace(/[^0-9.-]+/g, '')) || 0;
            const fee = this.calculateFee(amount);
            const tax = 0; // Nếu có công thức thuế, thay thế ở đây
            const total_after_fee = amount + fee + tax;
            return {
                ...order,
                fee,
                tax,
                total_after_fee
            };
        }) : [];
    }

    search() {
        this.filterOrders();
    }

    changePageSize(size) {
        this.state.pageSize = parseInt(size);
        // Có thể thêm logic phân trang ở đây
    }

    toggleAllColumns(ev) {
        const checked = ev.target.checked;
        Object.keys(this.state.visibleColumns).forEach(key => {
            this.state.visibleColumns[key] = checked;
        });
    }

    calculateFee(amount) {
        if (amount < 10000000) return amount * 0.003;
        else if (amount < 20000000) return amount * 0.002;
        else return amount * 0.001;
    }

    formatCurrency(val) {
        return Number(val).toLocaleString('vi-VN') + 'đ';
    }

    openDetail(order) {
        this.state.selectedOrder = order;
        this.state.showDetailPopup = true;
    }

    // Màu sắc cho loại lệnh
    typeClass(type) {
        const t = (type || '').toString().trim().toLowerCase();
        switch (t) {
            case 'buy':
            case 'mua':
                return 'bg-success text-white';
            case 'sell':
            case 'bán':
                return 'bg-danger text-white';
            case 'exchange':
            case 'hoán đổi':
                return 'bg-info text-white';
            default:
                return 'bg-secondary text-white';
        }
    }

    // Màu sắc cho trạng thái
    statusClass(status) {
        const s = (status || '').toString().trim().toLowerCase();
        switch (s) {
            case 'pending':
            case 'chờ khớp lệnh':
            case 'đang chờ':
                return 'bg-warning text-dark';
            case 'completed':
            case 'hoàn tất':
            case 'khớp thành công':
                return 'bg-success text-white';
            case 'cancelled':
            case 'đã hủy':
                return 'bg-danger text-white';
            case 'đang xử lý':
            case 'processing':
                return 'bg-info text-white';
            case 'đã từ chối':
            case 'rejected':
                return 'bg-secondary text-white';
            default:
                return 'bg-secondary text-white';
        }
    }
}

window.OrderWidget = OrderWidget; 