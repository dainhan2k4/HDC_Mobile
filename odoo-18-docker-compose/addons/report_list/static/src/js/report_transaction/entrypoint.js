/** @odoo-module */

import { mount } from "@odoo/owl";
import { ReportTransactionWidget } from './report_transaction_widget.js';

// Mount OWL widget when DOM is ready
function mountReportTransactionWidget() {
    console.log("Mounting Report Transaction OWL Widget...");
    
    const container = document.getElementById('reportTransactionWidget');
    if (!container) {
        console.error("Report Transaction container not found");
        return;
    }
    
    console.log("Container found:", container);
    
    try {
        // Mount OWL component using OWL mount function
        mount(ReportTransactionWidget, container);
        console.log("Report Transaction OWL Widget mounted successfully");
    } catch (error) {
        console.error("Error mounting Report Transaction OWL Widget:", error);
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountReportTransactionWidget);
} else {
    // DOM already ready
    mountReportTransactionWidget();
}