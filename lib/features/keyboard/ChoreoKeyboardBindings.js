import { is } from 'bpmn-js/lib/util/ModelUtil';

const HIGH_PRIORITY = 2000;

/**
 * Choreography specific keyboard bindings.
 */
export default function ChoreoKeyboardBindings(keyboard, selection, rules, modeling) {
  this.registerBindings(keyboard, selection, rules, modeling);
}

ChoreoKeyboardBindings.$inject = [
  'keyboard',
  'selection',
  'rules',
  'modeling'
];


ChoreoKeyboardBindings.prototype.registerBindings = function(keyboard, selection, rules, modeling) {
  // helper function returning a participant band iff it is the only element selected
  let getSelectedBand = function() {
    let selectedElements = selection.get();
    if (selectedElements.length && selectedElements.length === 1) {
      let element = selectedElements[0];
      if (is(element, 'bpmn:Participant')) {
        return element;
      }
    }
  };

  // move bands up and down
  // Direction Keys
  keyboard.addListener(HIGH_PRIORITY, function(context) {
    let event = context.keyEvent;

    if (keyboard.isCmd(event)) {
      return;
    }

    let upwards;
    if (keyboard.isKey([ 'ArrowUp', 'Up' ], event)) {
      upwards = true;
    } else if (keyboard.isKey([ 'ArrowDown', 'Down' ], event)) {
      upwards = false;
    } else {
      return;
    }

    let element = getSelectedBand();
    if (element) {
      if (rules.allowed('band.swap', {
        activityShape: element.activityShape,
        bandShape: element,
        upwards: upwards
      })) {
        modeling.swapParticipantBand(element.activityShape, element, upwards);
        return true;
      }
    }
  });

  // delete selected element
  // DEL
  // (specific behavior for participant bands)
  keyboard.addListener(HIGH_PRIORITY, function(context) {
    let event = context.keyEvent;

    if (keyboard.isKey([ 'Delete', 'Del' ], event)) {
      let element = getSelectedBand();
      if (element) {
        if (rules.allowed('band.delete', { activityShape: element.activityShape })) {
          modeling.deleteParticipantBand(element.activityShape, element.businessObject);
          return true;
        }
      }
    }
  });
};