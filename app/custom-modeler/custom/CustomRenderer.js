import inherits from 'inherits';

import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';

import {
  componentsToPath,
  createLine
} from 'diagram-js/lib/util/RenderUtil';

import {
  append as svgAppend,
  attr as svgAttr,
  create as svgCreate,
  classes as svgClasses
} from 'tiny-svg';

import {
  assign
} from 'min-dash';

let CHOREO_TASK_ROUNDING = 10;
let PARTICIPANT_BAND_HEIGHT = 19;

function translate(x, y, object) {
  let group = svgAttr(svgCreate('g'), {
    transform: 'translate(' + x + ', ' + y + ')'
  });
  svgAppend(group, object);
  return group;
}

function getParticipantBandOffset(height, index, bottom) {
  let bandHeight = PARTICIPANT_BAND_HEIGHT;
  let multiplier = Math.ceil(index / 2);
  let add = (bottom) ? bandHeight : 0;
  if (index % 2 == 0) {
    return add + bandHeight * multiplier;
  } else {
    return add + height - bandHeight * multiplier;
  }
}

function getTaskOutlinePath(x, y, width, height) {
  let r = CHOREO_TASK_ROUNDING;
  let path = [
    ['M', x + r, y + 0],
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

function getParticipantBandPath(width, height, participantBandKind) {
  let path;
  let r = CHOREO_TASK_ROUNDING;
  let bandDiff = PARTICIPANT_BAND_HEIGHT - r;
  participantBandKind = participantBandKind || 'top_initiating';
  if (participantBandKind.startsWith('top')) {
    path = [
      ['M', r, height],
      ['a', r, r, 0, 0, 0, -r, r],
      ['l', 0, bandDiff],
      ['l', width, 0],
      ['l', 0, -bandDiff],
      ['a', r, r, 0, 0, 0, -r, -r],
      ['z']
    ];
  } else if (participantBandKind.startsWith('bottom')) {
    path = [
      ['M', width - r, height],
      ['a', r, r, 0, 0, 0, r, -r],
      ['l', 0, -bandDiff],
      ['l', -width, 0],
      ['l', 0, bandDiff],
      ['a', r, r, 0, 0, 0, r, r],
      ['z']
    ];
  } else {
    path = [
      ['M', 0, 0],
      ['l', 0, PARTICIPANT_BAND_HEIGHT],
      ['l', width, 0],
      ['l', 0, -PARTICIPANT_BAND_HEIGHT],
      ['l', -width, 0],
      ['z']
    ];
  }
  return componentsToPath(path);
}

/*
function getParticipantBandPath(x, y, width, height, index) {
  let path;
  let r = CHOREO_TASK_ROUNDING;
  let bandDiff = PARTICIPANT_BAND_HEIGHT - r;
  switch(index) {
    case 0:
      path = [
        ['M', x + r, y + 0],
        ['a', r, r, 0, 0, 0, -r, r],
        ['l', 0, bandDiff],
        ['l', width, 0],
        ['l', 0, -bandDiff],
        ['a', r, r, 0, 0, 0, -r, -r],
        ['z']
      ];
      break;
    case 1:
      path = [
        ['M', width - r, y + height],
        ['a', r, r, 0, 0, 0, r, -r],
        ['l', 0, -bandDiff],
        ['l', -width, 0],
        ['l', 0, bandDiff],
        ['a', r, r, 0, 0, 0, r, r],
        ['z']
      ];
      break;
    default:
      let offset = getParticipantBandOffset(height, index);
      path = [
        ['M', 0, y + offset],
        ['l', 0, PARTICIPANT_BAND_HEIGHT],
        ['l', width, 0],
        ['l', 0, -PARTICIPANT_BAND_HEIGHT],
        ['l', -width, 0],
        ['z']
      ];
      break;
  }
  return componentsToPath(path);
}
*/

/**
 * A renderer that knows how to render choreography diagrams.
 */
export default function CustomRenderer(eventBus, styles, textRenderer) {

  BaseRenderer.call(this, eventBus, 2000);

  var computeStyle = styles.computeStyle;

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

  this.drawChoreographyActivity = function(p, element) {
    console.log('draw', element, element.businessObject.di);

    let bounds = element.businessObject.di.bounds;
    let activity = element.businessObject;
    let bands = element.businessObject.diBands;

    let group = svgCreate('g');

    // first, the background
    let outlinePath = getTaskOutlinePath(0, 0, bounds.width, bounds.height);
    let background = svgCreate('path');
    svgAttr(background, {
      d: outlinePath,
      fill: 'white'
    });
    svgAppend(group, background);

    // then the participant backgrounds and labels
    let lines = [];
    bands.forEach(di => {
      let participant = di.bpmnElement;
      let bandBounds = di.bounds;
      let bandKind = di.participantBandKind || 'top_initiating';

      let background = svgCreate('path');
      svgAttr(background, {
        d: getParticipantBandPath(bandBounds.width, bandBounds.height, bandKind),
        fill: (bandKind.includes('non_initiating')) ? 'lightgray' : 'white'
      });
      background = translate(bandBounds.x - bounds.x, bandBounds.y - bounds.y, background);
      svgAppend(group, background);

      let label = getBoxedLabel(participant.name, {
        x: 0,
        y: bandBounds.y - bounds.y,
        width: bandBounds.width,
        height: PARTICIPANT_BAND_HEIGHT
      }, 'center-middle');
      svgAppend(group, label);
    });

    // then the participant lines
    /*
    participants.forEach((participant, index) => {
      let line = svgCreate('line');
      if (index % 2 == 0) {
        index += 2;
      }
      let offset = getParticipantBandOffset(height, index);
      svgAttr(line, {
        x1: 0,
        y1: offset,
        x2: width,
        y2: offset,
        stroke: '#000000',
        strokeWidth: 2
      });
      svgAppend(group, line);
    });
    */

    // then the main label
    {
      //let participantCount = participants.length - 1;
      let top = 0; //getParticipantBandOffset(height, participantCount - participantCount % 2, true);
      let bottom = bounds.height; //getParticipantBandOffset(height, participantCount - 1 + participantCount % 2);
      let align = 'center-middle';
      if (element.type === 'bpmn:SubChoreography' && !element.collapsed) {
        align = 'left';
      }
      let label = getBoxedLabel(activity.name, {
        x: 0,
        y: top,
        width: bounds.width,
        height: bottom - top
      }, align);
      svgAppend(group, label);
    }

    // then the overall outline
    let outline = svgCreate('path');
    svgAttr(outline, {
      d: outlinePath,
      stroke: '#000000',
      strokeWidth: 2,
      fillOpacity: 0
    });
    svgAppend(group, outline);

    // finish up
    svgAppend(p, group);
    return group;
  };



  this.drawCustomConnection = function(p, element) {
    var attrs = computeStyle(attrs, {
      stroke: '#ff471a',
      strokeWidth: 2
    });

    return svgAppend(p, createLine(element.waypoints, attrs));
  };

  this.getCustomConnectionPath = function(connection) {
    var waypoints = connection.waypoints.map(function(p) {
      return p.original || p;
    });

    var connectionPath = [
      ['M', waypoints[0].x, waypoints[0].y]
    ];

    waypoints.forEach(function(waypoint, index) {
      if (index !== 0) {
        connectionPath.push(['L', waypoint.x, waypoint.y]);
      }
    });

    return componentsToPath(connectionPath);
  };
}

inherits(CustomRenderer, BaseRenderer);

CustomRenderer.$inject = [ 'eventBus', 'styles', 'textRenderer' ];


CustomRenderer.prototype.canRender = function(element) {
  return (/^custom:/.test(element.type)) || element.type === 'bpmn:ChoreographyTask' || element.type === 'bpmn:SubChoreography';
};

CustomRenderer.prototype.drawShape = function(p, element) {
  var type = element.type;

  if (type === 'bpmn:ChoreographyTask' || type === 'bpmn:SubChoreography') {
    return this.drawChoreographyActivity(p, element);
  }
};

CustomRenderer.prototype.getShapePath = function(shape) {
  var type = shape.type;

  if (type === 'bpmn:ChoreographyTask' || type === 'bpmn:SubChoreography') {
    getTaskOutlinePath(shape.x, shape.y, shape.width, shape.height)
  }
};

CustomRenderer.prototype.drawConnection = function(p, element) {

  var type = element.type;

  if (type === 'custom:connection') {
    return this.drawCustomConnection(p, element);
  }
};


CustomRenderer.prototype.getConnectionPath = function(connection) {

  var type = connection.type;

  if (type === 'custom:connection') {
    return this.getCustomConnectionPath(connection);
  }
};
