// entrypoint.js for VerificationWidget
console.log('Verification entrypoint.js loaded');

// Wait for OWL to be available and then mount the component
function mountVerificationWidget() {
    if (typeof owl !== 'undefined' && typeof VerificationWidget !== 'undefined') {
        const widgetContainer = document.getElementById('verificationWidget');
        if (widgetContainer) {
            console.log('Mounting VerificationWidget from entrypoint.js');
            owl.mount(VerificationWidget, widgetContainer);
        } else {
            console.warn('VerificationWidget container not found. Retrying in 100ms...');
            setTimeout(mountVerificationWidget, 100);
        }
    } else {
        console.warn('OWL or VerificationWidget not yet defined. Retrying in 100ms...');
        setTimeout(mountVerificationWidget, 100);
    }
}

mountVerificationWidget(); 