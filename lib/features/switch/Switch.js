import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

export default function Switch(injector, canvas, eventBus) {
  this._canvas = canvas;

  let self = this;
  eventBus.on('import.render.complete', function() {
    self.init();
  });
}

Switch.$inject = [ 'injector', 'canvas', 'eventBus' ];

Switch.prototype.init = function() {
  let choreo = this._canvas.getRootElement().businessObject;
  let definitions = choreo.$parent;
  let choreographies = definitions.rootElements.filter(element => is(element, 'bpmn:Choreography'));

  console.log('List of choreographies:', choreographies);
};
