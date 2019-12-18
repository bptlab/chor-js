import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import Refs from 'object-refs';

import {
  elementToString
} from 'bpmn-js/lib/import/Util';

import {
  assign,
  omit
} from 'min-dash';

import {
  isLabelExternal,
  getExternalLabelBounds
} from 'bpmn-js/lib/util/LabelUtil';

import {
  getMid
} from 'diagram-js/lib/layout/LayoutUtil';

import {
  resetAllBands
} from '../../util/BandUtil';

import {
  createMessageShape,
  createMessageFlowSemantics,
  linkMessageFlowSemantics
} from '../../util/MessageUtil';

let diRefs = new Refs(
  { name: 'bpmnElement', enumerable: true },
  { name: 'di', configurable: true }
);

function elementData(semantic, attrs) {
  return assign({
    id: semantic.id,
    type: semantic.$type,
    businessObject: semantic
  }, attrs);
}

function notYetDrawn(translate, semantic, refSemantic, property) {
  return new Error(translate('element {element} referenced by {referenced}#{property} not yet drawn', {
    element: elementToString(refSemantic),
    referenced: elementToString(semantic),
    property: property
  }));
}

function isPointInsideBBox(bbox, point) {
  return point.x >= bbox.x &&
    point.x <= bbox.x + bbox.width &&
    point.y >= bbox.y &&
    point.y <= bbox.y + bbox.height;
}

/**
 * A visitor for initially rendering a diagram.
 * Creates and links shapes as the diagram is iterated.
 * @constructor
 * @param {Injector} injector
 * @param {EventBus} eventBus
 * @param {Canvas} canvas
 * @param {ElementFactory} elementFactory
 * @param {ElementRegistry} elementRegistry
 * @param {*} translate
 * @param {TextRenderer} textRenderer
 * @param {BpmnModdle} moddle
 */
export default function InitialRenderVisitor(
    injector, eventBus, canvas, elementFactory, elementRegistry, translate, textRenderer, moddle
) {
  this._injector = injector;
  this._eventBus = eventBus;
  this._canvas = canvas;
  this._elementFactory = elementFactory;
  this._elementRegistry = elementRegistry;
  this._translate = translate;
  this._textRenderer = textRenderer;
  this._moddle = moddle;
}

InitialRenderVisitor.$inject = [
  'injector',
  'eventBus',
  'canvas',
  'elementFactory',
  'elementRegistry',
  'translate',
  'textRenderer',
  'moddle'
];

InitialRenderVisitor.prototype.init = function(...parameters) {
};

InitialRenderVisitor.prototype.start = function(choreo, diagram) {
  // load DI from selected diagram
  this._registerDi(diagram.plane);
  if (diagram.plane.planeElement) {
    // if there are no elements in the diagram there will not be any planeElements
    diagram.plane.planeElement.forEach(InitialRenderVisitor.prototype._registerDi.bind(this));
  }

  // If there are participants in the diagram which are not participating in any choreo their DI would never be set.
  // Even though their DI is not important in choreo diagrams due to diBands, it needs to be set because bpmn-js
  // refers to it in some places. Therefore, we set the di for all participants to a dummy DI.
  if (choreo.participants) {
    choreo.participants.forEach(participant => {
      let newDi = this._moddle.create('bpmndi:BPMNShape', {
        id: participant.id + choreo.id + '_dummy_di',
        bpmnElement: participant,
        bounds: this._moddle.create('dc:Bounds', {
          x: 0, y: 0, width: 0, height: 0
        })
      });
      participant.di = newDi;
    });
  }
};

InitialRenderVisitor.prototype.visit = function(element, parentShape) {
  // avoid multiple rendering of elements
  if (element.gfx) {
    throw new Error('already rendered ' + elementToString(element));
  }
  return this._add(element, parentShape);
};

/**
 * Iterate through all DI elements and link their business objects to them.
 */
