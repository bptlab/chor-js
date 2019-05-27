import { is } from 'bpmn-js/lib/util/ModelUtil';

export default class Switch {

  constructor(canvas, eventBus, bpmnjs, bpmnFactory, moddle) {
    this._canvas = canvas;
    this._eventBus = eventBus;
    this._bpmnjs = bpmnjs;
    this._bpmnFactory = bpmnFactory;
    this._moddle = moddle;

    // Bind this gloablly
    this.initializeSelect = this.initializeSelect.bind(this);

    // Register to events
    this._eventBus.on('import.render.complete', this.initializeSelect);
  }

  initializeSelect() {
    this._choreo = this._canvas.getRootElement().businessObject;
    this.definitions = this._choreo.$parent;
    const choreographies = this.getChoreographies();
    this.createSelectElement(choreographies)
  }

  /**
  * @return {Choreography[]}
  */
  getChoreographies() {
    return this.definitions.rootElements.filter(element => is(element, 'bpmn:Choreography'));
  }

  removeInterface() {
    const oldSelectElement = document.querySelector('.djs-select-wrapper');
    if (oldSelectElement) {
      oldSelectElement.parentElement.removeChild(oldSelectElement);
    }
  }

  createSelectElement(choreographies) {
    this.removeInterface();

    const palette = document.querySelector('.djs-palette');
    const optionElements = this.createOptionElements(choreographies);
    const selectElement = this.getSelectHtml(optionElements);
    palette.insertAdjacentHTML('beforeend', selectElement);

    // Register event listeners
    const select = document.querySelector('.djs-select');
    select.addEventListener("change", this.handleSwitchEvent.bind(this));

    const addButton = document.querySelector('#add-choreography');
    addButton.addEventListener("click", this.addChoreography.bind(this));

    const deleteButton = document.querySelector('#delete-choreography');
    deleteButton.addEventListener("click", this.deleteChoreography.bind(this));

    const renameButton = document.querySelector('#rename-choreography');
    renameButton.addEventListener("click", this.handleRenameChoreography.bind(this));
  }

  /**
  * @param {Choreography[]} choreographies a list of choreographies that should be converted to html option tags
  * @return {string[]}
  */
  createOptionElements(choreographies) {
    return choreographies.map((choreography) => {
      const choreoName = choreography.name  || choreography.id;
      return `<option value="${choreography.id}" ${this._choreo.id == choreography.id ? 'selected' : ''}>${choreoName}</option>`;
    });
  };

  getSelectHtml(optionElements) {
    return `
      <div class="djs-select-wrapper">
        <select class="djs-select">
          ${optionElements}
        </select>
        <button id="rename-choreography" class="djs-button">R</button>
        <button id="delete-choreography" class="djs-button">D</button>
        <button id="add-choreography" class="djs-button">A</button>
      </div>
    `;
  }

  /**
  * @param {Event} e html select input event
  * @return {void}
  */
  handleSwitchEvent(e) {
    this.switchChoreography(e.target.value);
  };

  /**
  * @param {string} choreoId identifying a choreography inside the current diagram
  * @return {void}
  */
  switchChoreography(choreoId) {
    this._bpmnjs.displayChoreography({ choreoID: choreoId });
  };

  /**
  * @return {void}
  */
  addChoreography() {
    const choreo = this._bpmnFactory.create('bpmn:Choreography', {});
    choreo.$parent = this.definitions;
    this.definitions.rootElements.push(choreo);

    const plane = this._bpmnFactory.createDiPlane(choreo);
    const diagram = this._bpmnFactory.create('bpmndi:BPMNDiagram', { plane });
    plane.$parent = diagram;
    diagram.$parent = this.definitions;
    this.definitions.diagrams.push(diagram);

    console.log(this.definitions);

    this.switchChoreography(choreo.id);
  };

  /**
  * @return {void}
  */
  deleteChoreography() {
    const currentChoreo = this._choreo;

    const choreographies = this.getChoreographies();
    if (choreographies.length <= 1) {
      console.log('The last remaining Choreography cannot be deleted.');
      return;
    }

    const remainingChoreo = choreographies.find((choreography) => choreography.id !== currentChoreo.id);
    this.removeChoreographyById(currentChoreo.id);
    this.switchChoreography(remainingChoreo.id);
  };

  removeChoreographyById(choreoId) {
    const choreoIndex = this.definitions.rootElements.findIndex((choreography) => choreography.id === choreoId);
    if (choreoIndex) {
      this.definitions.rootElements.splice(choreoIndex, 1);
    }

    const diagramIndex = this.definitions.diagrams.findIndex((diagram) => diagram.plane.bpmnElement.id === choreoId);
    if (diagramIndex) {
      this.definitions.diagrams.splice(diagramIndex, 1);
    }
  }

  handleRenameChoreography() {
    this.renameChoreography();
  }

  renameChoreography() {
    this.removeInterface();
    const palette = document.querySelector('.djs-palette');
    
    const renameElement = this.renameHtml();
    palette.insertAdjacentHTML('beforeend', renameElement);

    // Register event listeners
    const renameInput = document.querySelector('.djs-rename');
    renameInput.addEventListener("change", this.handleRenameEvent.bind(this));
    renameInput.addEventListener("keyup", this.handleEndRename.bind(this));
    renameInput.focus();
    renameInput.select();

    const okButton = document.querySelector('#end-rename');
    okButton.addEventListener("click", this.handleEndRename.bind(this));
  }

  renameHtml() {
    const choreoName = this._choreo.name || this._choreo.id;
    return `
    <div class="djs-select-wrapper">
      <input class="djs-rename" type="text" value="${choreoName}">
      <button id="end-rename" class="djs-button">Ok</button>
    </div>
    `
  }

  handleEndRename() {
    if (event.keyCode && event.keyCode !== 13) {
      return;
    }

    this.removeInterface();
    this.initializeSelect();
  }

  handleRenameEvent(e) {
    this._choreo.name = e.target.value;
  }
}
