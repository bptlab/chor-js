import inherits from 'inherits';
import PopupMenuProvider from 'diagram-js/lib/features/popup-menu/PopupMenuProvider';
import { is } from 'bpmn-js/lib/util/ModelUtil';

/**
 * Provides a list of choreographies to link call choreographies to.
 *
 * @param popupMenu
 * @param {ChoreoModeling} modeling
 * @param choreoUtil
 * @constructor
 */
export default function LinkCallChoreoProvider(popupMenu, modeling, choreoUtil) {
  this._modeling = modeling;
  this._choreoUtil = choreoUtil;
  PopupMenuProvider.call(this, popupMenu);
}

inherits(LinkCallChoreoProvider, PopupMenuProvider);

LinkCallChoreoProvider.$inject = [
  'popupMenu',
  'modeling',
  'choreoUtil'
];

LinkCallChoreoProvider.prototype.getEntries = function(element) {
  if (is(element, 'bpmn:CallChoreography')) {
    const currentChoreo = this._choreoUtil.currentChoreography();
    const currentRef = element.businessObject.calledChoreographyRef;
    let items = this._choreoUtil.choreographies().filter(choreo => choreo.id !== currentChoreo.id).map(choreo => {
      const name = choreo.name || choreo.id;
      return {
        id: ('select-' + choreo.id),
        label: name,
        active: currentRef === choreo,
        action: () => this._modeling.linkCallChoreo(element.businessObject, choreo)
      };
    });
    if (items.length == 0) {
      items.push({
        id: 'select-none',
        className: 'italic',
        label: 'no targets found'
      });
    }
    return items;
  }
  return [];
};

LinkCallChoreoProvider.prototype.register = function() {
  this._popupMenu.registerProvider('link-call-choreo-provider', this);
};