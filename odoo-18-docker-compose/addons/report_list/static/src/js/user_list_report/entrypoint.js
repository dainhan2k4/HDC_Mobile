/** @odoo-module */

import { mount } from "@odoo/owl";
import { UserListReportWidget } from './user_list_report_widget.js';

// Mount OWL widget when DOM is ready
function mountUserListReportWidget() {
    console.log("Mounting User List Report OWL Widget...");
    
    const container = document.getElementById('userListReportWidget');
    if (!container) {
        console.error("User List Report container not found");
        return;
    }
    
    console.log("Container found:", container);
    
    try {
        // Mount OWL component using OWL mount function
        mount(UserListReportWidget, container);
        console.log("User List Report OWL Widget mounted successfully");
    } catch (error) {
        console.error("Error mounting User List Report OWL Widget:", error);
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountUserListReportWidget);
} else {
    // DOM already ready
    mountUserListReportWidget();
}