import 'core-js/stable';
import { Viewer } from './Viewer';

import inherits from 'inherits';

import KeyboardMoveModule from 'diagram-js/lib/navigation/keyboard-move';
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas';
import ZoomScrollModule from 'diagram-js/lib/navigation/zoomscroll';


/**
 * A viewer that adds additional navigation capabilities.
 */
export function NavigatedViewer(options) {
  Viewer.call(this, options);
}

inherits(NavigatedViewer, Viewer);

NavigatedViewer.prototype._modules = [].concat(
  NavigatedViewer.prototype._modules, [
    KeyboardMoveModule,
    MoveCanvasModule,
    ZoomScrollModule
  ]
);