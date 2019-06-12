export default class CreateChoreographyHandler {

    constructor(bpmnFactory, choreoUtil) {
        this._bpmnFactory = bpmnFactory;
        this._choreoUtil = choreoUtil;
    }

    createChoreography() {
        const choreography = this._bpmnFactory.create('bpmn:Choreography', {});
        choreography.$parent = this._choreoUtil.definitions();
        return choreography;
    }

    createDiagram(choreography) {
        const plane = this._bpmnFactory.createDiPlane(choreography);
        const diagram = this._bpmnFactory.create('bpmndi:BPMNDiagram', { plane });
        plane.$parent = diagram;
        diagram.$parent = this._choreoUtil.definitions();
        return diagram;
    }

    execute() {
        this.choreography = this.createChoreography();
        this._choreoUtil.definitions().rootElements.push(this.choreography);

        this.diagram = this.createDiagram(this.choreography);
        this._choreoUtil.diagrams().push(this.diagram);

        this._choreoUtil.switchChoreography(this.choreography.id);
    }

    revert() {
        this._choreoUtil.removeChoreographyById(this.choreography.id);
        this._choreoUtil.switchToFirstChoreography();
    }
}
