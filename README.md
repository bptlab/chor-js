# chor-js

[![Build Status](https://travis-ci.com/bptlab/chor-js.svg?branch=master)](https://travis-ci.com/bptlab/chor-js)

> ***[Try it online!](https://bpt-lab.org/chor-js-demo/)***

View and edit [BPMN 2.0](https://www.omg.org/spec/BPMN/2.0.2/) choreography diagrams in the browser.
Based on [bpmn-js](https://github.com/bpmn-io/bpmn-js/).

[![chor-js screencast](./docs/screencast.gif "chor-js in action")](https://github.com/bptlab/chor-js-demo)

## Features

- model complex choreography diagrams
- create and reuse roles on the fly
- intuitively manage participant bands
- show, hide and swap messages
- import/export standard-compliant BPMN2 XML

chor-js supports most of the elements in the choreography diagram standard.

## Research

If you use chor-js in an academic setting, please cite our demo paper:

> Jan Ladleif, Anton von Weltzien, Mathias Weske: _chor-js: A Modeling Framework for BPMN 2.0 Choreography Diagrams._ ER Forum/Posters/Demos (2019)
> [[PDF]](http://ceur-ws.org/Vol-2469/ERDemo02.pdf)
> [[Bibtex]](https://dblp.org/rec/bibtex/conf/er/LadleifWW19)

## Installation
chor-js is packaged [via npm](https://www.npmjs.com/package/chor-js).

## Usage

Create a chor-js instance and link it to a canvas:

```javascript
// Import modeler or viewer class
import ChorJS from 'chor-js/lib/Modeler';

let xml; // your BPMN2 choreography XML

// Setup modeler
let modeler = new ChorJS({
  container: '#canvas',
  keyboard: {
    bindTo: document
  }
});

// Load model (optionally with a specific diagram ID)
await modeler.importXML(xml, '_choreo1');
```

For a more elaborate example of how to use the package, see [our demo](https://github.com/bptlab/chor-js-demo).
A development setup is described there as well.

As the library is based on [bpmn-js](https://github.com/bpmn-io/bpmn-js/), a lot of the instructions and techniques described there also work for chor-js.

## License

Licensed under the [MIT license](https://github.com/bptlab/chor-js/blob/master/LICENSE).
