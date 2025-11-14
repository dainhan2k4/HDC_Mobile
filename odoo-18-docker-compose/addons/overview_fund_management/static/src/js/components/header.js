/** @odoo-module **/
import { Component, xml, useState, onMounted, onPatched } from "@odoo/owl";

export class Header extends Component {
    static template = xml`
    <header class="hd-header shadow-lg" style="position:relative; overflow:visible; z-index:2000;">
      <div class="container-fluid d-flex align-items-center justify-content-between py-3 px-4 bg-white rounded-top-4 border-bottom border-light" style="overflow:visible;">
        <div class="d-flex align-items-center gap-4">
          <img t-att-src="'/overview_fund_management/static/src/img/hdcapital_logo.png'" alt="HDCapital Logo" style="height:60px;max-width:200px;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.1));"/>
        </div>
        <div class="d-flex align-items-center gap-4">
          <t t-if="state.isLoggedIn">
            <!-- Icon thông báo đáo hạn -->
            <div class="position-relative" id="notificationDropdownWrapper" style="position:relative; z-index:3000;">
              <button class="btn btn-link position-relative p-2" t-on-click="toggleNotificationDropdown" style="color:#6c757d;text-decoration:none;border:none;background:none;">
                <i class="fas fa-bell" style="font-size:20px;"></i>
                <t t-if="state.pendingNotificationsCount > 0">
                  <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="font-size:10px;padding:2px 6px;">
                    <t t-esc="state.pendingNotificationsCount"/>
                  </span>
                </t>
              </button>
              <div class="dropdown-menu shadow-lg border-0 rounded-3" id="notificationDropdown" style="display: none; right:0; min-width:420px; max-width:480px; max-height:600px; overflow-y:auto; top:120%; border-radius:16px !important; z-index:4000;">
                <!-- Header với checkbox và button xóa tất cả -->
                <div class="px-4 py-3 border-bottom bg-light">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0 fw-bold text-dark">
                      <i class="fas fa-bell me-2 text-primary"></i>Thông báo đáo hạn
                    </h6>
                    <t t-if="state.pendingNotificationsCount > 0">
                      <span class="badge bg-danger rounded-pill"><t t-esc="state.pendingNotificationsCount"/> chưa xử lý</span>
                    </t>
                  </div>
                  <t t-if="state.notifications.length > 0">
                    <div class="d-flex justify-content-between align-items-center">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="selectAllNotifications" 
                               t-on-change="() => this.toggleSelectAllNotifications()"
                               t-att-checked="state.selectedNotificationIds.length === state.notifications.length and state.notifications.length > 0"/>
                        <label class="form-check-label small text-muted" for="selectAllNotifications">
                          Chọn tất cả
                        </label>
                      </div>
                      <t t-if="state.selectedNotificationIds.length > 0">
                        <button class="btn btn-sm btn-outline-danger" t-on-click="() => this.deleteSelectedNotifications()">
                          <i class="fas fa-trash-alt me-1"></i>Xóa (<t t-esc="state.selectedNotificationIds.length"/>)
                        </button>
                      </t>
                    </div>
                  </t>
                </div>
                
                <!-- Danh sách thông báo -->
                <div class="notification-list" style="max-height:450px; overflow-y:auto;">
                  <t t-if="state.notifications.length === 0">
                    <div class="px-4 py-5 text-center text-muted">
                      <i class="fas fa-bell-slash mb-3" style="font-size:48px;opacity:0.2;color:#6c757d;"></i>
                      <div class="fw-semibold">Không có thông báo</div>
                      <div class="small mt-1">Bạn sẽ nhận thông báo khi có lệnh đến ngày đáo hạn</div>
                    </div>
                  </t>
                  <t t-foreach="state.notifications" t-as="notif" t-key="notif.id">
                    <div t-attf-class="notification-item px-3 py-2 border-bottom position-relative #{notif.investor_response === 'pending' ? 'notification-pending' : 'notification-processed'}"
                         t-att-style="notif.investor_response !== 'pending' ? 'opacity:0.6;' : ''"
                         style="transition:all 0.2s ease;">
                      <div class="d-flex align-items-start">
                        <!-- Checkbox để chọn -->
                        <div class="form-check me-3 mt-1">
                          <input class="form-check-input" type="checkbox" 
                                 t-att-id="'notif-check-' + notif.id"
                                 t-att-checked="state.selectedNotificationIds.includes(notif.id)"
                                 t-on-change="() => this.toggleNotificationSelection(notif.id)"
                                 t-on-click.stop=""/>
                        </div>
                        
                        <!-- Nội dung thông báo -->
                        <div class="flex-grow-1" t-on-click="() => this.handleNotificationClick(notif)" style="cursor:pointer;">
                          <!-- Message chính -->
                          <div class="mb-1">
                            <div class="small fw-semibold mb-1" t-attf-class="#{notif.investor_response === 'pending' ? 'text-dark' : 'text-muted'}" style="font-size:0.85rem;">
                              <i t-attf-class="fas #{notif.investor_response === 'pending' ? 'fa-exclamation-circle text-warning' : notif.investor_response === 'confirmed' ? 'fa-check-circle text-success' : notif.investor_response === 'rejected' ? 'fa-times-circle text-danger' : 'fa-clock text-danger'} me-1" style="font-size:0.8rem;"></i>
                              <t t-if="notif.investor_response === 'pending'">
                                Bạn có hợp đồng giao dịch đã đến hạn đáo hạn
                              </t>
                              <t t-elif="notif.investor_response === 'confirmed'">
                                Bạn đã xác nhận bán hợp đồng giao dịch
                              </t>
                              <t t-elif="notif.investor_response === 'rejected'">
                                Bạn đã từ chối bán hợp đồng giao dịch
                              </t>
                              <t t-else="">
                                Thông báo đáo hạn đã hết hạn
                              </t>
                            </div>
                            <div class="small text-muted mb-0" style="font-size:0.75rem;line-height:1.3;">
                              <i class="fas fa-file-invoice me-1" style="font-size:0.7rem;"></i>Lệnh: <span class="fw-semibold text-dark"><t t-esc="notif.transaction_name"/></span>
                            </div>
                            <div class="small text-muted mb-0" style="font-size:0.75rem;line-height:1.3;">
                              <i class="fas fa-chart-line me-1" style="font-size:0.7rem;"></i>Quỹ: <span class="fw-semibold"><t t-esc="notif.fund_name"/></span>
                            </div>
                            <div class="small text-muted mb-0" style="font-size:0.75rem;line-height:1.3;">
                              <i class="fas fa-calendar-alt me-1" style="font-size:0.7rem;"></i>Ngày đáo hạn: <span class="fw-semibold text-dark"><t t-esc="notif.maturity_date"/></span>
                            </div>
                            <div class="small text-muted mb-0" style="font-size:0.75rem;line-height:1.3;">
                              <i class="fas fa-coins me-1" style="font-size:0.7rem;"></i>Số lượng: <span class="fw-semibold text-primary"><t t-esc="notif.units"/></span> CCQ
                            </div>
                          </div>
                        </div>
                        
                        <!-- Badge status và nút xóa -->
                        <div class="d-flex flex-column align-items-end gap-2">
                          <t t-if="notif.investor_response === 'pending'">
                            <span class="badge bg-warning text-dark rounded-pill px-2 py-0" style="font-size:0.7rem;">
                              <i class="fas fa-clock me-1" style="font-size:0.65rem;"></i>Chờ xử lý
                            </span>
                          </t>
                          <t t-elif="notif.investor_response === 'confirmed'">
                            <span class="badge bg-success rounded-pill px-2 py-0" style="font-size:0.7rem;">
                              <i class="fas fa-check me-1" style="font-size:0.65rem;"></i>Đã xác nhận
                            </span>
                          </t>
                          <t t-elif="notif.investor_response === 'rejected'">
                            <span class="badge bg-danger rounded-pill px-2 py-0" style="font-size:0.7rem;">
                              <i class="fas fa-times me-1" style="font-size:0.65rem;"></i>Đã từ chối
                            </span>
                          </t>
                          <t t-elif="notif.investor_response === 'expired'">
                            <span class="badge bg-danger rounded-pill px-2 py-0" style="font-size:0.7rem;">
                              <i class="fas fa-exclamation-triangle me-1" style="font-size:0.65rem;"></i>Hết hạn
                            </span>
                          </t>
                          <button class="btn btn-sm btn-link text-muted p-0" 
                                  style="font-size:0.75rem;text-decoration:none;"
                                  t-on-click.stop="() => this.deleteNotification(notif)"
                                  title="Xóa thông báo">
                            <i class="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </t>
                </div>
              </div>
            </div>
            <div class="d-flex align-items-center gap-3 hd-user-menu position-relative" id="accountDropdownWrapper" style="position:relative; z-index:3000;">
              <div class="hd-avatar rounded-circle d-flex align-items-center justify-content-center text-white fs-5 shadow-sm" style="width:48px;height:48px;background:linear-gradient(135deg, #f97316, #ea580c);border:2px solid rgba(255,255,255,0.2);">
                <i class="fas fa-user"></i>
              </div>
              <div class="d-none d-md-block text-end">
                <div class="fw-bold text-dark text-uppercase small mb-1" style="letter-spacing:0.5px;"><t t-esc="state.userName"/></div>
                <div class="text-muted small" style="font-size:11px;">SỐ TK: <span class="fw-semibold text-dark"><t t-esc="state.accountNo"/></span></div>
              </div>
              <i class="fas fa-chevron-down text-muted transition-all" style="font-size:12px;transition:all 0.2s ease;"></i>
              <div class="dropdown-menu shadow-lg border-0 rounded-3" id="accountDropdown" style="display: none; right:0; min-width:240px; top:120%; border-radius:16px !important; z-index:4000;">
                <div class="dropdown-item-text px-4 py-3">
                  <small class="text-muted d-block mb-1"><t t-esc="state.userName"/></small>
                  <div class="fw-bold text-dark">Nhà Đầu Tư</div>
                </div>
                <div class="dropdown-divider my-2"></div>
                <a class="dropdown-item px-4 py-2 transition-all" href="/my-account" style="transition:all 0.2s ease;">
                  <i class="fas fa-receipt me-3 text-muted"></i>Danh sách thanh toán
                </a>
                <a class="dropdown-item px-4 py-2 transition-all" href="#" t-on-click="logout" style="transition:all 0.2s ease;color:#f97316;">
                  <i class="fas fa-sign-out-alt me-3"></i>Đăng xuất
                </a>
              </div>
            </div>
          </t>
          <t t-else="">
            <button class="btn btn-primary px-4 py-2 rounded-pill shadow-sm transition-all" t-on-click="() => window.location.href='/web/login'" style="background:linear-gradient(135deg, #f97316, #ea580c);border:none;transition:all 0.3s ease;">
              <i class="fas fa-sign-in-alt me-2"></i>Đăng nhập
            </button>
          </t>
        </div>
      </div>
      <div class="hd-menu-bar rounded-bottom-4 px-4 py-3 mt-n1 shadow-sm" style="background:linear-gradient(135deg, #f97316, #ea580c); position:relative; z-index:1000;">
        <nav class="d-flex gap-4 justify-content-center align-items-center">
          <a t-attf-class="hd-menu-item #{state.currentPage === 'overview' ? 'active' : ''}" href="/investment_dashboard" style="color:rgba(255,255,255,0.95);text-decoration:none;padding:10px 18px;border-radius:24px;transition:all 0.3s ease;font-weight:500;font-size:14px;letter-spacing:0.3px;">
            <i class="fas fa-home me-2"></i>TỔNG QUAN
          </a>
          <a t-attf-class="hd-menu-item #{state.currentPage === 'products' ? 'active' : ''}" href="/fund_widget" style="color:rgba(255,255,255,0.95);text-decoration:none;padding:10px 18px;border-radius:24px;transition:all 0.3s ease;font-weight:500;font-size:14px;letter-spacing:0.3px;">
            <i class="fas fa-chart-line me-2"></i>SẢN PHẨM ĐẦU TƯ
          </a>
          <a t-attf-class="hd-menu-item #{state.currentPage === 'transactions' ? 'active' : ''}" href="/transaction_management/pending" style="color:rgba(255,255,255,0.95);text-decoration:none;padding:10px 18px;border-radius:24px;transition:all 0.3s ease;font-weight:500;font-size:14px;letter-spacing:0.3px;">
            <span class="fw-bold fs-5 me-2">$</span>QUẢN LÝ GIAO DỊCH
          </a>
          <a t-attf-class="hd-menu-item #{state.currentPage === 'assets' ? 'active' : ''}" href="/asset-management" style="color:rgba(255,255,255,0.95);text-decoration:none;padding:10px 18px;border-radius:24px;transition:all 0.3s ease;font-weight:500;font-size:14px;letter-spacing:0.3px;">
            <i class="far fa-clock me-2"></i>QUẢN LÝ TÀI SẢN
          </a>
          <a t-attf-class="hd-menu-item #{state.currentPage === 'profile' ? 'active' : ''}" href="/personal_profile" style="color:rgba(255,255,255,0.95);text-decoration:none;padding:10px 18px;border-radius:24px;transition:all 0.3s ease;font-weight:500;font-size:14px;letter-spacing:0.3px;">
            <i class="far fa-file-alt me-2"></i>HỒ SƠ CÁ NHÂN
          </a>
        </nav>
      </div>
      
      <!-- Modal hiển thị chi tiết thông báo đáo hạn -->
      <t t-if="state.showNotificationModal">
        <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.5); z-index:5000;">
          <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content rounded-4 shadow-lg">
              <div class="modal-header bg-primary text-white rounded-top-4">
                <h5 class="modal-title fw-bold">
                  <i class="fas fa-bell me-2"></i>Chi tiết thông báo
                </h5>
                <button type="button" class="btn-close btn-close-white" t-on-click="() => this.closeNotificationModal()"></button>
              </div>
              <div class="modal-body p-4">
                <t t-if="state.transactionDetails">
                  <div class="row mb-3">
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="text-muted small">Mã lệnh giao dịch</label>
                        <div class="fw-bold fs-5"><t t-esc="state.transactionDetails.transaction_name || 'N/A'"/></div>
                      </div>
                      <div class="mb-3">
                        <label class="text-muted small">Quỹ đầu tư</label>
                        <div class="fw-semibold"><t t-esc="state.transactionDetails.fund_name || 'N/A'"/></div>
                      </div>
                      <div class="mb-3">
                        <label class="text-muted small">Ngày đáo hạn</label>
                        <div class="fw-semibold text-warning"><t t-esc="state.transactionDetails.maturity_date || 'N/A'"/></div>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="text-muted small">Số lượng CCQ</label>
                        <div class="fw-bold fs-5 text-primary"><t t-esc="state.transactionDetails.units ? state.transactionDetails.units.toLocaleString('vi-VN') : 'N/A'"/></div>
                      </div>
                      <div class="mb-3">
                        <label class="text-muted small">Giá CCQ</label>
                        <div class="fw-semibold"><t t-esc="state.transactionDetails.ccq_price ? state.transactionDetails.ccq_price.toLocaleString('vi-VN') + ' VNĐ' : (state.transactionDetails.nav ? state.transactionDetails.nav.toLocaleString('vi-VN') + ' VNĐ' : 'N/A')"/></div>
                      </div>
                      <div class="mb-3">
                        <label class="text-muted small">Giá trị ước tính</label>
                        <div class="fw-bold text-success"><t t-esc="state.transactionDetails.estimated_value ? state.transactionDetails.estimated_value.toLocaleString('vi-VN') + ' VNĐ' : 'N/A'"/></div>
                      </div>
                    </div>
                  </div>
                  <div class="alert alert-warning d-flex align-items-center mb-4">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <div>
                      <strong>Lưu ý:</strong> Lệnh của bạn đã đến ngày đáo hạn. Vui lòng xác nhận có muốn bán lại số CCQ này không.
                      Nếu bạn đồng ý, hệ thống sẽ tự động tạo lệnh bán và đưa vào sổ lệnh để khớp.
                    </div>
                  </div>
                </t>
                <t t-else="">
                  <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Đang tải...</span>
                    </div>
                    <p class="mt-3 text-muted">Đang tải thông tin chi tiết...</p>
                  </div>
                </t>
              </div>
              <div class="modal-footer border-top">
                <t t-if="state.selectedNotification and state.selectedNotification.investor_response === 'pending'">
                  <button type="button" class="btn btn-secondary" t-on-click="() => this.closeNotificationModal()">
                    <i class="fas fa-times me-2"></i>Đóng
                  </button>
                  <button type="button" class="btn btn-danger" t-on-click="() => this.rejectNotification(state.selectedNotification)">
                    <i class="fas fa-times-circle me-2"></i>Từ chối bán
                  </button>
                  <button type="button" class="btn btn-success" t-on-click="() => this.confirmNotification(state.selectedNotification)">
                    <i class="fas fa-check-circle me-2"></i>Đồng ý bán
                  </button>
                </t>
                <t t-else="">
                  <button type="button" class="btn btn-secondary" t-on-click="() => this.closeNotificationModal()">
                    <i class="fas fa-times me-2"></i>Đóng
                  </button>
                </t>
              </div>
            </div>
          </div>
        </div>
         <div class="modal-backdrop fade show" t-on-click="() => this.closeNotificationModal()"></div>
       </t>
       
       <!-- Toast Notification Popup -->
       <t t-if="state.showToast">
         <div class="position-fixed top-0 end-0 p-3" style="z-index:9999; margin-top:80px;">
           <div t-attf-class="toast show align-items-center text-white bg-#{state.toastType === 'success' ? 'success' : state.toastType === 'error' ? 'danger' : state.toastType === 'warning' ? 'warning' : 'info'} border-0" role="alert" aria-live="assertive" aria-atomic="true" style="min-width:300px; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
             <div class="d-flex">
               <div class="toast-body d-flex align-items-center">
                 <i t-attf-class="fas #{state.toastType === 'success' ? 'fa-check-circle' : state.toastType === 'error' ? 'fa-exclamation-circle' : state.toastType === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'} me-2"></i>
                 <span t-esc="state.toastMessage"/>
               </div>
               <button type="button" class="btn-close btn-close-white me-2 m-auto" t-on-click="() => this.hideToast()"></button>
             </div>
           </div>
         </div>
       </t>
       
       <!-- Confirm Modal -->
       <t t-if="state.showConfirmModal">
         <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.5); z-index:6000;">
           <div class="modal-dialog modal-dialog-centered">
             <div class="modal-content rounded-4 shadow-lg">
               <div class="modal-header border-bottom">
                 <h5 class="modal-title fw-bold">
                   <i class="fas fa-question-circle me-2 text-warning"></i>Xác nhận
                 </h5>
                 <button type="button" class="btn-close" t-on-click="() => this.cancelConfirm()"></button>
               </div>
               <div class="modal-body p-4">
                 <p class="mb-0" t-esc="state.confirmMessage"/>
               </div>
               <div class="modal-footer border-top">
                 <button type="button" class="btn btn-secondary" t-on-click="() => this.cancelConfirm()">
                   <i class="fas fa-times me-2"></i>Hủy
                 </button>
                 <button type="button" class="btn btn-primary" t-on-click="() => this.executeConfirm()">
                   <i class="fas fa-check me-2"></i>Xác nhận
                 </button>
               </div>
             </div>
           </div>
         </div>
         <div class="modal-backdrop fade show" t-on-click="() => this.cancelConfirm()"></div>
       </t>
    </header>
    `;

