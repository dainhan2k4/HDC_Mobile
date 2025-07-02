/** @odoo-module **/
import { Component, useState, xml } from "@odoo/owl";

export class PeriodicWidget extends Component {
    static template = xml`
        <div class="bg-gray-50 text-gray-900">
            <main class="max-w-7xl mx-auto p-6 space-y-8">
                <!-- Tabs -->
                <nav class="flex border-b border-gray-300 mb-8 flex-wrap">
                    <a href="/transaction_management/pending" class="text-sm font-normal text-gray-400 border-b-4 border-transparent pb-3 px-5 whitespace-nowrap hover:text-gray-600 hover:border-gray-300 transition">Lệnh chờ xử lý</a>
                    <a href="/transaction_management/order" class="text-sm font-normal text-gray-400 border-b-4 border-transparent pb-3 px-5 whitespace-nowrap hover:text-gray-600 hover:border-gray-300 transition">Lịch sử giao dịch</a>
                    <a href="/transaction_management/periodic" class="text-sm font-semibold text-blue-700 border-b-4 border-blue-700 pb-3 px-5 whitespace-nowrap" aria-current="page">Quản lý định kỳ</a>
                </nav>

                <!-- Section header -->
                <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900">Quản lý định kỳ</h2>
                    <p class="text-sm sm:text-base text-gray-600">Tổng số lệnh: <span class="font-semibold"><t t-esc="state.orders.length"/></span></p>
                </div>

                <!-- Content -->
                <section class="mt-4 px-0 pb-8">
                    <div class="overflow-x-auto">
                        <table class="w-full text-[9px] sm:text-xs text-left text-gray-700 table-fixed border border-gray-300 rounded-lg shadow-sm bg-white">
                            <thead class="bg-blue-500 text-white font-semibold">
                                <tr>
                                    <th class="px-2 py-2 border-r border-blue-600 w-[15%] truncate">Tên CCQ</th>
                                    <th class="px-2 py-2 border-r border-blue-600 w-[15%] truncate">Số tiền đăng ký đầu tư</th>
                                    <th class="px-2 py-2 border-r border-blue-600 w-[10%] truncate">Số kỳ đầu tư tối thiểu</th>
                                    <th class="px-2 py-2 border-r border-blue-600 w-[10%] truncate">Số kỳ đã đầu tư</th>
                                    <th class="px-2 py-2 border-r border-blue-600 w-[15%] truncate">Số kỳ liên tục không tham gia</th>
                                    <th class="px-2 py-2 border-r border-blue-600 w-[15%] truncate">Trạng thái đầu tư</th>
                                    <th class="px-2 py-2 border-r border-blue-600 w-[10%] truncate">Kỳ đầu tư tiếp theo</th>
                                    <th class="px-2 py-2 w-[10%] text-right pr-4"></th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <t t-if="state.orders and state.orders.length > 0">
                                    <t t-foreach="state.orders" t-as="order" t-key="order.order_code">
                                        <tr class="hover:bg-gray-50 transition">
                                            <td class="px-2 py-1 border-r border-gray-300 truncate">
                                                <t t-esc="order.fund_name"/>
                                                <t t-if="order.fund_ticker"> (<t t-esc="order.fund_ticker"/>)</t>
                                            </td>
                                            <td class="px-2 py-1 border-r border-gray-300 truncate">
                                                <t t-esc="order.amount"/><t t-esc="order.currency"/>
                                            </td>
                                            <td class="px-2 py-1 border-r border-gray-300 truncate">12 tháng</td>
                                            <td class="px-2 py-1 border-r border-gray-300 text-center truncate">2</td>
                                            <td class="px-2 py-1 border-r border-gray-300 text-center truncate">0</td>
                                            <td class="px-2 py-1 border-r border-gray-300 flex items-center gap-2 truncate">
                                                <span class="w-3 h-3 rounded-full bg-green-600 inline-block"></span>
                                                <span>Đang tham gia</span>
                                            </td>
                                            <td class="px-2 py-1 border-r border-gray-300 truncate">
                                                <t t-esc="order.session_date"/>
                                            </td>
                                            <td class="px-2 py-1 text-blue-600 text-right pr-4 cursor-pointer select-none truncate">
                                                Chi tiết
                                            </td>
                                        </tr>
                                    </t>
                                </t>
                                <t t-if="!state.orders or state.orders.length === 0">
                                    <tr class="bg-white">
                                        <td colspan="8" class="px-2 py-4 text-center text-gray-500">
                                            Không có dữ liệu quản lý định kỳ
                                        </td>
                                    </tr>
                                </t>
                            </tbody>
                        </table>
                    </div>
                </section>

                <!-- Pagination and info -->
                <div class="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-gray-600 gap-4">
                    <div>
                        Hiện 1 - <t t-esc="state.orders.length"/> trong số <t t-esc="state.orders.length"/>
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