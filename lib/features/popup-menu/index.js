import PopupMenuModule from 'diagram-js/lib/features/popup-menu';

import ParticipantPopupProvider from './ParticipantPopupProvider';
import ReplaceMenuProvider from './ReplaceMenuProvider';
import ActivityWrenchPopupProvider from './ActivityWrenchPopupProvider';
import ParticipantLinkingPopupProvider from './ParticipantLinkingPopupProvider';

export default {
  __depends__: [
    PopupMenuModule,
  ],
  __init__: [
    'participantPopupProvider',
    'replaceMenuProvider',
    'activityWrenchPopupProvider',
    'participantLinkingPopupProvider'
  ],
  participantPopupProvider: ['type', ParticipantPopupProvider],
  replaceMenuProvider: ['type', ReplaceMenuProvider],
  activityWrenchPopupProvider: ['type', ActivityWrenchPopupProvider],
  participantLinkingPopupProvider : ['type', ParticipantLinkingPopupProvider]
};