    setup() {
        this.listenersAttached = false;
        this.notificationListenersAttached = false;
        this.websocketListenerAttached = false;
        this.state = useState({
            currentPage: this.getCurrentPage(),
            userName: '',
            accountNo: '',
            isLoggedIn: false,
            notifications: [],
            pendingNotificationsCount: 0,
            showNotificationModal: false,
            selectedNotification: null,
            transactionDetails: null,
            showToast: false,
            toastMessage: '',
            toastType: 'success', // 'success', 'error', 'warning', 'info'
            showConfirmModal: false,
            confirmMessage: '',
            confirmCallback: null,
            selectedNotificationIds: [], // Danh sách ID thông báo đã chọn để xóa
        });
        this.fetchUserInfo();

        onPatched(() => {
            if (this.state.isLoggedIn && !this.listenersAttached) {
                const wrapper = document.getElementById('accountDropdownWrapper');
                const dropdown = document.getElementById('accountDropdown');
                if (wrapper && dropdown) {
                    wrapper.addEventListener('click', (e) => {
                        e.stopPropagation();
                        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                        // Đóng notification dropdown khi mở account dropdown
                        const notifDropdown = document.getElementById('notificationDropdown');
                        if (notifDropdown) {
                            notifDropdown.style.display = 'none';
                        }
                    });
                    document.addEventListener('click', (e) => {
                        if (!wrapper.contains(e.target)) {
                            dropdown.style.display = 'none';
                        }
                    });
                    this.listenersAttached = true;
                }
            }

            // Attach listeners cho notification dropdown
            if (this.state.isLoggedIn && !this.notificationListenersAttached) {
                const notifWrapper = document.getElementById('notificationDropdownWrapper');
                const notifDropdown = document.getElementById('notificationDropdown');
                if (notifWrapper && notifDropdown) {
                    document.addEventListener('click', (e) => {
                        if (!notifWrapper.contains(e.target)) {
                            notifDropdown.style.display = 'none';
                        }
                    });
                    this.notificationListenersAttached = true;
                }
            }

            // Load notifications khi đã đăng nhập
            if (this.state.isLoggedIn) {
                this.fetchMaturityNotifications();
                // Subscribe websocket để nhận thông báo realtime
                this.setupWebSocketListener();
            }

            // Thêm CSS cho hiệu ứng hover và z-index
            this.addHoverStyles();

            if (this.state.isLoggedIn && (window.location.pathname === '/web' || window.location.pathname === '/web/')) {
                window.location.href = '/investment_dashboard';
            }
        });
    }

