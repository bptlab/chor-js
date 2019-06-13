export default class RenameChoreographyHandler {

  constructor(choreoSwitch, choreoUtil) {
    this._choreoSwitch = choreoSwitch;
    this._choreoUtil = choreoUtil;
  }

  execute(options) {
    this.previousName = this._choreoUtil.currentChoreography().name;
    this._choreoUtil.currentChoreography().name = options.name;
  }

  revert() {
    this._choreoUtil.currentChoreography().name = this.previousName;
    this._choreoSwitch.updateSwitchOptions();
  }

}
