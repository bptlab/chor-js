import inherits from 'inherits';

import SetColorHandler from 'bpmn-js/lib/features/modeling/cmd/SetColorHandler';

import { is } from 'bpmn-js/lib/util/ModelUtil';

import {
  assign,
  filter,
  forEach,
  pick
} from 'min-dash';

const DEFAULT_COLORS = {
  fill: undefined,
  stroke: undefined
};

/**
 * The regular bpmn-js SetColorHandler uses the 'updateProperties' command to change the
 * DI information. However, that one has hardcoded exceptions for DI properties, and we can
 * not easily extend it with support for messages and participant bands which use the
 * 'diBand' property. So we implement the command for them manually, and delegate everything
 * else to the super class.
 *
 * @param {*} commandStack
 */
export default function ChoreoSetColorHandler(commandStack) {
  this._commandStack = commandStack;
}

ChoreoSetColorHandler.$inject = [
  'commandStack'
];

inherits(ChoreoSetColorHandler, SetColorHandler);

ChoreoSetColorHandler.prototype.execute = function(context) {
  const elements = context.elements;
  const colors = context.colors || DEFAULT_COLORS;
  context.oldColors = {};

  let changed = [];

  forEach(elements, function(element) {
    if (is(element, 'bpmn:Message')) {
      element = element.parent;
    }

    if (is(element, 'bpmn:Participant')) {
      context.oldColors[element.id] = pick(element.diBand, ['fill', 'stroke']);

      // This slightly complicated method makes sure that you can pass undefined to
      // erase custom coloring, and pass 'nothing' to not change the color at all
      if ('fill' in colors) {
        element.diBand.fill = colors.fill;
      }
      if ('stroke' in colors) {
        element.diBand.stroke = colors.stroke;
      }

      changed.push(element);
      changed.push(...element.children);
    } else if (is(element, 'bpmn:ChoreographyActivity')) {
      // Participant band rendering is also influenced by the activity color
      changed.push(...element.children);
    }
  });

  return changed;
};

ChoreoSetColorHandler.prototype.revert = function(context) {
  const elements = context.elements;
  const colors = context.colors || DEFAULT_COLORS;

  let changed = [];

  forEach(elements, function(element) {
    if (is(element, 'bpmn:Message')) {
      element = element.parent;
    }

    if (is(element, 'bpmn:Participant')) {
      if ('fill' in colors) {
        element.diBand.fill = context.oldColors[element.id].fill;
      }
      if ('stroke' in colors) {
        element.diBand.stroke = context.oldColors[element.id].stroke;
      }

      changed.push(element);
      changed.push(...element.children);
    } else if (is(element, 'bpmn:ChoreographyActivity')) {
      changed.push(...element.children);
    }
  });

  return changed;
};

ChoreoSetColorHandler.prototype.postExecute = function(context) {
  // Delegate all remaining elements to the super handler
  let newContext = assign({}, context);
  newContext.elements = filter(newContext.elements, function(element) {
    return !is(element, 'bpmn:Participant') && !is(element, 'bpmn:Message');
  });
  SetColorHandler.prototype.postExecute.call(this, newContext);
};