    addHoverStyles() {
        // Styles đã được di chuyển sang header.css
        // Không cần thêm styles nữa vì đã được load từ CSS file
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
                const soTk = await this.fetchStatusInfo();
                this.state.accountNo = soTk || '';
                this.state.isLoggedIn = true;
                // Load notifications sau khi đăng nhập
                this.fetchMaturityNotifications();
            } else {
                this.state.userName = '';
                this.state.accountNo = '';
                this.state.isLoggedIn = false;
                this.state.notifications = [];
                this.state.pendingNotificationsCount = 0;
            }
        } catch (e) {
            this.state.userName = '';
            this.state.accountNo = '';
            this.state.isLoggedIn = false;
            this.state.notifications = [];
            this.state.pendingNotificationsCount = 0;
        }
    }

    async fetchMaturityNotifications() {
        try {
            const response = await fetch('/api/transaction-list/maturity-notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'call',
                    params: {},
                    id: Math.floor(Math.random() * 1000000)
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const jsonRpcResponse = await response.json();
            // Với type='json', Odoo trả về JSON-RPC format: {jsonrpc: '2.0', id: null, result: {...}}
            const data = jsonRpcResponse.result || jsonRpcResponse;
            
            if (data && data.success && data.notifications) {
                this.state.notifications = data.notifications;
                // Đếm số thông báo chưa xử lý (pending)
                this.state.pendingNotificationsCount = data.notifications.filter(n => n.investor_response === 'pending').length;
            } else {
                this.state.notifications = [];
                this.state.pendingNotificationsCount = 0;
            }
        } catch (e) {
            console.error('Lỗi khi lấy thông báo đáo hạn:', e);
            this.state.notifications = [];
            this.state.pendingNotificationsCount = 0;
        }
    }

    toggleNotificationDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        const accountDropdown = document.getElementById('accountDropdown');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            // Đóng account dropdown khi mở notification dropdown
            if (accountDropdown) {
                accountDropdown.style.display = 'none';
            }
            // Reset selection khi đóng dropdown
            if (dropdown.style.display === 'none') {
                this.state.selectedNotificationIds = [];
            }
        }
    }
    
    toggleNotificationSelection(notificationId) {
        const index = this.state.selectedNotificationIds.indexOf(notificationId);
        if (index > -1) {
            this.state.selectedNotificationIds.splice(index, 1);
        } else {
            this.state.selectedNotificationIds.push(notificationId);
        }
    }
    
    toggleSelectAllNotifications() {
        if (this.state.selectedNotificationIds.length === this.state.notifications.length) {
            // Bỏ chọn tất cả
            this.state.selectedNotificationIds = [];
        } else {
            // Chọn tất cả
            this.state.selectedNotificationIds = this.state.notifications.map(n => n.id);
        }
    }
    
    async deleteSelectedNotifications() {
        if (this.state.selectedNotificationIds.length === 0) {
            return;
        }
        
        this.showConfirm(`Bạn có chắc chắn muốn xóa ${this.state.selectedNotificationIds.length} thông báo đã chọn?`, async () => {
            await this.performDeleteSelectedNotifications();
        });
    }
    
    async performDeleteSelectedNotifications() {
        try {
            const response = await fetch('/api/transaction-list/delete-maturity-notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'call',
                    params: {
                        notification_ids: this.state.selectedNotificationIds
                    },
                    id: Math.floor(Math.random() * 1000000)
                })
            });
            
            if (response.ok) {
                const jsonRpcResponse = await response.json();
                const data = jsonRpcResponse.result || jsonRpcResponse;
                if (data && data.success) {
                    const deletedCount = this.state.selectedNotificationIds.length;
                    this.state.selectedNotificationIds = [];
                    await this.fetchMaturityNotifications();
                    this.showToast(`Đã xóa ${deletedCount} thông báo thành công`, 'success');
                } else {
                    this.showToast('Không thể xóa thông báo: ' + (data.message || 'Lỗi không xác định'), 'error');
                }
            }
        } catch (error) {
            console.error('Lỗi khi xóa thông báo:', error);
            this.showToast('Lỗi kết nối: ' + error.message, 'error');
        }
    }

    async handleNotificationClick(notification) {
        // Đóng dropdown
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
        
        // Hiển thị modal với chi tiết giao dịch
        this.state.selectedNotification = notification;
        this.state.showNotificationModal = true;
        this.state.transactionDetails = null;
        
        // Lấy chi tiết transaction từ API
        try {
            const response = await fetch(`/api/transaction-list/get-transaction-details/${notification.transaction_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'call',
                    params: {},
                    id: Math.floor(Math.random() * 1000000)
                })
            });
            
            if (response.ok) {
                const jsonRpcResponse = await response.json();
                const data = jsonRpcResponse.result || jsonRpcResponse;
                if (data && data.success && data.transaction) {
                    const units = notification.units || notification.remaining_units || 0;
                    // Sử dụng giá CCQ từ tồn kho đầu ngày (đã được tính sẵn từ API)
                    const ccqPrice = data.transaction.ccq_price || data.transaction.current_nav || data.transaction.price || 0;
                    const estimatedValue = data.transaction.estimated_value || (units * ccqPrice);
                    
                    this.state.transactionDetails = {
                        transaction_name: data.transaction.name || notification.transaction_name,
                        fund_name: data.transaction.fund_name || notification.fund_name,
                        maturity_date: notification.maturity_date,
                        units: units,
                        ccq_price: ccqPrice,  // Giá CCQ từ tồn kho đầu ngày
                        nav: data.transaction.current_nav || data.transaction.price || 0,  // Giữ lại để fallback
                        estimated_value: estimatedValue
                    };
                }
            }
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết transaction:', error);
            // Vẫn hiển thị modal với thông tin từ notification
            this.state.transactionDetails = {
                transaction_name: notification.transaction_name,
                fund_name: notification.fund_name,
                maturity_date: notification.maturity_date,
                units: notification.units || notification.remaining_units || 0,
                ccq_price: 0,
                nav: 0,
                estimated_value: 0
            };
        }
    }
    
    closeNotificationModal() {
        this.state.showNotificationModal = false;
        this.state.selectedNotification = null;
        this.state.transactionDetails = null;
    }
    
    showToast(message, type = 'success') {
        this.state.toastMessage = message;
        this.state.toastType = type;
        this.state.showToast = true;
        // Tự động ẩn sau 5 giây
        setTimeout(() => {
            this.hideToast();
        }, 5000);
    }
    
    hideToast() {
        this.state.showToast = false;
        this.state.toastMessage = '';
    }
    
    showConfirm(message, callback) {
        this.state.confirmMessage = message;
        this.state.confirmCallback = callback;
        this.state.showConfirmModal = true;
    }
    
    executeConfirm() {
        if (this.state.confirmCallback) {
            this.state.confirmCallback();
        }
        this.cancelConfirm();
    }
    
    cancelConfirm() {
        this.state.showConfirmModal = false;
        this.state.confirmMessage = '';
        this.state.confirmCallback = null;
    }
    
    async deleteNotification(notification) {
        this.showConfirm('Bạn có chắc chắn muốn xóa thông báo này?', async () => {
            await this.performDeleteNotification(notification);
        });
    }
    
    async performDeleteNotification(notification) {
        
        try {
            const response = await fetch('/api/transaction-list/delete-maturity-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'call',
                    params: {
                        notification_id: notification.id
                    },
                    id: Math.floor(Math.random() * 1000000)
                })
            });
            
            if (response.ok) {
                const jsonRpcResponse = await response.json();
                const data = jsonRpcResponse.result || jsonRpcResponse;
                if (data && data.success) {
                    // Reload danh sách thông báo
                    await this.fetchMaturityNotifications();
                    this.showToast('Đã xóa thông báo thành công', 'success');
                } else {
                    this.showToast('Không thể xóa thông báo: ' + (data.message || 'Lỗi không xác định'), 'error');
                }
            }
        } catch (error) {
            console.error('Lỗi khi xóa thông báo:', error);
            this.showToast('Lỗi kết nối: ' + error.message, 'error');
        }
    }
    
    async confirmNotification(notification) {
        this.showConfirm('Bạn có chắc chắn muốn đồng ý bán lệnh này? Hệ thống sẽ tự động tạo lệnh bán.', async () => {
            await this.performConfirmNotification(notification);
        });
    }
    
    async performConfirmNotification(notification) {
        try {
            const response = await fetch(`/api/transaction-list/confirm-maturity-notification/${notification.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'call',
                    params: {},
                    id: Math.floor(Math.random() * 1000000)
                })
            });
            
            if (response.ok) {
                const jsonRpcResponse = await response.json();
                const data = jsonRpcResponse.result || jsonRpcResponse;
                if (data && data.success) {
                    const sellOrderName = data.sell_order_name || '';
                    const message = sellOrderName 
                        ? `Đã xác nhận bán thành công! Lệnh bán ${sellOrderName} đã được tạo và sẽ được đưa vào sổ lệnh để khớp.`
                        : 'Đã xác nhận bán thành công! Lệnh bán đã được tạo và sẽ được đưa vào sổ lệnh để khớp.';
                    this.showToast(message, 'success');
                    this.closeNotificationModal();
                    await this.fetchMaturityNotifications();
                } else {
                    this.showToast('Không thể xác nhận: ' + (data.message || 'Lỗi không xác định'), 'error');
                }
            } else {
                const errorText = await response.text();
                console.error('Lỗi HTTP:', response.status, errorText);
                this.showToast('Lỗi kết nối: HTTP ' + response.status, 'error');
            }
        } catch (error) {
            console.error('Lỗi khi xác nhận:', error);
            this.showToast('Lỗi kết nối: ' + error.message, 'error');
        }
    }
    
    async rejectNotification(notification) {
        this.showConfirm('Bạn có chắc chắn muốn từ chối bán lệnh này?', async () => {
            await this.performRejectNotification(notification);
        });
    }
    
    async performRejectNotification(notification) {
        try {
            const response = await fetch(`/api/transaction-list/reject-maturity-notification/${notification.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'call',
                    params: {},
                    id: Math.floor(Math.random() * 1000000)
                })
            });
            
            if (response.ok) {
                const jsonRpcResponse = await response.json();
                const data = jsonRpcResponse.result || jsonRpcResponse;
                if (data && data.success) {
                    this.showToast('Đã từ chối bán thành công', 'success');
                    this.closeNotificationModal();
                    await this.fetchMaturityNotifications();
                } else {
                    this.showToast('Không thể từ chối: ' + (data.message || 'Lỗi không xác định'), 'error');
                }
            }
        } catch (error) {
            console.error('Lỗi khi từ chối:', error);
            this.showToast('Lỗi kết nối: ' + error.message, 'error');
        }
    }

    setupWebSocketListener() {
        // Lắng nghe custom event từ bus service
        if (this.websocketListenerAttached) {
            return;
        }
        
        // Lắng nghe event khi nhận thông báo đáo hạn mới
        window.addEventListener('maturity-notification-received', (event) => {
            const payload = event.detail;
            if (payload && payload.type === 'maturity_notification') {
                // Reload danh sách thông báo
                this.fetchMaturityNotifications();
            }
        });
        
        // Lắng nghe event khi nhận thông báo xác nhận
        window.addEventListener('maturity-confirmation-received', (event) => {
            const payload = event.detail;
            if (payload && payload.type === 'maturity_confirmation') {
                // Reload danh sách thông báo để cập nhật trạng thái
                this.fetchMaturityNotifications();
            }
        });
        
        this.websocketListenerAttached = true;
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

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('/investment_dashboard')) return 'overview';
        if (path.includes('/fund_widget')) return 'products';
        if (path.includes('/transaction_management')) return 'transactions';
        if (path.includes('/asset-management')) return 'assets';
        if (path.includes('/personal_profile')) return 'profile';
        return 'overview';
    }
}

window.Header = Header;
