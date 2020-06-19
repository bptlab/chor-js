import BaseDrawModule from 'bpmn-js/lib/draw';
import ChoreoRenderer from './ChoreoRenderer';

export default {
  __init__: [
    'choreoRenderer'
  ],
  __depends__: [
    BaseDrawModule
  ],
  choreoRenderer: [ 'type', ChoreoRenderer ]
};
