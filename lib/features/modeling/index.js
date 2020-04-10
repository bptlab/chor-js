import BehaviorModule from './behavior';

import ChoreoElementFactory from './ChoreoElementFactory';
import ChoreoUpdater from './ChoreoUpdater';
import ChoreoModeling from './ChoreoModeling';
import DiOrderingModule from '../di-ordering';


export default {
  __init__: [
    'elementFactory',
    'bpmnUpdater',
    'modeling'
  ],
  __depends__: [
    BehaviorModule,
    DiOrderingModule
  ],
  elementFactory: [ 'type', ChoreoElementFactory ],
  bpmnUpdater: [ 'type', ChoreoUpdater ],
  modeling: [ 'type', ChoreoModeling ]
};
