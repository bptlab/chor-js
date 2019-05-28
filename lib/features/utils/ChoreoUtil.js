export default class ChoreoUtil {
    constructor(bpmnjs) {
        this._bpmnjs = bpmnjs;
    }

    switchChoreography(choreographyId) {
        this._bpmnjs.displayChoreography({ choreoID: choreographyId });
    };
}