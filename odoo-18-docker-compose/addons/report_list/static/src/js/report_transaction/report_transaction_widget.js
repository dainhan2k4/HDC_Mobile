/** @odoo-module */

import { Component, xml, useState, onMounted } from "@odoo/owl";

export class ReportTransactionWidget extends Component {
    static template = xml`
        <div class="report-contract-statistics-container">
            <!-- Header -->
            <div class="report-contract-statistics-header">
                <h1 class="report-contract-statistics-title">Báo cáo Giao dịch</h1>
                <p class="report-contract-statistics-subtitle">Thống kê giao dịch</p>
            </div>

            <!-- Filters -->
            <div class="report-contract-statistics-filters">
                <!-- Inline search by fields (đặt lên trên cùng) -->
                <div class="report-contract-statistics-filter-row">
                    <div class="report-contract-statistics-filter-group">
                        <label class="report-contract-statistics-filter-label" for="searchAccount">Số TK:</label>
                        <input id="searchAccount" type="text" class="report-contract-statistics-filter-input" placeholder="Nhập số TK"
                            t-model="state.searchValues.account_number" t-on-input="onSearchChange"/>
                    </div>
                    <div class="report-contract-statistics-filter-group">
                        <label class="report-contract-statistics-filter-label" for="searchCustomer">Khách hàng:</label>
                        <input id="searchCustomer" type="text" class="report-contract-statistics-filter-input" placeholder="Nhập khách hàng"
                            t-model="state.searchValues.customer_name" t-on-input="onSearchChange"/>
                    </div>
                    <div class="report-contract-statistics-filter-group">
                        <label class="report-contract-statistics-filter-label" for="searchStock">Mã CK:</label>
                        <input id="searchStock" type="text" class="report-contract-statistics-filter-input" placeholder="Nhập mã CK"
                            t-model="state.searchValues.stock_code" t-on-input="onSearchChange"/>
                    </div>
                    <div class="report-contract-statistics-filter-group">
                        <label class="report-contract-statistics-filter-label" for="searchOrderType">Loại lệnh:</label>
                        <select id="searchOrderType" class="report-contract-statistics-filter-input"
                            t-model="state.searchValues.order_type" t-on-change="onSearchChange">
                            <option value="">Tất cả</option>
                            <option value="buy">Mua</option>
                            <option value="sell">Bán</option>
                        </select>
                    </div>
                    <div class="report-contract-statistics-filter-group">
                        <label class="report-contract-statistics-filter-label" for="searchCode">Mã GD:</label>
                        <input id="searchCode" type="text" class="report-contract-statistics-filter-input" placeholder="Nhập mã GD"
                            t-model="state.searchValues.transaction_code" t-on-input="onSearchChange"/>
                    </div>
                </div>
                <!-- Hàng filter chính -->
                <div class="report-contract-statistics-filter-row">
                    <div class="report-contract-statistics-filter-group">
                        <label class="report-contract-statistics-filter-label" for="filterFund">Quỹ:</label>
                        <select id="filterFund" class="report-contract-statistics-filter-input" t-model="state.filters.fund" t-on-change="onFilterChange">
                            <option value="">Tất cả</option>
                            <option t-foreach="state.fundOptions" t-as="fund" t-key="fund.id" 
                                    t-att-value="fund.id" t-esc="fund.label"/>
                        </select>
                    </div>
                    <div class="report-contract-statistics-filter-group">
                        <label class="report-contract-statistics-filter-label" for="dateFromFilter">Từ ngày:</label>
                        <input type="date" id="dateFromFilter" class="report-contract-statistics-filter-input" t-model="state.filters.dateFrom" t-on-change="onFilterChange"/>
                    </div>
                    <div class="report-contract-statistics-filter-group">
                        <label class="report-contract-statistics-filter-label" for="dateToFilter">Đến ngày:</label>
                        <input type="date" id="dateToFilter" class="report-contract-statistics-filter-input" t-model="state.filters.dateTo" t-on-change="onFilterChange"/>
                    </div>
                    <div class="report-contract-statistics-filter-group">
                        <button class="report-contract-statistics-btn report-contract-statistics-btn-secondary" t-on-click="resetFilters">
                            <i class="fas fa-undo"></i> Làm mới
                        </button>
                    </div>
                    <div class="report-contract-statistics-filter-group">
                        <div class="dropdown" t-ref="exportDropdown">
                            <button class="report-contract-statistics-btn report-contract-statistics-btn-success dropdown-toggle" type="button" t-on-click="toggleExportDropdown">
                                <i class="fas fa-download"></i> Xuất file
                                <i class="fas fa-chevron-down" style="margin-left: 5px;"></i>
                            </button>
                            <div class="dropdown-menu" t-if="state.showExportDropdown" style="display: block; position: absolute; top: 100%; left: 0; z-index: 1000; min-width: 160px; padding: 5px 0; margin: 2px 0 0; background-color: #fff; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 6px 12px rgba(0,0,0,.175);">
                                <a class="dropdown-item" href="#" t-on-click="exportPdf" style="display: block; padding: 3px 20px; clear: both; font-weight: normal; line-height: 1.42857143; color: #333; white-space: nowrap; text-decoration: none;">
                                    <i class="fas fa-file-pdf"></i> Xuất PDF
                                </a>
                                <a class="dropdown-item" href="#" t-on-click="exportXlsx" style="display: block; padding: 3px 20px; clear: both; font-weight: normal; line-height: 1.42857143; color: #333; white-space: nowrap; text-decoration: none;">
                                    <i class="fas fa-file-excel"></i> Xuất XLSX
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Loading -->
            <div t-if="state.loading" class="report-contract-statistics-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Đang tải dữ liệu...</p>
            </div>

            <!-- Table -->
            <div class="report-contract-statistics-table-container">
                <div>
                    <table class="report-contract-statistics-table">
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>Ngày giao dịch</th>
                                <th>Ngày thanh toán</th>
                                <th>Số TK</th>
                                <th>Số TK GDCK</th>
                                <th>Khách hàng</th>
                                <th>Loại lệnh</th>
                                <th>Mã CK</th>
                                <th>Số lượng</th>
                                <th>Giá</th>
                                <th>Thành tiền</th>
                                <th>CN/TC</th>
                                <th>TN/NN</th>
                                <th>NVCS</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr t-if="!state.records || state.records.length === 0">
                                <td colspan="14" class="text-center py-3">
                                    <i class="fas fa-inbox me-2"></i>Không có dữ liệu giao dịch
                                </td>
                            </tr>
                            <tr t-foreach="state.records" t-as="record" t-key="record.id">
                                <td t-esc="record.stt or (state.records.indexOf(record) + 1)"/>
                                <td t-esc="record.transaction_date or ''"/>
                                <td t-esc="record.payment_date or ''"/>
                                <td t-esc="record.account_number or ''"/>
                                <td t-esc="record.gdck_account or ''"/>
                                <td t-esc="record.customer_name or ''"/>
                                <td>
                                    <span class="badge" t-att-class="record.order_type === 'Mua' ? 'badge-buy' : (record.order_type === 'Bán' ? 'badge-sell' : '')" t-esc="record.order_type or ''"/>
                                </td>
                                <td t-esc="record.stock_code or ''"/>
                                <td t-esc="record.quantity or ''"/>
                                <td class="text-right price-cell" t-esc="this.formatNumber(record.price)"/>
                                <td class="text-right price-cell" t-esc="this.formatNumber(record.total_amount)"/>
                                <td t-esc="record.cn_tc or ''"/>
                                <td t-esc="record.tn_nn or ''"/>
                                <td t-esc="record.nvcs or ''"/>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Pagination -->
            <div class="report-contract-statistics-pagination">
                <div class="report-contract-statistics-pagination-info">
                    Hiển thị <span t-esc="state.pagination.startRecord"/> đến <span t-esc="state.pagination.endRecord"/> 
                    trong tổng số <span t-esc="state.pagination.totalRecords"/> bản ghi
                </div>
                <div class="report-contract-statistics-pagination-controls">
                    <button t-foreach="state.pagination.pages" t-as="page" t-key="page" 
                            class="report-contract-statistics-pagination-btn" 
                            t-att-class="page === state.pagination.currentPage ? 'active' : ''"
                            t-on-click="() => this.goToPage(page)"
                            t-esc="page"/>
                </div>
            </div>
        </div>
    `;

