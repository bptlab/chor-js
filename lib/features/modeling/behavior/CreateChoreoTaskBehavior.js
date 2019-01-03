import inherits from 'inherits';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

import {
  getBandHeight, updateBands
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

  /**
   * Creates a new Band for a copied band, however, does not set any bounds.
   * @param oldBandShape
   * @param choreoShape
   * @returns {djs.model.Shape|*}
   */
  function createNewBand(oldBandShape, choreoShape) {
    console.log(oldBandShape);
    const fakeBounds = {};
    const bandDI = bpmnFactory.createDiShape('bpmndi:BPMNShape', fakeBounds, {
      choreographyActivityShape: choreoShape.businessObject.di,
      bpmnElement: oldBandShape.businessObject,
      participantBandKind: oldBandShape.diBand.participantBandKind,
      isMessageVisible: oldBandShape.diBand.isMessageVisible
    });

    const bandShape = elementFactory.createShape(assign({
      type: 'bpmn:Participant',
      id: model.ids.nextPrefixed('ParticipantBand_', oldBandShape.businessObject),
      businessObject: oldBandShape.businessObject,
      diBand: bandDI,
      activityShape: choreoShape
    }, fakeBounds));

    return bandShape;
  }

  this.preExecuted('shape.create', function(event) {
    //To accommodate for shapes that were copied we need to do some extra differentiation
    let context = event.context;
    let shape = context.shape;
    let position = context.position;

    if (is(shape, 'bpmn:ChoreographyActivity') && shape.type !== 'label') {
      //shapes that were created by copy already have participants, but need new band shapes
      if (shape.oldBusinessObject) {
        const oldBandShapes = shape.oldBandShapes;
        const newBandShapes = [];
        oldBandShapes.forEach(band => newBandShapes.push(createNewBand(band, shape)));
        shape.bandShapes = newBandShapes;
        // Info: Someone on the eventbus will set these positions again, but we set them here already cause
        // the bands need it
        shape.x = position.x;
        shape.y = position.y;
        const bounds = { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
        shape.businessObject.di.bounds = bpmnFactory.createDiBounds(bounds);
        //Also updates di of bands
        updateBands(injector, shape);

      } else {
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
        // Todo: could be important also for copy paste
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

    }
  });

  this.executed('shape.create', function(event) {
    let context = event.context;
    let shape = context.shape;
    if (is(shape, 'bpmn:ChoreographyActivity') && shape.type !== 'label') {
      //Same as above: new vs. copied
      if (shape.oldBusinessObject) {
        const choreo = canvas.getRootElement().businessObject;
        const bpmnDiagram = choreo.di;
        const planeElement = bpmnDiagram.get('planeElement');
        shape.bandShapes.forEach(bandShape => {
          planeElement.push(bandShape.diBand);
          bandShape.diBand.$parent = bpmnDiagram;
          canvas.addShape(bandShape, shape);
        });
        //Todo: Messages

      } else {

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
    }
  });

  this.reverted('shape.create', function(event) {
    let context = event.context;
    let shape = context.shape;

    if (is(shape, 'bpmn:ChoreographyActivity') && shape.type !== 'label') {
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