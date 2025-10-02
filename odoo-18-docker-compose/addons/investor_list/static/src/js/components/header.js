/** @odoo-module **/
import { Component, xml, useState, onMounted, onPatched } from "@odoo/owl";

export class Header extends Component {
    static template = xml`
    <header class="hd-header shadow-lg">
      <!-- Top Bar with Logo and User Info -->
      <div class="container-fluid d-flex align-items-center justify-content-between py-3 px-4">
        <div class="d-flex align-items-center gap-4">
          <!-- Logo with special styling -->
          <div class="hd-logo-container">
            <img t-att-src="'/investor_list/static/src/img/hdcapital_logo.png'" alt="HDCapital Logo" class="hd-logo-img"/>
          </div>
        </div>
        
        <div class="d-flex align-items-center gap-3">
          <t t-if="state.isLoggedIn">
            <!-- Enhanced User Menu -->
            <div class="d-flex align-items-center gap-3 hd-user-menu position-relative" id="accountDropdownWrapperMana">
              <!-- Status Indicator -->
              <div class="position-relative">
                <div class="hd-avatar rounded-circle d-flex align-items-center justify-content-center text-white fs-4 hd-avatar-enhanced" style="background-color:#f97316">
                  <i class="fas fa-user-tie"></i>
                </div>
                <div class="position-absolute top-0 end-0 translate-middle hd-status-indicator"></div>
              </div>
              
              <div class="d-none d-md-block text-end">
                <div class="fw-bold text-dark text-uppercase small" style="font-size:0.75rem;letter-spacing:0.5px;"><t t-esc="state.userName"/></div>
                <div class="d-flex align-items-center gap-2 small" style="font-size:0.7rem;font-weight:600;">
                  <span class="hd-chip-soft">Nhân viên</span>

                </div>
              </div>
              
              <i class="fas fa-chevron-down hd-chevron-down" style="color:#f97316"></i>
              
              <!-- Enhanced Dropdown -->
              <div class="dropdown-menu shadow-lg border-0 hd-dropdown-menu" id="accountDropdownMana">
                <div class="dropdown-item-text p-3 hd-dropdown-header">
                  <small class="text-white-50"><t t-esc="state.userName"/></small>
                  <div class="fw-bold">Nhân viên</div>
                  <div class="small text-white-50 mt-1">
                    <i class="fas fa-clock me-1"></i>Đang hoạt động
                  </div>
                </div>
                <div class="p-2">
                  <a class="dropdown-item rounded-3 py-2 hd-dropdown-item" href="/personal_profile">
                    <i class="fas fa-user-edit me-2 text-primary"></i>Thông tin cá nhân
                  </a>
                  <a class="dropdown-item rounded-3 py-2 hd-dropdown-item" href="#" t-on-click="logout" style="color:#f97316">
                    <i class="fas fa-sign-out-alt me-2"></i>Đăng xuất
                  </a>
                </div>
              </div>
            </div>
          </t>
          <t t-else="">
            <button class="btn px-4 py-2 rounded-pill hd-login-btn" style="background-color:#f97316;border-color:#f97316;color:white" t-on-click="() => window.location.href='/web/login'">
              <i class="fas fa-sign-in-alt me-2"></i>Đăng nhập
            </button>
          </t>
        </div>
      </div>
      
      <!-- Enhanced Navigation Bar -->
      <div class="hd-menu-bar rounded-bottom-4 px-4 py-3 mt-n1 shadow-lg">
        <nav class="d-flex gap-3 justify-content-center flex-wrap">
          <a t-attf-class="hd-menu-item #{state.currentPage === 'investor' ? 'active' : ''}" href="/investor_list">
            <i class="fas fa-users"></i> 
            <span>NHÀ ĐẦU TƯ</span>
          </a>
          <a t-attf-class="hd-menu-item #{state.currentPage === 'transaction' ? 'active' : ''}" href="/transaction-list">
            <i class="fas fa-exchange-alt"></i> 
            <span>GIAO DỊCH</span>
          </a>
          <div t-attf-class="hd-menu-item dropdown position-relative #{state.currentPage === 'nav' ? 'active' : ''} #{state.isNavDropdownOpen ? 'active' : ''}" t-on-click="toggleNavDropdown">
            <a href="#" class="d-flex align-items-center gap-2" t-on-click.stop="toggleNavDropdown">
              <i class="fas fa-chart-line"></i> 
              <span>NAV</span>
              <i class="fas fa-chevron-down ms-1 hd-chevron-down"></i>
            </a>
            
            <!-- NAV Dropdown Menu -->
            <div class="report-dropdown-menu" t-on-click.stop="">
              <div class="dropdown-header p-3">
                <i class="fas fa-chart-line me-2"></i>NAV Management
              </div>
              <div class="dropdown-body">
                <a href="/nav_management/nav_transaction" class="dropdown-item d-flex align-items-center gap-3 p-3 rounded-3" t-attf-class="#{state.currentPage === 'nav-transaction' ? 'active-submenu' : ''}" t-on-click="closeNavDropdown">
                  <div class="icon-wrapper d-flex align-items-center justify-content-center rounded-circle">
                    <i class="fas fa-exchange-alt"></i>
                  </div>
                  <div>
                    <div class="fw-bold" style="font-size:0.85rem;">NAV Phiên giao dịch</div>
                    <div class="text-muted small" style="font-size:0.75rem;">Quản lý NAV theo phiên giao dịch</div>
                  </div>
                </a>
                <a href="/nav_management/nav_monthly" class="dropdown-item d-flex align-items-center gap-3 p-3 rounded-3" t-attf-class="#{state.currentPage === 'nav-monthly' ? 'active-submenu' : ''}" t-on-click="closeNavDropdown">
                  <div class="icon-wrapper icon-wrapper-green d-flex align-items-center justify-content-center rounded-circle">
                    <i class="fas fa-calendar-alt"></i>
                  </div>
                  <div>
                    <div class="fw-bold" style="font-size:0.85rem;">NAV Tháng</div>
                    <div class="text-muted small" style="font-size:0.75rem;">Quản lý NAV theo tháng</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          <div t-attf-class="hd-menu-item dropdown position-relative #{state.currentPage === 'report' ? 'active' : ''} #{state.isReportDropdownOpen ? 'active' : ''}" t-on-click="toggleReportDropdown">
            <a href="#" class="d-flex align-items-center gap-2" t-on-click.stop="toggleReportDropdown">
              <i class="fas fa-file-alt"></i> 
              <span>BÁO CÁO</span>
              <i class="fas fa-chevron-down ms-1 hd-chevron-down"></i>
            </a>
            
            <!-- Report Dropdown Menu -->
            <div class="report-dropdown-menu" t-on-click.stop="">
              <div class="dropdown-header p-3">
                <i class="fas fa-chart-bar me-2"></i>Báo cáo
              </div>
              <div class="dropdown-body" style="max-height: 300px; overflow-y: auto;">
                <a href="/report-balance" class="dropdown-item d-flex align-items-center gap-3 p-3 rounded-3" t-attf-class="#{state.currentPage === 'report-balance' ? 'active-submenu' : ''}" t-on-click="closeReportDropdown">
                  <div class="icon-wrapper d-flex align-items-center justify-content-center rounded-circle">
                    <i class="fas fa-balance-scale"></i>
                  </div>
                  <div>
                    <div class="fw-bold" style="font-size:0.85rem;">Report Balance</div>
                    <div class="text-muted small" style="font-size:0.75rem;">Báo cáo số dư</div>
                  </div>
                </a>
                <a href="/report-transaction" class="dropdown-item d-flex align-items-center gap-3 p-3 rounded-3" t-attf-class="#{state.currentPage === 'report-transaction' ? 'active-submenu' : ''}" t-on-click="closeReportDropdown">
                  <div class="icon-wrapper icon-wrapper-green d-flex align-items-center justify-content-center rounded-circle">
                    <i class="fas fa-exchange-alt"></i>
                  </div>
                  <div>
                    <div class="fw-bold" style="font-size:0.85rem;">Report Transaction</div>
                    <div class="text-muted small" style="font-size:0.75rem;">Báo cáo giao dịch</div>
                  </div>
                </a>
                <a href="/report-order-history" class="dropdown-item d-flex align-items-center gap-3 p-3 rounded-3" t-attf-class="#{state.currentPage === 'report-order-history' ? 'active-submenu' : ''}" t-on-click="closeReportDropdown">
                  <div class="icon-wrapper icon-wrapper-blue d-flex align-items-center justify-content-center rounded-circle">
                    <i class="fas fa-history"></i>
                  </div>
                  <div>
                    <div class="fw-bold" style="font-size:0.85rem;">Report Order History</div>
                    <div class="text-muted small" style="font-size:0.75rem;">Sổ lệnh lịch sử giao dịch</div>
                  </div>
                </a>
                <a href="/report-contract-statistics" class="dropdown-item d-flex align-items-center gap-3 p-3 rounded-3" t-attf-class="#{state.currentPage === 'report-contract-statistics' ? 'active-submenu' : ''}" t-on-click="closeReportDropdown">
                  <div class="icon-wrapper icon-wrapper-purple d-flex align-items-center justify-content-center rounded-circle">
                    <i class="fas fa-chart-pie"></i>
                  </div>
                  <div>
                    <div class="fw-bold" style="font-size:0.85rem;">Report Contract Statistics</div>
                    <div class="text-muted small" style="font-size:0.75rem;">Thống kê HĐ theo kỳ hạn</div>
                  </div>
                </a>
                <a href="/report-early-sale" class="dropdown-item d-flex align-items-center gap-3 p-3 rounded-3" t-attf-class="#{state.currentPage === 'report-early-sale' ? 'active-submenu' : ''}" t-on-click="closeReportDropdown">
                  <div class="icon-wrapper icon-wrapper-orange d-flex align-items-center justify-content-center rounded-circle">
                    <i class="fas fa-clock"></i>
                  </div>
                  <div>
                    <div class="fw-bold" style="font-size:0.85rem;">Report Early Sale</div>
                    <div class="text-muted small" style="font-size:0.75rem;">Báo cáo bán trước hạn</div>
                  </div>
                </a>
                <a href="/aoc_report" class="dropdown-item d-flex align-items-center gap-3 p-3 rounded-3" t-attf-class="#{state.currentPage === 'aoc-report' ? 'active-submenu' : ''}" t-on-click="closeReportDropdown">
                  <div class="icon-wrapper icon-wrapper-cyan d-flex align-items-center justify-content-center rounded-circle">
                    <i class="fas fa-user-plus"></i>
                  </div>
                  <div>
                    <div class="fw-bold" style="font-size:0.85rem;">Báo cáo Mở/Đóng TK</div>
                    <div class="text-muted small" style="font-size:0.75rem;">Tình hình mở và đóng tài khoản</div>
                  </div>
                </a>
                <a href="/investor_report" class="dropdown-item d-flex align-items-center gap-3 p-3 rounded-3" t-attf-class="#{state.currentPage === 'investor-report' ? 'active-submenu' : ''}" t-on-click="closeReportDropdown">
                  <div class="icon-wrapper icon-wrapper-indigo d-flex align-items-center justify-content-center rounded-circle">
                    <i class="fas fa-users"></i>
                  </div>
                  <div>
                    <div class="fw-bold" style="font-size:0.85rem;">Danh sách Nhà đầu tư</div>
                    <div class="text-muted small" style="font-size:0.75rem;">Quản lý thông tin nhà đầu tư</div>
                  </div>
                </a>
                <a href="/user_list" class="dropdown-item d-flex align-items-center gap-3 p-3 rounded-3" t-attf-class="#{state.currentPage === 'user-list' ? 'active-submenu' : ''}" t-on-click="closeReportDropdown">
                  <div class="icon-wrapper icon-wrapper-teal d-flex align-items-center justify-content-center rounded-circle">
                    <i class="fas fa-user-cog"></i>
                  </div>
                  <div>
                    <div class="fw-bold" style="font-size:0.85rem;">Danh sách Người dùng</div>
                    <div class="text-muted small" style="font-size:0.75rem;">Quản lý người dùng hệ thống</div>
                  </div>
                </a>
                <a href="/list_tenors_interest_rates" class="dropdown-item d-flex align-items-center gap-3 p-3 rounded-3" t-attf-class="#{state.currentPage === 'list-tenors-interest-rates' ? 'active-submenu' : ''}" t-on-click="closeReportDropdown">
                  <div class="icon-wrapper icon-wrapper-pink d-flex align-items-center justify-content-center rounded-circle">
                    <i class="fas fa-percentage"></i>
                  </div>
                  <div>
                    <div class="fw-bold" style="font-size:0.85rem;">Kỳ hạn và Lãi suất</div>
                    <div class="text-muted small" style="font-size:0.75rem;">Quản lý kỳ hạn và lãi suất sản phẩm</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          <a t-attf-class="hd-menu-item #{state.currentPage === 'utils' ? 'active' : ''}" href="/utils">
            <i class="fas fa-tools"></i> 
            <span>TIỆN ÍCH</span>
          </a>
        </nav>
      </div>
    </header>
    
    <style>
      .icon-wrapper-cyan {
        background: linear-gradient(135deg, #06b6d4, #0891b2);
        color: white;
      }
      .icon-wrapper-indigo {
        background: linear-gradient(135deg, #6366f1, #4f46e5);
        color: white;
      }
      .icon-wrapper-teal {
        background: linear-gradient(135deg, #14b8a6, #0d9488);
        color: white;
      }
      .icon-wrapper-pink {
        background: linear-gradient(135deg, #ec4899, #db2777);
        color: white;
      }
      
      /* Custom scrollbar for dropdown */
      .dropdown-body::-webkit-scrollbar {
        width: 6px;
      }
      .dropdown-body::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 3px;
      }
      .dropdown-body::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }
      .dropdown-body::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
      
      /* Smooth scrolling */
      .dropdown-body {
        scroll-behavior: smooth;
      }
    </style>
    `;

