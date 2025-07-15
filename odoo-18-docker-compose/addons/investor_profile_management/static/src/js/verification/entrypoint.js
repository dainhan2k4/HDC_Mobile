// Verification Widget Entrypoint
import { VerificationWidget } from './verification_widget.js';

// Mount the widget when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const verificationContainer = document.getElementById('verificationWidget');
  if (verificationContainer) {
    const verificationWidget = new VerificationWidget();
    verificationWidget.mount(verificationContainer);
    }
}); 