import inherits from 'inherits';
import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';
import { translate } from 'diagram-js/lib/util/SvgTransformUtil';
import { componentsToPath } from 'diagram-js/lib/util/RenderUtil';
import { assign } from 'min-dash';
import { is } from 'bpmn-js/lib/util/ModelUtil';
import {
  append as svgAppend,
  attr as svgAttr,
  create as svgCreate,
  classes as svgClasses
} from 'tiny-svg';

import {
  heightOfBottomBands,
  heightOfTopBands,
  hasBandMarker
} from '../util/BandUtil';
import { MESSAGE_DISTANCE } from '../util/MessageUtil';

// Renderer configuration parameters
const CHOREO_TASK_ROUNDING = 10;
const MARKER_HEIGHT = 15;
const DEFAULT_FILL_OPACITY = 0.95;
const NON_INITIATING_OPACITY = 0.1725;
const DEFAULT_NON_INITIATING_FILL = 'rgb(211,211,211)';

/**
 * A renderer for BPMN 2.0 choreography diagrams.
 */
export default function ChoreoRenderer(config, eventBus, textRenderer, pathMap) {

  // Because of the priority this does not work with the injector
  BaseRenderer.call(this, eventBus, 2000);

  // Convenience functions to get the first color from a prioritized list.
  // First, get the color from the XML DI. Then, get the color from the config.
  // Then, take the given override color. If none of those are given, fills are
  // white and strokes are black.
  function getFillColor(di, override) {
    return di.get('bioc:fill') ||
           (config && config.defaultFillColor) ||
           override ||
           'white';
  }

  function getStrokeColor(di, override) {
    return di.get('bioc:stroke') ||
           (config && config.defaultStrokeColor) ||
           override ||
           'black';
  }

  // Label convenience functions
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

  // Message drawing function
  this.drawMessage = function(p, element) {
    let bandKind = element.parent.diBand.participantBandKind || 'top-initiating';
    let isBottom = bandKind.startsWith('bottom');
    let isInitiating = !bandKind.endsWith('non_initiating');

    // First, draw the connecting dotted line
    let connector = svgCreate('path');
    svgAttr(connector, {
      d: componentsToPath([
        ['M', element.width / 2, isBottom ? -MESSAGE_DISTANCE : element.height],
        ['l', 0, MESSAGE_DISTANCE]
      ]),
      stroke: getStrokeColor(element.parent.diBand),
      strokeWidth: 2,
      strokeDasharray: '0, 4',
      strokeLinecap: 'round'
    });
    svgAppend(p, connector);

    // Then, draw the envelope
    let envelope = svgCreate('path');
    let fillColorOverride;
    if (!isInitiating) {
      fillColorOverride = DEFAULT_NON_INITIATING_FILL;
    }
    svgAttr(envelope, {
      d: getEnvelopePath(element.width, element.height),
      stroke: getStrokeColor(element.parent.diBand),
      strokeWidth: 2,
      fill: getFillColor(element.parent.diBand, fillColorOverride),
      fillOpacity: DEFAULT_FILL_OPACITY
    });
    svgAppend(p, envelope);

    // Then, attach the label
    if (element.businessObject.name) {
      let label = getBoxedLabel(element.businessObject.name, {
        x: - element.parent.width / 2 + element.width / 2,
        y: isBottom ? element.height : -element.height,
        width: element.parent.width,
        height: element.height
      }, 'center-middle');
      svgAppend(p, label);
    }

    return p;
  };

  // Participant band drawing function
  this.drawParticipantBand = function(p, element) {
    const bandKind = element.diBand.participantBandKind || 'top-initiating';
    const isInitiating = !bandKind.endsWith('non_initiating');
    const isTop = bandKind.startsWith('top');
    const isBottom = bandKind.startsWith('bottom');
    const isMiddle = !isTop && !isBottom;

    const bandFill = element.diBand.get('bioc:fill');
    const bandStroke = element.diBand.get('bioc:stroke');
    const activityFill = element.parent.businessObject.di.get('bioc:fill');
    const activityStroke = element.parent.businessObject.di.get('bioc:stroke');

    const needsSolidFill = bandFill || activityFill;
    const needsAdditionalOutline = bandStroke || activityStroke;

    // Draw the participant band background if necessary, that is, if the band is
    // non-initiating or has a custom fill
    if (!isInitiating || needsSolidFill) {
      let bandShape = svgCreate('path');
      svgAttr(bandShape, {
        d: getParticipantBandOutline(0, 0, element.width, element.height, bandKind),
        fill: getFillColor(element.diBand, isInitiating ? 'white' : 'black'),
        fillOpacity: bandFill || isInitiating ? DEFAULT_FILL_OPACITY * (!bandFill ? 0.75 : 1) : NON_INITIATING_OPACITY
      });
      svgAppend(p, bandShape);
    }
    attachMarkerToParticipant(p, element);

    // If we have a custom fill or stroke, we have to again place a stroke around the
    // band to fix rendering artifacts around the task stroke
    if (needsSolidFill || needsAdditionalOutline) {
      let bandOutline = svgCreate('path');
      svgAttr(bandOutline, {
        d: getParticipantBandOutline(0, 0, element.width, element.height, bandKind),
        fill: 'none',
        stroke: getStrokeColor(
          element.diBand,
          getStrokeColor(element.parent.businessObject.di)
        ),
        strokeWidth: 2
      });
      svgAppend(p, bandOutline);
    } else {
      // Otherwise, a line below or above the band is enough
      if (isTop || isMiddle) {
        let line = svgCreate('path');
        svgAttr(line, {
          d: componentsToPath([
            ['M', 0, element.height],
            ['l', element.width, 0]
          ]),
          stroke: getStrokeColor(element.parent.businessObject.di),
          strokeWidth: 2
        });
        svgAppend(p, line);
      }
      if (isBottom || isMiddle) {
        let line = svgCreate('path');
        svgAttr(line, {
          d: componentsToPath([
            ['M', 0, 0],
            ['l', element.width, 0]
          ]),
          stroke: getStrokeColor(element.parent.businessObject.di),
          strokeWidth: 2
        });
        svgAppend(p, line);
      }
    }

    // Add the name of the participant
    let label = getBoxedLabel(element.businessObject.name, {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height - ((hasBandMarker(element.businessObject)) ? MARKER_HEIGHT : 0)
    }, 'center-middle');
    svgAppend(p, label);

    return p;
  };

  // Choreography activity drawing function
  this.drawChoreographyActivity = function(p, element) {
    // Draw the outer stroke and background
    let shape = svgCreate('path');
    svgAttr(shape, {
      d: getTaskOutline(
        0, 0, element.width, element.height,is(element, 'bpmn:CallChoreography') ? 2 : 0
      ),
      fill: getFillColor(element.businessObject.di),
      fillOpacity: DEFAULT_FILL_OPACITY,
      stroke: getStrokeColor(element.businessObject.di),
      strokeWidth: is(element, 'bpmn:CallChoreography') ? 6 : 2
    });
    svgAppend(p, shape);

    // Attach markers
    let hasMarkers = attachMarkerToChoreoActivity(p, element);

    // Place the label correctly taking into account whether we have markers
    let top = heightOfTopBands(element);
    let bottom = element.height - heightOfBottomBands(element) - (hasMarkers ? 20 : 0);
    let align = 'center-middle';
    if ((is(element, 'bpmn:SubChoreography') || is(element, 'bpmn:CallChoreography')) && !element.collapsed) {
      align = 'left';
    }
    let label = getBoxedLabel(element.businessObject.name, {
      x: 0,
      y: top,
      width: element.width,
      height: bottom - top
    }, align);
    svgAppend(p, label);

    return p;
  };

  // Marker attachment functions
  function attachMarkerToChoreoActivity(parentGfx, element) {
    // Markers are styled according to the activity they are attached to
    let style = {
      fill: 'none',
      stroke: getStrokeColor(element.businessObject.di)
    };
    const bottomBandHeight = heightOfBottomBands(element);

    let loopType = element.businessObject.loopType;
    let hasLoopMarker = [
      'Standard',
      'MultiInstanceSequential',
      'MultiInstanceParallel'
    ].indexOf(loopType) >= 0;
    let isCollapsed = element.collapsed;
    let offset = (isCollapsed && hasLoopMarker) ? 10 : 0;

    // Draw sub choreography marker
    if (isCollapsed) {
      translate(
        drawRect(parentGfx, 14, 14, assign({
          strokeWidth: 2
        }, style)),
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
      drawMarker('sub-process', parentGfx, markerPath, style);
    }

    // Draw loop markers
    if (hasLoopMarker) {
      let loopName;
      let pathAttr = {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height
      };

      if (loopType === 'Standard') {
        loopName = 'loop';
        pathAttr.position = {
          mx: ((element.width / 2 - offset) / element.width),
          my: (element.height - 7 - bottomBandHeight) / element.height
        };
        assign(style, {
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
      drawMarker(loopName, parentGfx, markerPath, style);
    }

    return isCollapsed || hasLoopMarker;
  }

  function attachMarkerToParticipant(parentGfx, element) {
    // Participant band markers are either styled by the band itself, or the
    // activity the participant band is attached to
    const style = {
      fill: 'none',
      stroke: getStrokeColor(
        element.diBand,
        getStrokeColor(element.parent.businessObject.di)
      ),
    };
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
      drawMarker('participant-multiplicity', parentGfx, markerPath, style);
    }
  }

  function drawMarker(type, parentGfx, d, attrs) {
    attrs = assign({ 'data-marker': type }, attrs);

    const path = svgCreate('path');
    svgAttr(path, { d: d });
    svgAttr(path, attrs);

    svgAppend(parentGfx, path);

    return path;
  }
}

inherits(ChoreoRenderer, BaseRenderer);

ChoreoRenderer.$inject = [
  'config',
  'eventBus',
  'textRenderer',
  'pathMap'
];

ChoreoRenderer.prototype.canRender = function(element) {
  return is(element, 'bpmn:ChoreographyActivity') ||
    is(element, 'bpmn:Participant') ||
    is(element, 'bpmn:Message');
};

ChoreoRenderer.prototype.drawShape = function(p, element) {
  if (is(element, 'bpmn:ChoreographyActivity')) {
    return this.drawChoreographyActivity(p, element);
  } else if (is(element, 'bpmn:Participant')) {
    return this.drawParticipantBand(p, element);
  } else if (is(element, 'bpmn:Message')) {
    return this.drawMessage(p, element);
  }
};

ChoreoRenderer.prototype.getShapePath = function(shape) {
  if (is(shape, 'bpmn:ChoreographyActivity')) {
    return getTaskOutline(shape.x, shape.y, shape.width, shape.height, is(shape, 'bpmn:CallChoreography') ? 6 : 1);
  } else if (is(shape, 'bpmn:Participant')) {
    return getParticipantBandOutline(shape.x, shape.y, shape.width, shape.height, shape.diBand.participantBandKind);
  } else if (is(shape, 'bpmn:Message')) {
    return getMessageOutline(shape);
  }
};

/**
 * The functions below are used to produce some of the more involved
 * vector paths used in the renderer.
 */

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

function getTaskOutline(x, y, width, height, offset) {
  offset = offset || 0;
  let r = CHOREO_TASK_ROUNDING;

  x -= offset;
  y -= offset;
  width += 2 * offset;
  height += 2 * offset;
  r += offset;

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

function drawRect(parentGfx, width, height, attrs) {
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
