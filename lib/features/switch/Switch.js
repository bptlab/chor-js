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

  getChoreographies() {
    return this.definitions.rootElements.filter(element => is(element, 'bpmn:Choreography'));
  }

  createSelectElement(choreographies) {
    const oldSelectElement = document.querySelector('.djs-select-wrapper');
    if (oldSelectElement) {
      oldSelectElement.parentElement.removeChild(oldSelectElement);
    }

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
  }

  /**
  * @param {Choreography[]} choreographies a list of choreographies that should be converted to html option tags
  * @return {string[]}
  */
  createOptionElements(choreographies) {
    return choreographies.map((choreography) => {
      return `<option value="${choreography.id}" ${this._choreo.id == choreography.id ? 'selected' : ''}>${choreography.id}</option>`;
    });
  };

  getSelectHtml(optionElements) {
    return `
      <div class="djs-select-wrapper">
        <select class="djs-select">
          ${optionElements}
        </select>
        <button id="rename-choreography">R</button>
        <button id="delete-choreography">D</button>
        <button id="add-choreography">A</button>
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
    choreo.name = 'Some Name';
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
    console.log(this.definitions.businessObject);
  };
}
