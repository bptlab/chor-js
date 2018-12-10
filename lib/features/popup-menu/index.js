import PopupMenuModule from 'diagram-js/lib/features/popup-menu';

import LoopPopupProvider from './LoopPopupProvider';
import ParticipantPopupProvider from './ParticipantPopupProvider';

export default {
  __depends__: [
    PopupMenuModule,
  ],
  __init__: [
    'loopPopupProvider',
    'participantPopupProvider'
  ],
  loopPopupProvider: ['type', LoopPopupProvider],
  participantPopupProvider: ['type', ParticipantPopupProvider]
};