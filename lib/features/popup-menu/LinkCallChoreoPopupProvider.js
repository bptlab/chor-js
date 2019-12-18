import inherits from 'inherits';
import PopupMenuProvider from 'diagram-js/lib/features/popup-menu/PopupMenuProvider';
import { is } from 'bpmn-js/lib/util/ModelUtil';

/**
 * Provides a list of choreographies to link call choreographies to.
 * @constructor
 * @param {Injector} injector
 * @param {PopupMenu} popupMenu
 * @param {Modeling|ChoreoModeling} modeling
 * @param {ChoreoUtil} choreoUtil
 */
export default function LinkCallChoreoProvider(injector, popupMenu, modeling, choreoUtil) {
  injector.invoke(PopupMenuProvider, this);
  this._popupMenu = popupMenu;
  this._modeling = modeling;
  this._choreoUtil = choreoUtil;
}

inherits(LinkCallChoreoProvider, PopupMenuProvider);

LinkCallChoreoProvider.$inject = [
  'injector',
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