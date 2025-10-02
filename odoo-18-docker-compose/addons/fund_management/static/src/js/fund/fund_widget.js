/** @odoo-module **/

import { Component, xml, useState, onMounted } from "@odoo/owl";
import { loadJS } from "@web/core/assets";

export class FundWidget extends Component {
    static template = xml`
        <div class="fund-dashboard container-xl py-4">

          <div class="row">
            <!-- Left Panel: Fund List -->
            <div class="col-md-3">
              <div class="card rounded-4 shadow-sm p-3">
                <h5 class="mb-3">Danh mục đầu tư</h5>
                <div class="list-group">
                  <t t-foreach="state.funds" t-as="fund" t-key="fund.ticker">
                    <button type="button"
                            t-att-class="[
                                'list-group-item',
                                'list-group-item-action',
                                'd-flex',
                                'justify-content-between',
                                'align-items-center',
                                state.compareFunds.includes(fund) ? 'active' : ''
                            ].join(' ')"
                            t-on-click="() => state.compareMode ? this.toggleCompareFund(fund) : this.selectFund(fund)">
                      <span><t t-esc="fund.name" /></span>
                      <small class="text-muted"><t t-esc="fund.current_nav" /></small> <!-- Giữ lại cho hiển thị, nhưng không dùng để tính toán -->
                    </button>
                  </t>
                  <t t-if="state.funds.length === 0">
                    <div class="text-danger text-center py-2">No fund data available.</div>
                  </t>
                </div>
              </div>
            </div>

            <!-- Right Panel: Fund Details -->
            <div class="col-md-9">
              <div class="card rounded-4 shadow-sm p-4">
                <h4 class="mb-3">Quỹ Đầu tư <t t-esc="state.selectedFund?.name || 'Chọn Quỹ'" /></h4>

                <!-- Fund Description -->
                <div class="mb-4">
                  <p class="text-muted"><t t-esc="state.selectedFund?.description || 'Vui lòng chọn quỹ để xem thông tin chi tiết.'" /></p>
                </div>

                <!-- Fund Detail Cards -->
                <div class="row mb-4">
                  <div class="col-md-3">
                    <div class="card shadow-sm rounded-3 text-center py-2">
                      <div class="card-body">
                        <h6 class="card-title text-muted mb-1">Giá trị từ đầu năm</h6>
                        <p class="fs-5 text-primary fw-bold mb-0">
                          <t t-esc="state.selectedFund?.current_ytd || '-'" />
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="col-md-3">
                    <div class="card shadow-sm rounded-3 text-center py-2">
                      <div class="card-body">
                        <h6 class="card-title text-muted mb-1">Giá trị hiện tại</h6>
                        <p class="fs-5 text-success fw-bold mb-0">
                          <t t-esc="state.selectedFund?.current_nav || '-'" /> <!-- Giữ lại cho hiển thị, nhưng không dùng để tính toán -->
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="col-md-3">
                    <div class="card shadow-sm rounded-3 text-center py-2">
                      <div class="card-body">
                        <h6 class="card-title text-muted mb-1">Giá cao nhất</h6>
                        <p class="fs-5 text-danger fw-bold mb-0">
                          <t t-esc="state.selectedFund?.hight_nav || '-'" />
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="col-md-3">
                    <div class="card shadow-sm rounded-3 text-center py-2">
                      <div class="card-body">
                        <h6 class="card-title text-muted mb-1">Giá thấp nhất</h6>
                        <p class="fs-5 text-danger fw-bold mb-0">
                          <t t-esc="state.selectedFund?.low_nav || '-'" />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="d-flex justify-content-center flex-wrap gap-3 mb-4">
                  <!-- Compare Button -->
                    <button class="btn btn-pill btn-compare"
                            t-on-click="() => this.compareSelectedFunds()">
                      📊 So sánh CCQ
                    </button>

                    <!-- Buy Button -->
                    <button class="btn btn-pill btn-buy"
                            t-on-click="() => goToBuyFund(state.selectedFund)">
                      💰 Mua
                    </button>

                    <!-- Sell Button -->
                    <button class="btn btn-pill btn-sell"
                            t-on-click="() => goToSellFund(state.selectedFund)">
                      💸 Bán
                    </button>

                    <t t-if="state.compareMode">
                      <button class="btn btn-sm btn-outline-secondary"
                              t-on-click="() => this.resetCompareMode()">
                        ❌ Hủy so sánh
                      </button>
                    </t>
                </div>

                <div class="mb-3">
                  <div class="btn-group border bg-light rounded-pill overflow-hidden shadow-sm" role="group" aria-label="Time range filter">
                    <t t-set="rangeOptions" t-value="['1M', '3M', '6M', '1Y']" />
                    <t t-foreach="rangeOptions" t-as="range" t-key="range">
                      <button
                        t-att-class="[
                          'btn',
                          'custom-range-btn',
                          range === state.activeRange ? 'active-range' : '',
                          range === '1M' ? 'rounded-start-pill' : '',
                          range === '1Y' ? 'rounded-end-pill' : ''
                        ].join(' ')"
                        t-on-click="() => this.updateNavChartRange(range)">
                        <t t-esc="range === '1M' ? '1 Tháng' : range === '3M' ? '3 Tháng' : range === '6M' ? '6 Tháng' : '1 Năm'" />
                      </button>
                    </t>
                  </div>
                </div>


                <div class="row mb-4">
                  <div class="col-12 d-flex justify-content-center">
                    <div style="width: 100%; max-width: 800px;">
                      <canvas id="navLineChart" class="chart-canvas"></canvas>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
    `;