    setup() {
        this.state = useState({
            loading: false,
            records: [],
            fundOptions: [],
            filters: {
                fund: '',
                dateFrom: '',
                dateTo: ''
            },
            searchValues: {
                account_number: '',
                customer_name: '',
                stock_code: '',
                order_type: '',
                transaction_code: '',
            },
            pagination: {
                currentPage: 1,
                pageSize: 10,
                totalRecords: 0,
                startRecord: 0,
                endRecord: 0,
                pages: []
            },
            showExportDropdown: false
        });

        onMounted(() => {
            console.log('ReportTransactionWidget OWL component mounted');
            this.initDropdown();
            this.loadFunds();
            this.loadData();
        });
    }

    async loadFunds() {
        try {
            const res = await this.rpc('/api/transaction-list/funds', {});
            if (res && res.success && Array.isArray(res.data)) {
                this.state.fundOptions = res.data.map(f => ({
                    id: f.id,
                    label: (f.ticker || f.symbol || f.name || '').trim() || f.name || ''
                }));
            }
        } catch (e) {
            console.error('Error loading funds:', e);
        }
    }

    async loadData() {
        this.state.loading = true;
        
        try {
            const response = await this.rpc('/report-transaction/data', {
                filters: this.state.filters,
                search_values: this.state.searchValues,
                page: this.state.pagination.currentPage,
                limit: this.state.pagination.pageSize
            });

            if (response.error) {
                console.error('Error loading data:', response.error);
                this.showError('Lỗi khi tải dữ liệu: ' + response.error);
                return;
            }

            // Chuẩn hóa dữ liệu về định dạng bảng hiển thị
            const items = Array.isArray(response.data) ? response.data : [];
            this.state.records = items.map((it) => ({
                // STT tính trong template
                transaction_date: it.phien_giao_dich || it.transaction_date || '',
                payment_date: it.payment_date || '',
                account_number: it.so_tai_khoan || it.account_number || '',
                gdck_account: it.gdck_account || it.so_tk_gdck || it.so_tai_khoan || '',
                customer_name: it.nha_dau_tu || it.customer_name || '',
                order_type: it.loai_lenh || it.order_type || '',
                stock_code: it.chuong_trinh_ticker || it.stock_code || it.ma_ck || '',
                quantity: it.so_ccq != null ? it.so_ccq : (it.quantity || ''),
                price: it.gia_tien != null ? it.gia_tien : (it.price || ''),
                total_amount: it.tong_so_tien != null ? it.tong_so_tien : (it.total_amount || ''),
                cn_tc: it.cn_tc || '',
                tn_nn: it.tn_nn || '',
                nvcs: it.nvcs || '',
                id: it.id,
            }));
            if (response.page) this.state.pagination.currentPage = response.page;
            if (response.limit) this.state.pagination.pageSize = response.limit;
            this.state.pagination.totalRecords = response.total || 0;
            this.updatePaginationInfo();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Lỗi khi tải dữ liệu');
        } finally {
            this.state.loading = false;
        }
    }

