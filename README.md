# chor-js

[![Build Status](https://travis-ci.com/bptlab/chor-js.svg?branch=master)](https://travis-ci.com/bptlab/chor-js)

### ***[:rocket: Try it live! :rocket:](https://bpt-lab.org/chor-js-demo/)***

View and edit [BPMN 2.0](https://www.omg.org/spec/BPMN/2.0.2/) choreography diagrams in the browser.
Based on [bpmn-js](https://github.com/bpmn-io/bpmn-js/).

[![chor-js screencast](./docs/screencast.gif "chor-js in action")](https://github.com/bptlab/chor-js-demo)

:boom: Supports most of the elements in the choreography diagram standard  
:boom: Imports/exports standard-compliant BPMN2 XML  
:boom: Provides features specifically designed for choreography modeling

Check out our [demo application](https://github.com/bptlab/chor-js-demo) for an example web application using chor-js, adding additional features like a model validator and properties panel.

## Research

If you use chor-js in an academic setting, please cite our demo paper:

> Jan Ladleif, Anton von Weltzien, Mathias Weske: _chor-js: A Modeling Framework for BPMN 2.0 Choreography Diagrams._ ER Forum/Posters/Demos (2019)
> [[PDF]](http://ceur-ws.org/Vol-2469/ERDemo02.pdf)
> [[Bibtex]](https://dblp.org/rec/bibtex/conf/er/LadleifWW19)

## Installation

### a) Pre-Packaged

Just include the pre-packaged code in your webpage:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/chor-js@latest/dist/assets/chor-js.css">
<script src="https://cdn.jsdelivr.net/npm/chor-js@latest/dist/chor-js-modeler.min.js"></script>
<!-- ... or 'viewer' or 'navigated-viewer'! -->
```

You can find a sample webpage [here](./docs/prepackaged.html).

### b) NPM

Install the package via `npm install chor-js` and import chor-js in your application:

```javascript
import ChorJS from 'chor-js/lib/Modeler';
// ... or 'Viewer' or 'NavigatedViewer'!
```

You can include the bundled style files from `dist/assets/chor-js.css` or bundle the assets folder on your own.

For a more elaborate example of how to use the package, see [our demo](https://github.com/bptlab/chor-js-demo).
A development setup is described there as well.

## Usage

Create a chor-js instance and link it to a canvas:

```javascript
const xml; // your BPMN2 choreography XML

// Setup modeler
const modeler = new ChorJS({
  container: '#canvas',
  keyboard: {
    bindTo: document
  }
});

// Load model (optionally with a specific diagram ID)
await modeler.importXML(xml, '_choreo1');
```

## Further Documentation

As the library is based on [bpmn-js](https://github.com/bpmn-io/bpmn-js/), a lot of the instructions and techniques described there also work for chor-js.

## License

Licensed under the [MIT license](https://github.com/bptlab/chor-js/blob/master/LICENSE).