InitialRenderVisitor.prototype._registerDi = function(di) {
  let bpmnElement = di.bpmnElement;

  if (bpmnElement) {
    // do not link DIs for participants because they have more than one
    if (!is(bpmnElement, 'bpmn:Participant')) {
      if (bpmnElement.di) {
        throw new Error('multiple DI elements defined for ' + elementToString(bpmnElement));
      } else {
        diRefs.bind(bpmnElement, 'di');
        bpmnElement.di = di;
      }
    }
  } else {
    throw new Error('no bpmnElement referenced in ' + elementToString(di));
  }
};

/**
 * Add bpmn element (semantic) to the canvas onto the specified parent shape.
 */
InitialRenderVisitor.prototype._add = function(semantic, parentShape) {
  let element;
  let isParticipantBand = is(semantic, 'bpmn:Participant') && is(parentShape, 'bpmn:ChoreographyActivity');
  let isMessageFlow = is(semantic, 'bpmn:MessageFlow');
  let isChoreoActivity = is(semantic, 'bpmn:ChoreographyActivity');
  let isChoreoTask = is(semantic, 'bpmn:ChoreographyTask');

  let hasDI = !isMessageFlow;

  /*
   * Most semantic elements have an attached DI semantic object (diagram interchange) that
   * bounds, widths, heights, etc. However, some elements like messages do not but
   * we still want to display them as standalone shapes.
   */
  if (hasDI) {
    // get the DI object corresponding to this element
    let di;
    if (isParticipantBand) {
      /*
      * For participant bands, the DI object is not as easy to get as there can
      * be multiple bands for the same semantic object (i.e., a bpmn:Participant).
      * For that reason, we have to iterate through all band DIs and find the right one.
      */
      di = parentShape.businessObject.di.$parent.planeElement.find(
        diBand => diBand.choreographyActivityShape === parentShape.businessObject.di && diBand.bpmnElement === semantic
      );
    } else {
      di = semantic.di;
    }

    /*
     * For choreography activities, we order the participants according
     * to the y position of their band. We then reposition and resize the
     * bands to fit the look and feel of our modeler.
     *
     * On a side note, we set the properties of the di elements ourselves
     * and largely ignore the values in the model. Most external modelers do
     * not properly maintain these values and they can not really be trusted.
     */
    if (isChoreoActivity) {
      let participants = semantic.participantRef;

      // temporarily link all participant business objects to the di band
      // for this specific choreography activity
      participants.forEach(participant => {
        participant.diBand = semantic.di.$parent.planeElement.find(
          diBand => diBand.choreographyActivityShape === di && diBand.bpmnElement === participant
        );
      });

      // sort the participants by their y coordinate and get all the di bands
      participants.sort((left, right) => left.diBand.bounds.y - right.diBand.bounds.y);
      let diBands = participants.map(participant => participant.diBand);

      // remove the temporary reference to the di band we stored in participants
      participants.forEach(participant => {
        delete participant.diBand;
      });

      // reset all the underlying di attributes
      resetAllBands(semantic, diBands, di.bounds);
    }

    /*
     * Handle attached message flows. A task must have 1 or 2 message flows attached
     * and one of them must be an initiating message flow, i.e., one whose source is
     * the initiating participant.
     */
    if (isChoreoTask) {
      let needsAdditionalMessageFlow = false;
      if (semantic.get('messageFlowRef').length == 0) {
        needsAdditionalMessageFlow = true;
      } else if (semantic.get('messageFlowRef').length == 1) {
        needsAdditionalMessageFlow = semantic.get('messageFlowRef')[0].sourceRef != semantic.initiatingParticipantRef;
      }
      // TODO add validation that at least one message flow has the
      //      initiating participant as a source

      if (needsAdditionalMessageFlow) {
        let messageFlow = createMessageFlowSemantics(
          this._injector,
          semantic,
          semantic.initiatingParticipantRef
        );
        linkMessageFlowSemantics(this._injector, semantic, messageFlow);
      }
    }

    /*
     * Depending on the type of the element's DI objects we have to create
     * different shapes.
     */
    if (is(di, 'bpmndi:BPMNPlane')) {
      // handle the special case that we deal with an invisible root element (process or collaboration)
      element = this._elementFactory.createRoot(elementData(semantic));
      this._canvas.setRootElement(element, true);

    } else if (is(di, 'bpmndi:BPMNShape')) {
      // elements that are displayed as shapes
      let collapsed = (
        is(semantic, 'bpmn:SubChoreography') || is(semantic, 'bpmn:CallChoreography')
      ) ? (!semantic.di.isExpanded) : false;
      let hidden = parentShape && (parentShape.hidden || parentShape.collapsed);

      // the bands of a collapsed choreo activity should still be visible
      if (isParticipantBand && !parentShape.hidden && parentShape.collapsed) {
        hidden = false;
      }

      let data = elementData(semantic, {
        collapsed: collapsed,
        hidden: hidden,
        x: Math.round(di.bounds.x),
        y: Math.round(di.bounds.y),
        width: Math.round(di.bounds.width),
        height: Math.round(di.bounds.height)
      });

      // choreography activity shapes need references to the band shapes
      if (isChoreoActivity) {
        assign(data, {
          bandShapes: []
        });
      }

      // participant bands refer the same participant, so the IDs need to be
      // made unique here based on the choreography activity as well
      if (isParticipantBand) {
        assign(data, {
          id: semantic.id + '_' + parentShape.businessObject.id,
          activityShape: parentShape,
          diBand: di
        });
      }

      element = this._elementFactory.createShape(data);

      // add participant band shapes to choreo shape registry
      if (isParticipantBand) {
        parentShape.bandShapes.push(element);
      }

      if (is(semantic, 'bpmn:BoundaryEvent')) {
        this._attachBoundary(semantic, element);
      }

      if (is(semantic, 'bpmn:DataStoreReference')) {
        // check wether data store is inside our outside of its semantic parent
        if (!isPointInsideBBox(parentShape, getMid(di.bounds))) {
          parentShape = this._canvas.getRootElement();
        }
      }

      this._canvas.addShape(element, parentShape);

    } else if (is(di, 'bpmndi:BPMNEdge')) {
      // elements that are displayed as connections, sequence flows, etc.
      let source = this._getSource(semantic);
      let target = this._getTarget(semantic);
      let hidden = parentShape && (parentShape.hidden || parentShape.collapsed);

      element = this._elementFactory.createConnection(elementData(semantic, {
        hidden: hidden,
        source: source,
        target: target,
        waypoints: di.waypoint.map(waypoint => ({ x: waypoint.x, y: waypoint.y }))
      }));

      if (is(semantic, 'bpmn:DataAssociation')) {
        // render always on top; this ensures DataAssociations
        // are rendered correctly across different "hacks" people
        // love to model such as cross participant / sub process
        // associations
        parentShape = null;
      }

      // insert sequence flows behind other flow nodes (cf. #727)
      let parentIndex;
      if (is(semantic, 'bpmn:SequenceFlow')) {
        parentIndex = 0;
      }

      this._canvas.addConnection(element, parentShape, parentIndex);

    } else {
      throw new Error(this._translate('unknown di {di} for element {semantic}', {
        di: elementToString(di),
        semantic: elementToString(semantic)
      }));
    }
    // (optional) external LABEL
    if (isLabelExternal(semantic) && semantic.name) {
      this._addLabel(semantic, element);
    }
  } else {
    if (isMessageFlow) {
      /*
       * Messages are attached to a participant band. They are separate shapes
       * but move with the band. They do not have an underlying DI element.
       * If no message is attached to the message flow, we first have to create one.
       */
      const choreo = this._canvas.getRootElement().businessObject;
      const definitions = choreo.$parent;
      let message = semantic.messageRef;
      if (!message) {
        message = this._moddle.create('bpmn:Message');
        message.id = this._moddle.ids.nextPrefixed('Message_', message);
        definitions.rootElements.unshift(message);
        semantic.messageRef = message;
      }

      if (this._elementRegistry.get(message.id)) {
        /*
         * A shape for this message has already been created. In that case, we
         * copy the message so that we do not have to deal with that when deleting
         * or unlinking them later.
         */
        let newMessage = this._moddle.create('bpmn:Message', omit(message, ['id','$type','di']));
        newMessage.id = this._moddle.ids.nextPrefixed('Message_', newMessage);
        definitions.rootElements.unshift(newMessage);
        semantic.messageRef = newMessage;
      }

      element = createMessageShape(this._injector, parentShape, semantic);
      this._canvas.addShape(element, parentShape);
    }
  }

  this._eventBus.fire('bpmnElement.added', { element: element });
  return element;
};

