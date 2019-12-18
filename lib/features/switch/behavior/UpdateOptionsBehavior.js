import inherits from 'inherits';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

/**
 * @constructor
 * @param {Injector} injector
 * @param {ChoreoSwitch} choreoSwitch
 */
export default function UpdateOptionsBehavior(injector, choreoSwitch) {
  injector.invoke(CommandInterceptor, this);

  function updateOptions() {
    choreoSwitch.updateSwitchOptions();
  }

  // update the choreography switch dropdown whenever something happens
  this.executed('choreography.create', updateOptions);
  this.reverted('choreography.create', updateOptions);
  this.executed('choreography.delete', updateOptions);
  this.reverted('choreography.delete', updateOptions);
  this.executed('choreography.rename', updateOptions);
  this.reverted('choreography.rename', updateOptions);
  this.executed('choreography.switch', updateOptions);
  this.reverted('choreography.switch', updateOptions);
}

inherits(UpdateOptionsBehavior, CommandInterceptor);

UpdateOptionsBehavior.$inject = [
  'injector',
  'choreoSwitch'
];