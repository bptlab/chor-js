import PopupMenuModule from 'diagram-js/lib/features/popup-menu';

import ParticipantPopupProvider from './ParticipantPopupProvider';
import ReplaceMenuProvider from './ReplaceMenuProvider';
import LinkCallChoreoPopupProvider from './LinkCallChoreoPopupProvider';
import LoopPopupProvider from './LoopPopupProvider';
import ParticipantLinkingPopupProvider from './ParticipantLinkingPopupProvider';

export default {
  __depends__: [
    PopupMenuModule,
  ],
  __init__: [
    'participantPopupProvider',
    'replaceMenuProvider',
    'linkCallChoreoPopupProvider',
    'loopPopupProvider',
    'participantLinkingPopupProvider'
  ],
  participantPopupProvider: ['type', ParticipantPopupProvider],
  replaceMenuProvider: ['type', ReplaceMenuProvider],
  linkCallChoreoPopupProvider: ['type', LinkCallChoreoPopupProvider],
  loopPopupProvider: ['type', LoopPopupProvider],
  participantLinkingPopupProvider : ['type', ParticipantLinkingPopupProvider]
};