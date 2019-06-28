import PopupMenuModule from 'diagram-js/lib/features/popup-menu';

import ParticipantPopupProvider from './ParticipantPopupProvider';
import ReplaceMenuProvider from './ReplaceMenuProvider';
import ActivityWrenchPopupProvider from './ActivityWrenchPopupProvider';

export default {
  __depends__: [
    PopupMenuModule,
  ],
  __init__: [
    'participantPopupProvider',
    'replaceMenuProvider',
    'activityWrenchPopupProvider'
  ],
  participantPopupProvider: ['type', ParticipantPopupProvider],
  replaceMenuProvider: ['type', ReplaceMenuProvider],
  activityWrenchPopupProvider: ['type', ActivityWrenchPopupProvider]
};