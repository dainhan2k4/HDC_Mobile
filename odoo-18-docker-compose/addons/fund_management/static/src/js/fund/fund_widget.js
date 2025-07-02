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
                    <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                            t-on-click="() => this.selectFund(fund)">
                      <span><t t-esc="fund.name" /></span>
                      <small class="text-muted"><t t-esc="fund.current_nav" /></small>
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

                <!-- Fund Detail Values -->
                <div class="row mb-4">
                  <div class="col-md-4 text-center">
                    <h6>Giá trị từ đầu năm</h6>
                    <p class="fs-5 text-primary"><t t-esc="state.selectedFund?.current_ytd || '-'" /></p>
                  </div>
                  <div class="col-md-4 text-center">
                    <h6>Giá trị hiện tại</h6>
                    <p class="fs-5 text-success"><t t-esc="state.selectedFund?.current_nav || '-'" /></p>
                  </div>
                  <div class="col-md-4 text-center">
                    <h6>Giá thấp nhất</h6>
                    <p class="fs-5 text-danger"><t t-esc="state.selectedFund?.low_nav || '-'" /></p>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="d-flex justify-content-center gap-2 mb-4">
                  <button class="btn btn-link" t-on-click="() => goToFundCompare(state.selectedFund)">Compare</button>
                  <button class="btn btn-dark" t-on-click="() => goToBuyFund(state.selectedFund)">Mua</button>
                  <button class="btn btn-outline-dark" t-on-click="() => goToSellFund(state.selectedFund)">Bán</button>
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
        });

        this.state.activeRange = '1M';  // mặc định

        onMounted(async () => {
            // Load Chart.js dynamically
            await loadJS("https://cdn.jsdelivr.net/npm/chart.js");

            // Fetch fund data
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

            this.updateNavChartRange(this.state.activeRange);  // ← Gọi luôn với '1M'

            // Draw charts
            this.drawCharts();
        });
    }

    // Thêm hàm này để khi click fund thì cập nhật state.selectedFund
    selectFund(fund) {
        console.log("✅ Selected Fund:", fund);
        this.state.selectedFund = fund;

        this.updateNavChartRange("1M");
    }

    drawCharts() {

        this.drawNavLineChart();  // <--- gọi hàm riêng này

    }

    goToStockPage(fund) {
        console.log("Redirecting to stock page for fund:", fund);
        window.location.href = "/stock_widget";
    }

    goToFundCompare(fund) {
        console.log("Redirecting to fund compare:", fund);
        window.location.href = "/fund_compare";
    }

    goToBuyFund(fund) {
        console.log("Redirecting to buy fund:", fund);
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
                    borderColor: '#36A2EB',
                    backgroundColor: 'rgba(54,162,235,0.1)',
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


    updateNavChartRange(range) {
        console.log("⏳ Changing NAV chart range to:", range);
        this.state.activeRange = range;

        // Dữ liệu thủ công theo từng khoảng thời gian
        const navDataByRange = {
            '1M': {
                labels: ['01-06', '03-06', '05-06', '07-06', '09-06', '11-06', '13-06', '15-06', '18-06', '22-06'],
                values: [16500, 16800, 16200, 17000, 16000, 15800, 17200, 15600, 18500, 19678]
            },
            '3M': {
                labels: ['01-04', '08-04', '15-04', '22-04', '29-04', '06-05', '13-05', '20-05', '01-06', '22-06'],
                values: [19500, 18800, 19200, 18000, 17500, 18200, 17800, 17100, 18800, 20678]
            },
            '6M': {
                labels: ['01-01', '15-01', '01-02', '15-02', '01-03', '15-03', '01-04', '01-05', '01-06', '22-06'],
                values: [21000, 20000, 19000, 19800, 18000, 18500, 17500, 16000, 22500, 21678]
            },
            '1Y': {
                labels: ['06-2024', '08-2024', '10-2024', '12-2024', '01-2025', '02-2025', '03-2025', '04-2025', '05-2025', '06-2025'],
                values: [28000, 25000, 26500, 23000, 22500, 21000, 20500, 19000, 17000, 15678]
            }
        };

        const chartData = navDataByRange[range];
        this.drawNavLineChart(chartData.labels, chartData.values);
    }



}
