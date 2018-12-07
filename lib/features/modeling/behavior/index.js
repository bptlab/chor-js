import CreateChoreoTaskBehavior from './CreateChoreoTaskBehavior';
import UpdateParticipantNameBehavior from './UpdateParticipantNameBehavior';
import RemoveParticipantBehavior from './RemoveParticipantBehavior';
import DeleteMessageBehavior from './DeleteMessageBehavior';

export default {
  __init__: [
    'createChoreoTaskBehavior',
    'updateParticipantNameBehavior',
    'removeParticipantBehavior',
    'deleteMessageBehavior'
  ],
  createChoreoTaskBehavior: [ 'type', CreateChoreoTaskBehavior ],
  updateParticipantNameBehavior: [ 'type', UpdateParticipantNameBehavior ],
  removeParticipantBehavior: [ 'type', RemoveParticipantBehavior ],
  deleteMessageBehavior: [ 'type', DeleteMessageBehavior ]
};