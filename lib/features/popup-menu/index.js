import PopupMenuModule from 'diagram-js/lib/features/popup-menu';
import LoopPopupProvider from './LoopPopupProvider';

export default {
  __depends__: [
    PopupMenuModule,
  ],
  __init__: [
    'loopPopupProvider'
  ],
  loopPopupProvider: ['type', LoopPopupProvider]
};