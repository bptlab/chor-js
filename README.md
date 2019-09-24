# chor-js

[![Build Status](https://travis-ci.com/bptlab/chor-js.svg?branch=master)](https://travis-ci.com/bptlab/chor-js)

> ***[Try it online!](https://bpt-lab.org/chor-js-demo/)***  
> [(get demo source)](https://github.com/bptlab/chor-js-demo)

View and edit [BPMN 2.0](https://www.omg.org/spec/BPMN/2.0.2/) choreography diagrams in the browser.

[![chor-js screencast](./docs/screencast.gif "chor-js in action")](https://github.com/bptlab/chor-js-demo)

## Features

- model complex choreography diagrams
- create and reuse roles on the fly
- intuitively manage participant bands
- show, hide and swap messages
- import/export standard-compliant BPMN2 XML

chor-js supports most of the elements in the choreography diagram standard.

As the library is heavily based on [bpmn-js](https://github.com/bpmn-io/bpmn-js/), a lot of the instructions and techniques described there also work for chor-js.

## Usage & Installation
chor-js provides three major modules: `Modeler`, `Viewer` and `NavigatedViewer` for a modeling, static viewing, and interactive viewing environment, respectively.
They can either be used by installing the npm package or using the pre-packaged distribution scripts. 

### Use npm Package
chor-js is packaged [through npm](https://www.npmjs.com/package/chor-js).
For an example of how to use the package, see [our demo](https://github.com/bptlab/chor-js-demo).
A development setup is described there as well.

To include chor-js in your node.js application, simply run

```
npm install chor-js
```

To use, for example, the `Modeler` in your application use the following code:

```javascript
import { Modeler } from 'chor-js';
var modeler = new Modeler({
  container: '#canvas',
  keyboard: {
    bindTo: document
  }
});
modeler.importXML(newXml, {}).then(() => {
    modeler.get('canvas').zoom('fit-viewport');
  }).catch(error => {
    console.error('Import went wrong: ', error);
  });
```

You must also include the CSS file in `dist/assets/chor-js.css` in your HTML for the icons to work.
To display a diagram, you need to supply your diagram's BPMN2 XML serialization as string.
Be aware that the chor-js npm package is distributed as ES6 code, so you might need to transpile it to ES5 yourself, or use
the pre-packaged version.

### Use Pre-Packaged Distro
chor-js is also available as pre-packaged, transpiled, polyfilled, minified, and un-minified scripts via [UNPKG](https://unpkg.com).
You can use, for example, the `Modeler` by adding the following code to your HTML:

```html
<!-- import source and style files -->
<link rel="stylesheet" href="unpkg.com/chor-js/dist/assets/chor-js.css">
<script src="unpkg.com/chor-js/chor-modeler.production.min.js"></script>

<!-- set up modeler -->
<script type="text/javascript">
var modeler = new ChorJS.Modeler({
        container: '#canvas',
        keyboard : {bindTo: window}
      });
</script>
```
All files are also available in the `dist` folder of the npm package and can be used if an ES5 version is required.

## License

Licensed under the [MIT license](https://github.com/bptlab/chor-js/blob/master/LICENSE).