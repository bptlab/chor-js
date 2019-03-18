import inherits from 'inherits';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

import {
  getBandHeight
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
export default function CreateChoreoTaskBehavior(injector, bpmnFactory, canvas, elementFactory, model) {

  injector.invoke(CommandInterceptor, this);

  this.preExecuted('shape.create', function(event) {
    //To accommodate for shapes that were copied we need to do some extra differentiation
    let context = event.context;
    let shape = context.shape;
    let position = context.position;

    //shapes that were created by copy already have participants.
    if (is(shape, 'bpmn:ChoreographyActivity') && shape.type !== 'label' && !shape.oldBusinessObject) {
      // Create a completely new ChoreoActivity
      // get the participants in the choreography
      let choreo = canvas.getRootElement();
      let participants = choreo.businessObject.get('participants');

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

      // find out the bounds of the band shapes
      let boundsA = {
        x: position.x - shape.width / 2,
        y: position.y - shape.height / 2,
        width: shape.width,
        height: getBandHeight(partA)
      };
      let boundsB = {
        x: position.x - shape.width / 2,
        y: position.y + shape.height / 2 - getBandHeight(partB),
        width: shape.width,
        height: getBandHeight(partB)
      };

      // create the participant bands
      let diA = bpmnFactory.createDiShape('bpmndi:BPMNShape', boundsA, {
        choreographyActivityShape: activity.di,
        bpmnElement: partA,
        participantBandKind: 'top_initiating',
        isMessageVisible: false
      });
      let shapeA = elementFactory.createShape(assign({
        type: 'bpmn:Participant',
        id: model.ids.nextPrefixed('ParticipantBand_', partA),
        businessObject: partA,
        diBand: diA,
        activityShape: shape
      }, boundsA));

      let diB = bpmnFactory.createDiShape('bpmndi:BPMNShape', boundsB, {
        choreographyActivityShape: activity.di,
        bpmnElement: partB,
        participantBandKind: 'bottom_non_initiating',
        isMessageVisible: false
      });
      let shapeB = elementFactory.createShape(assign({
        type: 'bpmn:Participant',
        id: model.ids.nextPrefixed('ParticipantBand_', partB),
        businessObject: partB,
        diBand: diB,
        activityShape: shape
      }, boundsB));

      shape.bandShapes = [shapeA, shapeB];
      // remember some stuff in the context for later linking
      assign(context, {
        createdShapeA: shapeA,
        createdShapeB: shapeB
      });

      // create initiating message flow and shape (invisible)
      if (is(shape, 'bpmn:ChoreographyTask')) {
        let messageFlow = createMessageFlowSemantics(
          injector,
          activity,
          activity.get('initiatingParticipantRef')
        );
        let messageShape = createMessageShape(injector, shapeA, messageFlow);
        messageShape.hidden = true;
        assign(context, {
          createdMessageFlow: messageFlow,
          createdMessageShape: messageShape
        });
      }
    }
  });


  this.executed('shape.create', function(event) {
    let context = event.context;
    let shape = context.shape;

    //Same as above: new vs. copied
    if (is(shape, 'bpmn:ChoreographyActivity') && shape.type !== 'label' && !shape.oldBusinessObject) {
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

      // properly link elements regarding choreography tasks
      if (is(shape, 'bpmn:ChoreographyTask')) {
        linkMessageFlowSemantics(injector, shape.businessObject, context.createdMessageFlow);
        canvas.addShape(context.createdMessageShape, context.createdShapeA);
      }
    }
  });


  this.reverted('shape.create', function(event) {
    let context = event.context;
    let shape = context.shape;

    if (is(shape, 'bpmn:ChoreographyActivity') && shape.type !== 'label') {
      if (!shape.oldBusinessObject) {
        // remove the bands from the BPMNDiagram semantic object
        let choreo = canvas.getRootElement().businessObject;
        let bpmnDiagram = choreo.di;
        bpmnDiagram.get('planeElement').pop();
        bpmnDiagram.get('planeElement').pop();

        // remove bands from canvas
        canvas.removeShape(context.createdShapeA);
        canvas.removeShape(context.createdShapeB);

        // properly unlink elements regarding choreography tasks
        if (is(shape, 'bpmn:ChoreographyTask')) {
          unlinkMessageFlowSemantics(injector, shape.businessObject, context.createdMessageFlow);
          canvas.removeShape(context.createdMessageShape);
        }
      } else {
        // Delete messages, message flows, and band DIs that were created during copy paste
        let choreo = canvas.getRootElement().businessObject;
        let bpmnDiagram = choreo.di;
        event.context.shape.bandShapes.forEach(band => {
          bpmnDiagram.get('planeElement').splice(bpmnDiagram.get('planeElement').indexOf(band), 1);
        });
        if (is(shape, 'bpmn:ChoreographyTask')) {
          const businessObject = shape.businessObject;
          // slice because unlinkMessageFlow touches the messageFlowRef array
          businessObject.messageFlowRef.slice().forEach(ref => {
            unlinkMessageFlowSemantics(injector, businessObject, ref);
          });
        }
      }

    }
  });
}

CreateChoreoTaskBehavior.$inject = [
  'injector',
  'bpmnFactory',
  'canvas',
  'elementFactory',
  'moddle'
];

inherits(CreateChoreoTaskBehavior, CommandInterceptor);