import inherits from 'inherits';

import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';

import {
  componentsToPath
} from 'diagram-js/lib/util/RenderUtil';

import {
  getFillColor,
  getStrokeColor
} from 'bpmn-js/lib/draw/BpmnRenderUtil';

import {
  assign
} from 'min-dash';

import {
  heightOfBottomBands
} from '../util/BandUtil';

import {
  append as svgAppend,
  attr as svgAttr,
  create as svgCreate,
  classes as svgClasses
} from 'tiny-svg';

// display specific constants, they are not part of the BPMNDI information
let CHOREO_TASK_ROUNDING = 10;
let MESSAGE_WIDTH = 35;
let MESSAGE_HEIGHT = MESSAGE_WIDTH / 7 * 5;
let MESSAGE_DISTANCE = 20;

function translate(x, y, object) {
  let group = svgAttr(svgCreate('g'), {
    transform: 'translate(' + x + ', ' + y + ')'
  });
  svgAppend(group, object);
  return group;
}

function getEnvelopePath(width, height) {
  let flap = height * 0.6;
  let path = [
    ['M', 0, 0],
    ['l', 0, height],
    ['l', width, 0],
    ['l', 0, -height],
    ['z'],
    ['M', 0, 0],
    ['l', width / 2., flap],
    ['l', width / 2., -flap]
  ];
  return componentsToPath(path);
}

function getTaskOutline(x, y, width, height) {
  let r = CHOREO_TASK_ROUNDING;
  let path = [
    ['M', x + r, y],
    ['a', r, r, 0, 0, 0, -r, r],
    ['l', 0, height - 2 * r],
    ['a', r, r, 0, 0, 0, r, r],
    ['l', width - 2 * r, 0],
    ['a', r, r, 0, 0, 0, r, -r],
    ['l', 0, - height + 2 * r],
    ['a', r, r, 0, 0, 0, -r, -r],
    ['z']
  ];
  return componentsToPath(path);
}

function getParticipantBandOutline(x, y, width, height, participantBandKind) {
  let path;
  let r = CHOREO_TASK_ROUNDING;
  participantBandKind = participantBandKind || 'top_initiating';
  if (participantBandKind.startsWith('top')) {
    path = [
      ['M', x, y + height],
      ['l', width, 0],
      ['l', 0, -height + r],
      ['a', r, r, 0, 0, 0, -r, -r],
      ['l', -width + 2*r, 0],
      ['a', r, r, 0, 0, 0, -r, r],
      ['z']
    ];
  } else if (participantBandKind.startsWith('bottom')) {
    path = [
      ['M', x + width, y],
      ['l', -width, 0],
      ['l', 0, height - r],
      ['a', r, r, 0, 0, 0, r, r],
      ['l', width - 2*r, 0],
      ['a', r, r, 0, 0, 0, r, -r],
      ['z']
    ];
  } else {
    path = [
      ['M', x, y + height],
      ['l', width, 0],
      ['l', 0, -height],
      ['l', -width, 0],
      ['z']
    ];
  }
  return componentsToPath(path);
}

/**
 * A renderer that knows how to render choreography diagrams.
 */
