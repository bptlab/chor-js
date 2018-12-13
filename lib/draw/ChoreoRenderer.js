import inherits from 'inherits';

import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';

import {
  translate
} from 'diagram-js/lib/util/SvgTransformUtil';

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
  heightOfBottomBands,
  heightOfTopBands,
  hasBandMarker
} from '../util/BandUtil';

import {
  append as svgAppend,
  attr as svgAttr,
  create as svgCreate,
  classes as svgClasses
} from 'tiny-svg';

import {
  MESSAGE_DISTANCE
} from '../util/MessageUtil';

// display specific constants that are not part of the BPMNDI standard
let CHOREO_TASK_ROUNDING = 10;
let MARKER_HEIGHT = 15;

/**
 * A renderer for BPMN 2.0 choreography diagrams.
 */
export default function ChoreoRenderer(eventBus, styles, textRenderer, pathMap) {

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
    svgAttr(label, {
      transform: 'translate(' + box.x + ', ' + box.y + ')',
    });
    return label;
  }

  this.drawMessage = function(p, element) {
    let bandKind = element.parent.diBand.participantBandKind || 'top-initiating';
    let isBottom = bandKind.startsWith('bottom');
    let isInitiating = !bandKind.endsWith('non_initiating');

    let group = svgCreate('g');

    // first, draw the connecting dotted line
    let connector = svgCreate('path');
    svgAttr(connector, {
      d: componentsToPath([
        ['M', element.width / 2, isBottom ? -MESSAGE_DISTANCE : element.height],
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
      d: getEnvelopePath(element.width, element.height),
      stroke: '#000000',
      strokeWidth: 2,
      fill: isInitiating ? 'white' : 'lightgray',
      fillOpacity: 1,
    });
    svgAppend(group, envelope);

    // then, attach the label
    if (element.businessObject.name) {
      let label = getBoxedLabel(element.businessObject.name, {
        x: - element.parent.width / 2 + element.width / 2,
        y: isBottom ? element.height : -element.height,
        width: element.parent.width,
        height: element.height
      }, 'center-middle');
      svgAppend(group, label);
    }

    svgAppend(p, group);
    return group;
  };

  this.drawParticipantBand = function(p, element) {
    let group = svgCreate('g');
    let bandKind = element.diBand.participantBandKind || 'top-initiating';
    let isInitiating = !bandKind.endsWith('non_initiating');

    // draw the participant band
    let bandShape = svgCreate('path');
    svgAttr(bandShape, {
      d: getParticipantBandOutline(0, 0, element.width, element.height, bandKind),
      stroke: '#000000',
      strokeWidth: 2,
      fill: isInitiating ? 'white' : 'lightgray',
      fillOpacity: 1,
    });
    svgAppend(group, bandShape);
    attachMarkerToParticipant(group, element);

    // add the name of the participant
    let label = getBoxedLabel(element.businessObject.name, {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height - ((hasBandMarker(element.businessObject)) ? MARKER_HEIGHT : 0)
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

    let hasMarkers = attachMarkerToChoreoActivity(group, element);

    let top = heightOfTopBands(element);
    let bottom = element.height - heightOfBottomBands(element) - (hasMarkers ? 20 : 0);
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

    svgAppend(p, group);
    return group;
  };

  function attachMarkerToChoreoActivity(parentGfx, element) {
    const defaultFillColor = 'transparent';
    const defaultStrokeColor = 'black';
    const bottomBandHeight = heightOfBottomBands(element);

    let loopType = element.businessObject.loopType;
    let hasLoopMarker = [
      'Standard',
      'MultiInstanceSequential',
      'MultiInstanceParallel'
    ].indexOf(loopType) >= 0;
    let isCollapsed = element.collapsed;
    let offset = (isCollapsed && hasLoopMarker) ? 10 : 0;

    // draw sub choreography marker
    if (isCollapsed) {
      translate(
        drawRect(parentGfx, 14, 14, {
          fill: getFillColor(element, defaultFillColor),
          stroke: getStrokeColor(element, defaultStrokeColor)
        }),
        element.width / 2 - 7.5 + offset,
        element.height - bottomBandHeight - 20
      );
      var markerPath = pathMap.getScaledPath('MARKER_SUB_PROCESS', {
        xScaleFactor: 1.5,
        yScaleFactor: 1.5,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: (element.width / 2 - 7.5 + offset) / element.width,
          my: (element.height - bottomBandHeight - 20) / element.height
        }
      });
      drawMarker('sub-process', parentGfx, markerPath, {
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor)
      });
    }

    // draw loop markers
    if (hasLoopMarker) {
      let loopName;
      let pathAttr = {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height
      };
      let drawAttr = {
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor)
      };

      if (loopType === 'Standard') {
        loopName = 'loop';
        pathAttr.position = {
          mx: ((element.width / 2 - offset) / element.width),
          my: (element.height - 7 - bottomBandHeight) / element.height
        };
        assign(drawAttr, {
          strokeWidth: 1,
          strokeLinecap: 'round',
          strokeMiterlimit: 0.5
        });
      } else if (loopType === 'MultiInstanceSequential') {
        loopName = 'sequential';
        pathAttr.position = {
          mx: ((element.width / 2 - 5 - offset) / element.width),
          my: (element.height - 19 - bottomBandHeight) / element.height
        };
      } else if (loopType === 'MultiInstanceParallel') {
        loopName = 'parallel';
        pathAttr.position = {
          mx: ((element.width / 2 - 6 - offset) / element.width),
          my: (element.height - 20 - bottomBandHeight) / element.height
        };
      }

      let markerPath = pathMap.getScaledPath('MARKER_' + loopName.toUpperCase(), pathAttr);
      drawMarker(loopName, parentGfx, markerPath, drawAttr);
    }

    return isCollapsed || hasLoopMarker;
  }

  function attachMarkerToParticipant(parentGfx, element) {
    const defaultFillColor = 'transparent';
    const defaultStrokeColor = 'black';
    if (hasBandMarker(element.businessObject)) {
      const markerPath = pathMap.getScaledPath('MARKER_PARALLEL', {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: ((element.width / 2 - 6) / element.width),
          my: (element.height - MARKER_HEIGHT) / element.height
        }
      });
      drawMarker('participant-multiplicity', parentGfx, markerPath, {
        strokeWidth: 1,
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor)
      });
    }
  }

  function drawMarker(type, parentGfx, d, attrs) {
    attrs = assign({ 'data-marker': type }, attrs);
    attrs = styles.computeStyle(attrs, ['no-fill'], {
      strokeWidth: 2,
      stroke: 'black'
    });

    const path = svgCreate('path');
    svgAttr(path, { d: d });
    svgAttr(path, attrs);

    svgAppend(parentGfx, path);

    return path;
  }

  function drawRect(parentGfx, width, height, attrs) {
    assign(attrs, {
      stroke: 'black',
      strokeWidth: 2,
      fill: 'white'
    });

    let rect = svgCreate('rect');
    svgAttr(rect, {
      x: 0,
      y: 0,
      width: width,
      height: height
    });
    svgAttr(rect, attrs);
    svgAppend(parentGfx, rect);
    return rect;
  }
}

