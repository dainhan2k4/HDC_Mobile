/** @odoo-module **/
import { Component, useState, xml } from "@odoo/owl";

export class OrderWidget extends Component {
    static template = xml`
        <div class="bg-gray-50 text-gray-900">
            <main class="max-w-7xl mx-auto p-6 space-y-8">
                <!-- Tabs -->
                <nav class="flex border-b border-gray-300 mb-8 flex-wrap">
                    <a href="/transaction_management/pending" class="text-sm font-normal text-gray-400 border-b-4 border-transparent pb-3 px-5 whitespace-nowrap hover:text-gray-600 hover:border-gray-300 transition">Lệnh chờ xử lý</a>
                    <a href="/transaction_management/order" class="text-sm font-semibold text-blue-700 border-b-4 border-blue-700 pb-3 px-5 whitespace-nowrap" aria-current="page">Lịch sử giao dịch</a>
                    <a href="/transaction_management/periodic" class="text-sm font-normal text-gray-400 border-b-4 border-transparent pb-3 px-5 whitespace-nowrap hover:text-gray-600 hover:border-gray-300 transition">Quản lý định kỳ</a>
                </nav>

                <!-- Section header + Search/Filter -->
                <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900">Lịch sử giao dịch</h2>
                    <div class="flex flex-col sm:flex-row sm:items-center gap-2 ml-auto">
                        <p class="text-sm sm:text-base text-gray-600 mr-2">Tổng số lệnh: <span class="font-semibold"><t t-esc="state.orders.length"/></span></p>
                        <form class="flex flex-wrap gap-2 items-center" t-on-submit.prevent="() => this.search()">
                            <input type="text" placeholder="Nhập mã lệnh" 
                                   class="border border-[#cbd5e1] rounded-md px-3 py-1 text-xs text-[#6b7280] placeholder-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#3f51b5]"
                                   t-model="state.searchOrderCode"/>
                            <select class="border border-[#cbd5e1] rounded-md px-3 py-1 text-xs text-[#6b7280] focus:outline-none focus:ring-1 focus:ring-[#3f51b5]"
                                    t-model="state.searchFund" t-on-change="() => this.filterOrders()">
                                <option value="">Chọn sản phẩm</option>
                                <t t-foreach="state.uniqueFunds" t-as="fund" t-key="fund">
                                    <option t-att-value="fund"><t t-esc="fund"/></option>
                                </t>
                            </select>
                            <select class="border border-[#cbd5e1] rounded-md px-3 py-1 text-xs text-[#6b7280] focus:outline-none focus:ring-1 focus:ring-[#3f51b5]"
                                    t-model="state.searchType" t-on-change="() => this.filterOrders()">
                                <option value="">Chọn loại lệnh</option>
                                <option value="Mua">Lệnh mua</option>
                                <option value="Bán">Lệnh bán</option>
                                <option value="Hoán đổi">Lệnh hoán đổi</option>
                            </select>
                            <button type="submit" class="flex items-center gap-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 px-4 py-1.5 rounded-md text-white text-xs font-semibold shadow hover:from-yellow-500 hover:to-yellow-700 transition-colors" aria-label="Search">
                                <i class="fas fa-search"></i>
                                <span>Tìm kiếm</span>
                            </button>
                            <button type="button" class="border border-[#cbd5e1] rounded-md p-2 text-[#6b7280] hover:text-[#3f51b5] transition-colors bg-white" aria-label="Settings" t-on-click="() => this.state.showColumnModal = true">
                                <i class="fas fa-cog"></i>
                            </button>
                        </form>
                    </div>
                </div>

                <!-- Table container -->
                <div class="border border-gray-300 rounded-lg shadow-sm bg-white overflow-visible overflow-x-auto scrollbar-thin">
                    <table class="min-w-full text-xs text-left border-collapse border border-[#cbd5e1]">
                        <thead class="bg-blue-500 text-white font-semibold">
                            <tr>
                                <th t-if="state.visibleColumns.account_number" class="border border-blue-600 px-2 py-2 whitespace-nowrap">Số tài khoản</th>
                                <th t-if="state.visibleColumns.fund_name" class="border border-blue-600 px-2 py-2 whitespace-nowrap">Quỹ - Chương trình</th>
                                <th t-if="state.visibleColumns.order_code" class="border border-blue-600 px-2 py-2 whitespace-nowrap">Mã lệnh</th>
                                <th t-if="state.visibleColumns.transaction_type" class="border border-blue-600 px-2 py-2 whitespace-nowrap">Loại lệnh</th>
                                <th t-if="state.visibleColumns.session_date" class="border border-blue-600 px-2 py-2 whitespace-nowrap">Ngày giao dịch</th>
                                <th t-if="state.visibleColumns.units" class="border border-blue-600 px-2 py-2 whitespace-nowrap">Số lượng</th>
                                <th t-if="state.visibleColumns.nav" class="border border-blue-600 px-2 py-2 whitespace-nowrap">NAV</th>
                                <th t-if="state.visibleColumns.amount" class="border border-blue-600 px-2 py-2 whitespace-nowrap">Tổng tiền</th>
                                <th t-if="state.visibleColumns.purchase_fee" class="border border-blue-600 px-2 py-2 whitespace-nowrap">Phí</th>
                                <th t-if="state.visibleColumns.tax" class="border border-blue-600 px-2 py-2 whitespace-nowrap">Thuế</th>
                                <th t-if="state.visibleColumns.total_after_fee" class="border border-blue-600 px-2 py-2 whitespace-nowrap">Số tiền sau thuế/phí</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <t t-if="state.filteredOrders and state.filteredOrders.length > 0">
                                <t t-foreach="state.filteredOrders" t-as="order" t-key="order.order_code">
                                    <tr class="even:bg-[#f8f9fc] odd:bg-white">
                                        <td t-if="state.visibleColumns.account_number" class="border border-[#cbd5e1] px-2 py-1 whitespace-nowrap">
                                            <t t-esc="order.account_number"/>
                                        </td>
                                        <td t-if="state.visibleColumns.fund_name" class="border border-[#cbd5e1] px-2 py-1 whitespace-nowrap">
                                            <t t-esc="order.fund_name"/>
                                            <t t-if="order.fund_ticker"> (<t t-esc="order.fund_ticker"/>)</t>
                                        </td>
                                        <td t-if="state.visibleColumns.order_code" class="border border-[#cbd5e1] px-2 py-1 whitespace-nowrap">
                                            <t t-esc="order.order_code"/>
                                        </td>
                                        <td t-if="state.visibleColumns.transaction_type" class="border border-[#cbd5e1] px-2 py-1 whitespace-nowrap">
                                            <t t-esc="order.transaction_type"/>
                                        </td>
                                        <td t-if="state.visibleColumns.session_date" class="border border-[#cbd5e1] px-2 py-1 whitespace-nowrap">
                                            <t t-esc="order.session_date"/>
                                        </td>
                                        <td t-if="state.visibleColumns.units" class="border border-[#cbd5e1] px-2 py-1 whitespace-nowrap text-right">
                                            <t t-esc="order.units"/>
                                        </td>
                                        <td t-if="state.visibleColumns.nav" class="border border-[#cbd5e1] px-2 py-1 whitespace-nowrap text-right">
                                            <t t-esc="order.nav"/>
                                        </td>
                                        <td t-if="state.visibleColumns.amount" class="border border-[#cbd5e1] px-2 py-1 whitespace-nowrap text-right">
                                            <t t-esc="order.amount"/><t t-esc="order.currency"/>
                                        </td>
                                        <td t-if="state.visibleColumns.purchase_fee" class="border border-[#cbd5e1] px-2 py-1 whitespace-nowrap text-center">
                                            <t t-esc="formatCurrency(order.fee)"/>
                                        </td>
                                        <td t-if="state.visibleColumns.tax" class="border border-[#cbd5e1] px-2 py-1 whitespace-nowrap text-center">
                                            <t t-esc="formatCurrency(order.tax)"/>
                                        </td>
                                        <td t-if="state.visibleColumns.total_after_fee" class="border border-[#cbd5e1] px-2 py-1 whitespace-nowrap text-right">
                                            <t t-esc="formatCurrency(order.total_after_fee)"/>
                                        </td>
                                    </tr>
                                </t>
                            </t>
                            <t t-if="!state.filteredOrders or state.filteredOrders.length === 0">
                                <tr class="bg-white">
                                    <td colspan="11" class="px-2 py-4 text-center text-gray-500">
                                        Không có dữ liệu lịch sử giao dịch
                                    </td>
                                </tr>
                            </t>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination and info -->
                <div class="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-gray-600 gap-4">
                    <div>
                        Hiện 1 - <t t-esc="state.filteredOrders.length"/> trong số <t t-esc="state.filteredOrders.length"/>
                    </div>
                    <div class="flex items-center gap-2">
                        <label for="perPage" class="whitespace-nowrap font-medium">Số lượng 1 trang:</label>
                        <select id="perPage" name="perPage" 
                                class="border border-gray-300 rounded px-3 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                t-on-change="(ev) => this.changePageSize(ev.target.value)">
                            <option value="10" t-att-selected="state.pageSize == 10">10</option>
                            <option value="20" t-att-selected="state.pageSize == 20">20</option>
                            <option value="50" t-att-selected="state.pageSize == 50">50</option>
                        </select>
                    </div>
                </div>
            </main>
        </div>
        <t t-if="state.showColumnModal">
            <div class="absolute left-1/2 top-16 z-50" style="transform: translateX(-50%);">
                <div class="bg-white rounded-lg shadow-lg p-6 min-w-[350px] border border-gray-200">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-semibold text-lg">Chọn cột hiển thị</h3>
                        <button class="text-gray-500 hover:text-red-500" t-on-click="() => this.state.showColumnModal = false">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="grid grid-cols-2 gap-2 mb-4">
                        <label><input type="checkbox" t-on-change="toggleAllColumns"/> Chọn tất cả</label>
                        <label><input type="checkbox" t-model="state.visibleColumns.account_number"/> Số tài khoản</label>
                        <label><input type="checkbox" t-model="state.visibleColumns.fund_name"/> Quỹ - Chương trình</label>
                        <label><input type="checkbox" t-model="state.visibleColumns.order_code"/> Mã lệnh</label>
                        <label><input type="checkbox" t-model="state.visibleColumns.transaction_type"/> Loại lệnh</label>
                        <label><input type="checkbox" t-model="state.visibleColumns.session_date"/> Ngày giao dịch</label>
                        <label><input type="checkbox" t-model="state.visibleColumns.units"/> Số lượng</label>
                        <label><input type="checkbox" t-model="state.visibleColumns.nav"/> NAV</label>
                        <label><input type="checkbox" t-model="state.visibleColumns.amount"/> Tổng tiền</label>
                        <label><input type="checkbox" t-model="state.visibleColumns.purchase_fee"/> Phí</label>
                        <label><input type="checkbox" t-model="state.visibleColumns.tax"/> Thuế</label>
                        <label><input type="checkbox" t-model="state.visibleColumns.total_after_fee"/> Số tiền sau thuế/phí</label>
                    </div>
                    <div class="flex justify-end gap-2">
                        <button class="btn btn-secondary" t-on-click="() => this.state.showColumnModal = false">Đóng</button>
                    </div>
                </div>
            </div>
        </t>
    `;

    setup() {
        const safeOrders = Array.isArray(this.props.orders) ? this.props.orders.filter(Boolean) : [];
        this.state = useState({
            orders: safeOrders,
            filteredOrders: [],
            searchOrderCode: '',
            searchFund: '',
            searchType: '',
            pageSize: 10,
            currentPage: 1,
            uniqueFunds: [...new Set(safeOrders.map(order => order.fund_name))],
            showColumnModal: false,
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
            }
        });
        this.filterOrders();
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
}

window.OrderWidget = OrderWidget; 