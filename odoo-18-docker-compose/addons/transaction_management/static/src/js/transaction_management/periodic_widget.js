/** @odoo-module **/
import { Component, useState, xml } from "@odoo/owl";

export class PeriodicWidget extends Component {
    static template = xml`
        <div class="bg-light text-dark">
            <main class="container py-4">
                <!-- Tabs -->
                <ul class="nav nav-tabs mb-4">
                    <li class="nav-item">
                        <a href="/transaction_management/pending" class="nav-link">Lệnh chờ xử lý</a>
                    </li>
                    <li class="nav-item">
                        <a href="/transaction_management/order" class="nav-link">Lịch sử giao dịch</a>
                    </li>
                    <li class="nav-item">
                        <a href="/transaction_management/periodic" class="nav-link active fw-semibold">Quản lý định kỳ</a>
                    </li>
                </ul>

                <!-- Section header -->
                <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
                    <h2 class="h4 fw-bold mb-0">Quản lý định kỳ</h2>
                    <div class="d-flex flex-column flex-md-row align-items-md-center gap-3">
                        <p class="mb-0 text-secondary">Tổng số lệnh: <span class="fw-semibold"><t t-esc="state.orders.length"/></span></p>
                        <p class="mb-0 text-info">Lệnh mua: <span class="fw-semibold"><t t-esc="state.orders.filter(o => o.transaction_type === 'Mua').length"/></span></p>
                        <p class="mb-0 text-success">Lệnh bán: <span class="fw-semibold"><t t-esc="state.orders.filter(o => o.transaction_type === 'Bán').length"/></span></p>
                    </div>
                </div>

                <!-- Table -->
                <div class="card shadow-sm rounded-4 border-0 mb-4 overflow-auto">
                    <div class="table-responsive">
                        <table class="table table-bordered table-hover align-middle mb-0 text-center">
                            <thead class="custom-red-bg" style="background-color:#f97316;color:white">
                                <tr>
                                    <th>Tên CCQ</th>
                                    <th>Số tiền đăng ký đầu tư</th>
                                    <th>Số kỳ hạn</th>
                                    <th>Lãi suất</th>
                                    <th>Ngày đáo hạn</th>
                                    <th>Số ngày còn lại</th>
                                    <th>Trạng thái đầu tư</th>
                                    <th>Kỳ đầu tư tiếp theo</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <t t-if="state.orders and state.orders.length > 0">
                                    <t t-foreach="state.orders" t-as="order" t-key="order.order_code">
                                        <tr>
                                            <td><t t-esc="order.fund_name"/><t t-if="order.fund_ticker"> (<t t-esc="order.fund_ticker"/>)</t></td>
                                            <td><t t-esc="order.amount"/><t t-esc="order.currency"/></td>
                                            <td>
                                                <span class="badge bg-info text-white px-2 py-1">
                                                    <t t-esc="order.tenor_months || 'N/A'"/> tháng
                                                </span>
                                            </td>
                                            <td>
                                                <span class="badge bg-success text-white px-2 py-1">
                                                    <t t-esc="order.interest_rate || 'N/A'"/>
                                                </span>
                                            </td>
                                            <td>
                                                <span class="text-primary fw-semibold">
                                                    <t t-esc="order.maturity_date || 'N/A'"/>
                                                </span>
                                            </td>
                                            <td>
                                                <span class="badge bg-warning text-dark px-2 py-1">
                                                    <t t-esc="order.days_to_maturity || 'N/A'"/> ngày
                                                </span>
                                            </td>
                                            <td>
                                                <span class="badge rounded-pill px-2 py-1 fw-semibold mb-1 text-dark">
                                                    <t t-esc="order.invest_status || 'Đang tham gia'"/>
                                                </span>
                                                <span class="small text-muted"><t t-esc="order.invest_status_detail"/></span>
                                            </td>
                                            <td><t t-esc="order.session_date"/></td>
                                            <td class="text-primary cursor-pointer">Chi tiết</td>
                                        </tr>
                                    </t>
                                </t>
                                <t t-if="!state.orders or state.orders.length === 0">
                                    <tr>
                                        <td colspan="9" class="text-center text-muted py-4">
                                            Không có dữ liệu quản lý định kỳ
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
                        Hiện 1 - <t t-esc="state.orders.length"/> trong số <t t-esc="state.orders.length"/>
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
    `;

    setup() {
        this.state = useState({
            orders: this.props.orders || [],
            pageSize: 10,
            currentPage: 1
        });
    }

    changePageSize(size) {
        this.state.pageSize = parseInt(size);
        // Có thể thêm logic phân trang ở đây
    }
}

window.PeriodicWidget = PeriodicWidget; 