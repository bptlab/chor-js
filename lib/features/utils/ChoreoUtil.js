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

    definitionsObject() {
        return this.currentChoreography().$parent;
    }

    choreographies() {
        return this.definitionsObject().rootElements;
    }

    diagrams() {
        return this.definitionsObject().diagrams;
    }

    switchChoreography(choreographyId) {
        this._bpmnjs.displayChoreography({ choreoID: choreographyId });
    }

    switchToFirstChoreography() {
        const remainingChoreo = this.definitionsObject().rootElements[0];
        this.switchChoreography(remainingChoreo.id);
    }

    removeChoreographyById(choreoId) {
        const choreoIndex = this.choreographies().findIndex((choreography) => choreography.id === choreoId);
        if (choreoIndex) {
            this.choreographies().splice(choreoIndex, 1);
        }

        const diagramIndex = this.diagrams().findIndex((diagram) => diagram.plane.bpmnElement.id === choreoId);
        if (diagramIndex) {
            this.diagrams().splice(diagramIndex, 1);
        }
    }
}