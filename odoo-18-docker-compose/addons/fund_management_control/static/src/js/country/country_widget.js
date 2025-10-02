/** @odoo-module **/
// country_widget.js cho country
console.log('Country widget loaded');

console.log("Loading CountryWidget...");

const { Component, xml, useState, onMounted } = window.owl;

class CountryWidget extends Component {
    static template = xml`
    <div class="container-fluid p-1">
        <!-- Header Section -->
        <div class="card shadow-sm mb-4">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <button t-on-click="createNew" class="btn btn-success fw-bold shadow-sm d-flex align-items-center gap-2">
                        <i class="fas fa-plus"></i>
                        Tạo mới
                    </button>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <div class="input-group" style="max-width: 450px;">
                        <span class="input-group-text bg-light border-end-0"><i class="fas fa-search text-muted"></i></span>
                        <input type="text" placeholder="Nhập từ khóa để tìm kiếm" class="form-control border-start-0"
                            t-model="state.searchTerm"
                            t-on-keyup="onSearchKeyup"
                        />
                    </div>
                    <div class="d-flex align-items-center text-muted">
                        <span class="me-3">Tổng <b t-esc="state.totalRecords"/> kết quả</span>
                        <button t-on-click="performSearch" class="btn btn-primary fw-bold">
                            Tìm kiếm
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <!-- Country Table Section -->
        <div class="card shadow-sm">
          <div class="card-body p-0">
            <table class="table table-hover mb-0">
                <thead class="table-light">
                    <tr>
                        <th class="px-3 py-2 text-uppercase small text-muted">Tên quốc gia</th>
                        <th class="px-3 py-2 text-uppercase small text-muted">Mã quốc gia</th>
                        <th class="px-3 py-2 text-uppercase small text-muted">Mã điện thoại</th>
                        <th class="px-3 py-2 text-uppercase small text-muted">Trạng thái</th>
                        <th class="px-3 py-2 text-center text-uppercase small text-muted">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    <t t-if="state.loading">
                        <tr>
                            <td colspan="5" class="text-center p-5">
                                <div class="d-flex justify-content-center align-items-center">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <p class="ms-3 text-muted">Đang tải dữ liệu...</p>
                                </div>
                            </td>
                        </tr>
                    </t>
                    <t t-if="!state.loading and state.countries.length === 0">
                        <tr>
                            <td colspan="5" class="text-center p-5 text-muted">
                                Không tìm thấy quốc gia nào.
                            </td>
                        </tr>
                    </t>
                    <t t-foreach="state.countries" t-as="country" t-key="country.id">
                        <tr class="align-middle">
                            <td class="px-3 py-2 fw-bold" t-esc="country.name"/>
                            <td class="px-3 py-2 text-muted" t-esc="country.code"/>
                            <td class="px-3 py-2" t-esc="country.phone_code"/>
                            <td class="px-3 py-2">
                                <span t-if="country.active" class="badge rounded-pill bg-success-subtle text-success-emphasis p-2">
                                    Kích hoạt
                                </span>
                                <span t-else="" class="badge rounded-pill bg-danger-subtle text-danger-emphasis p-2">
                                    Không kích hoạt
                                </span>
                            </td>
                            <td class="px-3 py-2 text-center">
                                <a href="#" t-on-click.prevent="() => this.handleEdit(country.id)" class="btn btn-sm btn-link text-primary text-decoration-none">
                                    <i class="fas fa-pencil-alt fa-lg"></i>
                                </a>
                                <a href="#" t-on-click.prevent="() => this.handleDelete(country.id)" class="btn btn-sm btn-link text-danger text-decoration-none">
                                    <i class="fas fa-trash fa-lg"></i>
                                </a>
                            </td>
                        </tr>
                    </t>
                </tbody>
            </table>
          </div>
          <!-- Pagination Controls -->
          <div t-if="totalPages > 1" class="card-footer d-flex justify-content-end">
            <nav aria-label="Page navigation">
              <ul class="pagination mb-0">
                <li t-attf-class="page-item #{state.currentPage === 1 ? 'disabled' : ''}">
                  <a class="page-link" href="#" t-on-click.prevent="() => this.changePage(state.currentPage - 1)">Previous</a>
                </li>
                <t t-foreach="Array.from({ length: totalPages }, (_, i) => i + 1)" t-as="page" t-key="page">
                    <li t-attf-class="page-item #{page === state.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" t-on-click.prevent="() => this.changePage(page)" t-esc="page"/>
                    </li>
                </t>
                <li t-attf-class="page-item #{state.currentPage === totalPages ? 'disabled' : ''}">
                  <a class="page-link" href="#" t-on-click.prevent="() => this.changePage(state.currentPage + 1)">Next</a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
    </div>
    `;
    setup() {
        this.state = useState({ countries: [], searchTerm: "", loading: true, currentPage: 1, totalRecords: 0, limit: 10 });
        onMounted(() => this.loadData());
    }
    get totalPages() { return Math.ceil(this.state.totalRecords / this.state.limit); }
    async loadData() {
        this.state.loading = true;
        const url = `/get_country_data?page=${this.state.currentPage}&limit=${this.state.limit}&search=${encodeURIComponent(this.state.searchTerm.trim())}`;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error("Tải dữ liệu thất bại");
            const data = await res.json();
            this.state.countries = data.records;
            this.state.totalRecords = data.total_records;
        } catch (e) { console.error(e); } finally { this.state.loading = false; }
    }
    changePage(page) { if (page > 0 && page <= this.totalPages) { this.state.currentPage = page; this.loadData(); } }
    onSearchKeyup(ev) { if (ev.key === 'Enter') this.performSearch(); }
    performSearch() { this.state.currentPage = 1; this.loadData(); }
    handleEdit(id) { window.location.href = `/country/edit/${id}`; }
    createNew() { window.location.href = '/country/new'; }
}
window.CountryWidget = CountryWidget;
export default CountryWidget; 
