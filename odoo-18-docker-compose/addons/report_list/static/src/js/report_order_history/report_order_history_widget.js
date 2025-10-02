/** @odoo-module */

import { Component, xml, useState, onMounted } from "@odoo/owl";

export class ReportOrderHistoryWidget extends Component {
    static template = xml`
            <div class="report-contract-statistics-container">
            <!-- Header -->
                <div class="report-contract-statistics-header">
                <h1 class="report-contract-statistics-title">Báo cáo Lịch sử Lệnh</h1>
                <p class="report-contract-statistics-subtitle">Thống kê lịch sử lệnh giao dịch</p>
                </div>

            <!-- Filters -->
            <div class="report-contract-statistics-filters">
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
                        <label class="report-contract-statistics-filter-label" for="statusFilter">Trạng thái:</label>
                        <select id="statusFilter" class="report-contract-statistics-filter-input" t-model="state.filters.status" t-on-change="onFilterChange">
                            <option value="">Tất cả</option>
                            <option value="pending">Chờ khớp</option>
                            <option value="matched">Đã khớp</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>
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
                <!-- Inline search by fields -->
                <div class="report-contract-statistics-filter-row">
                    <div class="report-contract-statistics-filter-group">
                        <label class="report-contract-statistics-filter-label" for="searchSoTK">Số TK:</label>
                        <input id="searchSoTK" type="text" class="report-contract-statistics-filter-input" placeholder="Nhập số TK"
                            t-model="state.searchValues.so_tk" t-on-input="onSearchChange"/>
                    </div>
                    <div class="report-contract-statistics-filter-group">
                        <label class="report-contract-statistics-filter-label" for="searchKH">Khách hàng:</label>
                        <input id="searchKH" type="text" class="report-contract-statistics-filter-input" placeholder="Nhập khách hàng"
                            t-model="state.searchValues.khach_hang" t-on-input="onSearchChange"/>
                    </div>
                    <div class="report-contract-statistics-filter-group">
                        <label class="report-contract-statistics-filter-label" for="searchMaCK">Mã CK:</label>
                        <input id="searchMaCK" type="text" class="report-contract-statistics-filter-input" placeholder="Nhập mã CK"
                            t-model="state.searchValues.ma_ck" t-on-input="onSearchChange"/>
                    </div>
                    <div class="report-contract-statistics-filter-group">
                        <label class="report-contract-statistics-filter-label" for="searchLenh">Lệnh:</label>
                        <input id="searchLenh" type="text" class="report-contract-statistics-filter-input" placeholder="Nhập số lệnh/SHL"
                            t-model="state.searchValues.lenh" t-on-input="onSearchChange"/>
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
                <div class="report-contract-statistics-table-wrapper">
                    <table class="report-contract-statistics-table">
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>Giờ đặt</th>
                                <th>Trạng thái</th>
                                <th>Số TK</th>
                                <th>Số TK GDCK</th>
                                <th>Khách hàng</th>
                                <th>NVCS</th>
                                <th>Loại lệnh</th>
                                <th>Lệnh</th>
                                <th>Mã CK</th>
                                <th>KL đặt</th>
                                <th>Giá đặt</th>
                                <th>KL khớp</th>
                                <th>Giá khớp</th>
                                <th>KL chờ</th>
                                <th>Giá chờ</th>
                                <th>SHL</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr t-if="!state.records || state.records.length === 0">
                                <td colspan="17" class="text-center py-3" style="font-size: 0.85rem;">
                                    <i class="fas fa-inbox me-2"></i>Không có dữ liệu lịch sử lệnh
                                </td>
                            </tr>
                            <tr t-foreach="state.records" t-as="record" t-key="record.id">
                                <td style="font-size: 0.8rem;" t-esc="record.stt || (state.records.indexOf(record) + 1)"/>
                                <td style="font-size: 0.8rem;" t-esc="record.gio_dat || ''"/>
                                <td style="font-size: 0.8rem;">
                                    <span class="badge" t-att-class="record.trang_thai === 'pending' ? 'badge-pending' : (record.trang_thai === 'matched' ? 'badge-approved' : (record.trang_thai === 'cancelled' ? 'badge-cancelled' : ''))"
                                          t-esc="record.trang_thai === 'matched' ? 'Đã khớp' : (record.trang_thai === 'pending' ? 'Chờ khớp' : (record.trang_thai === 'cancelled' ? 'Đã hủy' : (record.trang_thai || '')))"/>
                                </td>
                                <td style="font-size: 0.8rem;" t-esc="record.so_tk || ''"/>
                                <td style="font-size: 0.8rem;" t-esc="record.so_tk_gdck || ''"/>
                                <td style="font-size: 0.8rem;" t-esc="record.khach_hang || ''"/>
                                <td style="font-size: 0.8rem;" t-esc="record.nvcs || ''"/>
                                <td style="font-size: 0.8rem;">
                                    <span class="badge" t-att-class="record.loai_lenh === 'mua' ? 'badge-buy' : (record.loai_lenh === 'ban' ? 'badge-sell' : '')"
                                          t-esc="record.loai_lenh === 'mua' ? 'Mua' : (record.loai_lenh === 'ban' ? 'Bán' : (record.loai_lenh || ''))"/>
                                </td>
                                <td style="font-size: 0.8rem;" t-esc="record.lenh || ''"/>
                                <td style="font-size: 0.8rem;" t-esc="record.ma_ck || ''"/>
                                <td style="font-size: 0.8rem;" class="text-right" t-esc="this.formatNumber(record.kl_dat)"/>
                                <td style="font-size: 0.8rem;" class="text-right price-cell" t-esc="this.formatPrice50(record.gia_dat)"/>
                                <td style="font-size: 0.8rem;" class="text-right" t-esc="this.formatNumber(record.kl_khop)"/>
                                <td style="font-size: 0.8rem;" class="text-right price-cell" t-esc="this.formatPrice50(record.gia_khop)"/>
                                <td style="font-size: 0.8rem;" class="text-right" t-esc="this.formatNumber(record.kl_cho)"/>
                                <td style="font-size: 0.8rem;" class="text-right price-cell" t-esc="this.formatPrice50(record.gia_cho)"/>
                                <td style="font-size: 0.8rem;" t-esc="record.shl || ''"/>
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
                dateTo: '',
                status: ''
            },
            searchValues: {
                so_tk: '',
                khach_hang: '',
                ma_ck: '',
                lenh: ''
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
            console.log('ReportOrderHistoryWidget OWL component mounted');
            this.loadFunds();
            this.loadData();
            this.initDropdown();
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
            const response = await this.rpc('/report-order-history/data', {
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

            this.state.records = response.data || [];
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
            dateTo: '',
            status: ''
        };
        this.state.searchValues = {
            so_tk: '',
            khach_hang: '',
            ma_ck: '',
            lenh: ''
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

    onFilterChange() {
        this.state.pagination.currentPage = 1;
        this.loadData();
    }

    onSearchChange() {
        this.state.pagination.currentPage = 1;
        this.loadData();
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

            const response = await fetch(`/report-order-history/export-pdf?${params.toString()}`, {
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
            a.download = `report_order_history_${new Date().toISOString().split('T')[0]}.pdf`;
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

            const response = await fetch(`/report-order-history/export-xlsx?${params.toString()}`, {
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
            a.download = `report_order_history_${new Date().toISOString().split('T')[0]}.xlsx`;
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
            : (typeof value === 'number' ? value : parseFloat(String(value).toString().replace(/[\s,]/g, '')));
        if (isNaN(num)) return '0';
        return num.toLocaleString('vi-VN');
    }

    formatPrice50(value) {
        const num = (value === undefined || value === null || value === '')
            ? 0
            : (typeof value === 'number' ? value : parseFloat(String(value).toString().replace(/[\s,]/g, '')));
        if (isNaN(num)) return '0';
        const rounded = Math.round(num / 50) * 50;
        return rounded.toLocaleString('vi-VN');
    }
}