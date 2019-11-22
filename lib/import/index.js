import VisitorModule from './visitors';
import ChoreoTreeWalker from './ChoreoTreeWalker';

export default {
  __depends__: [
    VisitorModule
  ],
  treeWalker: [ 'type', ChoreoTreeWalker ],
};