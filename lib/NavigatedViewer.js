import Viewer from './Viewer';

import inherits from 'inherits';

import KeyboardMoveModule from 'diagram-js/lib/navigation/keyboard-move';
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas';
import ZoomScrollModule from 'diagram-js/lib/navigation/zoomscroll';


/**
 * A viewer that adds additional navigation capabilities.
 */
export default function NavigatedViewer(options) {
  Viewer.call(this, options);
}

inherits(NavigatedViewer, Viewer);

NavigatedViewer.prototype._navigationModules = [
  KeyboardMoveModule,
  MoveCanvasModule,
  ZoomScrollModule
];

module.exports = NavigatedViewer; // Required so we can import NViewer in html from a script as ChorJS

// For people who use the prepackaged version of chor-js we also export the plain Viewer here
// so they do not need to include two scripts if they want both
NavigatedViewer.Viewer = Viewer;

NavigatedViewer.prototype._modules = [].concat(
  Viewer.prototype._modules,
  NavigatedViewer.prototype._navigationModules
);
