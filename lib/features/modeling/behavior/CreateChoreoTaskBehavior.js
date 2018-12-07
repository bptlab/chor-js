import inherits from 'inherits';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

import {
  getBandHeight,
  idGenerator
} from '../../../util/BandUtil';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import {
  assign
} from 'min-dash';

import {
  createMessageFlowSemantics,
  unlinkMessageFlowSemantics,
  linkMessageFlowSemantics,
  createMessageShape
} from '../../../util/MessageUtil';

/**
 * Behavior when creating a choreography task.
 */
export default function CreateChoreoTaskBehavior(injector, bpmnFactory, canvas, elementFactory, create) {

  injector.invoke(CommandInterceptor, this);

  this.preExecute('shape.create', function(event) {
    let context = event.context;
    let shape = context.shape;

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
      let partA = participants[0];
      let partB = participants[1];

      // set the properties of the choreo activity business object
      let activity = shape.businessObject;
      activity.get('participantRef').push(partA);
      activity.get('participantRef').push(partB);
      activity.set('initiatingParticipantRef', partA);
      activity.set('name', 'New Activity');

      // create the participant bands
      let diA = bpmnFactory.createDiShape('bpmndi:BPMNShape', {}, {
        choreographyActivityShape: activity.di,
        bpmnElement: partA,
        participantBandKind: 'top_initiating',
        isMessageVisible: false,
        id: idGenerator.next()
      });
      let shapeA = elementFactory.createShape({
        type: 'bpmn:Participant',
        businessObject: partA,
        diBand: diA,
        activityShape: shape,
        id: idGenerator.next()
      });

      let diB = bpmnFactory.createDiShape('bpmndi:BPMNShape', {}, {
        choreographyActivityShape: activity.di,
        bpmnElement: partB,
        participantBandKind: 'bottom_non_initiating',
        isMessageVisible: false,
        id: idGenerator.next()
      });
      let shapeB = elementFactory.createShape({
        type: 'bpmn:Participant',
        businessObject: partB,
        diBand: diB,
        activityShape: shape,
        id: idGenerator.next()
      });

      shape.bandShapes = [ shapeA, shapeB ];

      // create initiating message flow and shape (invisible)
      let messageFlow = createMessageFlowSemantics(
        injector,
        activity,
        activity.get('initiatingParticipantRef')
      );
      shapeA.attachedMessageShape = createMessageShape(injector, shapeA, messageFlow);

      // remember some stuff in the context for later linking
      assign(context, {
        createdMessageFlow: messageFlow,
        createdShapeA: shapeA,
        createdShapeB: shapeB
      });
    }
  });

  this.executed('shape.create', function(event) {
    let context = event.context;
    let shape = context.shape;

    if (is(shape, 'bpmn:ChoreographyActivity') && shape.type !== 'label') {
      // properly link message flow
      linkMessageFlowSemantics(injector, shape.businessObject, context.createdMessageFlow);

      // calculate the bounds of the bands
      let activity = shape.businessObject;
      let partA = activity.get('participantRef')[0];
      let partB = activity.get('participantRef')[1];

      let boundsA = {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: getBandHeight(partA)
      };
      let boundsB = {
        x: shape.x,
        y: shape.y + shape.height - getBandHeight(partB),
        width: shape.width,
        height: getBandHeight(partB)
      };

      assign(context.createdShapeA, boundsA);
      assign(context.createdShapeA.diBand.bounds, boundsA);
      assign(context.createdShapeB, boundsB);
      assign(context.createdShapeB.diBand.bounds, boundsB);

      // add the bands to the BPMNDiagram semantic object
      let choreo = canvas.getRootElement().businessObject;
      let bpmnDiagram = choreo.di;
      bpmnDiagram.get('planeElement').push(context.createdShapeA.diBand);
      bpmnDiagram.get('planeElement').push(context.createdShapeB.diBand);
      context.createdShapeA.diBand.$parent = bpmnDiagram;
      context.createdShapeB.diBand.$parent = bpmnDiagram;

      // add bands to canvas
      canvas.addShape(context.createdShapeA, shape);
      canvas.addShape(context.createdShapeB, shape);
    }
  });

  this.reverted('shape.create', function(event) {
    let context = event.context;
    let shape = context.shape;

    if (is(shape, 'bpmn:ChoreographyActivity') && shape.type !== 'label') {
      // unlink message flow
      unlinkMessageFlowSemantics(injector, shape.businessObject, context.createdMessageFlow);

      // remove the bands from the BPMNDiagram semantic object
      let choreo = canvas.getRootElement().businessObject;
      let bpmnDiagram = choreo.di;
      bpmnDiagram.get('planeElement').pop();
      bpmnDiagram.get('planeElement').pop();

      // remove bands from canvas
      canvas.removeShape(context.createdShapeA);
      canvas.removeShape(context.createdShapeB);
    }
  });
}

CreateChoreoTaskBehavior.$inject = [
  'injector',
  'bpmnFactory',
  'canvas',
  'elementFactory',
  'create'
];

inherits(CreateChoreoTaskBehavior, CommandInterceptor);