import CreateChoreoTaskBehavior from './CreateChoreoTaskBehavior';
import RemoveParticipantBehavior from './RemoveParticipantBehavior';
import DeleteMessageBehavior from './DeleteMessageBehavior';
import ToggleChoreoCollapseBehaviour from './ToggleChoreoCollapseBehavior';

export default {
  __init__: [
    'createChoreoTaskBehavior',
    'removeParticipantBehavior',
    'deleteMessageBehavior',
    'toggleChoreoCollapseBehavior'
  ],
  createChoreoTaskBehavior: [ 'type', CreateChoreoTaskBehavior ],
  removeParticipantBehavior: [ 'type', RemoveParticipantBehavior ],
  deleteMessageBehavior: [ 'type', DeleteMessageBehavior ],
  toggleChoreoCollapseBehavior: [ 'type', ToggleChoreoCollapseBehaviour ]
};