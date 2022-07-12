import { initializeApp, getApps } from 'firebase-admin/app';

if (!getApps().length) {
    initializeApp()
}
export {generate} from './generate'
