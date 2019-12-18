import {
  assign
} from 'min-dash';


/**
 * A provider responsible for populating the palette.
 * @constructor
 * @param {Palette} palette
 * @param {Create} create
 * @param {ElementFactory} elementFactory
 * @param {SpaceTool} spaceTool
 * @param {LassoTool} lassoTool
 */
export default function PaletteProvider(palette, create, elementFactory, spaceTool, lassoTool) {
  this._create = create;
  this._elementFactory = elementFactory;
  this._spaceTool = spaceTool;
  this._lassoTool = lassoTool;

  palette.registerProvider(this);
}

PaletteProvider.$inject = [
  'palette',
  'create',
  'elementFactory',
  'spaceTool',
  'lassoTool'
];

/**
 * @param {Object} element (not provided by caller and not used)
 *
 * @return {Object} an object containing the palette specification
 */
PaletteProvider.prototype.getPaletteEntries = function(element) {
  var actions = {},
      create = this._create,
      elementFactory = this._elementFactory,
      spaceTool = this._spaceTool,
      lassoTool = this._lassoTool;

  function createAction(type, group, className, title, options) {
    function createListener(event) {
      var shape = elementFactory.createShape(assign({ type: type }, options));

      if (options) {
        shape.businessObject.di.isExpanded = options.isExpanded;
      }

      create.start(event, shape);
    }

    var shortType = type.replace(/^bpmn:/, '');

    return {
      group: group,
      className: className,
      title: title || 'Create ' + shortType,
      action: {
        dragstart: createListener,
        click: createListener
      }
    };
  }

  assign(actions, {
    'lasso-tool': {
      group: 'tools',
      className: 'bpmn-icon-lasso-tool',
      title: 'Activate the lasso tool',
      action: {
        click: function(event) {
          lassoTool.activateSelection(event);
        }
      }
    },
    'space-tool': {
      group: 'tools',
      className: 'bpmn-icon-space-tool',
      title: 'Activate the create/remove space tool',
      action: {
        click: function(event) {
          spaceTool.activateSelection(event);
        }
      }
    },
    'tool-separator': {
      group: 'tools',
      separator: true
    },
    'create.choreography-task': createAction(
      'bpmn:ChoreographyTask',
      'choreography',
      'choreo-icon-choreography-task'
    ),
    'create.subchoreography-collapsed': createAction(
      'bpmn:SubChoreography',
      'choreography',
      'choreo-icon-subchoreography-collapsed',
      'Create collapsed SubChoreography',
      { isExpanded: false, collapsed: true }
    ),
    'create.subchoreography-expanded': createAction(
      'bpmn:SubChoreography',
      'choreography',
      'choreo-icon-subchoreography-expanded',
      'Create expanded SubChoreography',
      { isExpanded: true, collapsed: false }
    ),
    'create.callchoreography-collapsed': createAction(
      'bpmn:CallChoreography',
      'choreography',
      'choreo-icon-callchoreography-collapsed',
      'Create collapsed Call Choreography',
      { isExpanded: false, collapsed: true }
    ),
    'choreo-separator': {
      group: 'choreography',
      separator: true
    },
    'create.start-event': createAction(
      'bpmn:StartEvent',
      'event',
      'bpmn-icon-start-event-none'
    ),
    'create.intermediate-event': createAction(
      'bpmn:IntermediateThrowEvent',
      'event',
      'bpmn-icon-intermediate-event-none'
    ),
    'create.end-event': createAction(
      'bpmn:EndEvent',
      'event',
      'bpmn-icon-end-event-none'
    ),
    'event-separator': {
      group: 'event',
      separator: true
    },
    'create.exclusive-gateway': createAction(
      'bpmn:ExclusiveGateway',
      'gateway',
      'bpmn-icon-gateway-xor'
    ),
    'create.parallel-gateway': createAction(
      'bpmn:ParallelGateway',
      'gateway',
      'bpmn-icon-gateway-parallel'
    ),
    'create.event-based-gateway': createAction(
      'bpmn:EventBasedGateway',
      'gateway',
      'bpmn-icon-gateway-eventbased'
    )
  });

  return actions;
};
