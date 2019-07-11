import inherits from 'inherits';
import PopupMenuProvider from 'diagram-js/lib/features/popup-menu/PopupMenuProvider';

/**
 * Provides a popup menu for setting loop types.
 *
 * @param popupMenu
 * @param {ChoreoModeling} modeling
 * @constructor
 */
export default function LoopPopupProvider(popupMenu, modeling) {
  this._modeling = modeling;
  PopupMenuProvider.call(this, popupMenu);
}

inherits(LoopPopupProvider, PopupMenuProvider);

LoopPopupProvider.prototype.getHeaderEntries = function(element) {
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

LoopPopupProvider.prototype.getEntries = function(element) {
  return [];
};

LoopPopupProvider.prototype.register = function() {
  this._popupMenu.registerProvider('loop-provider', this);
};