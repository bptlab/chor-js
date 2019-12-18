import inherits from 'inherits';

import KeyboardMoveSelection from 'diagram-js/lib/features/keyboard-move-selection/KeyboardMoveSelection';
import { is } from 'bpmn-js/lib/util/ModelUtil';

/**
 * Override the KeyboardMoveSelection handler in diagram-js to prohibit moving
 * participant bands or messages using arrow keys.
 * @constructor
 * @param {Injector} injector
 * @param {Selection} selection
 */
export default function ChoreoMoveSelection(injector, selection) {
  injector.invoke(KeyboardMoveSelection, this);

  let oldMoveSelection = this.moveSelection;
  this.moveSelection = function(direction, accelerated) {
    var selectedElements = selection.get();

    if (!selectedElements.length) {
      return;
    }

    // Participant bands and messages are not movable unless their activities are also selected
    let isNotMovable = function(shape) {
      const participantActivityUnselected = is(shape, 'bpmn:Participant') && !selectedElements.includes(shape.parent);
      const messageActivityUnselected = is(shape, 'bpmn:Message') && !selectedElements.includes(shape.parent.parent);

      return participantActivityUnselected || messageActivityUnselected;
    };

    if (selectedElements.some(isNotMovable)) {
      return;
    }

    // We remove all these shapes as they will be moved anyway due to being descendant of the activity
    selection._selectedElements = selectedElements.filter(
      e => !(is(e, 'bpmn:Participant') || is(e, 'bpmn:Message')));

    oldMoveSelection.call(this, direction, accelerated);
  };
}

inherits(ChoreoMoveSelection, KeyboardMoveSelection);

ChoreoMoveSelection.$inject = [ 'injector', 'selection' ];