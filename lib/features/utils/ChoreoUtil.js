import { is } from 'bpmn-js/lib/util/ModelUtil';

export default class ChoreoUtil {

  constructor(bpmnjs, canvas) {
    this._bpmnjs = bpmnjs;
    this._canvas = canvas;
  }

  currentChoreography() {
    return this._canvas.getRootElement().businessObject;
  }

  currentDiagram() {
    return this.diagrams().find((diagram) => diagram.plane.bpmnElement && diagram.plane.bpmnElement.id === this.currentChoreography().id);
  }

  definitions() {
    return this._bpmnjs._definitions;
  }

  choreographies() {
    return this.definitions().rootElements.filter(element => is(element, 'bpmn:Choreography'));
  }

  diagrams() {
    return this.definitions().diagrams || [];
  }

  removeChoreographyById(choreoId) {
    const choreoIndex = this.definitions().rootElements.findIndex((choreography) => choreography.id === choreoId);
    if (choreoIndex >= 0) {
      this.definitions().rootElements.splice(choreoIndex, 1);
    } else {
      throw new Error('could not find choreography with ID ' + choreoId);
    }

    const diagramIndex = this.diagrams().findIndex((diagram) => diagram.plane.bpmnElement && diagram.plane.bpmnElement.id === choreoId);
    if (diagramIndex >= 0) {
      this.diagrams().splice(diagramIndex, 1);
    } else {
      throw new Error('could not find diagram for ID ' + choreoId);
    }

    return {
      choreoIndex,
      diagramIndex
    };
  }

}

ChoreoUtil.$inject = [
  'bpmnjs',
  'canvas'
];
