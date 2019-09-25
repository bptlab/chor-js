import InitialRenderVisitor from './InitialRenderVisitor';
import RestoreFromCacheVisitor from './RestoreFromCacheVisitor';

export default {
  __init__: [
    'initialRenderVisitor',
    'restoreFromCacheVisitor'
  ],
  initialRenderVisitor: [ 'type', InitialRenderVisitor ],
  restoreFromCacheVisitor: [ 'type', RestoreFromCacheVisitor ]
};