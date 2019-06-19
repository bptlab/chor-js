import BehaviorModule from './behavior';
import ChoreoSwitch from './ChoreoSwitch';

export default {
  __init__: [
    'choreoSwitch'
  ],
  __depends__: [
    BehaviorModule
  ],
  choreoSwitch: [ 'type', ChoreoSwitch ]
};