/**
 * Returns the business object that is the host to the given boundary element.
 */
InitialRenderVisitor.prototype._getBoundaryHostSemantic = function(boundarySemantic) {
  return boundarySemantic.attachedToRef;
};

/**
 * Attach the boundary element to the given host
 *
 * @param {ModdleElement} boundarySemantic
 * @param {djs.model.Base} boundaryElement
 */
InitialRenderVisitor.prototype._attachBoundary = function(boundarySemantic, boundaryElement) {
  let translate = this._translate;
  let hostSemantic = this._getBoundaryHostSemantic(boundarySemantic);

  if (!hostSemantic) {
    throw new Error(translate('missing host semantics for {semantic}', {
      semantic: elementToString(boundarySemantic)
    }));
  }

  let host = this._elementRegistry.get(hostSemantic.id);
  let attachers = host && host.attachers;

  if (!host) {
    throw notYetDrawn(translate, boundarySemantic, hostSemantic, '(hostSemantics)');
  }

  // wire element.host <> host.attachers
  boundaryElement.host = host;

  if (!attachers) {
    host.attachers = attachers = [];
  }

  if (attachers.indexOf(boundaryElement) === -1) {
    attachers.push(boundaryElement);
  }
};

/**
 * add label for an element
 */
InitialRenderVisitor.prototype._addLabel = function(semantic, element) {
  let bounds;
  let text;
  let label;

  bounds = getExternalLabelBounds(semantic, element);

  text = semantic.name;

  if (text) {
    // get corrected bounds from actual layouted text
    bounds = this._textRenderer.getExternalLabelBounds(bounds, text);
  }

  label = this._elementFactory.createLabel(elementData(semantic, {
    id: semantic.id + '_label',
    labelTarget: element,
    type: 'label',
    hidden: element.hidden || !semantic.name,
    x: Math.round(bounds.x),
    y: Math.round(bounds.y),
    width: Math.round(bounds.width),
    height: Math.round(bounds.height)
  }));

  return this._canvas.addShape(label, element.parent);
};

