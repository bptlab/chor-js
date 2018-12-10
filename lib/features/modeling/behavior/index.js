import CreateChoreoTaskBehavior from './CreateChoreoTaskBehavior';
import RemoveParticipantBehavior from './RemoveParticipantBehavior';
import DeleteMessageBehavior from './DeleteMessageBehavior';

export default {
  __init__: [
    'createChoreoTaskBehavior',
    'removeParticipantBehavior',
    'deleteMessageBehavior'
  ],
  createChoreoTaskBehavior: [ 'type', CreateChoreoTaskBehavior ],
  removeParticipantBehavior: [ 'type', RemoveParticipantBehavior ],
  deleteMessageBehavior: [ 'type', DeleteMessageBehavior ]
};