    setup() {
        console.log("🎯 FundWidget - setup called!");

        this.state = useState({
            loading: true,
            funds: [],
            selectedFund: null,
            activeRange: '1M',
            compareFunds: [],   // 👈 THÊM DÒNG NÀY
            compareMode: false,   // 👈 Thêm dòng này
        });


        this.state.activeRange = '1M';  // mặc định

        onMounted(async () => {
            // Load Chart.js dynamically
            await loadJS("https://cdn.jsdelivr.net/npm/chart.js");

            try {
                const response = await fetch('/data_fund');
                const data = await response.json();
                console.log("📥 Fund data:", data);
                this.state.funds = data;
            } catch (error) {
                console.error("❌ Error fetching funds:", error);
            } finally {
                this.state.loading = false;
            }

        });
    }

    // Thêm hàm này để khi click fund thì cập nhật state.selectedFund
    selectFund(fund) {
        this.unable_roll();

        console.log("✅ Selected Fund:", fund);
        this.state.selectedFund = fund;

        const navHistory = fund.nav_history_json
            ? JSON.parse(fund.nav_history_json)
            : [];

        const labels = navHistory.map(entry => {
            const d = new Date(entry.date);
            return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        });

        const values = navHistory.map(entry => entry.value);

        this.drawNavLineChart(labels, values);


    }

    drawCharts() {
        this.drawNavLineChart();  // <--- gọi hàm riêng này
    }

    goToStockPage(fund) {
        console.log("Redirecting to stock page for fund:", fund);
        window.location.href = "/stock_widget";
    }

    goToBuyFund(fund) {
        if (fund) {
            sessionStorage.setItem('selectedTicker', fund.ticker);
        } else {
            sessionStorage.removeItem('selectedTicker'); // hoặc bỏ dòng này nếu muốn giữ nguyên session cũ
        }
        window.location.href = "/fund_buy";
    }

    goToSellFund(fund) {
        console.log("Redirecting to sell fund:", fund);
        window.location.href = "/fund_sell";
    }

