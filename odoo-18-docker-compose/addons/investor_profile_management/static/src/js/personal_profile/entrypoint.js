// Personal Profile Widget Entrypoint
import { PersonalProfileWidget } from './personal_profile_widget.js';
    
// Mount the widget when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const profileContainer = document.getElementById('personalProfileWidget');
  if (profileContainer) {
    const profileWidget = new PersonalProfileWidget();
    profileWidget.mount(profileContainer);
        }
}); 