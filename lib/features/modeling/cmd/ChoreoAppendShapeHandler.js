import inherits from 'inherits';
import AppendShapeHandler from 'diagram-js/lib/features/modeling/cmd/AppendShapeHandler';

/**
 * Extends the function of the default AppendShapeHandler to pass the shape that was the source.
 * We need this to enable participant predictions
 * @constructor
 * @param {Injector} injector
 */
export default function ChoreoAppendShapeHandler(injector) {
  injector.invoke(AppendShapeHandler, this);
}

inherits(ChoreoAppendShapeHandler, AppendShapeHandler);

ChoreoAppendShapeHandler.$inject = [ 'injector' ];

/**
 * Creates a new shape to be appended
 *
 * @param {Object} context
 */
ChoreoAppendShapeHandler.prototype.preExecute = function(context) {

  var source = context.source;

  if (!source) {
    throw new Error('source required');
  }

  const target = context.target || source.parent;
  let shape = context.shape;

  shape = context.shape =
    this._modeling.createShape(
      shape,
      context.position,
      target, { attach: context.attach, sourceShape: context.source });

  context.shape = shape;
};