export default function CustomRenderer(eventBus, styles, textRenderer, pathMap) {

  BaseRenderer.call(this, eventBus, 2000);

  function getLabel(caption, options) {
    var text = textRenderer.createText(caption || '', options);
    svgClasses(text).add('djs-label');
    return text;
  }

  function getBoxedLabel(caption, box, align) {
    let label = getLabel(caption, {
      box: box,
      align: align,
      padding: align === 'center-middle' ? 0 : 5,
      style: {
        fill: 'black'
      }
    });
    return translate(box.x, box.y, label);
  }

  this.drawParticipantBand = function(p, element) {
    let group = svgCreate('g');
    let bandKind = element.diBand.participantBandKind || 'top-initiating';
    let isBottom = bandKind.startsWith('bottom');
    let isInitiating = !bandKind.endsWith('non_initiating');

    // optionally display an envelope for the attached message
    if (element.diBand.isMessageVisible) {
      // first, draw the connecting dotted line
      let connector = svgCreate('path');
      svgAttr(connector, {
        d: componentsToPath([
          ['M', element.width / 2, isBottom ? element.height : -MESSAGE_DISTANCE],
          ['l', 0, MESSAGE_DISTANCE]
        ]),
        stroke: 'black',
        strokeWidth: 2,
        strokeDasharray: '0, 4',
        strokeLinecap: 'round'
      });
      svgAppend(group, connector);

      // then, draw the envelope
      let envelope = svgCreate('path');
      svgAttr(envelope, {
        d: getEnvelopePath(MESSAGE_WIDTH, MESSAGE_HEIGHT),
        stroke: '#000000',
        strokeWidth: 2,
        fill: isInitiating ? 'white' : 'lightgray',
        fillOpacity: 1,
      });
      svgAppend(group, translate(
        element.width / 2 - MESSAGE_WIDTH / 2,
        isBottom ? element.height + MESSAGE_DISTANCE : -MESSAGE_DISTANCE - MESSAGE_HEIGHT,
        envelope)
      );

      // add a label with the message name if applicable
      // first, find the message flow with this participant as a source
      let messageFlow = element.choreoActivity.businessObject.messageFlowRef.find(
        flow => flow.sourceRef === element.businessObject
      );
      if (messageFlow && messageFlow.messageRef) {
        let message = messageFlow.messageRef;
        if (message.name) {
          let label = getBoxedLabel(message.name, {
            x: 0,
            y: isBottom ? element.height + MESSAGE_DISTANCE + MESSAGE_HEIGHT : -MESSAGE_DISTANCE - MESSAGE_HEIGHT - element.height,
            width: element.width,
            height: element.height
          }, 'center-middle');
          svgAppend(group, label);
        }
      }
    }

    // draw the actual participant band
    let shape = svgCreate('path');
    svgAttr(shape, {
      d: getParticipantBandOutline(0, 0, element.width, element.height, bandKind),
      stroke: '#000000',
      strokeWidth: 2,
      fill: isInitiating ? 'white' : 'lightgray',
      fillOpacity: 1,
    });
    svgAppend(group, shape);

    // add the name of the participant
    let label = getBoxedLabel(element.businessObject.name, {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height
    }, 'center-middle');
    svgAppend(group, label);

    svgAppend(p, group);
    return group;
  };

  this.drawChoreographyActivity = function(p, element) {
    let group = svgCreate('g');

    let shape = svgCreate('path');
    svgAttr(shape, {
      d: getTaskOutline(0, 0, element.width, element.height),
      fill: 'white',
      stroke: 'black',
      strokeWidth: 2
    });
    svgAppend(group, shape);

    //TODO the size of the label should be determined by the participant bands, i.e.,
    //it should extend from the bottom of the last participant band on the top to the
    //top of the first participant band on the bottom
    let top = 0;
    let bottom = element.height;
    let align = 'center-middle';
    if (element.type === 'bpmn:SubChoreography' && !element.collapsed) {
      align = 'left';
    }
    let label = getBoxedLabel(element.businessObject.name, {
      x: 0,
      y: top,
      width: element.width,
      height: bottom - top
    }, align);
    svgAppend(group, label);
    const loopType = element.businessObject.loopType;
    if (loopType === 'Standard'
      || loopType === 'MultiInstanceSequential'
      || loopType === 'MultiInstanceParallel') {
      attachMarker(group, element);
    }
    svgAppend(p, group);
    return group;
  };

  function attachMarker(parentGfx, element) {
    // The loops in choreos are mutually exclusive
    const bottomBandHeight = heightOfBottomBands(element);
    const defaultFillColor = 'transparent', defaultStrokeColor = 'black';

    if (element.businessObject.loopType === 'Standard') {
      drawStandardLoopType(parentGfx, element);
    } else if (element.businessObject.loopType === 'MultiInstanceSequential') {
      drawSequentialLoopType(parentGfx, element);
    } else if (element.businessObject.loopType === 'MultiInstanceParallel') {
      drawParallelLoopType(parentGfx, element);
    }

    function drawStandardLoopType(parentGfx, element) {
      const markerPath = pathMap.getScaledPath('MARKER_LOOP', {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: ((element.width / 2) / element.width),
          my: (element.height - 7 - bottomBandHeight) / element.height
        }
      });

      drawMarker('loop', parentGfx, markerPath, {
        strokeWidth: 1,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor),
        strokeLinecap: 'round',
        strokeMiterlimit: 0.5
      });
    }

    function drawSequentialLoopType(parentGfx, element) {
      const markerPath = pathMap.getScaledPath('MARKER_SEQUENTIAL', {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: ((element.width / 2 - 3) / element.width),
          my: (element.height - 19 - bottomBandHeight) / element.height
        }
      });

      drawMarker('sequential', parentGfx, markerPath, {
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor)
      });
    }
    function drawParallelLoopType(parentGfx, element) {
      const markerPath = pathMap.getScaledPath('MARKER_PARALLEL', {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: ((element.width / 2 - 6) / element.width),
          my: (element.height - 20 - 20) / element.height
        }
      });

      drawMarker('parallel', parentGfx, markerPath, {
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor)
      });
    }

    function drawMarker(type, parentGfx, path, attrs) {
      function drawPath(parentGfx, d, attrs) {

        attrs = styles.computeStyle(attrs, ['no-fill'], {
          strokeWidth: 2,
          stroke: 'black'
        });

        var path = svgCreate('path');
        svgAttr(path, { d: d });
        svgAttr(path, attrs);

        svgAppend(parentGfx, path);

        return path;
      }

      return drawPath(parentGfx, path, assign({ 'data-marker': type }, attrs));
    }

  }
}

inherits(CustomRenderer, BaseRenderer);

CustomRenderer.$inject = [ 'eventBus', 'styles', 'textRenderer', 'pathMap'];


CustomRenderer.prototype.canRender = function(element) {
  return element.type === 'bpmn:ChoreographyTask' ||
         element.type === 'bpmn:SubChoreography' ||
         element.type === 'bpmn:Participant';
};

CustomRenderer.prototype.drawShape = function(p, element) {
  var type = element.type;

  if (type === 'bpmn:ChoreographyTask' || type === 'bpmn:SubChoreography') {
    return this.drawChoreographyActivity(p, element);
  } else if (type === 'bpmn:Participant') {
    return this.drawParticipantBand(p, element);
  }
};

CustomRenderer.prototype.getShapePath = function(shape) {
  var type = shape.type;

  if (type === 'bpmn:ChoreographyTask' || type === 'bpmn:SubChoreography') {
    return getTaskOutline(shape.x, shape.y, shape.width, shape.height);
  } else if (type === 'bpmn:Participant') {
    return getParticipantBandOutline(shape.x, shape.y, shape.width, shape.height, shape.diBand.participantBandKind);
  }
};