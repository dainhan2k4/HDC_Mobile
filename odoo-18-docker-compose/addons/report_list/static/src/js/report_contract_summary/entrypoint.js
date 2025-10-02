/** @odoo-module */

import { mount } from "@odoo/owl";
import { ReportContractSummaryWidget } from './report_contract_summary_widget.js';

// Mount OWL widget when DOM is ready
function mountReportContractSummaryWidget() {
    console.log("Mounting Report Contract Summary OWL Widget...");
    
    const container = document.getElementById('reportContractSummaryWidget');
    if (!container) {
        console.error("Report Contract Summary container not found");
        return;
    }
    
    console.log("Container found:", container);
    
    try {
        // Mount OWL component using OWL mount function
        mount(ReportContractSummaryWidget, container);
        console.log("Report Contract Summary OWL Widget mounted successfully");
    } catch (error) {
        console.error("Error mounting Report Contract Summary OWL Widget:", error);
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountReportContractSummaryWidget);
} else {
    // DOM already ready
    mountReportContractSummaryWidget();
}