    setup() {
        this.listenersAttached = false;
        this.state = useState({
            currentPage: this.getCurrentPage(),
            userName: '',
            accountNo: '',
            isLoggedIn: false,
            isReportDropdownOpen: false,
            isNavDropdownOpen: false,
        });
        this.fetchUserInfo();

        // Cập nhật currentPage khi URL thay đổi
        this.updateCurrentPage = () => {
            this.state.currentPage = this.getCurrentPage();
        };

        // Lắng nghe sự kiện popstate (back/forward button)
        window.addEventListener('popstate', this.updateCurrentPage);

        // Cleanup function để remove event listener
        this.cleanup = () => {
            window.removeEventListener('popstate', this.updateCurrentPage);
        };

        onPatched(() => {
            // Cập nhật currentPage mỗi khi component được patch
            this.updateCurrentPage();
            
            // Add click outside listener for dropdowns
            if (!this.dropdownListenerAdded) {
                this.dropdownClickHandler = (e) => {
                    const reportDropdown = document.querySelector('.hd-menu-item.dropdown');
                    const navDropdown = document.querySelector('.hd-menu-item.dropdown');
                    if (reportDropdown && !reportDropdown.contains(e.target)) {
                        this.closeReportDropdown();
                    }
                    if (navDropdown && !navDropdown.contains(e.target)) {
                        this.closeNavDropdown();
                    }
                };
                document.addEventListener('click', this.dropdownClickHandler);
                this.dropdownListenerAdded = true;
            }
            
            if (this.state.isLoggedIn && !this.listenersAttached) {
                const wrapper = document.getElementById('accountDropdownWrapperMana');
                const dropdown = document.getElementById('accountDropdownMana');
                if (wrapper && dropdown) {
                    wrapper.addEventListener('click', (e) => {
                        e.stopPropagation();
                        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                    });
                    document.addEventListener('click', (e) => {
                        if (!wrapper.contains(e.target)) {
                            dropdown.style.display = 'none';
                        }
                    });
                    this.listenersAttached = true;
                }
            }

            if (this.state.isLoggedIn && (window.location.pathname === '/web' || window.location.pathname === '/web/')) {
                window.location.href = '/investor_list';
            }
        });
    }

