/** @odoo-module */

import { mount } from "@odoo/owl";
import { ReportPurchaseContractWidget } from './report_purchase_contract_widget.js';

// Mount OWL widget when DOM is ready
function mountReportPurchaseContractWidget() {
    console.log("Mounting Report Purchase Contract OWL Widget...");
    
    const container = document.getElementById('reportPurchaseContractWidget');
    if (!container) {
        console.error("Report Purchase Contract container not found");
        return;
    }
    
    console.log("Container found:", container);
    
    try {
        // Mount OWL component using OWL mount function
        mount(ReportPurchaseContractWidget, container);
        console.log("Report Purchase Contract OWL Widget mounted successfully");
    } catch (error) {
        console.error("Error mounting Report Purchase Contract OWL Widget:", error);
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountReportPurchaseContractWidget);
} else {
    // DOM already ready
    mountReportPurchaseContractWidget();
}