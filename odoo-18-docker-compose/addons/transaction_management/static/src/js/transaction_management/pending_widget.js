/** @odoo-module **/
import { Component, useState, xml } from "@odoo/owl";

export class PendingWidget extends Component {
    static template = xml`
        <div class="bg-light text-dark">
            <main class="container py-4">
                <!-- Tabs -->
                <ul class="nav nav-tabs mb-4">
                    <li class="nav-item">
                        <a href="/transaction_management/pending" class="nav-link active fw-semibold">Lệnh chờ xử lý</a>
                    </li>
                    <li class="nav-item">
                        <a href="/transaction_management/order" class="nav-link">Lịch sử giao dịch</a>
                    </li>
                    <li class="nav-item">
                        <a href="/transaction_management/periodic" class="nav-link">Quản lý định kỳ</a>
                    </li>
                </ul>

                <!-- Section header -->
                <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
                    <h2 class="h4 fw-bold mb-0">
                        Lệnh chờ <t t-esc="state.currentFilter === 'buy' ? 'mua' : state.currentFilter === 'sell' ? 'bán' : 'chuyển đổi'"/>
                    </h2>
                    <p class="mb-0 text-secondary">
                        Tổng số lệnh: <span class="fw-semibold"><t t-esc="state.filteredOrders.length"/></span>
                    </p>
                </div>

                <!-- Buttons group -->
                <div class="mb-4 d-flex flex-wrap gap-2">
                    <button t-att-data-filter="'buy'"
                            t-attf-class="btn btn-sm fw-semibold rounded-pill px-4 py-2 shadow-sm filter-btn #{state.currentFilter === 'buy' ? 'text-white' : ''}"
                            t-att-style="state.currentFilter === 'buy' ? 'background-color:#f97316;border-color:#f97316' : 'color:#f97316;border-color:#f97316'"
                            t-on-click="() => this.filterOrders('buy')" type="button">
                        Lệnh chờ mua
                    </button>
                    <button t-att-data-filter="'sell'"
                            t-attf-class="btn btn-sm fw-semibold rounded-pill px-4 py-2 shadow-sm filter-btn #{state.currentFilter === 'sell' ? 'text-white' : ''}"
                            t-att-style="state.currentFilter === 'sell' ? 'background-color:#f97316;border-color:#f97316' : 'color:#f97316;border-color:#f97316'"
                            t-on-click="() => this.filterOrders('sell')" type="button">
                        Lệnh chờ bán
                    </button>
                    <button t-att-data-filter="'exchange'"
                            t-attf-class="btn btn-sm fw-semibold rounded-pill px-4 py-2 shadow-sm filter-btn #{state.currentFilter === 'exchange' ? 'text-white' : ''}"
                            t-att-style="state.currentFilter === 'exchange' ? 'background-color:#f97316;border-color:#f97316' : 'color:#f97316;border-color:#f97316'"
                            t-on-click="() => this.filterOrders('exchange')" type="button">
                        Lệnh chờ chuyển đổi
                    </button>
                    <button id="create-order-btn"
                            class="ms-auto btn btn-sm fw-semibold rounded-pill px-4 py-2 d-flex align-items-center gap-2 shadow-sm"
                            style="background-color:#f97316;border-color:#f97316;color:white"
                            type="button"
                            t-on-click="() => this.createOrder()">
                        <i class="fas fa-plus"></i>
                        <span id="create-btn-text">
                            <t t-esc="state.currentFilter === 'buy' ? 'Tạo lệnh mua' : state.currentFilter === 'sell' ? 'Tạo lệnh bán' : 'Tạo lệnh chuyển đổi'"/>
                        </span>
                    </button>
                </div>

                <!-- Table container -->
                <div class="card shadow-sm rounded-4 border-0 mb-4">
                    <div class="table-responsive">
                        <table class="table table-bordered table-hover align-middle mb-0 text-center">
                            <thead class="custom-red-bg" style="background-color:#f97316;color:white">
                                <tr>
                                    <th>Số tài khoản</th>
                                    <th>Quỹ - Chương trình</th>
                                    <th>Ngày đặt lệnh</th>
                                    <th>Mã lệnh</th>
                                    <th>NAV kỳ trước</th>
                                    <th>Số lượng (CCQ)</th>
                                    <th id="amount-column">
                                        <t t-if="state.currentFilter === 'buy'">Số tiền mua</t>
                                        <t t-elif="state.currentFilter === 'sell' or state.currentFilter === 'exchange'">Giá trị ước tính</t>
                                        <t t-else="">Số tiền</t>
                                    </th>
                                    <th>Phiên giao dịch</th>
                                    <th>Trạng thái</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <t t-if="state.filteredOrders and state.filteredOrders.length > 0">
                                    <t t-foreach="state.filteredOrders" t-as="order" t-key="order.order_code">
                                        <tr>
                                            <td><t t-esc="order.account_number"/></td>
                                            <td class="fw-semibold" style="color:#f97316"><t t-esc="order.fund_name"/><t t-if="order.fund_ticker"> (<t t-esc="order.fund_ticker"/>)</t></td>
                                            <td><t t-esc="order.order_date"/></td>
                                            <td class="font-monospace"><t t-esc="order.order_code"/></td>
                                            <td><t t-esc="order.nav"/></td>
                                            <td class="fw-semibold">
                                                <t t-esc="order.units || 0"/> CCQ
                                            </td>
                                            <td>
                                                <t t-esc="order.amount"/><t t-esc="order.currency"/>
                                            </td>
                                            <td><t t-esc="order.session_date"/></td>
                                            <td>
                                                <div class="d-flex flex-column align-items-center">
                                                    <span t-attf-class="badge rounded-pill px-2 py-1 fw-semibold mb-1 #{ this.badgeClass(order.status) }">
                                                        <t t-esc="order.status"/>
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div class="dropdown">
                                                    <button class="btn btn-link text-secondary p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                        <i class="fas fa-ellipsis-h" style="color:#f97316"></i>
                                                    </button>
                                                     <ul class="dropdown-menu">
                                                         <li><a class="dropdown-item" href="#" t-on-click="() => { this.openDetailPopup(order); }">Thông tin giao dịch</a></li>
                                                     </ul>
                                                </div>
                                            </td>
                                        </tr>
                                    </t>
                                </t>
                                <t t-if="!state.filteredOrders or state.filteredOrders.length === 0">
                                    <tr>
                                        <td colspan="9" class="text-center text-muted py-4">
                                            Không có dữ liệu lệnh chờ xử lý
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
                        Hiện 1 - <t t-esc="state.filteredOrders.length"/> trong số <span id="pagination-total"><t t-esc="state.filteredOrders.length"/></span>
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
            </main>
        </div>
        <t t-if="state.showDetailPopup">
            <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);z-index:2000;">
                <div class="modal-dialog modal-dialog-end modal-lg modal-dialog-scrollable" style="z-index:2001;">
                    <div class="modal-content rounded-4 shadow">
                        <div class="modal-header text-white rounded-top-4" style="background-color:#f97316">
                            <h2 class="modal-title h5 fw-bold mb-0">Thông tin giao dịch</h2>
                            <button type="button" class="btn-close btn-close-white" t-on-click="() => this.state.showDetailPopup = false"></button>
                        </div>
                        <div class="modal-body">
                            <t t-if="state.selectedOrder.transaction_type === 'sell'">
                                <!-- Lệnh chờ bán -->
                                <div class="mb-4 pb-3 border-bottom">
                                    <div class="fw-semibold mb-2" style="color:#f97316">Thông tin giao dịch</div>
                                    <div class="row g-2 small">
                                        <div class="col-4 text-secondary">Quỹ đầu tư:</div><div class="col-8 fw-medium"><t t-esc="state.selectedOrder.fund_full_name || state.selectedOrder.fund_name"/></div>
                                        <div class="col-4 text-secondary">Chương trình:</div><div class="col-8 fw-medium"><t t-esc="state.selectedOrder.fund_name"/></div>
                                        <div class="col-4 text-secondary">Loại lệnh:</div><div class="col-8 fw-medium">Lệnh bán</div>
                                        <div class="col-4 text-secondary">Ngày đặt lệnh:</div><div class="col-8 fw-medium"><t t-esc="state.selectedOrder.order_date || state.selectedOrder.session_date"/></div>
                                        <div class="col-4 text-secondary">Phiên giao dịch:</div><div class="col-8 fw-medium"><t t-esc="state.selectedOrder.session_date"/></div>
                                        <div class="col-4 text-secondary">Số CCQ bán:</div><div class="col-8 fw-bold text-danger"><t t-esc="state.selectedOrder.units"/></div>
                                    </div>
                                </div>
                                <div class="mb-2">
                                    <div class="fw-semibold mb-2" style="color:#f97316">Chi tiết lệnh bán</div>
                                    <table class="table table-bordered table-sm mb-0">
                                        <thead class="table-light">
                                            <tr>
                                                <th>Ngày mua</th>
                                                <th>TG nắm giữ</th>
                                                <th>SL bán</th>
                                                <th>Phí</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <t t-if="state.selectedOrder.buy_date">
                                                <tr>
                                                    <td class="text-center"><t t-esc="state.selectedOrder.buy_date"/></td>
                                                    <td class="text-center"><t t-esc="state.selectedOrder.holding_days"/> ngày</td>
                                                    <td class="text-center"><t t-esc="state.selectedOrder.units"/></td>
                                                    <td class="text-center"><t t-esc="this.formatCurrency(state.selectedOrder.sell_fee)"/></td>
                                                </tr>
                                            </t>
                                            <t t-if="!state.selectedOrder.buy_date">
                                                <tr><td colspan="4" class="text-center text-muted">Không có dữ liệu</td></tr>
                                            </t>
                                        </tbody>
                                    </table>
                                </div>
                            </t>
                            <t t-else="">
                                <!-- Lệnh mua, chuyển đổi ... giữ nguyên như cũ -->
                                <!-- Thông tin đầu tư -->
                                <div class="mb-4 pb-3 border-bottom">
                                    <div class="fw-semibold mb-2 text-danger">Thông tin đầu tư</div>
                                    <div class="row g-2 small">
                                        <div class="col-4 text-secondary">Quỹ đầu tư:</div><div class="col-8 fw-medium"><t t-esc="state.selectedOrder.fund_full_name || state.selectedOrder.fund_name"/></div>
                                        <div class="col-4 text-secondary">Chương trình:</div><div class="col-8 fw-medium"><t t-esc="state.selectedOrder.fund_name"/></div>
                                        <div class="col-4 text-secondary">Loại lệnh:</div>
                                        <div class="col-8 fw-medium">
                                            <t t-if="state.selectedOrder.transaction_type === 'buy'">Lệnh mua</t>
                                            <t t-elif="state.selectedOrder.transaction_type === 'exchange'">Lệnh hoán đổi</t>
                                            <t t-else=""><t t-esc="state.selectedOrder.transaction_type"/></t>
                                        </div>
                                        <div class="col-4 text-secondary">Ngày đặt lệnh:</div><div class="col-8 fw-medium"><t t-esc="state.selectedOrder.order_date || state.selectedOrder.session_date"/></div>
                                        <div class="col-4 text-secondary">Phiên giao dịch:</div><div class="col-8 fw-medium"><t t-esc="state.selectedOrder.session_date"/></div>
                                        <div class="col-4 text-secondary">Số lượng (CCQ):</div><div class="col-8 fw-bold text-primary"><t t-esc="state.selectedOrder.units || 0"/> CCQ</div>
                                        <div class="col-4 text-secondary">Số tiền mua:</div><div class="col-8 fw-bold text-danger"><t t-esc="state.selectedOrder.amount"/> <t t-esc="state.selectedOrder.currency || 'đ'"/></div>
                                    </div>
                                </div>
                                <!-- Thông tin chuyển khoản -->
                                <div class="mb-4 pb-3 border-bottom">
                                    <div class="fw-semibold mb-2 text-danger">Thông tin chuyển khoản</div>
                                    <div class="text-secondary small">Bạn đang chọn phương thức chuyển khoản qua ngân hàng.</div>
                                </div>
                                <!-- Tài khoản thụ hưởng -->
                                <div class="mb-2">
                                    <div class="fw-semibold mb-2 text-danger">Tài khoản thụ hưởng</div>
                                    <div class="row g-2 small">
                                        <div class="col-4 text-secondary">Tên thụ hưởng:</div>
                                        <div class="col-8 d-flex align-items-center gap-2 fw-medium">
                                            <t t-esc="state.selectedOrder.fund_name"/>
                                            <button class="btn btn-outline-danger btn-sm py-0 px-2" t-on-click="() => this.copyToClipboard(state.selectedOrder.fund_name)"><i class="fas fa-copy"></i> Copy</button>
                                        </div>
                                        <div class="col-4 text-secondary">Số tài khoản:</div>
                                        <div class="col-8 d-flex align-items-center gap-2 fw-medium">
                                            666666666
                                            <button class="btn btn-outline-danger btn-sm py-0 px-2" t-on-click="() => this.copyToClipboard('666666666')"><i class="fas fa-copy"></i> Copy</button>
                                        </div>
                                        <div class="col-4 text-secondary">Tên ngân hàng:</div>
                                        <div class="col-8 d-flex align-items-center gap-2 fw-medium">
                                            NH Standard Chartered VN
                                            <button class="btn btn-outline-danger btn-sm py-0 px-2" t-on-click="() => this.copyToClipboard('NH Standard Chartered VN')"><i class="fas fa-copy"></i> Copy</button>
                                        </div>
                                        <div class="col-4 text-secondary">Nội dung:</div>
                                        <div class="col-8 d-flex align-items-center gap-2 fw-medium">
                                            <t t-esc="state.selectedOrder.order_code"/> - <t t-esc="state.selectedOrder.fund_name"/>
                                            <button class="btn btn-outline-danger btn-sm py-0 px-2" t-on-click="() => this.copyToClipboard(state.selectedOrder.order_code + ' - ' + state.selectedOrder.fund_name)"><i class="fas fa-copy"></i> Copy</button>
                                        </div>
                                    </div>
                                </div>
                                <t t-if="state.selectedOrder.has_contract">
                                    <div class="mb-2">
                                        <div class="fw-semibold mb-2 text-danger">Hợp đồng</div>
                                        <a t-att-href="state.selectedOrder.contract_url" target="_blank" class="btn btn-link btn-sm">Xem hợp đồng</a>
                                        <a t-att-href="state.selectedOrder.contract_download_url" class="btn btn-link btn-sm">Tải về</a>
                                    </div>
                                </t>
                            </t>
                        </div>
                    </div>
                </div>
                <div class="modal-backdrop fade show" style="z-index:1999;" t-on-click="() => this.state.showDetailPopup = false"></div>
            </div>
        </t>
    `;

