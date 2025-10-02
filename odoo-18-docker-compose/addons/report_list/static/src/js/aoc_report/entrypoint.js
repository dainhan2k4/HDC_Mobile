/** @odoo-module */

import { mount } from "@odoo/owl";
import { AOCReportWidget } from './aoc_report_widget.js';

// Mount OWL widget when DOM is ready
function mountAOCReportWidget() {
    console.log("Mounting AOC Report OWL Widget...");
    
    const container = document.getElementById('aocReportWidget');
    if (!container) {
        console.error("AOC Report container not found");
        return;
    }
    
    console.log("Container found:", container);
    
    try {
        // Mount OWL component using OWL mount function
        mount(AOCReportWidget, container);
        console.log("AOC Report OWL Widget mounted successfully");
    } catch (error) {
        console.error("Error mounting AOC Report OWL Widget:", error);
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAOCReportWidget);
} else {
    // DOM already ready
    mountAOCReportWidget();
}