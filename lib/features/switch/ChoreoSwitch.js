import CreateChoreographyHandler from './cmd/CreateChoreographyHandler';
import DeleteChoreographyHandler from './cmd/DeleteChoreographyHandler';
import RenameChoreographyHandler from './cmd/RenameChoreographyHandler';
import SwitchChoreographyHandler from './cmd/SwitchChoreographyHandler';

export default class ChoreoSwitch {

  constructor(eventBus, commandStack, choreoUtil) {
    this._eventBus = eventBus;
    this._commandStack = commandStack;
    this._choreoUtil = choreoUtil;

    // Bind this globally
    this.registerHandlers = this.registerHandlers.bind(this);
    this.createSwitchElement = this.createSwitchElement.bind(this);
    this.updateSwitchOptions = this.updateSwitchOptions.bind(this);

    // Register to events
    this._eventBus.on('diagram.init', this.registerHandlers);
    this._eventBus.once('import.render.complete', this.createSwitchElement);
    this._eventBus.on('import.render.complete', this.updateSwitchOptions);
  }

  registerHandlers() {
    this._commandStack.registerHandler('choreography.create', CreateChoreographyHandler);
    this._commandStack.registerHandler('choreography.delete', DeleteChoreographyHandler);
    this._commandStack.registerHandler('choreography.rename', RenameChoreographyHandler);
    this._commandStack.registerHandler('choreography.switch', SwitchChoreographyHandler);
  }

  createSwitchElement() {
    const palette = document.querySelector('.djs-palette');
    palette.insertAdjacentHTML('beforeend', this.switchElement());

    this.registerEventListeners();
  }

  registerEventListeners() {
    this.handleSwitchEvent = this.handleSwitchEvent.bind(this);
    this.handleAddEvent = this.handleAddEvent.bind(this);
    this.handleDeleteEvent = this.handleDeleteEvent.bind(this);
    this.handleStartRenameEvent = this.handleStartRenameEvent.bind(this);
    this.handleRenameEvent = this.handleRenameEvent.bind(this);
    this.handleEndRenameEvent = this.handleEndRenameEvent.bind(this);

    const select = document.querySelector('.djs-select');
    select.addEventListener('change', this.handleSwitchEvent);

    const addButton = document.querySelector('#add-choreography');
    addButton.addEventListener('click', this.handleAddEvent);

    const deleteButton = document.querySelector('#delete-choreography');
    deleteButton.addEventListener('click', this.handleDeleteEvent);

    const startRenameButton = document.querySelector('#start-rename-choreography');
    startRenameButton.addEventListener('click', this.handleStartRenameEvent);

    const renameInput = document.querySelector('.djs-rename');
    renameInput.addEventListener('keyup', this.handleEndRenameEvent);
    renameInput.addEventListener('change', this.handleRenameEvent);

    const endRenameButton = document.querySelector('#end-rename-choreography');
    endRenameButton.addEventListener('click', this.handleEndRenameEvent);
  }

  switchElement() {
    return `
      <div class="djs-select-wrapper">
        <select class="djs-select"></select>
        <button id="start-rename-choreography" class="bpmn-icon-screw-wrench" title="Rename this choreography"></button>
        <button id="delete-choreography" class="bpmn-icon-trash" title="Delete this choreography"></button>
        <button id="add-choreography" class="bpmn-icon-sub-process-marker" title="Add a new choreography"></button>
      </div>

      <div class="djs-rename-wrapper">
        <input class="djs-rename" type="text">
        <button id="end-rename-choreography" class="djs-button">Rename</button>
      </div>
    `;
  }

  handleSwitchEvent(e) {
    this._commandStack.execute('choreography.switch', {
      id: e.target.value
    });
  }

  handleAddEvent() {
    this._commandStack.execute('choreography.create', {});
  }

  handleDeleteEvent() {
    /*
     * TODO For some reason, the command stack does not check on its own whether
     * the command can execute --- might be a bug in diagram.js.
     */
    if (this._commandStack.canExecute('choreography.delete', {})) {
      this._commandStack.execute('choreography.delete', {});
    }
  }

  handleStartRenameEvent() {
    this.displayRenameInterface();
  }

  handleRenameEvent(e) {
    this._commandStack.execute('choreography.rename', {
      newName: e.target.value,
    });
  }

  handleEndRenameEvent(e) {
    if (e.keyCode && e.keyCode !== 13) {
      return;
    }

    this.displaySelectInterface();
  }

  displayRenameInterface() {
    this.hideInterface();

    const renameWrapper = document.querySelector('.djs-rename-wrapper');
    renameWrapper.style.display = 'flex';

    const renameInput = document.querySelector('.djs-rename');
    const currentChoreography = this._choreoUtil.currentChoreography();
    renameInput.value = currentChoreography.name || currentChoreography.id;
    renameInput.focus();
    renameInput.select();
  }

  displaySelectInterface() {
    this.hideInterface();

    this.updateSwitchOptions();
    const selectWrapper = document.querySelector('.djs-select-wrapper');
    selectWrapper.style.display = 'flex';
  }

  hideInterface() {
    const renameWrapper = document.querySelector('.djs-rename-wrapper');
    renameWrapper.style.display = 'none';

    const selectWrapper = document.querySelector('.djs-select-wrapper');
    selectWrapper.style.display = 'none';
  }

  updateSwitchOptions() {
    const select = document.querySelector('.djs-select');
    select.innerHTML = this.choreographyOptionElements();
  }

  choreographyOptionElements() {
    const currentChoreography = this._choreoUtil.currentChoreography();
    const choreographies = this._choreoUtil.choreographies();

    return choreographies.map((choreography) => {
      const choreoName = choreography.name || choreography.id;
      return `
        <option 
          value="${choreography.id}" 
          ${currentChoreography.id == choreography.id ? 'selected' : ''}>
            ${choreoName}
        </option>
      `;
    });
  }

}

ChoreoSwitch.$inject = [
  'eventBus',
  'commandStack',
  'choreoUtil'
];