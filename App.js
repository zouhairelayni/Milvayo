import AppGestureRoot from './src/AppGestureRoot';
import ModernApp from './ModernApp';

// Niyarvo Projects has one UI. Legacy domain modules remain the business-rule authority.
export default function App(){return <AppGestureRoot><ModernApp/></AppGestureRoot>;}
