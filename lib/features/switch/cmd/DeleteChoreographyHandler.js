export default class DeleteChoreographyHandler {

  constructor(choreoUtil) {
    this._choreoUtil = choreoUtil;
  }

  execute() {
    if (this._choreoUtil.choreographies().length <= 1) {
      console.log('The last remaining Choreography cannot be deleted.');
      return;
    }

    this.choreography = this._choreoUtil.currentChoreography();
    this.diagram = this._choreoUtil.currentDiagram();

    this._choreoUtil.removeChoreographyById(this.choreography.id);
    this._choreoUtil.switchToFirstChoreography();
  }

  revert() {
    this._choreoUtil.definitions().rootElements.push(this.choreography);
    this._choreoUtil.diagrams().push(this.diagram);
    this._choreoUtil.switchChoreography(this.choreography.id);
  }

}
