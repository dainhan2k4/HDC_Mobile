/** @odoo-module */

import { mount } from "@odoo/owl";
import { ReportContractStatisticsWidget } from './report_contract_statistics_widget.js';

// Mount OWL widget when DOM is ready
function mountReportContractStatisticsWidget() {
    console.log("Mounting Report Contract Statistics OWL Widget...");
    
    const container = document.getElementById('reportContractStatisticsWidget');
    if (!container) {
        console.error("Report Contract Statistics container not found");
        return;
    }
    
    console.log("Container found:", container);
    
    try {
        // Mount OWL component using OWL mount function
        mount(ReportContractStatisticsWidget, container);
        console.log("Report Contract Statistics OWL Widget mounted successfully");
    } catch (error) {
        console.error("Error mounting Report Contract Statistics OWL Widget:", error);
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountReportContractStatisticsWidget);
} else {
    // DOM already ready
    mountReportContractStatisticsWidget();
}