    toggleReportDropdown() {
        this.state.isReportDropdownOpen = !this.state.isReportDropdownOpen;
    }

    closeReportDropdown() {
        this.state.isReportDropdownOpen = false;
    }

    toggleNavDropdown() {
        this.state.isNavDropdownOpen = !this.state.isNavDropdownOpen;
    }

    closeNavDropdown() {
        this.state.isNavDropdownOpen = false;
    }

    async fetchUserInfo() {
        try {
            const response = await fetch('/web/session/get_session_info', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: '{}'
            });
            const data = await response.json();
            if (data.result && data.result.uid) {
                this.state.userName = data.result.name;
                // Gọi API lấy số tài khoản từ status.info
                const soTk = await this.fetchStatusInfo();
                this.state.accountNo = soTk || '';
                this.state.isLoggedIn = true;
            } else {
                this.state.userName = '';
                this.state.accountNo = '';
                this.state.isLoggedIn = false;
            }
        } catch (e) {
            this.state.userName = '';
            this.state.accountNo = '';
            this.state.isLoggedIn = false;
        }
    }

    async fetchStatusInfo() {
        try {
            const response = await fetch('/get_status_info', {
                method: 'GET',
                headers: {'Content-Type': 'application/json'}
            });
            const data = await response.json();
            if (data && Array.isArray(data) && data.length > 0) {
                return data[0].so_tk || '';
            } else if (data && data.so_tk) {
                return data.so_tk;
            }
            return '';
        } catch (e) {
            return '';
        }
    }

    async logout() {
        await fetch('/web/session/destroy', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: '{}'
        });
        window.location.href = '/web/login';
    }

    willUnmount() {
        // Cleanup event listeners khi component bị hủy
        if (this.cleanup) {
            this.cleanup();
        }
        
        // Remove dropdown click outside listener
        if (this.dropdownListenerAdded) {
            document.removeEventListener('click', this.dropdownClickHandler);
        }
    }

    getCurrentPage() {
        const path = window.location.pathname;
        
        // Xác định trang hiện tại theo thứ tự ưu tiên
        if (path.includes('/investor_list')) return 'investor';
        if (path.includes('/transaction-list')) return 'transaction';
        if (path.includes('/nav_management/nav_transaction')) return 'nav-transaction';
        if (path.includes('/nav_management/nav_monthly')) return 'nav-monthly';
        if (path.includes('/fund_widget') || path.includes('/nav')) return 'nav';
        if (path.includes('/report-balance')) return 'report-balance';
        if (path.includes('/report-transaction')) return 'report-transaction';
        if (path.includes('/report-order-history')) return 'report-order-history';
        if (path.includes('/report-contract-statistics')) return 'report-contract-statistics';
        if (path.includes('/report-early-sale')) return 'report-early-sale';
        if (path.includes('/aoc_report')) return 'aoc-report';
        if (path.includes('/investor_report')) return 'investor-report';
        if (path.includes('/user_list')) return 'user-list';
        if (path.includes('/list_tenors_interest_rates')) return 'list-tenors-interest-rates';
        if (path.includes('/asset-management')) return 'report';
        if (path.includes('/personal_profile')) return 'utils';
        
        // Mặc định về trang investor nếu không khớp với bất kỳ trang nào
        return 'investor';
    }
}

window.Header = Header;
