import inherits from 'inherits';
import PopupMenuProvider from 'diagram-js/lib/features/popup-menu/PopupMenuProvider';
import { is } from 'bpmn-js/lib/util/ModelUtil';

/**
 *
 * @param popupMenu
 * @param {ChoreoModeling} modeling
 * @param choreoUtil
 * @constructor
 */
export default function ActivityWrenchPopupProvider(popupMenu, modeling, choreoUtil) {
  this._modeling = modeling;
  this._choreoUtil = choreoUtil;
  PopupMenuProvider.call(this, popupMenu);
}

inherits(ActivityWrenchPopupProvider, PopupMenuProvider);


ActivityWrenchPopupProvider.prototype.getEntries = function(element) {
  if (is(element, 'bpmn:CallChoreography')) {
    const currentChoreo = this._choreoUtil.currentChoreography();
    const currentLink = element.businessObject.calledChoreographyRef;
    const items = this._choreoUtil.choreographies().filter(choreo => choreo.id !== currentChoreo.id).map(choreo => {
      const name = choreo.name || choreo.id;
      return {
        id: ('select-' + choreo.id),
        label: name,
        active: currentLink === choreo,
        action: () => this._modeling.linkCallChoreo(element.businessObject, currentLink, choreo) };
    });
    return items;
  }
  return [];
};

ActivityWrenchPopupProvider.prototype.getHeaderEntries = function(element) {
  const isParallel = element.businessObject.loopType === 'MultiInstanceParallel';
  const isSequential = element.businessObject.loopType === 'MultiInstanceSequential';
  const isStandard = element.businessObject.loopType === 'Standard';
  let self = this;

  function toggleEntry(event, entry) {
    let marker;
    if (entry.active) {
      marker = 'None';
    } else {
      marker = entry.loopType;
    }
    self._modeling.updateProperties(element, {
      loopType: marker
    });
  }

  return [
    {
      id: 'toggle-parallel-mi',
      className: 'bpmn-icon-parallel-mi-marker',
      title: 'Parallel Multi Instance',
      active: isParallel,
      action: toggleEntry,
      loopType: 'MultiInstanceParallel',
    },
    {
      id: 'toggle-sequential-mi',
      className: 'bpmn-icon-sequential-mi-marker',
      title: 'Sequential Multi Instance',
      active: isSequential,
      action: toggleEntry,
      loopType: 'MultiInstanceSequential'
    },
    {
      id: 'toggle-loop',
      className: 'bpmn-icon-loop-marker',
      title: 'Loop',
      active: isStandard,
      action: toggleEntry,
      loopType: 'Standard'
    }
  ];
};

ActivityWrenchPopupProvider.prototype.register = function() {
  this._popupMenu.registerProvider('activity-wrench-provider', this);
};