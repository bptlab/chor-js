import CreateChoreoTaskBehavior from './CreateChoreoTaskBehavior';
import RemoveParticipantBehavior from './RemoveParticipantBehavior';
import ResizeParticipantBandBehavior from './ResizeParticipantBandBehavior';
import DeleteMessageBehavior from './DeleteMessageBehavior';

export default {
  __init__: [
    'createChoreoTaskBehavior',
    'removeParticipantBehavior',
    'resizeParticipantBehavior',
    'deleteMessageBehavior'
  ],
  createChoreoTaskBehavior: [ 'type', CreateChoreoTaskBehavior ],
  removeParticipantBehavior: [ 'type', RemoveParticipantBehavior ],
  resizeParticipantBehavior: [ 'type', ResizeParticipantBandBehavior ],
  deleteMessageBehavior: [ 'type', DeleteMessageBehavior ]
};