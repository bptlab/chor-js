import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import {
  elementToString
} from 'bpmn-js/lib/import/Util';

/**
 * A walker traversing the definitions tree which calls the visitor at specific nodes.
 *
 * @param {*} visitor
 */
export default class ChoreoTreeWalker {
  constructor() {
    this._deferred = [];
  }

  /**
   * Before each run, the correct visitor e.g., cached or not cached has to be set.
   * @param visitor
   */
  setVisitor(visitor) {
    this._visitor = visitor;
    if (this._deferred.length !== 0) {
      throw new Error('Before setting a new visitor not all objects in deferred have been visited');
    }
  }

  /**
   * Start the traversal of the choreography.
   *
   * @param {*} choreo choreography to traverse (bpmn:Choreography)
   * @param {*} diagram diagram interchange for the choreography (bpmndi:Plane)
   */
  start(choreo, diagram) {
    this._visitor.start(choreo, diagram);
    let rootShape = this._visitor.visit(choreo);
    this.handleChoreography(choreo, rootShape);
    this.handleDeferred();
  }

  handleDeferred() {
    while (this._deferred.length) {
      let fn = this._deferred.shift();
      fn();
    }
  }

  handleChoreography(choreo, rootShape) {
    this.handleFlowElementsContainer(choreo, rootShape);
    this.handleArtifacts(choreo.artifacts, rootShape);
  }

  handleSubChoreography(choreo, parentShape) {
    this.handleFlowElementsContainer(choreo, parentShape);
    this.handleArtifacts(choreo.artifacts, parentShape);
  }

  handleChoreographyActivity(activity, parentShape) {
    let self = this;
    activity.participantRef.forEach(participant => {
      self.handleParticipant(participant, parentShape);
    });
  }

  handleParticipant(participant, parentShape) {
    let participantShape = this._visitor.visit(participant, parentShape);

    if (is(parentShape, 'bpmn:ChoreographyTask')) {
      let task = parentShape.businessObject;
      let self = this;
      task.get('messageFlowRef').forEach(messageFlow => {
        if (messageFlow.sourceRef === participant) {
          self._visitor.visit(messageFlow, participantShape);
        }
      });
    }
  }

  handleArtifact(artifact, parentShape) {
    // bpmn:TextAnnotation
    // bpmn:Group
    // bpmn:Association
    this._visitor.visit(artifact, parentShape);
  }

  handleArtifacts(artifacts, parentShape) {
    artifacts = artifacts || [];
    let self = this;
    artifacts.forEach(artifact => {
      if (is(artifact, 'bpmn:Association')) {
        self._deferred.push(function() {
          self.handleArtifact(artifact, parentShape);
        });
      } else {
        self.handleArtifact(artifact, parentShape);
      }
    });
  }

  handleFlowNode(flowNode, parentShape) {
    let flowNodeShape = this._visitor.visit(flowNode, parentShape);

    if (is(flowNode, 'bpmn:SubChoreography')) {
      this.handleSubChoreography(flowNode, flowNodeShape || parentShape);
    }

    if (is(flowNode, 'bpmn:ChoreographyActivity')) {
      this.handleChoreographyActivity(flowNode, flowNodeShape || parentShape);
    }
  }

  handleSequenceFlow(sequenceFlow, parentShape) {
    this._visitor.visit(sequenceFlow, parentShape);
  }

  handleBoundaryEvent(event, parentShape) {
    this._visitor.visit(event, parentShape);
  }

  handleFlowElementsContainer(container, parentShape) {
    this.handleFlowElements(container.flowElements, parentShape);
  }

  handleFlowElements(flowElements, parentShape) {
    flowElements = flowElements || [];
    let self = this;
    flowElements.forEach(flowElement => {
      if (is(flowElement, 'bpmn:SequenceFlow')) {
        self._deferred.push(function() {
          self.handleSequenceFlow(flowElement, parentShape);
        });
      } else if (is(flowElement, 'bpmn:BoundaryEvent')) {
        self._deferred.unshift(function() {
          self.handleBoundaryEvent(flowElement, parentShape);
        });
      } else if (is(flowElement, 'bpmn:FlowNode')) {
        self.handleFlowNode(flowElement, parentShape);
      } else {
        throw new Error(
          'unrecognized flowElement ' +
          elementToString(flowElement) + ' in context ' +
          (parentShape ? elementToString(parentShape.businessObject) : 'null')
        );
      }
    });
  }
}
