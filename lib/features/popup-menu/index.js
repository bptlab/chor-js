import PopupMenuModule from 'diagram-js/lib/features/popup-menu';

import LoopPopupProvider from './LoopPopupProvider';
import ParticipantPopupProvider from './ParticipantPopupProvider';
import ReplaceMenuProvider from './ReplaceMenuProvider';
import LinkCallChoreoPopupProvider from './LinkCallChoreoPopupProvider';

export default {
  __depends__: [
    PopupMenuModule,
  ],
  __init__: [
    'loopPopupProvider',
    'participantPopupProvider',
    'replaceMenuProvider',
    'linkCallChoreoPopupProvider'
  ],
  loopPopupProvider: ['type', LoopPopupProvider],
  participantPopupProvider: ['type', ParticipantPopupProvider],
  replaceMenuProvider: ['type', ReplaceMenuProvider],
  linkCallChoreoPopupProvider: ['type', LinkCallChoreoPopupProvider]
};