    onFilterChange() {
        this.state.pagination.currentPage = 1;
        this.loadData();
    }

    onSearchChange() {
        this.state.pagination.currentPage = 1;
        this.loadData();
    }

    updatePaginationInfo() {
        const startRecord = this.state.pagination.totalRecords > 0 ? 
            (this.state.pagination.currentPage - 1) * this.state.pagination.pageSize + 1 : 0;
        const endRecord = Math.min(
            this.state.pagination.currentPage * this.state.pagination.pageSize, 
            this.state.pagination.totalRecords
        );
        
        this.state.pagination.startRecord = startRecord;
        this.state.pagination.endRecord = endRecord;
        
        // Generate page numbers
        const totalPages = Math.ceil(this.state.pagination.totalRecords / this.state.pagination.pageSize);
        this.state.pagination.pages = [];
        for (let i = 1; i <= totalPages; i++) {
            this.state.pagination.pages.push(i);
        }
    }

    goToPage(page) {
        this.state.pagination.currentPage = page;
        this.loadData();
    }

    resetFilters() {
        this.state.filters = {
            fund: '',
            dateFrom: '',
            dateTo: ''
        };
        this.state.searchValues = {
            account_number: '',
            customer_name: '',
            stock_code: '',
            order_type: '',
            transaction_code: '',
        };
        this.state.pagination.currentPage = 1;
        this.loadData();
    }

    initDropdown() {
        // Đóng dropdown khi click bên ngoài
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.dropdown')) {
                this.state.showExportDropdown = false;
            }
        });
    }

    toggleExportDropdown() {
        this.state.showExportDropdown = !this.state.showExportDropdown;
    }

    async exportPdf() {
        this.state.showExportDropdown = false;
        try {
            this.state.loading = true;
            
            const params = new URLSearchParams();
            Object.keys(this.state.filters).forEach(key => {
                if (this.state.filters[key]) {
                    params.append(key, this.state.filters[key]);
                }
            });

            const response = await fetch(`/report-transaction/export-pdf?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/pdf',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_transaction_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
        } catch (error) {
            console.error('Error exporting PDF:', error);
            this.showError('Lỗi khi xuất PDF: ' + error.message);
        } finally {
            this.state.loading = false;
        }
    }

    async exportXlsx() {
        this.state.showExportDropdown = false;
        try {
            this.state.loading = true;
            
            const params = new URLSearchParams();
            Object.keys(this.state.filters).forEach(key => {
                if (this.state.filters[key]) {
                    params.append(key, this.state.filters[key]);
                }
            });

            const response = await fetch(`/report-transaction/export-xlsx?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_transaction_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
        } catch (error) {
            console.error('Error exporting XLSX:', error);
            this.showError('Lỗi khi xuất XLSX: ' + error.message);
        } finally {
            this.state.loading = false;
        }
    }

    showError(message) {
        alert(message);
    }

    async rpc(route, params) {
        try {
            const response = await fetch(route, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'call',
                    params: params
                })
            });

            const data = await response.json();
            return data.result;
        } catch (error) {
            console.error('RPC Error:', error);
            throw error;
        }
    }

    formatNumber(value) {
        const num = (value === undefined || value === null || value === '')
            ? 0
            : (typeof value === 'number' ? value : parseFloat(String(value).toString().replace(/[\,\s]/g, '')));
        if (isNaN(num)) return '0';
        return num.toLocaleString('vi-VN');
    }
}