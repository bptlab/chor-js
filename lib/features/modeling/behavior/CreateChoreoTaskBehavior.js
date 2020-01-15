import inherits from 'inherits';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import {
  flatten
} from 'min-dash';


import {
  getConnectedElements,
  isChoreoActivity,
  isInitiating
} from '../../../util/DiagramWalkerUtil';

/**
 *
 * @param hints
 * @param {Array} allParticipants
 * @returns {*}
 */
function chooseParticipants (hints, allParticipants) {
  // In the default case no source shape was given, e.g. because the the activity was dragged from the side pallet.
  if (allParticipants.length < 2) {
    return {};
  }
  const recommended = {
    initiator: allParticipants[0],
    receiver: allParticipants[1]
  };
  if (hints && hints.sourceShape) {
    let source = hints.sourceShape;
    const precedingActivities = getConnectedElements(hints.sourceShape, 'incoming', isChoreoActivity);

    if (isChoreoActivity(source) || precedingActivities.length === 1) {
      // We reverse the participants roles compared to the previous activity.
      const participants = isChoreoActivity(source) ? source.bandShapes : precedingActivities[0].bandShapes;
      recommended.receiver = participants.find(p => isInitiating(p)).businessObject;
      recommended.initiator = participants.find(p => !isInitiating(p)).businessObject;

    } else if (precedingActivities.length > 1) {
      // If there are more than two preceding activities, e.g., due to a join we select the most used participants.
      const participants = flatten(precedingActivities.map(p => p.bandShapes.map(bs => bs.businessObject)));
      const count = {};
      participants.forEach(bo => {
        count[bo.id] = (count[bo.id] || 0) + 1;
      });
      let list = allParticipants.map(bo => [bo, count[bo.id]]);
      list.sort((a, b) => b[1] - a[1]);

      recommended.initiator = list[0][0];
      recommended.receiver = list[1][0];
    }
  }
  return recommended;

}

/**
 * Behavior when creating a choreography task.
 * @constructor
 * @param {Injector} injector
 * @param {BpmnFactory} bpmnFactory
 * @param {Canvas} canvas
 * @param {ElementFactory} elementFactory
 * @param {BPMNModdle} model
 * @param {CommandStack} commandStack
 */
export default function CreateChoreoTaskBehavior (injector, bpmnFactory, canvas, elementFactory, model, commandStack) {

  injector.invoke(CommandInterceptor, this);

  this.preExecuted('shape.create', function (event) {
    const context = event.context;
    const shape = context.shape;
    if (is(shape, 'bpmn:ChoreographyActivity') && shape.type !== 'label') {
      if (!shape.businessObject.name) {
        shape.businessObject.name = 'New Activity';
      }
    }
  });

  this.postExecuted('shape.create', function (event) {
    let context = event.context;
    let shape = context.shape;

    if (is(shape, 'bpmn:ChoreographyActivity') && shape.type !== 'label') {
      let activity = shape.businessObject;
      if (!activity.participantRef) {
        activity.participantRef = [];
      }
      if (!shape.bandShapes) {
        shape.bandShapes = [];
      }

      let choreo = canvas.getRootElement();
      let participants = choreo.businessObject.get('participants');

      const recommended = chooseParticipants(context.hints, participants);
      let partA = recommended.initiator;
      let partB = recommended.receiver;
      const bandAContext = {
        delete: false,
        activityShape: shape,
        index: 0,
        isInitiating: true,
        participant: partA
      };
      commandStack.execute('band.create', bandAContext);

      const bandBContext = {
        delete: false,
        activityShape: shape,
        index: 1,
        isInitiating: false,
        participant: partB
      };
      commandStack.execute('band.create', bandBContext);

      // create initiating message flow and shape (invisible)
      if (is(shape, 'bpmn:ChoreographyTask')) {
        const messageContext = {
          bandShape: shape.bandShapes[0], // this might be wrong
          isVisible: false
        };
        commandStack.execute('message.add', messageContext);
      }

    }
  });

}

CreateChoreoTaskBehavior.$inject = [
  'injector',
  'bpmnFactory',
  'canvas',
  'elementFactory',
  'moddle',
  'commandStack'
];

inherits(CreateChoreoTaskBehavior, CommandInterceptor);