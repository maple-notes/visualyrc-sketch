import {createRoot} from 'react-dom/client';
import App from './app';
import '@xyflow/react/dist/style.css';
import './styles/app.css';
createRoot(document.getElementById('root')!).render(<App/>);
