// /src/app/App.js
import AppGestureRoot from './AppGestureRoot';
import ModernApp from './ModernApp';

// Milvayo has one UI. Legacy domain modules remain the business-rule authority.
export default function App(){return <AppGestureRoot><ModernApp/></AppGestureRoot>;}
