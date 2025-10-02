odoo.define('transaction_list.matched_orders', function (require) {
    'use strict';

    var core = require('web.core');
    var Widget = require('web.Widget');
    var _t = core._t;

    var MatchedOrdersTab = Widget.extend({
        template: 'matched_orders_tab',
        
        events: {
            'click .btn-refresh': '_onRefreshClick',
            'click .btn-match-orders': '_onMatchOrdersClick',
            'change .filter-fund': '_onFilterChanged',
            'change .filter-date-from': '_onFilterChanged',
            'change .filter-date-to': '_onFilterChanged',
        },

        init: function (parent) {
            this._super.apply(this, arguments);
            this.matched_pairs = [];
            this.loading = false;
            this.autoRefreshInterval = 30000; // 30 seconds
            this.refreshTimer = null;
            this.funds = [];
            console.log("Loading matched orders...");
        },

        start: function() {
            var self = this;
            return this._super.apply(this, arguments).then(function() {
                // Start auto-refresh
                self.refreshTimer = setInterval(function() {
                    self._loadMatchedPairs();
                }, self.autoRefreshInterval);
            });
        },

        destroy: function() {
            if (this.refreshTimer) {
                clearInterval(this.refreshTimer);
            }
            this._super.apply(this, arguments);
        },

        willStart: function () {
            var self = this;
            return this._super.apply(this, arguments).then(function () {
                return self._loadFunds().then(function(){
                    return self._loadMatchedPairs();
                });
            });
        },

        _loadMatchedPairs: function () {
            var self = this;
            this.loading = true;
            var params = { limit: 1000 };
            // Đọc filter từ query URL nếu có: ?fund_id=...&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
            try {
                var url = new URL(window.location.href);
                var fundId = url.searchParams.get('fund_id');
                var dateFrom = url.searchParams.get('date_from');
                var dateTo = url.searchParams.get('date_to');
                if (fundId) params.fund_id = fundId;
                if (dateFrom) params.date_from = dateFrom + ' 00:00:00';
                if (dateTo) params.date_to = dateTo + ' 23:59:59';
            } catch (e) {}

            // Ưu tiên filter trên UI nếu có
            var $fundSelect = this.$('.filter-fund');
            if ($fundSelect && $fundSelect.length && $fundSelect.val()) {
                params.fund_id = $fundSelect.val();
                var ticker = $fundSelect.find(':selected').data('ticker');
                if (ticker) params.ticker = ticker;
            }
            var $dateFrom = this.$('.filter-date-from');
            var $dateTo = this.$('.filter-date-to');
            if ($dateFrom && $dateFrom.val()) {
                params.date_from = $dateFrom.val().trim() + ' 00:00:00';
            }
            if ($dateTo && $dateTo.val()) {
                params.date_to = $dateTo.val().trim() + ' 23:59:59';
            }

            return this._rpc({
                route: '/api/transaction-list/matched-orders',
                params: params
            }).then(function (response) {
                console.log("API Response:", response);
                if (response.success) {
                    self.matched_pairs = response.data;
                    console.log("Loaded matched orders:", response.total);
                    if (self.matched_pairs.length > 0) {
                        console.log("Sample matched order:", self.matched_pairs[0]);
                    }
                    self.renderMatchedOrders();
                } else {
                    self.displayNotification({
                        type: 'danger',
                        title: _t('Error'),
                        message: response.message || _t('Could not load matched orders'),
                        sticky: false,
                    });
                }
            }).finally(function () {
                self.loading = false;
            });
        },

        _loadFunds: function () {
            var self = this;
            return this._rpc({
                route: '/api/transaction-list/funds',
                params: {}
            }).then(function (res) {
                if (res && res.success && Array.isArray(res.data)) {
                    self.funds = res.data;
                    self._renderFundFilter();
                }
            });
        },

        _renderFundFilter: function () {
            var $fundSelect = this.$('.filter-fund');
            if (!$fundSelect || !$fundSelect.length) return; // template có thể không có phần tử này
            $fundSelect.empty();
            $fundSelect.append($('<option/>', { value: '', text: _t('Tất cả quỹ') }));
            for (var i = 0; i < this.funds.length; i++) {
                var f = this.funds[i];
                var $opt = $('<option/>', {
                    value: f.id,
                    text: f.name + (f.ticker ? (' (' + f.ticker + ')') : '')
                });
                if (f.ticker) $opt.attr('data-ticker', f.ticker);
                $fundSelect.append($opt);
            }
        },

        renderMatchedOrders: function () {
            var self = this;
            var $content = this.$('.matched-orders-content');
            $content.empty();

            if (!this.matched_pairs || !this.matched_pairs.length) {
                $content.append($('<div/>', {
                    class: 'alert alert-info text-center py-5',
                    html: '<i class="fa fa-info-circle fa-2x mb-2"></i><br/>' + _t('No matched orders found')
                }));
                return;
            }

            var $table = $('<table/>', {
                class: 'table table-striped table-hover table-bordered'
            });

            // Add summary section
            var totalValue = 0;
            var totalQuantity = 0;
            this.matched_pairs.forEach(function(pair) {
                totalValue += pair.total_value || 0;
                totalQuantity += pair.matched_quantity || 0;
            });

            var $summary = $('<div/>', {
                class: 'alert alert-info mb-3'
            }).append(
                $('<div/>', {
                    class: 'row',
                    html: `
                        <div class="col-md-4">
                            <strong>Total Matches:</strong> ${this.matched_pairs.length}
                        </div>
                        <div class="col-md-4">
                            <strong>Total Quantity:</strong> ${this._formatNumber(totalQuantity)}
                        </div>
                        <div class="col-md-4">
                            <strong>Total Value:</strong> ${this._formatNumber(totalValue)} VND
                        </div>
                    `
                })
            );
            $content.append($summary);

            // Table header
            var $header = $('<thead/>').append($('<tr/>').append(
                $('<th/>', { text: _t('STT') }),
                $('<th/>', { text: _t('Reference') }),
                $('<th/>', { text: _t('Quỹ') }),
                $('<th/>', { text: _t('Người mua') }),
                $('<th/>', { text: _t('Người bán') }),
                $('<th/>', { text: _t('SL khớp') }),
                $('<th/>', { text: _t('Giá khớp') }),
                $('<th/>', { text: _t('Tổng giá trị') }),
                $('<th/>', { text: _t('Buy In') }),
                $('<th/>', { text: _t('Sell In') }),
                $('<th/>', { text: _t('Buy Out') }),
                $('<th/>', { text: _t('Sell Out') }),
                $('<th/>', { text: _t('Buy Term (m)') }),
                $('<th/>', { text: _t('Sell Term (m)') }),
                $('<th/>', { text: _t('Buy Rate (%)') }),
                $('<th/>', { text: _t('Sell Rate (%)') }),
                $('<th/>', { text: _t('Ngày khớp') }),
                $('<th/>', { text: _t('Trạng thái') })
            ));

            // Table body
            var $body = $('<tbody/>');
            _.each(this.matched_pairs, function (pair, index) {
                var $row = $('<tr/>').append(
                    $('<td/>', { text: index + 1 }),
                    $('<td/>', { text: pair.reference || '' }),
                    $('<td/>', { text: pair.fund_name }),
                    $('<td/>', { text: pair.buy_investor }),
                    $('<td/>', { text: pair.sell_investor }),
                    $('<td/>', { 
                        text: self._formatNumber(pair.matched_quantity),
                        class: 'text-right'
                    }),
                    $('<td/>', { 
                        text: self._formatNumber(pair.matched_price),
                        class: 'text-right'
                    }),
                    $('<td/>', { 
                        text: self._formatNumber(pair.total_value),
                        class: 'text-right'
                    }),
                    $('<td/>', { text: pair.buy_in_time || '' }),
                    $('<td/>', { text: pair.sell_in_time || '' }),
                    $('<td/>', { text: pair.buy_out_time || '' }),
                    $('<td/>', { text: pair.sell_out_time || '' }),
                    $('<td/>', { text: pair.buy_term_months != null ? pair.buy_term_months : '' }),
                    $('<td/>', { text: pair.sell_term_months != null ? pair.sell_term_months : '' }),
                    $('<td/>', { text: pair.buy_interest_rate != null ? pair.buy_interest_rate : '' }),
                    $('<td/>', { text: pair.sell_interest_rate != null ? pair.sell_interest_rate : '' }),
                    $('<td/>', { text: pair.match_date }),
                    $('<td/>').append(
                        $('<span/>', {
                            text: pair.status,
                            class: 'badge ' + (pair.status === 'confirmed' ? 'badge-success' : (pair.status === 'done' ? 'badge-warning' : 'badge-info'))
                        })
                    )
                );
                $body.append($row);
            });

            $table.append($header).append($body);
            $content.append($table);
        },

        _formatNumber: function(number) {
            if (typeof number !== 'number') return number;
            return new Intl.NumberFormat('vi-VN').format(number);
        },

        _onRefreshClick: function (ev) {
            ev.preventDefault();
            this._loadMatchedPairs();
        },

        _onFilterChanged: function (ev) {
            ev.preventDefault();
            this._loadMatchedPairs();
        },
    });

    core.action_registry.add('matched_orders_tab', MatchedOrdersTab);
    return MatchedOrdersTab;
});