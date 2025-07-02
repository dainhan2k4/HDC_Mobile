/** @odoo-module **/
import { Component, useState, xml } from "@odoo/owl";

export class PendingWidget extends Component {
    static template = xml`
        <div class="bg-gray-50 text-gray-900">
            <main class="max-w-7xl mx-auto p-6 space-y-8">
                <!-- Tabs -->
                <nav class="flex border-b border-gray-300 mb-8 flex-wrap">
                    <a href="/transaction_management/pending" class="text-sm font-semibold text-blue-700 border-b-4 border-blue-700 pb-3 px-5 whitespace-nowrap" aria-current="page">Lệnh chờ xử lý</a>
                    <a href="/transaction_management/order" class="text-sm font-normal text-gray-400 border-b-4 border-transparent pb-3 px-5 whitespace-nowrap hover:text-gray-600 hover:border-gray-300 transition">Lịch sử giao dịch</a>
                    <a href="/transaction_management/periodic" class="text-sm font-normal text-gray-400 border-b-4 border-transparent pb-3 px-5 whitespace-nowrap hover:text-gray-600 hover:border-gray-300 transition">Quản lý định kỳ</a>
                </nav>

                <!-- Section header -->
                <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900" id="section-title">
                        Lệnh chờ <t t-esc="state.currentFilter === 'buy' ? 'mua' : state.currentFilter === 'sell' ? 'bán' : 'chuyển đổi'"/>
                    </h2>
                    <p class="text-sm sm:text-base text-gray-600">
                        Tổng số lệnh: <span class="font-semibold" id="total-orders"><t t-esc="state.filteredOrders.length"/></span>
                    </p>
                </div>

                <!-- Buttons group -->
                <div class="mb-8 flex flex-wrap gap-3">
                    <button t-att-data-filter="'buy'" 
                            t-attf-class="text-sm font-semibold rounded-lg px-5 py-2 shadow-md transition filter-btn #{state.currentFilter === 'buy' ? 'bg-blue-700 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}"
                            t-on-click="() => this.filterOrders('buy')" type="button">
                        Lệnh chờ mua
                    </button>
                    <button t-att-data-filter="'sell'" 
                            t-attf-class="text-sm font-semibold rounded-lg px-5 py-2 shadow-md transition filter-btn #{state.currentFilter === 'sell' ? 'bg-blue-700 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}"
                            t-on-click="() => this.filterOrders('sell')" type="button">
                        Lệnh chờ bán
                    </button>
                    <button t-att-data-filter="'exchange'" 
                            t-attf-class="text-sm font-semibold rounded-lg px-5 py-2 shadow-md transition filter-btn #{state.currentFilter === 'exchange' ? 'bg-blue-700 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}"
                            t-on-click="() => this.filterOrders('exchange')" type="button">
                        Lệnh chờ chuyển đổi
                    </button>
                    <button id="create-order-btn" 
                            class="ml-auto bg-yellow-400 hover:bg-yellow-300 text-sm font-semibold rounded-lg px-5 py-2 text-gray-900 flex items-center gap-2 shadow-md transition" 
                            type="button" 
                            t-on-click="() => this.createOrder()">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                        </svg>
                        <span id="create-btn-text">
                            <t t-esc="state.currentFilter === 'buy' ? 'Tạo lệnh mua' : state.currentFilter === 'sell' ? 'Tạo lệnh bán' : 'Tạo lệnh chuyển đổi'"/>
                        </span>
                    </button>
                </div>

                <!-- Table container -->
                <div class="border border-gray-300 rounded-lg shadow-sm bg-white overflow-visible">
                    <table class="w-full text-[9px] sm:text-xs text-left text-gray-700 table-fixed">
                        <thead class="bg-blue-500 text-white font-semibold">
                            <tr>
                                <th scope="col" class="px-2 py-2 border-r border-blue-600 w-[10%] truncate">Số tài khoản</th>
                                <th scope="col" class="px-2 py-2 border-r border-blue-600 w-[15%] truncate">Quỹ - Chương trình</th>
                                <th scope="col" class="px-2 py-2 border-r border-blue-600 w-[15%] truncate">Ngày đặt lệnh</th>
                                <th scope="col" class="px-2 py-2 border-r border-blue-600 w-[15%] truncate">Mã lệnh</th>
                                <th scope="col" class="px-2 py-2 border-r border-blue-600 w-[10%] truncate">NAV kỳ trước</th>
                                <th scope="col" class="px-2 py-2 border-r border-blue-600 w-[10%] truncate" id="amount-column">
                                    <t t-if="state.currentFilter === 'buy'">Số tiền mua</t>
                                    <t t-elif="state.currentFilter === 'sell' or state.currentFilter === 'exchange'">Giá trị ước tính</t>
                                    <t t-else="">Số tiền</t>
                                </th>
                                <th scope="col" class="px-2 py-2 border-r border-blue-600 w-[10%] truncate">Phiên giao dịch</th>
                                <th scope="col" class="px-2 py-2 border-r border-blue-600 w-[10%] truncate">Trạng thái</th>
                                <th scope="col" class="px-2 py-2 w-[5%]"></th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200" id="table-body">
                            <t t-if="state.filteredOrders and state.filteredOrders.length > 0">
                                <t t-foreach="state.filteredOrders" t-as="order" t-key="order.order_code">
                                    <tr class="hover:bg-gray-50 transition order-row">
                                        <td class="px-2 py-1 border-r border-gray-300 font-mono truncate">
                                            <t t-esc="order.account_number"/>
                                        </td>
                                        <td class="px-2 py-1 border-r border-gray-300 text-[10px] font-semibold text-blue-900 hover:underline cursor-pointer truncate">
                                            <t t-esc="order.fund_name"/>
                                            <t t-if="order.fund_ticker"> (<t t-esc="order.fund_ticker"/>)</t>
                                        </td>
                                        <td class="px-2 py-1 border-r border-gray-300 truncate">
                                            <t t-esc="order.order_date"/>
                                        </td>
                                        <td class="px-2 py-1 border-r border-gray-300 font-mono truncate">
                                            <t t-esc="order.order_code"/>
                                        </td>
                                        <td class="px-2 py-1 border-r border-gray-300 truncate">
                                            <t t-esc="order.nav"/>
                                        </td>
                                        <td class="px-2 py-1 border-r border-gray-300 truncate">
                                            <t t-if="order.transaction_type === 'Bán' or order.transaction_type === 'Hoán đổi'">
                                                <t t-esc="order.amount"/><t t-esc="order.currency"/>
                                            </t>
                                            <t t-elif="order.transaction_type === 'Mua'">
                                                <t t-esc="order.amount"/><t t-esc="order.currency"/>
                                            </t>
                                            <t t-else="">
                                                <t t-esc="order.amount"/><t t-esc="order.currency"/>
                                            </t>
                                            <t t-if="state.currentFilter === 'sell' or state.currentFilter === 'exchange'">
                                                <br/><span class="text-[8px] text-gray-500">(<t t-esc="order.units"/> CCQ)</span>
                                            </t>
                                        </td>
                                        <td class="px-2 py-1 border-r border-gray-300 truncate">
                                            <t t-esc="order.session_date"/>
                                        </td>
                                        <td class="px-2 py-1 border-r border-gray-300">
                                            <div class="flex items-center gap-1 text-[10px] font-semibold text-yellow-600 truncate">
                                                <span class="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block"></span>
                                                <t t-esc="order.status"/>
                                            </div>
                                            <div class="text-[8px] text-gray-400 ml-6 -mt-1 truncate">
                                                <t t-esc="order.status_detail"/>
                                            </div>
                                        </td>
                                        <td class="px-2 py-1 text-center text-gray-400 cursor-pointer">
                                            <div class="relative">
                                                <button t-on-click="() => this.state.showMenu = order.order_code" class="p-1"><i class="fas fa-ellipsis-h"></i></button>
                                                <div t-if="this.state.showMenu === order.order_code" class="absolute right-0 bg-white border rounded shadow z-10">
                                                    <button t-on-click="() => { this.openDetailPopup(order); this.state.showMenu = null; }" class="block w-full text-center px-4 py-2 whitespace-nowrap font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition rounded-lg text-nowrap">Thông tin giao dịch</button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </t>
                            </t>
                            <t t-if="!state.filteredOrders or state.filteredOrders.length === 0">
                                <tr class="bg-white">
                                    <td colspan="9" class="px-2 py-4 text-center text-gray-500">
                                        Không có dữ liệu lệnh chờ xử lý
                                    </td>
                                </tr>
                            </t>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination and info -->
                <div class="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-gray-600 gap-4">
                    <div>
                        Hiện 1 - <t t-esc="state.filteredOrders.length"/> trong số <span id="pagination-total"><t t-esc="state.filteredOrders.length"/></span>
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
        <t t-if="state.showDetailPopup">
            <div class="fixed inset-0 z-50 flex" style="justify-content: flex-end;">
                <div class="bg-white w-full max-w-xl h-full shadow-2xl border-l border-blue-200 p-0 flex flex-col animate-slide-in-right fixed right-0 top-0 rounded-l-2xl">
                    <div class="flex items-center justify-between px-6 py-4 bg-blue-600 rounded-tl-2xl">
                        <h2 class="text-lg font-bold text-white tracking-wide">Thông tin giao dịch</h2>
                        <button t-on-click="() => this.state.showDetailPopup = false" class="text-white hover:text-yellow-300 text-2xl transition"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="flex-1 overflow-y-auto px-6 py-4">
                        <t t-if="state.selectedOrder.transaction_type === 'Bán'">
                            <!-- Lệnh chờ bán -->
                            <div class="mb-6 pb-4 border-b border-gray-200">
                                <div class="font-semibold text-base mb-3 text-blue-700">Thông tin giao dịch</div>
                                <div class="grid grid-cols-2 gap-y-2 gap-x-4 text-[15px]">
                                    <div class="text-gray-500">Quỹ đầu tư:</div><div class="font-medium text-gray-900"><t t-esc="state.selectedOrder.fund_full_name || state.selectedOrder.fund_name"/></div>
                                    <div class="text-gray-500">Chương trình:</div><div class="font-medium text-gray-900"><t t-esc="state.selectedOrder.fund_name"/></div>
                                    <div class="text-gray-500">Loại lệnh:</div><div class="font-medium text-gray-900">Lệnh bán</div>
                                    <div class="text-gray-500">Ngày đặt lệnh:</div><div class="font-medium text-gray-900"><t t-esc="state.selectedOrder.order_date || state.selectedOrder.session_date"/></div>
                                    <div class="text-gray-500">Phiên giao dịch:</div><div class="font-medium text-gray-900"><t t-esc="state.selectedOrder.session_date"/></div>
                                    <div class="text-gray-500">Số CCQ bán:</div><div class="font-medium text-blue-700"><t t-esc="state.selectedOrder.units"/></div>
                                </div>
                            </div>
                            <div class="mb-2">
                                <div class="font-semibold text-base mb-3 text-blue-700">Chi tiết lệnh bán</div>
                                <table class="w-full text-[15px] border border-gray-200 rounded-lg overflow-hidden">
                                    <thead class="bg-gray-100">
                                        <tr>
                                            <th class="px-3 py-2 font-semibold text-gray-700">Ngày mua</th>
                                            <th class="px-3 py-2 font-semibold text-gray-700">TG nắm giữ</th>
                                            <th class="px-3 py-2 font-semibold text-gray-700">SL bán</th>
                                            <th class="px-3 py-2 font-semibold text-gray-700">Phí</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <t t-if="state.selectedOrder.buy_date">
                                            <tr>
                                                <td class="px-3 py-2 text-center"><t t-esc="state.selectedOrder.buy_date"/></td>
                                                <td class="px-3 py-2 text-center"><t t-esc="state.selectedOrder.holding_days"/> ngày</td>
                                                <td class="px-3 py-2 text-center"><t t-esc="state.selectedOrder.units"/></td>
                                                <td class="px-3 py-2 text-center"><t t-esc="this.formatCurrency(state.selectedOrder.sell_fee)"/></td>
                                            </tr>
                                        </t>
                                        <t t-if="!state.selectedOrder.buy_date">
                                            <tr><td colspan="4" class="px-3 py-2 text-center text-gray-400">Không có dữ liệu</td></tr>
                                        </t>
                                    </tbody>
                                </table>
                            </div>
                        </t>
                        <t t-else="">
                            <!-- Lệnh mua, chuyển đổi ... giữ nguyên như cũ -->
                            <!-- Thông tin đầu tư -->
                            <div class="mb-6 pb-4 border-b border-gray-200">
                                <div class="font-semibold text-base mb-3 text-blue-700">Thông tin đầu tư</div>
                                <div class="grid grid-cols-2 gap-y-2 gap-x-4 text-[15px]">
                                    <div class="text-gray-500">Quỹ đầu tư:</div><div class="font-medium text-gray-900"><t t-esc="state.selectedOrder.fund_full_name || state.selectedOrder.fund_name"/></div>
                                    <div class="text-gray-500">Chương trình:</div><div class="font-medium text-gray-900"><t t-esc="state.selectedOrder.fund_name"/></div>
                                    <div class="text-gray-500">Loại lệnh:</div><div class="font-medium text-gray-900"><t t-esc="state.selectedOrder.transaction_type"/></div>
                                    <div class="text-gray-500">Ngày đặt lệnh:</div><div class="font-medium text-gray-900"><t t-esc="state.selectedOrder.order_date || state.selectedOrder.session_date"/></div>
                                    <div class="text-gray-500">Phiên giao dịch:</div><div class="font-medium text-gray-900"><t t-esc="state.selectedOrder.session_date"/></div>
                                    <div class="text-gray-500">Số tiền mua:</div><div class="font-medium text-blue-700"><t t-esc="state.selectedOrder.amount"/> <t t-esc="state.selectedOrder.currency || 'đ'"/></div>
                                </div>
                            </div>
                            <!-- Thông tin chuyển khoản -->
                            <div class="mb-6 pb-4 border-b border-gray-200">
                                <div class="font-semibold text-base mb-3 text-blue-700">Thông tin chuyển khoản</div>
                                <div class="text-gray-700">Bạn đang chọn phương thức chuyển khoản qua ngân hàng.</div>
                            </div>
                            <!-- Tài khoản thụ hưởng -->
                            <div class="mb-2">
                                <div class="font-semibold text-base mb-3 text-blue-700">Tài khoản thụ hưởng</div>
                                <div class="grid grid-cols-2 gap-y-3 gap-x-4 text-[15px]">
                                    <div class="text-gray-500">Tên thụ hưởng:</div>
                                    <div class="flex items-center gap-2 font-medium text-gray-900">
                                        <t t-esc="state.selectedOrder.fund_name"/>
                                        <button class="ml-1 px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-600 hover:text-white transition" t-on-click="() => this.copyToClipboard(state.selectedOrder.fund_name)"><i class="fas fa-copy"></i> Copy</button>
                                    </div>
                                    <div class="text-gray-500">Số tài khoản:</div>
                                    <div class="flex items-center gap-2 font-medium text-gray-900">
                                        666666666
                                        <button class="ml-1 px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-600 hover:text-white transition" t-on-click="() => this.copyToClipboard('666666666')"><i class="fas fa-copy"></i> Copy</button>
                                    </div>
                                    <div class="text-gray-500">Tên ngân hàng:</div>
                                    <div class="flex items-center gap-2 font-medium text-gray-900">
                                        NH Standard Chartered VN
                                        <button class="ml-1 px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-600 hover:text-white transition" t-on-click="() => this.copyToClipboard('NH Standard Chartered VN')"><i class="fas fa-copy"></i> Copy</button>
                                    </div>
                                    <div class="text-gray-500">Nội dung:</div>
                                    <div class="flex items-center gap-2 font-medium text-gray-900">
                                        <t t-esc="state.selectedOrder.order_code"/> - <t t-esc="state.selectedOrder.fund_name"/>
                                        <button class="ml-1 px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-600 hover:text-white transition" t-on-click="() => this.copyToClipboard(state.selectedOrder.order_code + ' - ' + state.selectedOrder.fund_name)"><i class="fas fa-copy"></i> Copy</button>
                                    </div>
                                </div>
                            </div>
                        </t>
                    </div>
                </div>
                <div class="flex-1" t-on-click="() => this.state.showDetailPopup = false"></div>
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

    filterOrders(filterType) {
        this.state.currentFilter = filterType;
        
        // Lọc dữ liệu theo loại giao dịch
        let filtered = this.state.orders;
        if (filterType === 'buy') {
            filtered = this.state.orders.filter(order => order.transaction_type === 'Mua');
        } else if (filterType === 'sell') {
            filtered = this.state.orders.filter(order => order.transaction_type === 'Bán');
        } else if (filterType === 'exchange') {
            filtered = this.state.orders.filter(order => order.transaction_type === 'Hoán đổi');
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
