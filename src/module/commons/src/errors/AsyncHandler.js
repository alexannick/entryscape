import escoErrors from 'commons/nls/escoErrors.nls';
import registry from 'commons/registry';
import _TemplatedMixin from 'dijit/_TemplatedMixin';
import _WidgetBase from 'dijit/_WidgetBase';
import declare from 'dojo/_base/declare';
import { NLSMixin } from 'esi18n';
import jquery from 'jquery';
import { template as renderTemplate } from 'lodash-es';
import PubSub from 'pubsub-js';
import DOMUtil from '../util/htmlUtil';
import template from './AsyncHandlerTemplate.html';
import './errors.css';

// Case Generic problem: Something went wrong... send error report / continue anyway / ok,
//  proceed anyway.
// Case signed out: Sign in again - > close dialog and open sign in dialog
// Case lost connection: No contact with server, retry

const INPROGRESS = 0;
const GENERIC_PROBLEM = 1;
const UNAUTHORIZED = 2;
const SIGNED_OUT = 3;
const LOST_CONNECTION = 4;

const extractProblem = (err) => {
  if (typeof err === 'object' && err.response && typeof err.response.status === 'number') {
    const status = err.response.status;
    const major = Math.floor(status / 100);
    switch (major) {
      case 0:
        return LOST_CONNECTION;
      case 1:
      case 3:
        return GENERIC_PROBLEM;
      case 4:
        // 403 is a specific error when a user is disabled and the correct username/password combination was submitted
        return status === 401 || status === 403 ? UNAUTHORIZED : GENERIC_PROBLEM;
      default:
    }
  }
  return GENERIC_PROBLEM;
};

