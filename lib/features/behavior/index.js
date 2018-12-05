import CreateChoreoTaskBehavior from './CreateChoreoTaskBehavior';
import UpdateParticipantNameBehavior from './UpdateParticipantNameBehavior';

export default {
  __init__: [
    'createChoreoTaskBehavior',
    'updateParticipantNameBehavior'
  ],
  createChoreoTaskBehavior: [ 'type', CreateChoreoTaskBehavior ],
  updateParticipantNameBehavior: [ 'type', UpdateParticipantNameBehavior ]
};