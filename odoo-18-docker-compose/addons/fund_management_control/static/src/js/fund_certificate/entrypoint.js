// entrypoint.js for FundCertificateWidget
document.addEventListener('DOMContentLoaded', () => {
    // Call the centralized service to handle mounting.
    // It will safely wait for all dependencies to be ready.
    if (window.WidgetMountingService) {
        window.WidgetMountingService.mountWhenReady(
            'FundCertificateWidget',      // The name of the Component Class
            'fundCertificateWidget'       // The ID of the container element in the DOM
        );
    } else {
        console.error('WidgetMountingService is not available. Make sure it is loaded first in your assets.');
    }
});
