var HIGH_PRIORITY = 2000;

export default function BpmnDiOrdering(eventBus, canvas) {

  eventBus.on('saveXML.start', HIGH_PRIORITY, orderDi);

  function orderDi() {
    /* bpmn-js 6.3.3 breaks our DI export, as the DI is now ordered according to layers
    to conform with the standard (See bpmn-js change-log for more info)
    We do not order, as ordering does not work with the participant one to many mapping
    and breaks our export. Thus, we have to override this function.*/
  }
}

BpmnDiOrdering.$inject = [ 'eventBus', 'canvas' ];