/**
 * Return the drawn connection end based on the given side.
 *
 * @throws {Error} if the end is not yet drawn
 */
InitialRenderVisitor.prototype._getEnd = function(semantic, side) {
  let element;
  let refSemantic;
  let type = semantic.$type;
  let translate = this._translate;

  refSemantic = semantic[side + 'Ref'];

  // handle mysterious isMany DataAssociation#sourceRef
  if (side === 'source' && type === 'bpmn:DataInputAssociation') {
    refSemantic = refSemantic && refSemantic[0];
  }

  // fix source / target for DataInputAssociation / DataOutputAssociation
  if (side === 'source' && type === 'bpmn:DataOutputAssociation' ||
      side === 'target' && type === 'bpmn:DataInputAssociation') {

    refSemantic = semantic.$parent;
  }

  element = refSemantic && this._getElement(refSemantic);

  if (element) {
    return element;
  }

  if (refSemantic) {
    throw notYetDrawn(translate, semantic, refSemantic, side + 'Ref');
  } else {
    throw new Error(translate('{semantic}#{side} Ref not specified', {
      semantic: elementToString(semantic),
      side: side
    }));
  }
};

InitialRenderVisitor.prototype._getSource = function(semantic) {
  return this._getEnd(semantic, 'source');
};

InitialRenderVisitor.prototype._getTarget = function(semantic) {
  return this._getEnd(semantic, 'target');
};

InitialRenderVisitor.prototype._getElement = function(semantic) {
  return this._elementRegistry.get(semantic.id);
};
