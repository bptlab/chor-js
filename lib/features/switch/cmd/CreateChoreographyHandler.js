export default class CreateChoreographyHandler {

  constructor(bpmnFactory, choreoUtil, commandStack) {
    this._bpmnFactory = bpmnFactory;
    this._choreoUtil = choreoUtil;
    this._commandStack = commandStack;
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

  preExecute(context) {
    // create new semantic objects
    let newChoreography = this.createChoreography();
    let newDiagram = this.createDiagram(newChoreography);

    // store them in the context
    context.newChoreography = newChoreography;
    context.newDiagram = newDiagram;
  }

  execute(context) {
    this._choreoUtil.definitions().rootElements.push(context.newChoreography);
    this._choreoUtil.diagrams().push(context.newDiagram);
  }

  postExecute(context) {
    this._commandStack.execute('choreography.switch', {
      id: context.newChoreography.id
    });
  }

  revert(context) {
    this._choreoUtil.removeChoreographyById(context.newChoreography.id);
  }

}

CreateChoreographyHandler.$inject = [
  'bpmnFactory',
  'choreoUtil',
  'commandStack'
];