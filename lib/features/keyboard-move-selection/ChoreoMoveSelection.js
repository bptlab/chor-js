import inherits from 'inherits';

import KeyboardMoveSelection from 'diagram-js/lib/features/keyboard-move-selection/KeyboardMoveSelection';
import { is } from 'bpmn-js/lib/util/ModelUtil';

/**
 * Override the KeyboardMoveSelection handler in diagram-js to prohibit moving
 * participant bands or messages using arrow keys.
 */
export default function ChoreoMoveSelection(injector, selection) {
  injector.invoke(KeyboardMoveSelection, this);

  let oldMoveSelection = this.moveSelection;
  this.moveSelection = function(direction, accelerated) {
    var selectedElements = selection.get();

    if (!selectedElements.length) {
      return;
    }

    // participant bands and messages are not movable
    let isNotMovable = function(shape) {
      return is(shape, 'bpmn:Participant') || is(shape, 'bpmn:Message');
    };
    if (selectedElements.some(isNotMovable)) {
      return;
    }

    oldMoveSelection.call(this, direction, accelerated);
  };
}

inherits(ChoreoMoveSelection, KeyboardMoveSelection);

ChoreoMoveSelection.$inject = [ 'injector', 'selection' ];