inherits(ChoreoRenderer, BaseRenderer);

ChoreoRenderer.$inject = ['eventBus', 'styles', 'textRenderer', 'pathMap'];


ChoreoRenderer.prototype.canRender = function(element) {
  return element.type === 'bpmn:ChoreographyTask' ||
    element.type === 'bpmn:SubChoreography' ||
    element.type === 'bpmn:Participant' ||
    element.type === 'bpmn:Message';
};

ChoreoRenderer.prototype.drawShape = function(p, element) {
  var type = element.type;

  if (type === 'bpmn:ChoreographyTask' || type === 'bpmn:SubChoreography') {
    return this.drawChoreographyActivity(p, element);
  } else if (type === 'bpmn:Participant') {
    return this.drawParticipantBand(p, element);
  } else if (type === 'bpmn:Message') {
    return this.drawMessage(p, element);
  }
};

ChoreoRenderer.prototype.getShapePath = function(shape) {
  var type = shape.type;

  if (type === 'bpmn:ChoreographyTask' || type === 'bpmn:SubChoreography') {
    return getTaskOutline(shape.x, shape.y, shape.width, shape.height);
  } else if (type === 'bpmn:Participant') {
    return getParticipantBandOutline(shape.x, shape.y, shape.width, shape.height, shape.diBand.participantBandKind);
  } else if (type === 'bpmn:Message') {
    return getMessageOutline(shape);
  }
};

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

function getMessageOutline(x, y, width, height) {
  let path = [
    ['M', x, y],
    ['l', 0, height],
    ['l', width, 0],
    ['l', 0, -height],
    ['z']
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
    ['l', 0, -height + 2 * r],
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
      ['l', -width + 2 * r, 0],
      ['a', r, r, 0, 0, 0, -r, r],
      ['z']
    ];
  } else if (participantBandKind.startsWith('bottom')) {
    path = [
      ['M', x + width, y],
      ['l', -width, 0],
      ['l', 0, height - r],
      ['a', r, r, 0, 0, 0, r, r],
      ['l', width - 2 * r, 0],
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