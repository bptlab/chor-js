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

function getTaskOutline(width, height) {
  let r = CHOREO_TASK_ROUNDING;
  let path = [
    ['M', r, 0],
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

function getParticipantBandOutline(width, height, participantBandKind) {
  let path;
  let r = CHOREO_TASK_ROUNDING;
  let bandDiff = height - r;
  participantBandKind = participantBandKind || 'top_initiating';
  if (participantBandKind.startsWith('top')) {
    path = [
      ['M', 0, height],
      ['l', width, 0],
      ['l', 0, -height + r],
      ['a', r, r, 0, 0, 0, -r, -r],
      ['l', -width + 2*r, 0],
      ['a', r, r, 0, 0, 0, -r, r],
      ['z']
    ];
  } else if (participantBandKind.startsWith('bottom')) {
    path = [
      ['M', width, 0],
      ['l', -width, 0],
      ['l', 0, height - r],
      ['a', r, r, 0, 0, 0, r, r],
      ['l', width - 2*r, 0],
      ['a', r, r, 0, 0, 0, r, -r],
      ['z']
    ];
  } else {
    path = [
      ['M', 0, height],
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

  this.drawParticipantBand = function(p, element) {
    var group = svgCreate('g');

    var bandKind = element.diBand.participantBandKind;
    var shape = svgCreate('path');
    svgAttr(shape, {
      d: getParticipantBandOutline(element.width, element.height, bandKind),
      stroke: '#000000',
      strokeWidth: 2,
      fill: (bandKind && bandKind.endsWith('non_initiating')) ? 'lightgray' : 'white',
      fillOpacity: 1,
    });
    svgAppend(group, shape);

    let label = getBoxedLabel(element.businessObject.name, {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height
    }, 'center-middle');
    svgAppend(group, label);

    svgAppend(p, group);
    return group;
  }

  this.drawChoreographyActivity = function(p, element) {
    console.log('drawChoreographyActivity', element, element.businessObject.di);

    let activity = element.businessObject;

    let group = svgCreate('g');

    let shape = svgCreate('path');
    svgAttr(shape, {
      d: getTaskOutline(element.width, element.height),
      fill: 'white',
      stroke: 'black',
      strokeWidth: 2
    });
    svgAppend(group, shape);

    //let participantCount = participants.length - 1;
    let top = 0; //getParticipantBandOffset(height, participantCount - participantCount % 2, true);
    let bottom = element.height; //getParticipantBandOffset(height, participantCount - 1 + participantCount % 2);
    let align = 'center-middle';
    if (element.type === 'bpmn:SubChoreography' && !element.collapsed) {
      align = 'left';
    }
    let label = getBoxedLabel(activity.name, {
      x: 0,
      y: top,
      width: element.width,
      height: bottom - top
    }, align);
    svgAppend(group, label);

    // finish up
    svgAppend(p, group);
    return group;
  };

  // this.drawCustomConnection = function(p, element) {
  //   var attrs = computeStyle(attrs, {
  //     stroke: '#ff471a',
  //     strokeWidth: 2
  //   });

  //   return svgAppend(p, createLine(element.waypoints, attrs));
  // };

  // this.getCustomConnectionPath = function(connection) {
  //   var waypoints = connection.waypoints.map(function(p) {
  //     return p.original || p;
  //   });

  //   var connectionPath = [
  //     ['M', waypoints[0].x, waypoints[0].y]
  //   ];

  //   waypoints.forEach(function(waypoint, index) {
  //     if (index !== 0) {
  //       connectionPath.push(['L', waypoint.x, waypoint.y]);
  //     }
  //   });

  //   return componentsToPath(connectionPath);
  // };
}

inherits(CustomRenderer, BaseRenderer);

CustomRenderer.$inject = [ 'eventBus', 'styles', 'textRenderer' ];


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
    return getTaskOutline(shape.width, shape.height)
  } else if (type === 'bpmn:Participant') {
    console.log('getShapePath', shape);
  }
};

// CustomRenderer.prototype.drawConnection = function(p, element) {

//   var type = element.type;

//   if (type === 'custom:connection') {
//     return this.drawCustomConnection(p, element);
//   }
// };


// CustomRenderer.prototype.getConnectionPath = function(connection) {

//   var type = connection.type;

//   if (type === 'custom:connection') {
//     return this.getCustomConnectionPath(connection);
//   }
// };
