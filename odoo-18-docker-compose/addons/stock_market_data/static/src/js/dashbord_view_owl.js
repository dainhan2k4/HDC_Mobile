/** @odoo-module **/
import { registry } from "@web/core/registry";
import { Component, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

class Dashboard extends Component {
    setup() {
        super.setup();
        
        this.orm = useService("orm");
        // Chế độ hiển thị toàn bộ thành phần của index (từ context action)
        this.showAll = !!(this.props && this.props.action && this.props.action.context && this.props.action.context.show_all);
        
        this.state = useState({
            index: "",
            market: "",
            marketStatus: "",
            tradeDate: "",
            variation: "",
            records: [],
            gainersHighlighted: true,
            losersHighlighted: false,
            selectedIndex: "nifty_50",
            availableIndices: [
                { key: "nifty_50", name: "NIFTY 50" },
                { key: "nifty_bank", name: "NIFTY BANK" },
                { key: "nifty_it", name: "NIFTY IT" },
                { key: "nifty_pharma", name: "NIFTY PHARMA" },
                { key: "nifty_auto", name: "NIFTY AUTO" },
                { key: "nifty_fmcg", name: "NIFTY FMCG" },
                { key: "nifty_metal", name: "NIFTY METAL" },
                { key: "nifty_realty", name: "NIFTY REALTY" },
                { key: "nifty_privatebank", name: "NIFTY PRIVATE BANK" },
                { key: "nifty_psubank", name: "NIFTY PSU BANK" },
                { key: "nifty_energy", name: "NIFTY ENERGY" },
                { key: "nifty_consumerdurables", name: "NIFTY CONSUMER DURABLES" },
                { key: "nifty_healthcareindex", name: "NIFTY HEALTHCARE" },
                { key: "nifty_oilgas", name: "NIFTY OIL & GAS" },
                { key: "nifty_media", name: "NIFTY MEDIA" },
                { key: "nifty_financial_services", name: "NIFTY FINANCIAL SERVICES" },
                { key: "nifty_next50", name: "NIFTY NEXT 50" },
                { key: "nifty_midcap50", name: "NIFTY MIDCAP 50" },
                { key: "nifty_midcap100", name: "NIFTY MIDCAP 100" },
                { key: "nifty_smallcap50", name: "NIFTY SMALLCAP 50" },
                { key: "nifty_smallcap100", name: "NIFTY SMALLCAP 100" },
            ],
            previousRecords: {},
            changedFields: {},
            isLoading: false,
            lastUpdateTime: new Date().toLocaleTimeString(),
        });

        this.isMounted = true;
        this.isDestroyed = false;
        this.refreshDataInterval = null;
        this.notificationInterval = null;
        this.changeTimeout = null;
        
        // Data fetching flags để tránh request chồng chéo
        this.isDataLoading = false;
        this.isIndicesLoading = false;
        
        this.start_refresh_timer();
        this.onLoad();
    }

    // Format số với dấu phẩy
    formatNumber(num) {
        if (num === null || num === undefined) return '-';
        return new Intl.NumberFormat('en-IN').format(num);
    }

    // Format phần trăm
    formatPercentage(num) {
        if (num === null || num === undefined) return '-';
        return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
    }

    // Format giá trị tiền tệ
    formatCurrency(num) {
        if (num === null || num === undefined) return '-';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    }

    // Format VALUE theo đơn vị Ấn Độ: ưu tiên hiển thị Crore/Lakh để dễ đọc
    formatValue(num) {
        if (num === null || num === undefined) return '-';
        const n = Number(num) || 0;
        const CRORE = 1e7; // 1 Cr = 10,000,000
        const LAKH = 1e5;  // 1 Lakh = 100,000
        if (Math.abs(n) >= CRORE) {
            const v = n / CRORE;
            return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(v)} Cr`;
        }
        if (Math.abs(n) >= LAKH) {
            const v = n / LAKH;
            return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(v)} Lakh`;
        }
        return this.formatCurrency(n);
    }

    // Kiểm tra component có còn mounted không
    isComponentMounted() {
        return this.isMounted && !this.isDestroyed;
    }

    getSelectedIndexName() {
        const selected = this.state.availableIndices.find(
            idx => idx.key === this.state.selectedIndex
        );
        return selected ? selected.name : "NIFTY 50";
    }

    async load_data() {
        if (!this.isComponentMounted()) {
            console.log("Component not mounted, skipping load_data");
            return;
        }

        // Kiểm tra nếu đang load data thì bỏ qua
        if (this.isDataLoading) {
            console.log("Data loading in progress, skipping load_data");
            return;
        }

        console.log("load_data for index:", this.state.selectedIndex);
        
        // Set flag để tránh request chồng chéo
        this.isDataLoading = true;
        
        try {
            this.state.isLoading = true;
            
            // Ưu tiên dữ liệu realtime cho mọi index (bao gồm cả NIFTY 50)
            // Lấy headline realtime trực tiếp từ API allIndices để có 'last' chính xác
            let indexData = await this.orm.call("nifty.alldata", "get_realtime_index_headline", [this.state.selectedIndex]);
            // Fallback nếu realtime không có dữ liệu
            if (!indexData) {
                // Thử method realtime tổng hợp
                indexData = await this.orm.call("nifty.alldata", "get_realtime_index_data", [this.state.selectedIndex]);
                if (!indexData) {
                    if (this.state.selectedIndex === "nifty_50") {
                        indexData = await this.orm.call("nifty.integration", "get_nifty50_summary");
                    } else {
                        indexData = await this.orm.call("nifty.alldata", "get_index_summary", [this.state.selectedIndex]);
                    }
                }
            }
            
            // Kiểm tra lại sau khi API call
            if (!this.isComponentMounted()) {
                console.log("Component destroyed during API call, skipping state update");
                return;
            }

            console.log("Index data received:", indexData);
            this.state.index = this.getSelectedIndexName();
            
            if (indexData) {
                // Tổng quan sử dụng dữ liệu realtime nếu có
                this.state.market = indexData.market || "NSE";
                this.state.tradeDate = indexData.tradeDate || new Date().toLocaleDateString('en-IN');
                const displayValue = indexData.last || indexData.avg_value || indexData.total_value || 0;
                this.state.variation = this.formatCurrency(displayValue);
                this.state.marketStatus = (indexData.marketStatus || "Open") === "Open" ? "Open" : "Closed";
                this.state.lastUpdateTime = indexData.lastUpdateTime || indexData.timestamp || new Date().toLocaleTimeString();
            } else {
                console.log("No data available for index:", this.state.selectedIndex);
                // Fallback về dữ liệu mặc định
                this.state.market = "NSE";
                this.state.tradeDate = new Date().toLocaleDateString('en-IN');
                this.state.variation = "₹0.00";
                this.state.marketStatus = "Open";
                this.state.lastUpdateTime = new Date().toLocaleTimeString();
            }
        } catch (error) {
            if (this.isComponentMounted()) {
                console.log("Error loading data:", error);
                // Fallback về dữ liệu mặc định
                this.state.market = "NSE";
                this.state.tradeDate = new Date().toLocaleDateString('en-IN');
                this.state.variation = "₹0.00";
                this.state.marketStatus = "Open";
                this.state.lastUpdateTime = new Date().toLocaleTimeString();
            }
        } finally {
            if (this.isComponentMounted()) {
                this.state.isLoading = false;
            }
            // Reset flag sau khi hoàn thành
            this.isDataLoading = false;
        }
    }

    async loadIndicesData(method) {
        if (!this.isComponentMounted()) {
            console.log("Component not mounted, skipping loadIndicesData");
            return;
        }

        // Kiểm tra nếu đang load indices data thì bỏ qua
        if (this.isIndicesLoading) {
            console.log("Indices data loading in progress, skipping loadIndicesData");
            return;
        }

        // Set flag để tránh request chồng chéo
        this.isIndicesLoading = true;

        try {
            this.state.isLoading = true;
            let result;
            
            console.log("Loading indices data for:", this.state.selectedIndex, "method:", method);
            
            // Kiểm tra component state trước khi gọi API
            if (!this.isComponentMounted()) {
                console.log("Component destroyed before API call, skipping");
                return;
            }
            
            const orderExpr = method === "gainer_nifty50" ? "pChange desc" : "pChange asc";
            const fields = [
                "symbol",
                "open",
                "dayHigh",
                "dayLow",
                "previousClose",
                "lastPrice",
                "change",
                "pChange",
                "totalTradedValue",
                "totalTradedVolume",
                "yearHigh",
                "yearLow",
            ];

            if (this.state.selectedIndex === "nifty_50") {
                if (this.showAll) {
                    // Realtime: fallback sang searchRead nếu cần
                    const realtimeList = await this.orm.call("nifty.alldata", "get_realtime_top_indices", [
                        "nifty_50",
                        orderExpr,
                        200
                    ]);
                    result = (realtimeList && realtimeList.length) ? realtimeList : await this.orm.searchRead(
                        "nifty.stockindices",
                        [],
                        fields,
                        { order: orderExpr }
                    );
                } else {
                    // Top 5 realtime
                    const realtimeTop = await this.orm.call("nifty.alldata", "get_realtime_top_indices", [
                        "nifty_50",
                        orderExpr,
                        5
                    ]);
                    result = (realtimeTop && realtimeTop.length) ? realtimeTop : await this.orm.call("nifty.stockindices", method);
                }
            } else {
                if (this.showAll) {
                    // Realtime full list theo index
                    const realtimeList = await this.orm.call("nifty.alldata", "get_realtime_top_indices", [
                        this.state.selectedIndex,
                        orderExpr,
                        500
                    ]);
                    result = (realtimeList && realtimeList.length) ? realtimeList : await this.orm.searchRead(
                        "nifty.alldata",
                        [["market_type_state", "=", this.state.selectedIndex]],
                        fields,
                        { order: orderExpr }
                    );
                } else {
                    // Top 5 realtime theo index
                    const realtimeTop = await this.orm.call("nifty.alldata", "get_realtime_top_indices", [
                        this.state.selectedIndex,
                        orderExpr,
                        5
                    ]);
                    result = (realtimeTop && realtimeTop.length) ? realtimeTop : await this.orm.call("nifty.alldata", "get_top_indices", [
                        this.state.selectedIndex,
                        orderExpr,
                        5,
                    ]);
                }
            }

            // Kiểm tra lại sau khi API call
            if (!this.isComponentMounted()) {
                console.log("Component destroyed during API call, skipping state update");
                return;
            }

            console.log("Indices data result:", result);

            if (result && result.length > 0) {
                const newRecords = result.map((record, index) => ({
                    id: index + 1,
                    symbol: record.symbol,
                    open: this.formatCurrency(record.open),
                    change: this.formatCurrency(record.change),
                    dayHigh: this.formatCurrency(record.dayHigh),
                    dayLow: this.formatCurrency(record.dayLow),
                    lastPrice: this.formatCurrency(record.lastPrice),
                    pChange: this.formatPercentage(record.pChange),
                    previousClose: this.formatCurrency(record.previousClose),
                    totalTradedValue: this.formatValue(record.totalTradedValue ?? (record.totalTradedValueInLakhs ? record.totalTradedValueInLakhs * 1e5 : 0)),
                    totalTradedVolume: this.formatNumber(record.totalTradedVolume),
                    yearHigh: this.formatCurrency(record.yearHigh),
                    yearLow: this.formatCurrency(record.yearLow),
                    // Lưu giá trị gốc để so sánh
                    rawData: {
                        open: record.open,
                        change: record.change,
                        dayHigh: record.dayHigh,
                        dayLow: record.dayLow,
                        lastPrice: record.lastPrice,
                        pChange: record.pChange,
                        previousClose: record.previousClose,
                        totalTradedValue: record.totalTradedValue ?? (record.totalTradedValueInLakhs ? record.totalTradedValueInLakhs * 1e5 : 0),
                        totalTradedVolume: record.totalTradedVolume,
                        yearHigh: record.yearHigh,
                        yearLow: record.yearLow,
                    }
                }));

                // Kiểm tra component state trước khi update
                if (this.isComponentMounted()) {
                    this.detectChanges(newRecords);
                    this.state.records = newRecords;
                    this.state.lastUpdateTime = new Date().toLocaleTimeString();
                }
            } else {
                console.log("No data available for index:", this.state.selectedIndex);
                if (this.isComponentMounted()) {
                    this.state.records = [];
                }
            }
        } catch (error) {
            if (this.isComponentMounted()) {
                console.error("Error loading indices data:", error);
                this.state.records = [];
            }
        } finally {
            if (this.isComponentMounted()) {
                this.state.isLoading = false;
            }
            // Reset flag sau khi hoàn thành
            this.isIndicesLoading = false;
        }
    }

    detectChanges(newRecords) {
        if (!this.isComponentMounted()) return;

        const changes = {};
        
        newRecords.forEach((record, index) => {
            const oldRecord = this.state.records[index];
            if (oldRecord && oldRecord.rawData) {
                const recordChanges = {};
                
                // So sánh từng trường dữ liệu
                const fields = [
                    'open', 'dayHigh', 'dayLow', 'previousClose', 'lastPrice', 
                    'change', 'pChange', 'totalTradedValue', 'totalTradedVolume', 
                    'yearHigh', 'yearLow'
                ];
                
                fields.forEach(field => {
                    const oldValue = oldRecord.rawData[field];
                    const newValue = record.rawData[field];
                    
                    // So sánh với độ chính xác 2 chữ số thập phân cho giá trị tiền
                    if (field.includes('Price') || field.includes('Value') || field.includes('High') || field.includes('Low')) {
                        if (Math.abs(oldValue - newValue) > 0.01) {
                            recordChanges[field] = {
                                old: oldValue,
                                new: newValue,
                                type: newValue > oldValue ? 'increase' : 'decrease'
                            };
                        }
                    } else if (field === 'pChange') {
                        // So sánh phần trăm thay đổi với độ chính xác 0.01%
                        if (Math.abs(oldValue - newValue) > 0.01) {
                            recordChanges[field] = {
                                old: oldValue,
                                new: newValue,
                                type: newValue > oldValue ? 'increase' : 'decrease'
                            };
                        }
                    } else if (field === 'totalTradedVolume') {
                        // So sánh volume với độ chính xác 1
                        if (Math.abs(oldValue - newValue) > 0) {
                            recordChanges[field] = {
                                old: oldValue,
                                new: newValue,
                                type: newValue > oldValue ? 'increase' : 'decrease'
                            };
                        }
                    } else {
                        // So sánh các trường khác
                        if (oldValue !== newValue) {
                            recordChanges[field] = {
                                old: oldValue,
                                new: newValue,
                                type: newValue > oldValue ? 'increase' : 'decrease'
                            };
                        }
                    }
                });
                
                if (Object.keys(recordChanges).length > 0) {
                    changes[record.symbol] = recordChanges;
                    console.log(`Changes detected for ${record.symbol}:`, recordChanges);
                }
            }
        });
        
        this.state.changedFields = changes;
        
        // Clear timeout cũ nếu có
        if (this.changeTimeout) {
            clearTimeout(this.changeTimeout);
        }
        
        // Xóa hiệu ứng nháy sau 3 giây
        this.changeTimeout = setTimeout(() => {
            if (this.isComponentMounted()) {
                this.state.changedFields = {};
            }
        }, 3000);
    }

    async onIndexChange(event) {
        if (!this.isComponentMounted()) return;
        
        this.state.selectedIndex = event.target.value;
        
        // Load lại cả dữ liệu tổng quan và dữ liệu chi tiết
        await this.load_data();
        await this.loadIndicesData("gainer_nifty50");
    }

    async bindClickEvent() {
        if (!this.isComponentMounted()) return;

        const gainersTitle = document.getElementById("gainers-title");
        const losersTitle = document.getElementById("losers-title");

        if (gainersTitle && losersTitle) {
            gainersTitle.addEventListener("click", async() => {
                if (!this.isComponentMounted()) return;
                
                this.state.gainersHighlighted = true;
                this.state.losersHighlighted = false;
                gainersTitle.classList.add("highlighted", "view_1");
                losersTitle.classList.remove("highlighted1", "view_2");
                await this.loadIndicesData("gainer_nifty50");
            });

            losersTitle.addEventListener("click", async() => {
                if (!this.isComponentMounted()) return;
                
                this.state.gainersHighlighted = false;
                this.state.losersHighlighted = true;
                losersTitle.classList.add("highlighted1", "view_2");
                gainersTitle.classList.remove("highlighted", "view_1");
                await this.loadIndicesData("losser_nifty50");
            });
        }
    }

    async onLoad() {
        if (!this.isComponentMounted()) return;

        this.state.gainersHighlighted = true;
        this.state.losersHighlighted = false;
        const gainersTitle = document.getElementById("gainers-title");
        const losersTitle = document.getElementById("losers-title");

        if (gainersTitle && losersTitle) {
            gainersTitle.classList.add("highlighted", "view_1");
            losersTitle.classList.remove("highlighted1", "view_2");
        }

        await this.load_data();
        await this.loadIndicesData("gainer_nifty50");

        this.bindClickEvent();
    }

    displayNotification_open() {
        if (!this.isComponentMounted()) return;
        
        const notification = this.env.services.notification;
        notification.add("The NSE-NIFTY Market is Open.", {
            title: "Market Status",
            type: "info",
            sticky: false,
        });
    }

    displayNotification_close() {
        if (!this.isComponentMounted()) return;
        
        const notification = this.env.services.notification;
        notification.add("The NSE-NIFTY Market is closed.", {
            title: "Market Status",
            type: "warning",
            sticky: false,
        });
    }

    start_refresh_timer() {
        if (!this.isComponentMounted()) return;

        // Clear interval cũ nếu có
        if (this.refreshDataInterval) {
            clearInterval(this.refreshDataInterval);
        }

        // Refresh dữ liệu tuần tự - đợi data hoàn thành rồi mới lấy tiếp
        this.refreshDataInterval = setInterval(async () => {
            // Kiểm tra component state
            if (!this.isComponentMounted()) {
                console.log("Component destroyed, clearing refresh interval");
                clearInterval(this.refreshDataInterval);
                return;
            }

            // Kiểm tra nếu đang có request đang chạy thì bỏ qua
            if (this.isDataLoading || this.isIndicesLoading) {
                console.log("Previous request still in progress, skipping this cycle");
                return;
            }

            try {
                console.log("Starting new data refresh cycle...");
                
                // Load dữ liệu tổng quan trước
                await this.load_data();
                
                // Kiểm tra lại sau khi load_data
                if (!this.isComponentMounted()) return;
                
                // Đợi một chút để đảm bảo data đã được xử lý
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Load dữ liệu chi tiết dựa trên tab hiện tại
                if (this.state.gainersHighlighted) {
                    await this.loadIndicesData("gainer_nifty50");
                } else if (this.state.losersHighlighted) {
                    await this.loadIndicesData("losser_nifty50");
                }
                
                console.log("Data refresh cycle completed successfully");
            } catch (error) {
                if (this.isComponentMounted()) {
                    console.error("Error during data refresh cycle:", error);
                }
            }
        }, 1000);

        // Notification timer mỗi 50 giây
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
        }

        this.notificationInterval = setInterval(async () => {
            if (!this.isComponentMounted()) {
                clearInterval(this.notificationInterval);
                return;
            }

            try {
                if (this.state.marketStatus === "Open") {
                    this.displayNotification_open();
                } else {
                    this.displayNotification_close();
                }
            } catch (error) {
                if (this.isComponentMounted()) {
                    console.error("Error in notification timer:", error);
                }
            }
        }, 50000);
    }

    willDestroy() {
        console.log("Dashboard component willDestroy called");
        
        // Đánh dấu component đã destroy
        this.isMounted = false;
        this.isDestroyed = true;
        
        // Reset các flag
        this.isDataLoading = false;
        this.isIndicesLoading = false;
        
        // Clear tất cả intervals
        if (this.refreshDataInterval) {
            console.log("Clearing refreshDataInterval");
            clearInterval(this.refreshDataInterval);
            this.refreshDataInterval = null;
        }
        
        if (this.notificationInterval) {
            console.log("Clearing notificationInterval");
            clearInterval(this.notificationInterval);
            this.notificationInterval = null;
        }
        
        // Clear tất cả timeouts nếu có
        if (this.changeTimeout) {
            console.log("Clearing changeTimeout");
            clearTimeout(this.changeTimeout);
            this.changeTimeout = null;
        }
        
        // Reset state để tránh memory leaks
        if (this.state) {
            this.state.records = [];
            this.state.changedFields = {};
            this.state.isLoading = false;
        }
        
        console.log("Dashboard component cleanup completed");
    }

    // Phương thức để kiểm tra xem một trường có thay đổi không
    isFieldChanged(symbol, field) {
        return this.state.changedFields[symbol] && this.state.changedFields[symbol][field];
    }

    // Phương thức để lấy class CSS cho hiệu ứng nháy
    getFieldClass(symbol, field) {
        if (this.isFieldChanged(symbol, field)) {
            const change = this.state.changedFields[symbol][field];
            return change.type === 'increase' ? 'field-increase' : 'field-decrease';
        }
        return '';
    }

    // Phương thức để lấy class cho màu sắc giá trị realtime
    getPriceClass(value, field) {
        if (!value || value === '-') return '';
        
        if (field === 'change' || field === 'pChange') {
            const numValue = parseFloat(value.replace(/[^\d.-]/g, ''));
            if (numValue > 0) return 'price-up';
            if (numValue < 0) return 'price-down';
            return 'price-unchanged';
        }
        
        return '';
    }

    // Phương thức để lấy class màu sắc cho tất cả các trường
    getValueColorClass(symbol, field, value) {
        // Nếu có thay đổi realtime, ưu tiên hiệu ứng nháy
        if (this.isFieldChanged(symbol, field)) {
            const change = this.state.changedFields[symbol][field];
            return change.type === 'increase' ? 'field-increase' : 'field-decrease';
        }
        
        // Nếu không có thay đổi, hiển thị màu theo giá trị
        if (field === 'change' || field === 'pChange') {
            const numValue = parseFloat(value.replace(/[^\d.-]/g, ''));
            if (numValue > 0) return 'price-up';
            if (numValue < 0) return 'price-down';
            return 'price-unchanged';
        }
        
        return '';
    }
}

Dashboard.template = "stock_market_data.clientaction";
registry.category("actions").add("stock_market_data.dashboard", Dashboard);