    setup() {
        this.state = useState({
            orders: this.props.orders || [],
            filteredOrders: [],
            currentFilter: 'buy',
            pageSize: 10,
            currentPage: 1,
            showDetailPopup: false,
            selectedOrder: null,
        });
        
        this.filterOrders('buy'); // Mặc định hiển thị lệnh mua
    }

    badgeStyle(status) {
        // Các trạng thái dùng cam #f97316
        const orangeStatuses = ['pending', 'cancelled', 'Chờ khớp lệnh', 'Đang chờ'];
        if (orangeStatuses.includes(status)) {
            return 'background-color:#f97316;color:#fff';
        }
        // Mặc định giữ nguyên màu chữ tối để tương phản với các bg-* mặc định
        return '';
    }

    badgeClass(status) {
        // Chuẩn hóa status về chữ thường để map dễ hơn
        const normalized = (status || '').toString().trim().toLowerCase();
        // Map trạng thái -> màu Bootstrap hợp lý
        switch (normalized) {
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

    filterOrders(filterType) {
        this.state.currentFilter = filterType;
        // Lọc dữ liệu theo loại giao dịch
        let filtered = this.state.orders;
        if (filterType === 'buy') {
            filtered = this.state.orders.filter(order => order.transaction_type === 'buy');
        } else if (filterType === 'sell') {
            filtered = this.state.orders.filter(order => order.transaction_type === 'sell');
        } else if (filterType === 'exchange') {
            filtered = this.state.orders.filter(order => order.transaction_type === 'exchange');
        }
        this.state.filteredOrders = filtered;
    }

    changePageSize(size) {
        this.state.pageSize = parseInt(size);
        // Có thể thêm logic phân trang ở đây
    }

    createOrder() {
        const filterType = this.state.currentFilter;
        let url = '/fund_buy'; // Mặc định
        
        if (filterType === 'sell') {
            url = '/fund_sell';
        } else if (filterType === 'exchange') {
            url = '/fund_swap';
        }
        
        window.location.href = url;
    }

    openDetailPopup(order) {
        this.state.selectedOrder = order;
        this.state.showDetailPopup = true;
    }

    copyToClipboard(text) {
        if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text);
        } else {
            // Fallback cho trình duyệt không hỗ trợ navigator.clipboard
            const input = document.createElement('input');
            input.value = text;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
        }
    }

    formatCurrency(val) {
        return Number(val).toLocaleString('vi-VN') + 'đ';
    }
}

window.PendingWidget = PendingWidget;
