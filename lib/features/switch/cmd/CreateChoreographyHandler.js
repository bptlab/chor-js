export default class CreateChoreographyHandler {

    constructor(canvas, bpmnFactory, bpmnjs, choreoUtil) {
        this._canvas = canvas;
        this._bpmnFactory = bpmnFactory;
        this._bpmnjs = bpmnjs;
        this._choreoUtil = choreoUtil;
        this._definitions = this._choreoUtil.definitionsObject();
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

    execute() {
        this.choreography = this.createChoreography();
        this._definitions.rootElements.push(this.choreography);

        this.diagram = this.createDiagram(this.choreography);
        this._definitions.diagrams.push(this.diagram);

        this._choreoUtil.switchChoreography(this.choreography.id);
    }

    revert() {
        this._choreoUtil.removeChoreographyById(this.choreography.id);
        this._choreoUtil.switchToFirstChoreography();
    }
}
