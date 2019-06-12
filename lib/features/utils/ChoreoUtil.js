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
    return this.diagrams().find((diagram) => diagram.plane.bpmnElement.id === this.currentChoreography().id);
  }

  definitions() {
    return this.currentChoreography().$parent;
  }

  choreographies() {
    return this.definitions().rootElements.filter(element => is(element, 'bpmn:Choreography'));
  }

  diagrams() {
    return this.definitions().diagrams;
  }

  switchChoreography(choreographyId) {
    this._bpmnjs.displayChoreography({ choreoID: choreographyId });
  }

  switchToFirstChoreography() {
    const remainingChoreo = this.choreographies()[0];
    this.switchChoreography(remainingChoreo.id);
  }

  removeChoreographyById(choreoId) {
    const choreoIndex = this.definitions().rootElements.findIndex((choreography) => choreography.id === choreoId);
    if (choreoIndex) {
      this.definitions().rootElements.splice(choreoIndex, 1);
    }

    const diagramIndex = this.diagrams().findIndex((diagram) => diagram.plane.bpmnElement.id === choreoId);
    if (diagramIndex) {
      this.diagrams().splice(diagramIndex, 1);
    }
  }

}
