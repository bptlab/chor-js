import inherits from 'inherits';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

import {
  getBandHeight,
  idGenerator
} from '../../util/BandUtil';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import {
  assign
} from 'min-dash';

/**
 * Behavior when creating a choreography task.
 */
export default function CreateChoreoTaskBehavior(eventBus, bpmnFactory, canvas, elementFactory, create) {

  CommandInterceptor.call(this, eventBus);

  this.preExecute('shape.create', function(event) {

    var context = event.context,
        shape = context.shape;

    if (is(shape, 'bpmn:ChoreographyActivity') && shape.type !== 'label') {
      // get the participants in the choreography
      let choreo = canvas.getRootElement();
      let participants = choreo.businessObject.participants;

      // create participants if we do not have two yet
      while (participants.length < 2) {
        let participant = bpmnFactory.create('bpmn:Participant');
        participants.push(participant);
        participant.name = 'Participant ' + participants.length;
      }

      // set the properties of the choreo activity business object
      let activity = shape.businessObject;
      activity.participantRefs = [
        participants[0],
        participants[1]
      ];
      activity.initiatingParticipantRef = participants[0];
      activity.name = 'New Activity';
    }
  });

  this.postExecute('shape.create', function(event) {

    var context = event.context,
        shape = context.shape;

    if (is(shape, 'bpmn:ChoreographyActivity') && shape.type !== 'label') {
      let partA = shape.businessObject.participantRefs[0];
      let partB = shape.businessObject.participantRefs[1];
      let activity = shape.businessObject;

      // create the participant bands
      let boundsA = {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: getBandHeight(partA)
      };
      let diA = bpmnFactory.create('bpmndi:BPMNShape', {
        choreographyActivityShape: activity.di,
        bpmnElement: partA,
        participantBandKind: 'top_initiating',
        bounds: boundsA,
        id: idGenerator.next()
      });
      let shapeA = elementFactory.createShape(assign({
        type: 'bpmn:Participant',
        businessObject: partA,
        diBand: diA,
        activityShape: shape,
        id: idGenerator.next()
      }, boundsA));

      let boundsB = {
        x: shape.x,
        y: shape.y + shape.height - getBandHeight(partB),
        width: shape.width,
        height: getBandHeight(partB)
      };
      let diB = bpmnFactory.create('bpmndi:BPMNShape', {
        choreographyActivityShape: activity.di,
        bpmnElement: partB,
        participantBandKind: 'bottom_non_initiating',
        bounds: boundsB,
        id: idGenerator.next()
      });
      let shapeB = elementFactory.createShape(assign({
        type: 'bpmn:Participant',
        businessObject: partB,
        diBand: diB,
        activityShape: shape,
        id: idGenerator.next()
      }, boundsB));

      shape.bandShapes = [ shapeA, shapeB ];

      canvas.addShape(shapeA, shape, 0);
      canvas.addShape(shapeB, shape, 0);

      // TODO create message flows
    }
  });

  // TODO implement this.revert
}

CreateChoreoTaskBehavior.$inject = [
  'eventBus',
  'bpmnFactory',
  'canvas',
  'elementFactory',
  'create'
];

inherits(CreateChoreoTaskBehavior, CommandInterceptor);