    drawNavLineChart(labels = [], values = []) {
        const navCtx = document.getElementById('navLineChart');

        if (window.Chart && navCtx) {
            if (this.navChartInstance) {
                this.navChartInstance.destroy();  // Xoá biểu đồ cũ
            }

            this.navChartInstance = new Chart(navCtx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'NAV/Unit (VND)',
                        data: values,
                        borderColor: '#dc3545', // đỏ đậm giống header
                        backgroundColor: 'rgba(220, 53, 69, 0.1)', // đỏ nhạt có độ trong suốt
                        fill: true,
                        tension: 0.3,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                    }]
                },

                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Biến động NAV/Unit theo thời gian'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                callback: (value) => value.toLocaleString('vi-VN') + '₫'
                            }
                        }
                    }
                }
            });
        } else {
            console.warn("⚠️ Chart.js hoặc canvas chưa sẵn sàng!");
        }
    }

    updateNavChartRange(range) {        // Cập nhật NAV theo thời gian thật
        this.unable_roll();
        console.log("⏳ Changing NAV chart range to:", range);
        this.state.activeRange = range;

        const fund = this.state.selectedFund;
        if (!fund || !fund.nav_history_json) {
            console.warn("⚠️ Không có dữ liệu nav_history_json!");
            return;
        }

        const allData = JSON.parse(fund.nav_history_json);

        const now = new Date();
        const getDateMonthsAgo = (months) => {
            const d = new Date(now);
            d.setMonth(d.getMonth() - months);
            return d;
        };

        let startDate;
        switch (range) {
            case '1M':
                startDate = getDateMonthsAgo(1); break;
            case '3M':
                startDate = getDateMonthsAgo(3); break;
            case '6M':
                startDate = getDateMonthsAgo(6); break;
            case '1Y':
                startDate = getDateMonthsAgo(12); break;
            default:
                startDate = getDateMonthsAgo(1); break;
        }

        // Lọc dữ liệu trong khoảng thời gian được chọn
        const filtered = allData.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= startDate && entryDate <= now;
        });

        const labels = filtered.map(entry => {
            const d = new Date(entry.date);
            return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        });

        const values = filtered.map(entry => entry.value);
        this.drawNavLineChart(labels, values);
    }

    toggleCompareFund(fund) {
        this.unable_roll();
        const index = this.state.compareFunds.indexOf(fund);

        if (index > -1) {
            this.state.compareFunds.splice(index, 1);
        } else {
            if (this.state.compareFunds.length >= 4) {
                Swal.fire({
                    icon: "warning",
                    title: "Giới hạn!",
                    text: "⚠️ Bạn chỉ có thể chọn tối đa 4 quỹ để so sánh.",
                    confirmButtonColor: "#dc3545"
                });
                return;
            }
            this.state.compareFunds.push(fund);
        }

        // ✅ Luôn bật chế độ so sánh và vẽ lại mỗi khi có thay đổi
        this.state.compareMode = true;
        this.compareSelectedFunds();
    }


    compareSelectedFunds() {
        if (!this.state.compareMode) {
            this.state.compareMode = true;
            Swal.fire({
                title: "Thông báo!",
                text: "Hãy chọn các sản phẩm chứng chỉ quỹ để so sánh.",
                icon: "info",
                confirmButtonText: "OK",
                confirmButtonColor: "#36A2EB"
            });
            return;
        }

        const selected = this.state.compareFunds;

        const datasets = selected.map((fund, index) => {
            const navData = fund.nav_history_json ? JSON.parse(fund.nav_history_json) : [];

            const values = navData.map(e => e.value);

            // Lấy ngày định dạng dd-mm từ quỹ đầu tiên
            if (index === 0) {
                this.compareLabels = navData.map(e => {
                    const d = new Date(e.date);
                    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                });
            }

            const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545'];
            const bgColors = ['rgba(0,123,255,0.1)', 'rgba(40,167,69,0.1)', 'rgba(255,193,7,0.1)', 'rgba(220,53,69,0.1)'];

            return {
                label: `${fund.name} (NAV)`,
                data: values,
                borderColor: colors[index % colors.length],
                backgroundColor: bgColors[index % bgColors.length],
                fill: false,
                tension: 0.3
            };
        });

        const navCtx = document.getElementById('navLineChart');
        if (this.navChartInstance) {
            this.navChartInstance.destroy();
        }

        this.navChartInstance = new Chart(navCtx, {
            type: 'line',
            data: {
                labels: this.compareLabels,
                datasets: datasets
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'So sánh NAV/Unit giữa các Quỹ'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: (value) => value.toLocaleString('vi-VN') + '₫'
                        }
                    }
                }
            }
        });
    }



    resetCompareMode() {
        this.unable_roll();
        this.state.compareMode = false;
        this.state.compareFunds = [];

        // Gọi lại biểu đồ NAV của quỹ đang được chọn
        const fund = this.state.selectedFund;
        if (!fund || !fund.nav_history_json) {
            console.warn("⚠️ Không có dữ liệu quỹ để vẽ lại!");
            return;
        }

        const allData = JSON.parse(fund.nav_history_json);

        const now = new Date();
        const getDateMonthsAgo = (months) => {
            const d = new Date(now);
            d.setMonth(d.getMonth() - months);
            return d;
        };

        let startDate;
        switch (this.state.activeRange) {
            case '1M':
                startDate = getDateMonthsAgo(1); break;
            case '3M':
                startDate = getDateMonthsAgo(3); break;
            case '6M':
                startDate = getDateMonthsAgo(6); break;
            case '1Y':
                startDate = getDateMonthsAgo(12); break;
            default:
                startDate = getDateMonthsAgo(1); break;
        }

        const filtered = allData.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= startDate && entryDate <= now;
        });

        const labels = filtered.map(entry => {
            const d = new Date(entry.date);
            return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        });

        const values = filtered.map(entry => entry.value);

        this.drawNavLineChart(labels, values);
    }

    unable_roll(){
      const scrollTop = window.scrollY;
      requestAnimationFrame(() => {
          window.scrollTo(0, scrollTop);
        });
    }
}
