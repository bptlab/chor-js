import { is } from 'bpmn-js/lib/util/ModelUtil';

export default class Switch {

  constructor(canvas, eventBus, bpmnjs) {
    this._canvas = canvas;
    this._eventBus = eventBus;
    this._bpmnjs = bpmnjs;

    // Bind this gloablly
    this.initializeSelect = this.initializeSelect.bind(this);

    // Register to events
    this._eventBus.on('import.render.complete', this.initializeSelect);
  }

  initializeSelect() {
    this._choreo = this._canvas.getRootElement().businessObject;

    if (document.querySelector('.djs-select')) {
      return;
    }

    const choreographies = this.getChoreographies();

    this.createSelectElement(choreographies)
  }

  getChoreographies() {
    const definitions = this._choreo.$parent;
    return definitions.rootElements.filter(element => is(element, 'bpmn:Choreography'));
  }

  createSelectElement(choreographies) {
    const palette = document.querySelector('.djs-palette');
    const optionElements = this.createOptionElements(choreographies);
    const selectElement = this.getSelectHtml(optionElements);
    palette.insertAdjacentHTML('beforeend', selectElement);
    
    // Register choreography switch function on select
    const select = document.querySelector('.djs-select');
    select.addEventListener("change", this.switchChoreography.bind(this));
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
      </div>
    `;
  }

  /**
  * @param {Event} e identifying a choreography inside the current diagram
  * @return {void}
  */
  switchChoreography(e) {
    this._bpmnjs.displayChoreography({ choreoID: e.target.value });
  };
}
