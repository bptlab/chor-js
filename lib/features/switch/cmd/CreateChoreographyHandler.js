export default class UpdateMessageLabelHandler {

    constructor(canvas, bpmnFactory, bpmnjs) {
        this._canvas = canvas;
        this._bpmnFactory = bpmnFactory;
        this._definitions = this._canvas.getRootElement().businessObject.$parent;
        this._bpmnjs = bpmnjs;
    }

    createChoreography() {
        const choreography = this._bpmnFactory.create('bpmn:Choreography', {});
        choreography.$parent = this._definitions;
        return choreography;
    }

    createDiagram(choreography) {
        const plane = this._bpmnFactory.createDiPlane(choreography);
        const diagram = this._bpmnFactory.create('bpmndi:BPMNDiagram', { plane });
        plane.$parent = diagram;
        diagram.$parent = this._definitions;
        return diagram;
    }

    switchChoreography(choreoId) {
        this._bpmnjs.displayChoreography({ choreoID: choreoId });
    };

    execute() {
        this.choreography = this.createChoreography();
        this._definitions.rootElements.push(this.choreography);

        this.diagram = this.createDiagram(this.choreography);
        this._definitions.diagrams.push(this.diagram);

        this.switchChoreography(this.choreography.id);
    }

    revert() {
        this.removeChoreographyById(this.choreography.id);
        this.switchToFirstChoreography();
    }

    switchToFirstChoreography() {
        const remainingChoreo = this._definitions.rootElements[0];
        this.switchChoreography(remainingChoreo.id);
    }

    removeChoreographyById(choreoId) {
        const choreoIndex = this.definitions.rootElements.findIndex((choreography) => choreography.id === choreoId);
        if (choreoIndex) {
            this.definitions.rootElements.splice(choreoIndex, 1);
        }

        const diagramIndex = this.definitions.diagrams.findIndex((diagram) => diagram.plane.bpmnElement.id === choreoId);
        if (diagramIndex) {
            this.definitions.diagrams.splice(diagramIndex, 1);
        }
    }
}
