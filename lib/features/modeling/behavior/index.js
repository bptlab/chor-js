import CreateChoreoTaskBehavior from './CreateChoreoTaskBehavior';
import UpdateParticipantNameBehavior from './UpdateParticipantNameBehavior';
import DeleteMessageBehavior from './DeleteMessageBehavior';

export default {
  __init__: [
    'createChoreoTaskBehavior',
    'updateParticipantNameBehavior',
    'deleteMessageBehavior'
  ],
  createChoreoTaskBehavior: [ 'type', CreateChoreoTaskBehavior ],
  updateParticipantNameBehavior: [ 'type', UpdateParticipantNameBehavior ],
  deleteMessageBehavior: [ 'type', DeleteMessageBehavior ]
};