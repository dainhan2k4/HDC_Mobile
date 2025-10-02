/** @odoo-module */

import { mount } from "@odoo/owl";
import { ReportSellContractWidget } from './report_sell_contract_widget.js';

// Mount OWL widget when DOM is ready
function mountReportSellContractWidget() {
    console.log("Mounting Report Sell Contract OWL Widget...");
    
    const container = document.getElementById('reportSellContractWidget');
    if (!container) {
        console.error("Report Sell Contract container not found");
        return;
    }
    
    console.log("Container found:", container);
    
    try {
        // Mount OWL component using OWL mount function
        mount(ReportSellContractWidget, container);
        console.log("Report Sell Contract OWL Widget mounted successfully");
    } catch (error) {
        console.error("Error mounting Report Sell Contract OWL Widget:", error);
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountReportSellContractWidget);
} else {
    // DOM already ready
    mountReportSellContractWidget();
}