export default declare([_WidgetBase, _TemplatedMixin, NLSMixin.Dijit], {
  templateString: template,
  progressDelay: 2000,
  nlsBundles: [{ escoErrors }],
  codes: {
    GENERIC_PROBLEM,
    UNAUTHORIZED,
    LOST_CONNECTION,
  },

  checkCountIntervalls: [2, 5, 10, 30, 60, 120, 300, 600],
  postCreate() {
    this.inherited('postCreate', arguments);
    this.promises = [];

    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(this.domNode);
    });

    jquery(this.domNode).on('hidden.bs.modal', () => {
      this.resetDialogAfterClose();
    });

    this._ignoreNext = {};
    this._ignore = {};
  },

  show(promise, callType) {
    if (this.checkIgnoreTrue(callType)) {
      return;
    }

    this.closeDetails();
    const obj = {
      promise,
      callType,
      time: new Date().getTime(),
    };
    this.promises.push(obj);
    promise.then(
      value => this.resolved(promise, value),
      value => this.rejected(promise, value),
    );
    this.setNewTimer();
  },

  addIgnore(callType, status, forNextRequest) {
    const ignoreObj = forNextRequest === true ? this._ignoreNext : this._ignore;
    if (typeof status === 'number') {
      ignoreObj[callType] = status;
    } else {
      ignoreObj[callType] = true;
    }
  },

  removeIgnore(callType) {
    delete this._ignoreNext[callType];
    delete this._ignore[callType];
  },

  checkIgnoreTrue(callType) {
    if (this._ignoreNext[callType] === true) {
      delete this._ignoreNext[callType];
      return true;
    }

    return this._ignore[callType] === true;
  },

  checkIgnore(obj) {
    const ct = obj.callType;
    let status = -1;
    if (obj.err) {
      status = extractProblem(obj.err);
    }

    const ignoreNextStatus = this._ignoreNext[ct];
    if (typeof ignoreNextStatus !== 'undefined') {
      delete this._ignoreNext[ct];
      return ignoreNextStatus === true ? true : ignoreNextStatus === status;
    }

    const ignoreStatus = this._ignore[ct];
    if (typeof ignoreStatus !== 'undefined') {
      return ignoreStatus === true ? true : ignoreStatus === status;
    }
    return false;
  },

  removeTimer(obj) {
    clearTimeout(obj.timer);
    delete obj.timer;
    delete this.timer;
  },
  setNewTimer() {
    if (this.dialogOpen) {
      return;
    }
    if (!this.timer) {
      for (let i = 0; i < this.promises.length; i++) {
        const obj = this.promises[i];
        if (!obj.resolved) {
          const remaining = this.progressDelay - (new Date().getTime() - obj.time);
          if (remaining < 0) {
            this.openDialog();
          } else {
            obj.timer = setTimeout(() => {
              delete obj.timer;
              delete this.timer;
              this.openDialog();
            }, remaining);
            this.timer = true;
          }
          break;
        }
      }
    }
  },

  openDialog(manual = false) {
    this.manual = manual;
    jquery(this.domNode).modal('show');
    const subToken = PubSub.subscribe('hide.bs.modal', () => { // @todo check that this specific modal was hidden
      PubSub.unsubscribe(subToken);
      jquery(this.domNode).modal('hide');
    });
    jquery(this.domNode).on('shown.bs.modal', () => {
      this.dialogOpen = true;
      if (!this.manual) {
        this.updateOrCloseDialog();
      }
    });
  },

  updateOrCloseDialog() {
    if (!this.manual) {
      let resolved = true;
      for (let i = 0; i < this.promises.length; i++) {
        const obj = this.promises[i];
        if (obj.resolved !== true) {
          resolved = false;
        }
      }
      if (resolved) {
        this.closeDialog();
      } else {
        this.updateDialog();
      }
    }
  },

  updateDialog() {
    this.messages.innerHTML = '';
    let rejectionReason = INPROGRESS;
    for (let i = 0; i < this.promises.length; i++) {
      const obj = this.promises[i];
      if (obj.resolved === false) {
        const reason = extractProblem(obj.err);
        if (reason > rejectionReason) {
          rejectionReason = reason;
        }
      }
    }
    if (rejectionReason === UNAUTHORIZED) {
      registry.get('entrystore').getAuth().getUserInfo(true).then((userinfo) => {
        this.renderDialog(userinfo.id === '_guest' ? SIGNED_OUT : GENERIC_PROBLEM);
      });
    } else {
      this.renderDialog(rejectionReason);
    }
  },

  closeDialog() {
    if (this.dialogOpen) {
      jquery(this.domNode).modal('hide');
    }
  },

  resetDialogAfterClose() {
    this._dataLoading.classList.remove('d-none');
    this._dataError.classList.add('d-none');
    this._messagesBlock.classList.add('d-none');
    this.promises = [];
    this.dialogOpen = false;
    this.checkCountIdx = -1;
    clearTimeout(this.checkCountdownTimeout);
    this.manual = false;
  },

  closeDialogSignedOut() {
    registry.get('verifyUser')();
    this.closeDialog();
  },
  renderDialog(state) {
    if (state === INPROGRESS) {
      this._dataLoading.classList.remove('d-none');
      this._dataError.classList.add('d-none');
    } else {
      this._dataLoading.classList.add('d-none');
      this._dataError.classList.remove('d-none');
    }

    switch (state) {
      case INPROGRESS:
        break;
      case GENERIC_PROBLEM:
        this.renderDetails();
        break;
      case SIGNED_OUT:
        break;
      case LOST_CONNECTION:
        this.checkConnection(true);
        break;
      default:
    }
  },
  renderDetails() {
    this.messages.innerHTML = '';
    for (let i = 0; i < this.promises.length; i++) {
      const obj = this.promises[i];
      let progressClass = 'info';
      if (typeof obj.resolved !== 'undefined') {
        progressClass = obj.resolved === true ? 'success' : 'danger';
      }
      let message;
      if (obj.err && obj.err.response && obj.err.response.status === 412) {
        message = this.NLSLocalized0.conflictProblem;
      } else {
        message = typeof obj.err === 'object' && typeof obj.err.message === 'string' ?
          obj.err.message : obj.err;
      }
      if (obj.err) {
        console.error(`${obj.err}\n${obj.stack}`);
      }

      const messagesDiv = DOMUtil.create('div', null, this.messages);
      messagesDiv.classList.add('alert');
      messagesDiv.classList.add(`alert-${progressClass}`);
      messagesDiv.innerHTML = `${obj.callType}: ${message}`;
    }
  },

  detailsShowing: false,
  closeDetails() {
    this.hideDetails();
  },
  hideDetails() {
    const showHideButtonEl = this.domNode.querySelector('.btn-secondary');

    showHideButtonEl.innerHTML = this.NLSLocalized0.showDetails;
    this._messagesBlock.classList.add('d-none');
    this.detailsShowing = false;
  },
  showDetails() {
    const showHideButtonEl = this.domNode.querySelector('.btn-secondary');

    showHideButtonEl.innerHTML = this.NLSLocalized0.hideDetails;
    this._messagesBlock.classList.remove('d-none');
    this.detailsShowing = true;
  },
  toggleDetails() {
    if (this.detailsShowing) {
      this.hideDetails();
    } else {
      this.showDetails();
    }
  },

  signIn() {
    const signInDialog = registry.get('signInDialog');
    this.closeDialog();
    jquery(this.domNode).modal('hide');
    signInDialog.dialog.conditionalHide = function () {
      delete signInDialog.mainDialog.conditionalHide;
      signInDialog.dialog.hide();
      registry.get('verifyUser')();
    };
    signInDialog.show();
  },
  checkCountIdx: -1,
  checkCountdownTimeout: null,
  checkConnection(fromSystem) {
    if (fromSystem === true && this.checkCountIdx >= 0) {
      return;
    }
    this.checkCountIdx = 0;
    clearTimeout(this.checkCountdownTimeout);

    const es = registry.get('entrystore');
    const drawCounter = (seconds) => {
      // Not connected. Connecting in 4s... Try Now
      this.connectionBlock.classList.remove('d-none');
      this.timeToCheck.innerHTML =
        renderTemplate(this.NLSLocalized0.notConnected)({ time: seconds });
    };
    let check;
    const countdown = (seconds) => {
      this.checkCountdownTimeout = setInterval(() => {
        const seconds_ = seconds - 1;
        if (seconds_ === 0) {
          clearTimeout(this.checkCountdownTimeout);
          check();
        } else {
          drawCounter(seconds_);
        }
      }, 1000);
      drawCounter(seconds);
    };
    const continueCountdown = () => {
      countdown(this.checkCountIntervalls[this.checkCountIdx]);
      if (this.checkCountIdx < (this.checkCountIntervalls.length - 1)) {
        this.checkCountIdx += 1;
      }
    };
    check = function () {
      es.getREST().get(`${es.getBaseURI()}management/status`, 'text/plain').then((res) => {
        if (res === 'UP') {
          this.closeDialog();
        } else if (typeof res === 'object' && res.repositoryStatus === 'online') {
          continueCountdown();
        }
      }, continueCountdown);
    };
    check();
  },

  resolved(promise) {
    const obj = this.getPromiseObject(promise);
    obj.resolved = true;
    if (this.dialogOpen) {
      this.updateOrCloseDialog();
    } else {
      this.promises.splice(this.promises.indexOf(obj), 1);
    }
    if (obj.timer) {
      this.removeTimer(obj);
      this.setNewTimer();
    }
    // Only needed to remove from ignoreNext when callType and status is a match
    this.checkIgnore(obj);
  },
  rejected(promise, value) {
    const obj = this.getPromiseObject(promise);
    obj.resolved = false;
    obj.err = value;
    if (this.checkIgnore(obj)) {
      this.promises.splice(this.promises.indexOf(obj), 1);
      if (obj.timer) {
        this.removeTimer(obj);
      }
      this.updateOrCloseDialog();
      return;
    }
    if (this.dialogOpen) {
      this.updateDialog();
    } else {
      for (let i = 0; i < this.promises.length; i++) {
        const o = this.promises[i];
        if (o.timer) {
          this.removeTimer(o);
        }
      }
      this.openDialog();
    }
  },

  getPromiseObject(promise) {
    for (let i = 0; i < this.promises.length; i++) {
      const obj = this.promises[i];
      if (obj.promise === promise) {
        return obj;
      }
    }

    return null;
  },
});
