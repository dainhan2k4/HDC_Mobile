/** @odoo-module **/

import { Component, xml, useState, onMounted } from "@odoo/owl";
import { loadJS } from "@web/core/assets";
import { useService } from "@web/core/utils/hooks";

export class FundWidget extends Component {
    static template = xml`
        <div class="fund-dashboard container-xl py-4">

          <div class="row">
            <!-- Left Panel: Fund List (card/table-like with scroll) -->
            <div class="col-md-3">
              <div class="card shadow-sm border-0 h-100">
                <div class="px-3 py-2" style="background: linear-gradient(90deg,#fb923c,#f97316); color:#fff; border-top-left-radius:.5rem; border-top-right-radius:.5rem;">
                  <div class="d-flex align-items-center justify-content-between">
                    <div class="fw-semibold">Danh mục đầu tư</div>
                  
                  </div>
                </div>
                <div class="px-0" style="max-height:70vh; overflow-y:auto;">
                  <!-- Header row -->
                  <div class="d-flex px-1 py-1 small text-muted" style="position:sticky; top:0; background:#fff; z-index:1; border-bottom:1px solid #eee; font-size:.75rem;">
                    <div class="flex-grow-1 text-truncate text-center">MÃ QUỸ</div>
                    <div class="text-center" style="width:78px;">GIÁ</div>
                    <div class="text-center" style="width:96px;">KL</div>
                  </div>
                  <!-- Data rows -->
                  <t t-foreach="state.funds" t-as="fund" t-key="fund.ticker">
                    <button type="button"
                            class="w-100 border-0 bg-white"
                            style="padding:.25rem .4rem; border-bottom:1px solid #f1f5f9; text-align:left;"
                            t-on-click="() => state.compareMode ? this.toggleCompareFund(fund) : this.selectFund(fund)">
                      <div class="d-flex align-items-center" style="font-size:.8rem;">
                        <div class="flex-grow-1 me-2 text-truncate text-center">
                          <span class="small"
                                t-att-style="'display:inline-block; padding:.08rem .4rem; border-radius:999px; background:'+ this.getFundColor(fund) + '; color:#fff; text-align:center;'">
                            <t t-esc="fund.ticker" />
                          </span>
                        </div>
                        <div class="text-center" style="width:78px;">
                          <t t-set="pdir" t-value="(state.flashPriceByTicker &amp;&amp; state.flashPriceByTicker[fund.ticker]) || ''"/>
                          <span t-att-style="'display:inline-block; padding:.12rem .3rem; border-radius:.3rem; line-height:1; text-align:center; background:'
                            + (pdir==='up' ? '#dcfce7' : (pdir==='down' ? '#fee2e2' : '#fff7ed'))
                            + '; border:1px solid '
                            + (pdir==='up' ? '#86efac' : (pdir==='down' ? '#fecaca' : '#fed7aa'))
                            + '; color:'
                            + (pdir==='up' ? '#166534' : (pdir==='down' ? '#991b1b' : '#9a3412'))
                            + ';'">
                            <t t-esc="fund.current_nav || '-'" />
                          </span>
                        </div>
                        <div class="text-center" style="width:96px;">
                          <t t-set="vdir" t-value="(state.flashVolumeByTicker &amp;&amp; state.flashVolumeByTicker[fund.ticker]) || ''"/>
                          <span t-att-style="'display:inline-block; padding:.12rem .3rem; border-radius:.3rem; line-height:1; text-align:center; background:'
                            + (vdir==='up' ? '#eff6ff' : (vdir==='down' ? '#fef2f2' : '#f1f5f9'))
                            + '; border:1px solid '
                            + (vdir==='up' ? '#bfdbfe' : (vdir==='down' ? '#fecaca' : '#e5e7eb'))
                            + '; color:'
                            + (vdir==='up' ? '#1e40af' : (vdir==='down' ? '#991b1b' : '#111827'))
                            + ';'">
                            <t t-esc="(+ (fund.volume || 0)).toLocaleString('vi-VN')" />
                          </span>
                        </div>
                      </div>
                    </button>
                  </t>
                  <t t-if="state.funds.length === 0">
                    <div class="text-danger text-center py-3">No fund data available.</div>
                  </t>
                </div>
              </div>
            </div>

            <!-- Right Panel: Fund Details -->
            <div class="col-md-9">
              <div class="card rounded-4 shadow-sm p-4 fund-detail-card">
                <h4 class="mb-1">Quỹ Đầu tư <t t-esc="state.selectedFund?.name || 'Chọn Quỹ'" /></h4>
                <div class="subtle mb-3">
                  <t t-esc="state.selectedFund?.ticker || ''" />
                  <t t-if="state.selectedFund &amp;&amp; state.selectedFund.investment_type"> - <t t-esc="state.selectedFund.investment_type" /></t>
                </div>

                <!-- Fund Description -->
                <div class="mb-4">
                  <p class="text-muted"><t t-esc="state.selectedFund?.description || 'Vui lòng chọn quỹ để xem thông tin chi tiết.'" /></p>
                </div>

                <!-- Fund Detail Cards -->
                <div class="row mb-4">
                  <div class="col-md-3">
                    <div class="card shadow-sm rounded-3 text-center py-2">
                      <div class="card-body">
                        <h6 class="card-title text-muted mb-1">Giá mở cửa</h6>
                        <p class="fs-5 text-primary fw-bold mb-0">
                          <t t-esc="state.selectedFund?.open_price || '-'" />
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="col-md-3">
                    <div class="card shadow-sm rounded-3 text-center py-2">
                      <div class="card-body">
                        <h6 class="card-title text-muted mb-1">Giá trị hiện tại</h6>
                        <p class="fs-5 fw-bold mb-0">
                          <span t-att-class="[
                            (state.selectedFund &amp;&amp; state.flashByTicker &amp;&amp; state.flashByTicker[state.selectedFund.ticker] === 'up') ? 'flash-text-up' : '',
                            (state.selectedFund &amp;&amp; state.flashByTicker &amp;&amp; state.flashByTicker[state.selectedFund.ticker] === 'down') ? 'flash-text-down' : ''
                          ].join(' ')">
                            <t t-esc="state.selectedFund?.current_nav || '-'" />
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="col-md-3">
                    <div class="card shadow-sm rounded-3 text-center py-2">
                      <div class="card-body">
                        <h6 class="card-title text-muted mb-1">Giá cao nhất</h6>
                        <p class="fs-5 text-danger fw-bold mb-0">
                          <t t-esc="state.selectedFund?.high_price || '-'" />
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="col-md-3">
                    <div class="card shadow-sm rounded-3 text-center py-2">
                      <div class="card-body">
                        <h6 class="card-title text-muted mb-1">Giá thấp nhất</h6>
                        <p class="fs-5 text-danger fw-bold mb-0">
                          <t t-esc="state.selectedFund?.low_price || '-'" />
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
                       So sánh CCQ
                    </button>

                    <!-- Buy Button -->
                    <button class="btn btn-pill btn-buy"
                            t-on-click="() => goToBuyFund(state.selectedFund)">
                       Mua
                    </button>

                    <!-- Sell Button -->
                    <button class="btn btn-pill btn-sell"
                            t-on-click="() => goToSellFund(state.selectedFund)">
                       Bán
                    </button>

                    <t t-if="state.compareMode">
                      <button class="btn btn-sm btn-outline-secondary"
                              t-on-click="() => this.resetCompareMode()">
                        Hủy so sánh
                      </button>
                    </t>
                </div>

                <!-- NAV/Unit chart removed per request -->

                <!-- Chart Toolbar (TradingView style) -->
                <div class="chart-toolbar-container mb-3" style="background: #f8f9fa; border-radius: 8px; padding: 8px 12px;">
                  <div class="d-flex align-items-center flex-wrap gap-2">
                    <!-- Symbol Search & Compare -->
                    <div class="d-flex align-items-center gap-1">
                      <button class="btn btn-sm btn-outline-dark" 
                              t-on-click="() => this.openSymbolSearch()"
                              style="font-weight: 600; text-transform: uppercase;">
                        <i class="fas fa-search me-1"></i>
                        <t t-esc="state.selectedFund?.ticker || 'Chọn CCQ'" />
                      </button>
                      <button class="btn btn-sm btn-outline-dark" 
                              t-on-click="() => this.toggleCompareMode()"
                              title="So sánh hoặc thêm CCQ">
                        <i class="fas fa-plus"></i>
                      </button>
                    </div>
                    
                    <div class="vr" style="height: 24px; opacity: 0.3;"></div>
                    
                    <!-- Interval Selector -->
                    <div class="btn-group btn-group-sm" role="group">
                      <button type="button" 
                              class="btn btn-outline-secondary"
                              t-on-click="() => this.setInterval('1D')"
                              t-att-class="{'active': state.interval === '1D'}">
                        1D
                      </button>
                      <button type="button" 
                              class="btn btn-outline-secondary"
                              t-on-click="() => this.setInterval('1W')"
                              t-att-class="{'active': state.interval === '1W'}">
                        1W
                      </button>
                      <button type="button" 
                              class="btn btn-outline-secondary"
                              t-on-click="() => this.setInterval('1M')"
                              t-att-class="{'active': state.interval === '1M'}">
                        1M
                      </button>
                    </div>
                    
                    <div class="vr" style="height: 24px; opacity: 0.3;"></div>
                    
                    <!-- Chart Style -->
                    <div class="btn-group btn-group-sm" role="group">
                      <button type="button" 
                              class="btn btn-outline-secondary"
                              t-on-click="() => this.setChartStyle('candles')"
                              t-att-class="{'active': state.chartStyle === 'candles'}"
                              title="Candles">
                        <i class="fas fa-chart-bar"></i>
                      </button>
                      <button type="button" 
                              class="btn btn-outline-secondary"
                              t-on-click="() => this.setChartStyle('line')"
                              t-att-class="{'active': state.chartStyle === 'line'}"
                              title="Line">
                        <i class="fas fa-chart-line"></i>
                      </button>
                    </div>
                    
                    <div class="vr" style="height: 24px; opacity: 0.3;"></div>
                    
                    <!-- Compare Funds Display -->
                    <t t-if="state.compareFunds &amp;&amp; state.compareFunds.length &gt; 0">
                      <div class="d-flex align-items-center gap-1 flex-wrap">
                        <span class="small text-muted">So sánh:</span>
                        <t t-foreach="state.compareFunds" t-as="cf" t-key="cf.ticker">
                          <span class="badge bg-primary" 
                                t-att-style="'background-color: ' + this.getFundColor(cf) + ';'">
                            <t t-esc="cf.ticker" />
                            <button class="btn-close btn-close-white ms-1" 
                                    style="font-size: 0.7em;"
                                    t-on-click="() => this.removeCompareFund(cf)"></button>
                          </span>
                        </t>
                      </div>
                    </t>
                    
                    <div class="ms-auto d-flex align-items-center gap-1">
                      <!-- Date Range Selector -->
                      <div class="btn-group btn-group-sm border bg-light rounded-pill overflow-hidden shadow-sm" role="group">
                        <t t-set="candleRanges" t-value="['1D','5D','1M','3M']" />
                      <t t-foreach="candleRanges" t-as="cr" t-key="cr">
                          <button class="btn custom-range-btn range-candle" 
                                  t-att-class="{'active': state.candleRange === cr}"
                                  t-on-click="() => this.updateCandleRange(cr)">
                          <t t-esc="cr" />
                        </button>
                      </t>
                       </div>
                      
                      <button class="btn btn-sm btn-outline-secondary" 
                              t-on-click="() => this.scrollToRealtime()"
                              title="Go to realtime">
                        <i class="fas fa-arrow-right"></i>
                      </button>
                     </div>
                  </div>
                </div>

                <div class="candlestick-panel">
                  <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                     <h6 class="mb-0 section-title">Biểu đồ biến động</h6>
                  </div>
                  <div class="row">
                     <div class="col-12">
                       <div class="candle-wrapper" style="position: relative; width: 100%; height: 600px; background: #0b0f1a; border-radius: 8px; overflow: hidden;">
                         <div id="candleContainer" class="candle-container" style="width: 100%; height: 100%;"></div>
                         <div class="chart-overlay-controls" style="position: absolute; bottom: 10px; left: 10px; display: flex; gap: 8px; z-index: 10;">
                           <button class="btn btn-sm btn-outline-light" 
                                   t-on-click="() => this.resetChartView()"
                                   title="Reset chart view">
                             <i class="fas fa-redo"></i>
                           </button>
                           <button class="btn btn-sm btn-outline-light" 
                                   t-on-click="() => this.fitChartContent()"
                                   title="Fit content">
                             <i class="fas fa-expand"></i>
                           </button>
                         </div>
                       </div>
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
            candleRange: '1D',
            interval: '1D',      // Chart interval (1D, 1W, 1M)
            chartStyle: 'candles', // Chart style (candles, line)
            flashByTicker: {},           // flash cho giá hiện tại của selectedFund
            flashPriceByTicker: {},      // flash theo ticker cho cột GIÁ
            flashVolumeByTicker: {},     // flash theo ticker cho cột KL
        });
        
        // Khởi tạo mảng lưu area series cho so sánh
        this.compareAreaSeries = [];

        // Bus service (fallback interval nếu không có)
        try {
            this.bus = useService?.('bus_service');
        } catch (e) {
            this.bus = null;
        }

        this.state.activeRange = '1M';  // mặc định

        onMounted(async () => {
            // Load Lightweight Charts (high-performance OHLC)
            try { await loadJS("https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js"); } catch(e) { console.warn('Lightweight Charts load failed', e); }

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
            // Start realtime updates via bus if available
            try {
                if (this.bus) {
                    this.bus.addChannel('ssi.marketdata');
                    this.bus.start();
                    this.bus.addEventListener('notification', ({ detail }) => {
                        const notifs = detail || [];
                        const hasMarketNotice = notifs.some((n) => (n[1] && n[1].type === 'fetch_notice'));
                        if (hasMarketNotice) {
                            this.refreshFunds();
                        }
                    });
                } else {
                    // Fallback: poll every 20s
                    this._pollId = setInterval(() => this.refreshFunds(), 20000);
                }
            } catch (e) {
                console.warn('Bus init failed, fallback to polling', e);
                this._pollId = setInterval(() => this.refreshFunds(), 20000);
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

        // NAV/Unit chart removed; skip drawing
        // Load candlestick for current ticker
        if (fund && fund.ticker) {
            this.state.candleRange = this.state.candleRange || '1D';
            this.loadCandleData(fund.ticker, this.state.candleRange);
        }


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

    async refreshFunds() {
        try {
            const prevByTicker = {};
            (this.state.funds || []).forEach(f => { prevByTicker[f.ticker] = f; });

            const res = await fetch('/data_fund');
            const data = await res.json();
            this.state.funds = data;

            // detect changes to flash
            const flashMap = this.state.flashByTicker || {};
            const priceFlash = this.state.flashPriceByTicker || {};
            const volFlash = this.state.flashVolumeByTicker || {};
            data.forEach(f => {
                const prev = prevByTicker[f.ticker];
                if (!prev) return;
                const prevVal = Number(prev.current_nav || 0);
                const currVal = Number(f.current_nav || 0);
                if (currVal > prevVal) {
                    flashMap[f.ticker] = 'up';
                    priceFlash[f.ticker] = 'up';
                } else if (currVal < prevVal) {
                    flashMap[f.ticker] = 'down';
                    priceFlash[f.ticker] = 'down';
                }
                // Volume direction
                const pVol = Number(prev.volume || 0);
                const cVol = Number(f.volume || 0);
                if (cVol > pVol) volFlash[f.ticker] = 'up';
                else if (cVol < pVol) volFlash[f.ticker] = 'down';
                if (flashMap[f.ticker]) {
                    const ticker = f.ticker;
                    setTimeout(() => {
                        if (this.state.flashByTicker && this.state.flashByTicker[ticker]) {
                            delete this.state.flashByTicker[ticker];
                        }
                    }, 1000);
                }
                if (priceFlash[f.ticker]) {
                    const t = f.ticker;
                    setTimeout(() => {
                        if (this.state.flashPriceByTicker && this.state.flashPriceByTicker[t]) {
                            delete this.state.flashPriceByTicker[t];
                        }
                    }, 800);
                }
                if (volFlash[f.ticker]) {
                    const t = f.ticker;
                    setTimeout(() => {
                        if (this.state.flashVolumeByTicker && this.state.flashVolumeByTicker[t]) {
                            delete this.state.flashVolumeByTicker[t];
                        }
                    }, 800);
                }
            });
            this.state.flashByTicker = flashMap;
            this.state.flashPriceByTicker = priceFlash;
            this.state.flashVolumeByTicker = volFlash;
            // Nếu đang chọn quỹ, cập nhật lại theo id
            if (this.state.selectedFund) {
                const updated = data.find(f => f.id === this.state.selectedFund.id);
                if (updated) {
                    this.state.selectedFund = updated;
                }
            }
        } catch (e) {
            console.warn('Refresh funds failed', e);
        }
    }

    getFundColor(fund) {
        // Ưu tiên màu từ model fund (field `color`), sau đó mới tới `fund_color` nếu có
        if (fund && typeof fund.color === 'string' && fund.color.trim()) {
            return fund.color.trim();
        }
        if (fund && typeof fund.fund_color === 'string' && fund.fund_color.trim()) {
            return fund.fund_color.trim();
        }
        return this._colorFromTicker(fund && fund.ticker);
    }

    _colorFromTicker(ticker) {
        // Deterministic HSL based on ticker
        const str = (ticker || '').toString();
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        const hue = Math.abs(hash) % 360;
        const sat = 70; //%
        const light = 45; //%
        return `hsl(${hue} ${sat}% ${light}%)`;
    }

    async loadCandleData(ticker, range) {
        try {
            const { fromDate, toDate } = this._computeDateRange(range);
            const qs = new URLSearchParams({ ticker, range, fromDate, toDate }).toString();
            const res = await fetch(`/fund_ohlc?${qs}`);
            const payload = await res.json();
            if (payload && payload.status === 'Success') {
                const items = payload.data || [];
                // Xác định intraday hay daily dựa vào kiểu của trường t
                this._isIntraday = Array.isArray(items) && items.length > 0 && typeof items[0].t === 'number';
                this.drawCandleChart(items);
                // Start or restart simulated realtime updates based on latest data
                this.startRealtime(items);
            }
        } catch (e) {
            console.warn('Load candle data failed', e);
        }
    }

    updateCandleRange(range) {
        this.unable_roll();
        this.state.candleRange = range;
        
        // Nếu đang ở chế độ so sánh, vẽ lại so sánh với range mới
        if (this.state.compareMode && this.state.compareFunds.length > 0) {
            this.compareSelectedFunds();
        } else {
            // Nếu không, load candlestick cho fund đang chọn
        const fund = this.state.selectedFund;
        if (fund && fund.ticker) {
            this.loadCandleData(fund.ticker, range);
            }
        }
    }

    drawCandleChart(ohlcItems = []) {
        const container = document.getElementById('candleContainer');
        if (!container || !window.LightweightCharts) return;
        const LWC = window.LightweightCharts;
        
        // Lưu container reference để dùng trong event handlers
        this._chartContainer = container;
        
        if (!this.lwChart) {
            const isIntraday = !!this._isIntraday;
            this.lwChart = LWC.createChart(container, {
                layout: { 
                    background: { color: '#0b0f1a' }, 
                    textColor: '#e5e7eb' 
                },
                grid: { 
                    vertLines: { color: '#1f2937', style: 0 }, 
                    horzLines: { color: '#1f2937', style: 0 } 
                },
                rightPriceScale: { 
                    borderColor: '#374151',
                    scaleMargins: { top: 0.1, bottom: 0.1 }
                },
                leftPriceScale: {
                    visible: false
                },
                timeScale: { 
                    borderColor: '#374151', 
                    timeVisible: true, 
                    secondsVisible: isIntraday,  // Chỉ bật giây cho intraday
                    rightOffset: 6,
                    barSpacing: 6,
                    minBarSpacing: 2
                },
                crosshair: { 
                    mode: 1,
                    vertLine: { color: '#6b7280', width: 1, style: 2 },
                    horzLine: { color: '#6b7280', width: 1, style: 2 },
                    vertLineLabelVisible: true,  // Hiển thị label trên đường dọc
                    horzLineLabelVisible: true   // Hiển thị label trên đường ngang
                },
                handleScroll: {
                    mouseWheel: true,
                    pressedMouseMove: true,
                    horzTouchDrag: true,
                    vertTouchDrag: true
                },
                handleScale: {
                    axisPressedMouseMove: true,
                    axisTouchScale: true,
                    mouseWheel: true,
                    pinch: true
                },
                localization: { 
                    priceFormatter: (v) => (v ?? 0).toLocaleString('vi-VN'),
                    timeFormatter: (t) => {
                        // Chuẩn hóa hiển thị thời gian theo kiểu dữ liệu:
                        // - Intraday: t là số (unix seconds) => HH:mm:ss
                        // - Daily: t có thể là object {year,month,day} hoặc 'YYYY-MM-DD' => dd/MM/yyyy
                        const pad = (n) => String(n).padStart(2, '0');
                        if (isIntraday) {
                            const d = new Date((typeof t === 'number' ? t : Number(t)) * 1000);
                            return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                        }
                        // Daily formats
                        if (t && typeof t === 'object' && 'year' in t && 'month' in t && 'day' in t) {
                            return `${pad(t.day)}/${pad(t.month)}/${t.year}`;
                        }
                        if (typeof t === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t)) {
                            const [y, m, d] = t.split('-').map(Number);
                            return `${pad(d)}/${pad(m)}/${y}`;
                        }
                        if (typeof t === 'number') {
                            const d = new Date(t * 1000);
                            return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                        }
                        return '';
                    }
                },
            });
            try { this.lwChart.timeScale().applyOptions({ barSpacing: 10, minBarSpacing: 6, rightOffset: 8 }); } catch(e) {}
            // Series API compatibility (v3 vs v4): prefer v4 addSeries(), fallback to v3 addXxxSeries()
            try {
                if (typeof this.lwChart.addSeries === 'function' && LWC.CandlestickSeries) {
                    this.lwCandle = this.lwChart.addSeries(LWC.CandlestickSeries, {
                        upColor: '#22c55e', downColor: '#ef4444',
                        borderUpColor: '#22c55e', borderDownColor: '#ef4444',
                        wickUpColor: '#22c55e', wickDownColor: '#ef4444',
                    });
                } else if (typeof this.lwChart.addCandlestickSeries === 'function') {
                    this.lwCandle = this.lwChart.addCandlestickSeries({
                        upColor: '#22c55e', downColor: '#ef4444',
                        borderUpColor: '#22c55e', borderDownColor: '#ef4444',
                        wickUpColor: '#22c55e', wickDownColor: '#ef4444',
                    });
                }
            // Refine candlestick aesthetics
            try {
                this.lwCandle && this.lwCandle.applyOptions({
                    priceLineVisible: false,
                    lastValueVisible: true,
                    borderVisible: true,
                    upColor: '#22c55e', downColor: '#ef4444',
                    borderUpColor: '#22c55e', borderDownColor: '#ef4444',
                    wickUpColor: '#22c55e', wickDownColor: '#ef4444',
                    crosshairMarkerVisible: true,  // Hiển thị marker khi hover
                    crosshairMarkerRadius: 4,
                });
            } catch(e) {}
            } catch(e) { console.warn('Create candlestick series failed', e); }
            
            // Tạo custom tooltip element (chỉ tạo một lần)
            if (!this._tooltip) {
                const existingTooltip = document.getElementById('chart-tooltip');
                if (existingTooltip) {
                    existingTooltip.remove();
                }
                
                const tooltip = document.createElement('div');
                tooltip.id = 'chart-tooltip';
                tooltip.style.cssText = 'position: absolute; display: none; background: rgba(15, 23, 42, 0.95); color: #e5e7eb; padding: 8px 12px; border-radius: 6px; font-size: 12px; pointer-events: none; z-index: 1000; border: 1px solid #374151; box-shadow: 0 4px 6px rgba(0,0,0,0.3);';
                tooltip.innerHTML = '<div style="font-weight: 600; margin-bottom: 4px; color: #fbbf24;">OHLC Info</div><div id="tooltip-content"></div>';
                container.style.position = 'relative';
                container.appendChild(tooltip);
                this._tooltip = tooltip;
            }
            
            // Subscribe to crosshair move để hiển thị tooltip tùy chỉnh
            try {
                if (this.lwChart && typeof this.lwChart.subscribeCrosshairMove === 'function') {
                    // Lưu reference đến ohlcItems để dùng trong event handler
                    this._ohlcDataMap = new Map();
                    ohlcItems.forEach(item => {
                        const timeKey = typeof item.t === 'number' ? item.t : (typeof item.t === 'string' ? new Date(item.t).getTime() / 1000 : item.t);
                        this._ohlcDataMap.set(timeKey, item);
                    });
                    
                    this.lwChart.subscribeCrosshairMove((param) => {
                        if (!param.time || !param.seriesData) {
                            if (this._tooltip) this._tooltip.style.display = 'none';
                            return;
                        }
                        
                        const candleData = param.seriesData.get(this.lwCandle);
                        if (!candleData) {
                            if (this._tooltip) this._tooltip.style.display = 'none';
                            return;
                        }
                        
                        // Hỗ trợ cả intraday (number) và daily (string/object)
                        let timeKey;
                        if (typeof param.time === 'number') {
                            timeKey = param.time;
                        } else if (typeof param.time === 'string') {
                            timeKey = Math.floor(new Date(param.time).getTime() / 1000);
                        } else if (param.time && typeof param.time === 'object' && 'year' in param.time) {
                            const { year, month, day } = param.time;
                            timeKey = Math.floor(new Date(year, (month - 1), day).getTime() / 1000);
                        } else {
                            timeKey = null;
                        }
                        const ohlcData = this._ohlcDataMap.get(timeKey);
                        
                        if (ohlcData && this._tooltip) {
                            const date = new Date(timeKey * 1000);
                            const isIntradayView = !!this._isIntraday;
                            
                            const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                            
                            const timeStr = isIntradayView
                                ? date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
                                : '';
                            
                            const content = `
                                <div style="margin-bottom: 2px;"><strong>Ngày:</strong> ${dateStr}</div>
                                ${timeStr ? `<div style="margin-bottom: 2px;"><strong>Thời gian:</strong> ${timeStr}</div>` : ''}
                                <div style="margin-bottom: 2px;"><strong>Mở:</strong> <span style="color: #60a5fa;">${(ohlcData.o || 0).toLocaleString('vi-VN')}</span></div>
                                <div style="margin-bottom: 2px;"><strong>Cao:</strong> <span style="color: #22c55e;">${(ohlcData.h || 0).toLocaleString('vi-VN')}</span></div>
                                <div style="margin-bottom: 2px;"><strong>Thấp:</strong> <span style="color: #ef4444;">${(ohlcData.l || 0).toLocaleString('vi-VN')}</span></div>
                                <div><strong>Đóng:</strong> <span style="color: ${ohlcData.c >= ohlcData.o ? '#22c55e' : '#ef4444'};">${(ohlcData.c || 0).toLocaleString('vi-VN')}</span></div>
                                ${ohlcData.v ? `<div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #374151;"><strong>KL:</strong> ${(ohlcData.v || 0).toLocaleString('vi-VN')}</div>` : ''}
                            `;
                            
                            const tooltipContent = document.getElementById('tooltip-content');
                            if (tooltipContent) {
                                tooltipContent.innerHTML = content;
                            }
                            
                            // Hiển thị tooltip gần vị trí chuột
                            if (this._chartContainer) {
                                const containerRect = this._chartContainer.getBoundingClientRect();
                                this._tooltip.style.display = 'block';
                                
                                // Tính toán vị trí tooltip dựa trên vị trí chuột trong container
                                const mouseX = param.point ? param.point.x : containerRect.width / 2;
                                const mouseY = param.point ? param.point.y : containerRect.height / 2;
                                
                                // Đợi tooltip render để lấy kích thước
                                setTimeout(() => {
                                    const tooltipRect = this._tooltip.getBoundingClientRect();
                                    let left = mouseX + 20;
                                    let top = mouseY - 20;
                                    
                                    // Nếu tooltip ra ngoài bên phải, đặt bên trái
                                    if (left + tooltipRect.width > containerRect.width) {
                                        left = mouseX - tooltipRect.width - 20;
                                    }
                                    
                                    // Nếu tooltip ra ngoài bên dưới, đặt bên trên
                                    if (top + tooltipRect.height > containerRect.height) {
                                        top = mouseY - tooltipRect.height - 20;
                                    }
                                    
                                    // Đảm bảo không ra ngoài bên trái hoặc trên
                                    if (left < 0) left = 10;
                                    if (top < 0) top = 10;
                                    
                                    this._tooltip.style.left = left + 'px';
                                    this._tooltip.style.top = top + 'px';
                                }, 0);
                            } else {
                                this._tooltip.style.display = 'block';
                                this._tooltip.style.left = (param.point ? param.point.x : 100) + 20 + 'px';
                                this._tooltip.style.top = (param.point ? param.point.y : 100) - 20 + 'px';
                            }
                        } else if (this._tooltip) {
                            this._tooltip.style.display = 'none';
                        }
                    });
                }
            } catch(e) { console.warn('Subscribe crosshair move failed', e); }

            // Xóa volume chart - chỉ giữ lại candlestick chart
            this.lwVolume = null;
            try {
                this._resizeObs = new ResizeObserver(() => {
                    const { clientWidth, clientHeight } = container;
                    this.lwChart.applyOptions({ width: clientWidth, height: clientHeight });
                });
                this._resizeObs.observe(container);
            } catch(e) {}
        }
        // Helper: chuyển về dạng thời gian mà lightweight-charts ưa thích
        const normalizeTime = (timeValue) => {
            if (typeof timeValue === 'number') {
                return timeValue > 10000000000 ? Math.floor(timeValue / 1000) : timeValue; // seconds
            }
            if (typeof timeValue === 'string') {
                if (/^\d{4}-\d{2}-\d{2}$/.test(timeValue)) {
                    const [y, m, d] = timeValue.split('-').map(Number);
                    return { year: y, month: m, day: d }; // business day to avoid TZ shift
                }
                const parsed = new Date(timeValue);
                return isNaN(parsed.getTime()) ? null : Math.floor(parsed.getTime() / 1000);
            }
            if (timeValue instanceof Date) {
                return Math.floor(timeValue.getTime() / 1000);
            }
            if (timeValue && typeof timeValue === 'object' && 'year' in timeValue) {
                return timeValue; // already business day
            }
            return null;
        };

        const epochSecondsFromTime = (t) => {
            if (typeof t === 'number') return t;
            if (typeof t === 'string') return Math.floor(new Date(t).getTime() / 1000);
            if (t && typeof t === 'object' && 'year' in t) {
                return Math.floor(new Date(t.year, t.month - 1, t.day).getTime() / 1000);
            }
            if (t instanceof Date) return Math.floor(t.getTime() / 1000);
            return 0;
        };

        // Map và normalize time, sắp xếp theo thời gian
        const ohlc = ohlcItems
            .map(i => {
                const normalizedTime = normalizeTime(i.t);
                if (normalizedTime === null) return null;
                return { 
                    time: normalizedTime, 
                    open: i.o, 
                    high: i.h, 
                    low: i.l, 
                    close: i.c 
                };
            })
            .filter(item => item !== null)
            .sort((a, b) => epochSecondsFromTime(a.time) - epochSecondsFromTime(b.time));
        
        // Cập nhật map data để dùng trong crosshair tooltip (chuẩn hóa key về epoch seconds)
        this._ohlcDataMap = new Map();
        ohlcItems.forEach(item => {
            const key = epochSecondsFromTime(normalizeTime(item.t));
            if (key) this._ohlcDataMap.set(key, item);
        });
        
        if (this.lwCandle && typeof this.lwCandle.setData === 'function' && ohlc.length > 0) {
            try {
                this.lwCandle.setData(ohlc);
            } catch(e) {
                console.error('Error setting candlestick data:', e);
                // Fallback: thử với dữ liệu mới nhất
                if (ohlc.length > 0) {
                    this.lwCandle.setData([ohlc[ohlc.length - 1]]);
                }
            }
        }
        if (ohlc.length && this.lwCandle && typeof this.lwCandle.createPriceLine === 'function') {
            const last = ohlc[ohlc.length - 1];
            try { this._lastPriceLine && this.lwCandle.removePriceLine(this._lastPriceLine); } catch(e) {}
            try {
                this._lastPriceLine = this.lwCandle.createPriceLine({
                    price: last.close,
                    color: '#6b7280',
                    lineWidth: 1,
                    lineStyle: 2,
                    axisLabelVisible: true,
                    title: 'Last'
                });
            } catch(e) {}
        }
        this.lwChart.timeScale().fitContent();
    }

    // ===== Realtime simulation like lightweight-charts sample =====
    startRealtime(baseItems = []) {
        try { this.stopRealtime(); } catch(e) {}
        
        // Helper function để normalize time format
        const normalizeTime = (timeValue) => {
            if (typeof timeValue === 'number') {
                return timeValue > 10000000000 ? timeValue / 1000 : timeValue;
            }
            if (typeof timeValue === 'string') {
                if (/^\d{4}-\d{2}-\d{2}$/.test(timeValue)) {
                    return timeValue;
                }
                const parsed = new Date(timeValue);
                return isNaN(parsed.getTime()) ? null : Math.floor(parsed.getTime() / 1000);
            }
            if (timeValue instanceof Date) {
                return Math.floor(timeValue.getTime() / 1000);
            }
            return null;
        };
        
        const seed = baseItems.slice(-100) // recent snapshot
            .map(i => {
                const normalizedTime = normalizeTime(i.t);
                if (normalizedTime === null) return null;
                return { 
                    time: normalizedTime, 
                    open: i.o, 
                    high: i.h, 
                    low: i.l, 
                    close: i.c 
                };
            })
            .filter(item => item !== null);
            
        if (!this.lwCandle || seed.length === 0) return;
        let last = seed[seed.length - 1];
        let i = 0;
        const rand = () => (Math.random() - 0.5) * (last.close * 0.004); // +-0.4%
        this._rtInterval = setInterval(() => {
            // Every 5 ticks start a new candle, otherwise update current
            const isOpen = (i % 5) === 0;
            if (isOpen) {
                const open = last.close;
                const val = open + rand();
                // Tính toán time mới dựa trên time hiện tại
                let nextTime;
                if (typeof last.time === 'number') {
                    // Nếu là timestamp, thêm 1 ngày (86400 seconds)
                    nextTime = last.time + 86400;
                } else if (typeof last.time === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(last.time)) {
                    // Nếu là string YYYY-MM-DD, thêm 1 ngày
                    const d = new Date(last.time);
                    d.setDate(d.getDate() + 1);
                    nextTime = d.toISOString().slice(0, 10);
                } else {
                    // Fallback
                    const d = new Date(last.time);
                    d.setDate(d.getDate() + 1);
                    nextTime = Math.floor(d.getTime() / 1000);
                }
                const candle = { 
                    time: nextTime, 
                    open: open, 
                    high: Math.max(open, val), 
                    low: Math.min(open, val), 
                    close: val 
                };
                last = candle;
                try {
                    this.lwCandle.update(candle);
                } catch(e) {
                    console.warn('Realtime update failed:', e);
                }
            } else {
                const val = last.close + rand();
                last = { 
                    time: last.time, 
                    open: last.open, 
                    high: Math.max(last.high, val), 
                    low: Math.min(last.low, val), 
                    close: val 
                };
                try {
                    this.lwCandle.update(last);
                } catch(e) {
                    console.warn('Realtime update failed:', e);
                }
            }
            i += 1;
        }, 1000);
    }

    _computeDateRange(range) {
        const today = new Date();
        const toDate = today.toISOString().slice(0,10);
        const daysAgo = (n) => {
            const d = new Date(today); d.setDate(d.getDate() - n); return d.toISOString().slice(0,10);
        };
        const monthsAgo = (n) => {
            const d = new Date(today); d.setMonth(d.getMonth() - n); return d.toISOString().slice(0,10);
        };
        const yearsAgo = (n) => {
            const d = new Date(today); d.setFullYear(d.getFullYear() - n); return d.toISOString().slice(0,10);
        };
        const yearStart = () => {
            const d = new Date(today.getFullYear(), 0, 1); return d.toISOString().slice(0,10);
        };
        switch (range) {
            case '1D': return { fromDate: toDate, toDate };
            case '5D': return { fromDate: daysAgo(5), toDate };
            case '1M': return { fromDate: daysAgo(31), toDate };
            case '3M': return { fromDate: daysAgo(91), toDate };
            case '6M': return { fromDate: daysAgo(182), toDate };
            case 'YTD': return { fromDate: yearStart(), toDate };
            case '1Y': return { fromDate: yearsAgo(1), toDate };
            case '5Y': return { fromDate: yearsAgo(5), toDate };
            case 'ALL': return { fromDate: '2020-01-01', toDate }; // Hoặc từ ngày đầu tiên có dữ liệu
            default: return { fromDate: daysAgo(31), toDate };
        }
    }

    stopRealtime() {
        if (this._rtInterval) {
            clearInterval(this._rtInterval);
            this._rtInterval = null;
        }
    }

    _incDay(isoDate) {
        try {
            const d = new Date(isoDate);
            d.setDate(d.getDate() + 1);
            return d.toISOString().slice(0,10);
        } catch(e) { return isoDate; }
    }

    scrollToRealtime() {
        if (this.lwChart && this.lwChart.timeScale) {
            try { 
                this.lwChart.timeScale().scrollToRealTime(); 
            } catch(e) {
                // Fallback: scroll to rightmost position
                try {
                    this.lwChart.timeScale().scrollToPosition(-1, true);
                } catch(e2) {}
            }
        }
    }

    resetChartView() {
        if (this.lwChart && this.lwChart.timeScale) {
            try {
                this.lwChart.timeScale().resetTimeScale();
            } catch(e) {
                this.fitChartContent();
            }
        }
    }

    fitChartContent() {
        if (this.lwChart && this.lwChart.timeScale) {
            try {
                this.lwChart.timeScale().fitContent();
            } catch(e) {
                console.warn('Fit content failed', e);
            }
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
        const index = this.state.compareFunds.findIndex(f => f.ticker === fund.ticker);

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

    toggleCompareMode() {
        this.unable_roll();
        if (!this.state.selectedFund) {
            Swal.fire({
                icon: "info",
                title: "Chọn CCQ",
                text: "Vui lòng chọn một chứng chỉ quỹ trước khi so sánh.",
                confirmButtonColor: "#36A2EB"
            });
            return;
        }
        
        // Toggle compare mode
        if (!this.state.compareMode) {
            this.state.compareMode = true;
            // Tự động thêm fund hiện tại vào danh sách so sánh nếu chưa có
            const exists = this.state.compareFunds.find(f => f.ticker === this.state.selectedFund.ticker);
            if (!exists) {
                this.state.compareFunds.push(this.state.selectedFund);
            }
        } else {
            // Nếu đang ở chế độ so sánh, có thể mở dialog để thêm thêm CCQ
            this.openCompareDialog();
        }
    }

    openCompareDialog() {
        // Tạo dialog để chọn thêm CCQ để so sánh
        const availableFunds = this.state.funds.filter(f => 
            !this.state.compareFunds.find(cf => cf.ticker === f.ticker)
        );
        
        if (availableFunds.length === 0) {
            Swal.fire({
                icon: "info",
                title: "Không có CCQ",
                text: "Tất cả CCQ đã được thêm vào danh sách so sánh.",
                confirmButtonColor: "#36A2EB"
            });
            return;
        }

        const options = availableFunds.map(f => f.ticker).join(', ');
        
        Swal.fire({
            title: "Thêm CCQ để so sánh",
            text: `CCQ có sẵn: ${options}`,
            input: "text",
            inputPlaceholder: "Nhập mã CCQ (ví dụ: VND, VFM, ...)",
            showCancelButton: true,
            confirmButtonText: "Thêm",
            cancelButtonText: "Hủy",
            confirmButtonColor: "#36A2EB",
            inputValidator: (value) => {
                if (!value) {
                    return "Vui lòng nhập mã CCQ!";
                }
                const fund = this.state.funds.find(f => 
                    f.ticker && f.ticker.toUpperCase() === value.toUpperCase().trim()
                );
                if (!fund) {
                    return "Không tìm thấy CCQ với mã này!";
                }
                if (this.state.compareFunds.find(cf => cf.ticker === fund.ticker)) {
                    return "CCQ này đã được thêm vào danh sách so sánh!";
                }
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                const ticker = result.value.toUpperCase().trim();
                const fund = this.state.funds.find(f => 
                    f.ticker && f.ticker.toUpperCase() === ticker
                );
                if (fund && this.state.compareFunds.length < 4) {
                    this.state.compareFunds.push(fund);
                    this.compareSelectedFunds();
                }
            }
        });
    }

    removeCompareFund(fund) {
        this.unable_roll();
        const index = this.state.compareFunds.findIndex(f => f.ticker === fund.ticker);
        if (index > -1) {
            // Xóa area series tương ứng
            if (this.compareAreaSeries && this.compareAreaSeries[index]) {
                try {
                    if (this.lwChart) {
                        this.lwChart.removeSeries(this.compareAreaSeries[index]);
                    }
                } catch(e) {}
                this.compareAreaSeries.splice(index, 1);
            }
            
            this.state.compareFunds.splice(index, 1);
            if (this.state.compareFunds.length === 0) {
                this.state.compareMode = false;
                // Vẽ lại candlestick chart cho fund đang chọn
                const selectedFund = this.state.selectedFund;
                if (selectedFund && selectedFund.ticker) {
                    this.loadCandleData(selectedFund.ticker, this.state.candleRange || '1M');
                }
            } else {
                // Vẽ lại với danh sách còn lại
                this.compareSelectedFunds();
            }
        }
    }

    openSymbolSearch() {
        if (!this.state.funds || this.state.funds.length === 0) {
            Swal.fire({
                icon: "info",
                title: "Không có dữ liệu",
                text: "Chưa có danh sách CCQ.",
                confirmButtonColor: "#36A2EB"
            });
            return;
        }

        const options = this.state.funds.map(f => f.ticker).join(', ');
        
        Swal.fire({
            title: "Tìm kiếm CCQ",
            text: `CCQ có sẵn: ${options}`,
            input: "text",
            inputPlaceholder: "Nhập mã CCQ để tìm kiếm",
            showCancelButton: true,
            confirmButtonText: "Chọn",
            cancelButtonText: "Hủy",
            confirmButtonColor: "#36A2EB",
            inputValidator: (value) => {
                if (!value) {
                    return "Vui lòng nhập mã CCQ!";
                }
                const fund = this.state.funds.find(f => 
                    f.ticker && f.ticker.toUpperCase() === value.toUpperCase().trim()
                );
                if (!fund) {
                    return "Không tìm thấy CCQ với mã này!";
                }
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                const ticker = result.value.toUpperCase().trim();
                const fund = this.state.funds.find(f => 
                    f.ticker && f.ticker.toUpperCase() === ticker
                );
                if (fund) {
                    this.selectFund(fund);
                }
            }
        });
    }

    setInterval(interval) {
        this.unable_roll();
        this.state.interval = interval;
        // Có thể thêm logic để thay đổi interval của chart nếu cần
        console.log("Interval changed to:", interval);
    }

    setChartStyle(style) {
        this.unable_roll();
        this.state.chartStyle = style;
        // Có thể thêm logic để thay đổi chart style nếu cần
        console.log("Chart style changed to:", style);
    }


    async compareSelectedFunds() {
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
        if (!selected || selected.length === 0) {
            return;
        }

        // Ẩn candlestick và volume khi so sánh
        if (this.lwCandle) {
            try {
                this.lwCandle.setData([]);
            } catch(e) {}
        }
        if (this.lwVolume) {
            try {
                this.lwVolume.setData([]);
            } catch(e) {}
        }

        // Xóa các area series cũ nếu có
        if (this.compareAreaSeries) {
            this.compareAreaSeries.forEach(series => {
                try {
                    this.lwChart.removeSeries(series);
                } catch(e) {}
            });
        }
        this.compareAreaSeries = [];

        // Đảm bảo chart đã được khởi tạo
        const container = document.getElementById('candleContainer');
        if (!container || !window.LightweightCharts) return;
        const LWC = window.LightweightCharts;
        
        if (!this.lwChart) {
            this.drawCandleChart([]);
        }

        // Load OHLC data cho từng CCQ và vẽ area chart
        const range = this.state.candleRange || '1M';
        // Khi ở 1D thì coi là intraday để hiển thị theo giây
        this._isIntraday = (range === '1D');
        try {
            if (this.lwChart && typeof this.lwChart.applyOptions === 'function') {
                this.lwChart.applyOptions({ timeScale: { secondsVisible: this._isIntraday, timeVisible: true } });
            }
        } catch(e) {}
        const { fromDate, toDate } = this._computeDateRange(range);

        for (let i = 0; i < selected.length; i++) {
            const fund = selected[i];
            try {
                const qs = new URLSearchParams({ 
                    ticker: fund.ticker, 
                    range, 
                    fromDate, 
                    toDate 
                }).toString();
                const res = await fetch(`/fund_ohlc?${qs}`);
                const payload = await res.json();
                
                if (payload && payload.status === 'Success') {
                    const items = payload.data || [];
                    if (items.length > 0) {
                        // Lấy màu cho CCQ này
                        let fundColor = this.getFundColor(fund);
                        
                        // Convert color (hex, hsl, rgb) to rgba với opacity
                        const colorToRgba = (color, alpha) => {
                            if (!color) return `rgba(0, 123, 255, ${alpha})`;
                            
                            // Nếu là HSL
                            if (color.startsWith('hsl(')) {
                                const match = color.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
                                if (match) {
                                    const h = parseInt(match[1]);
                                    const s = parseInt(match[2]) / 100;
                                    const l = parseInt(match[3]) / 100;
                                    // Convert HSL to RGB
                                    const c = (1 - Math.abs(2 * l - 1)) * s;
                                    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
                                    const m = l - c / 2;
                                    let r, g, b;
                                    if (h < 60) { r = c; g = x; b = 0; }
                                    else if (h < 120) { r = x; g = c; b = 0; }
                                    else if (h < 180) { r = 0; g = c; b = x; }
                                    else if (h < 240) { r = 0; g = x; b = c; }
                                    else if (h < 300) { r = x; g = 0; b = c; }
                                    else { r = c; g = 0; b = x; }
                                    return `rgba(${Math.round((r + m) * 255)}, ${Math.round((g + m) * 255)}, ${Math.round((b + m) * 255)}, ${alpha})`;
                                }
                            }
                            
                            // Nếu là hex
                            if (color.startsWith('#')) {
                                const r = parseInt(color.slice(1, 3), 16);
                                const g = parseInt(color.slice(3, 5), 16);
                                const b = parseInt(color.slice(5, 7), 16);
                                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                            }
                            
                            // Nếu là rgb/rgba, giữ nguyên và chỉ thay đổi alpha
                            if (color.startsWith('rgb')) {
                                return color.replace(/rgba?\([^)]+\)/, `rgba(${color.match(/\d+/g).slice(0, 3).join(', ')}, ${alpha})`);
                            }
                            
                            return `rgba(0, 123, 255, ${alpha})`;
                        };
                        
                        // Chuẩn hóa màu thành hex hoặc rgb để dùng cho lineColor
                        const normalizeColor = (color) => {
                            if (!color) return '#007bff';
                            if (color.startsWith('#')) return color;
                            if (color.startsWith('rgb')) {
                                // Convert rgb to hex
                                const match = color.match(/\d+/g);
                                if (match && match.length >= 3) {
                                    const r = parseInt(match[0]).toString(16).padStart(2, '0');
                                    const g = parseInt(match[1]).toString(16).padStart(2, '0');
                                    const b = parseInt(match[2]).toString(16).padStart(2, '0');
                                    return `#${r}${g}${b}`;
                                }
                                return '#007bff';
                            }
                            if (color.startsWith('hsl(')) {
                                // Convert HSL to hex
                                const match = color.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
                                if (match) {
                                    const h = parseInt(match[1]);
                                    const s = parseInt(match[2]) / 100;
                                    const l = parseInt(match[3]) / 100;
                                    const c = (1 - Math.abs(2 * l - 1)) * s;
                                    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
                                    const m = l - c / 2;
                                    let r, g, b;
                                    if (h < 60) { r = c; g = x; b = 0; }
                                    else if (h < 120) { r = x; g = c; b = 0; }
                                    else if (h < 180) { r = 0; g = c; b = x; }
                                    else if (h < 240) { r = 0; g = x; b = c; }
                                    else if (h < 300) { r = x; g = 0; b = c; }
                                    else { r = c; g = 0; b = x; }
                                    const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
                                    const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
                                    const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');
                                    return `#${rHex}${gHex}${bHex}`;
                                }
                            }
                            return '#007bff';
                        };
                        
                        const normalizedColor = normalizeColor(fundColor);

                        // Tạo area series (mountain chart)
                        let areaSeries;
                        try {
                            if (typeof this.lwChart.addSeries === 'function' && LWC.AreaSeries) {
                                areaSeries = this.lwChart.addSeries(LWC.AreaSeries, {
                                    lineColor: normalizedColor,
                                    topColor: colorToRgba(fundColor, 0.4),
                                    bottomColor: colorToRgba(fundColor, 0.05),
                                    lineWidth: 2,
                                    title: `${fund.ticker} - ${fund.name || ''}`
                                });
                            } else if (typeof this.lwChart.addAreaSeries === 'function') {
                                areaSeries = this.lwChart.addAreaSeries({
                                    lineColor: normalizedColor,
                                    topColor: colorToRgba(fundColor, 0.4),
                                    bottomColor: colorToRgba(fundColor, 0.05),
                                    lineWidth: 2,
                                    title: `${fund.ticker} - ${fund.name || ''}`
                                });
                            }
                        } catch(e) {
                            console.warn('Failed to create area series:', e);
                            continue;
                        }

                        if (areaSeries) {
                            // Helper function để normalize time format
                            const normalizeTime = (timeValue) => {
                                if (typeof timeValue === 'number') {
                                    // Nếu là timestamp (seconds), giữ nguyên
                                    // Nếu là milliseconds, chuyển sang seconds
                                    return timeValue > 10000000000 ? timeValue / 1000 : timeValue;
                                }
                                if (typeof timeValue === 'string') {
                                    // Nếu là string YYYY-MM-DD, giữ nguyên (lightweight-charts hỗ trợ)
                                    if (/^\d{4}-\d{2}-\d{2}$/.test(timeValue)) {
                                        return timeValue;
                                    }
                                    // Nếu là string khác, parse thành timestamp
                                    const parsed = new Date(timeValue);
                                    return isNaN(parsed.getTime()) ? null : Math.floor(parsed.getTime() / 1000);
                                }
                                if (timeValue instanceof Date) {
                                    return Math.floor(timeValue.getTime() / 1000);
                                }
                                return null;
                            };

        // Convert OHLC data thành format cho area series (sử dụng close price)
                            const areaData = items
                                .map(item => {
                                    const normalizedTime = normalizeTime(item.t);
                                    if (normalizedTime === null) return null;
                                    const value = (item.c ?? item.close ?? null);
                                    if (value === null || isNaN(Number(value))) return null;
                                    return {
                                        time: normalizedTime,
                                        value: Number(value)
                                    };
                                })
                                .filter(item => item !== null)
            .sort((a, b) => epochSecondsFromTime(a.time) - epochSecondsFromTime(b.time));

                            try {
                                if (areaData.length > 0) {
                                    areaSeries.setData(areaData);
                                    this.compareAreaSeries.push(areaSeries);
                                } else if ((items || []).length > 0) {
                                    // Fallback: nếu thiếu dữ liệu (ví dụ intraday trống), hiển thị 1 điểm cuối để user vẫn thấy giá
                                    const last = items[items.length - 1];
                                    const tnorm = normalizeTime(last.t);
                                    const vnorm = Number(last.c ?? last.close ?? 0);
                                    if (tnorm != null) {
                                        areaSeries.setData([{ time: tnorm, value: vnorm }]);
                                        this.compareAreaSeries.push(areaSeries);
                                    }
                                }
                            } catch(e) {
                                console.warn('Failed to set area data:', e);
                                // Fallback: thử với dữ liệu mới nhất
                                if (areaData.length > 0) {
                                    try {
                                        areaSeries.setData([areaData[areaData.length - 1]]);
                                    } catch(e2) {
                                        console.error('Fallback failed:', e2);
                                    }
                                }
                            }
                        }
                    }
                }
            } catch(e) {
                console.warn(`Failed to load data for ${fund.ticker}:`, e);
            }
        }

        // Fit content sau khi vẽ xong
        if (this.lwChart && this.compareAreaSeries.length > 0) {
            try {
                this.lwChart.timeScale().fitContent();
            } catch(e) {}
        }
    }



    resetCompareMode() {
        this.unable_roll();
        this.state.compareMode = false;
        this.state.compareFunds = [];

        // Xóa các area series khi thoát chế độ so sánh
        if (this.compareAreaSeries && this.compareAreaSeries.length > 0) {
            this.compareAreaSeries.forEach(series => {
                try {
                    if (this.lwChart) {
                        this.lwChart.removeSeries(series);
                    }
                } catch(e) {}
            });
            this.compareAreaSeries = [];
        }

        // Vẽ lại candlestick chart cho fund đang chọn
        const fund = this.state.selectedFund;
        if (fund && fund.ticker) {
            this.loadCandleData(fund.ticker, this.state.candleRange || '1M');
        }
    }

    unable_roll(){
      const scrollTop = window.scrollY;
      requestAnimationFrame(() => {
          window.scrollTo(0, scrollTop);
        });
    }
}
