import Alert from 'commons/components/common/alert/Alert';
import Button from 'commons/components/common/button/Button';
import Row from 'commons/components/common/grid/Row';
import TaskProgress from 'commons/progresstask/components/TaskProgress';
import ProgressDialog from 'commons/progresstask/ProgressDialog';
import registry from 'commons/registry';
import config from 'config';
import declare from 'dojo/_base/declare';
import stamp from 'dojo/date/stamp';
import { i18n } from 'esi18n';
import { clone, cloneDeep, merge, template } from 'lodash-es';
import m from 'mithril';
import { promiseUtil } from 'store';
import pipelineUtil from './pipelineUtil';
import { getDistributionFileRURIs, getDistributionFilesInfo } from './utils/distributionUtil';
import apiUtil from './utils/apiUtil';

/**
 * TODO move from here
 * @param x
 * @returns {*|Array}
 */
const getObjectValues = x => Object.keys(x).reduce((y, z) => y.push(x[z]) && y, []);

/**
 * How the initial progress api should look like
 */
const initialTasksState = {
  init: {
    id: 'init',
    name: '',
    nlsTaskName: 'apiInitialized', // nlsString
    width: '50%', // max width / nr of tasks,
    order: 1,
    status: '', // started, progress, done
    message: '',
  },
  fileprocess: {
    id: 'fileprocess',
    name: '',
    nlsTaskName: 'apiGenerationTask', // nlsString
    width: '50%', // max width / nr of tasks,
    order: 2,
    status: '',
    message: '',
  },
};

export default declare([], {
  /**
   * @param {{params: object, filesURI: array|null}}
   * params:
   *  - mode
   *  - distributionRow
   *  - datasetRow
   *  - apiDistEntry
   *  - distributionEntry
   *  - datasetEntry
   *  - escaApiProgress
   *  - escaFiles
   *  - escaApiProgress
   *  filesURI:
   *  - only these filesURI should be merged to the API. A special case where we have only added
   *    files to the distribution and no other changes (like replace/remove). Helps improve preformance
   *    of the API update.
   */
  execute({ params = {}, filesURI = null }) {
    this.noOfFiles = 0;
    this.progressDialog = new ProgressDialog();

    // apply all params in `this` context
    /* eslint-disable-next-line */
    for (param in params) {
      this[param] = params[param];
    }

    // needed to choose the correct progress dialog message
    this.hasOnlyAddedFiles = Array.isArray(filesURI) && filesURI.length;

    this.validateFiles(filesURI)
      .then(this.generateAPI.bind(this))
      .then(this._showProgressDialog.bind(this));
  },
  /**
   *
   * @private
   */
  _showProgressDialog() {
    // clone task state and render initial progress dialog
    initialTasksState.init.name = this.escaApiProgress[initialTasksState.init.nlsTaskName];
    initialTasksState.fileprocess.name = this.escaApiProgress[initialTasksState.fileprocess.nlsTaskName];
    this.tasks = cloneDeep(initialTasksState);

    // show the progress dialog
    this.resetProgressDialog();
    this.progressDialog.show();

    this.updateProgressDialogState(this.tasks);
  },
  /**
   * Render the progress dialog
   * @param {Object} tasks The state to pass to TaskProgress
   * @param {boolean} updateFooter
   * @param {string|null} errorMessage
   */
  updateProgressDialog(tasks, updateFooter = false, errorMessage = null) {
    if (!this.modalBody) { // this is called many time so just get the reference once
      this.modalBody = this.progressDialog.getModalBody();
    }
    m.render(this.modalBody, m(TaskProgress, { tasks: getObjectValues(tasks) }));
    if (updateFooter) {
      this.showFooterResult(errorMessage);
    }
  },
  /**
   * Empty the progress dialog
   */
  resetProgressDialog() {
    const modalBody = this.progressDialog.getModalBody();
    m.render(modalBody, null);

    return modalBody;
  },
  /**
   * Runs the activate/refresh API pipeline
   */
  async generateAPI() {
    if (this.mode === 'refresh') {
      this.refreshAPI();
    } else {
      // check if catalog/dataset are public
      const isDatasetPublic = this.datasetEntry.isPublic();
      const contextEntry = await this.datasetEntry.getContext().getEntry();
      const isCatalogPublic = contextEntry.isPublic();

      if (isCatalogPublic && isDatasetPublic) {
        this.activateAPI(); // note, we don't await for the activateAPI to finish as it would block the rendering of the progress dialog
      } else {
        /**
         * Inform the user that either or both parent dataset and catalog are not public. Activating the api will
         * make the data accessible via the API
         */
        // eslint-disable-next-line
        const nonPublicParent = isDatasetPublic ? (isCatalogPublic ? 'dataset and catalog' : 'dataset') : 'catalog';
        const message = i18n.renderNLSTemplate(this.escaFiles.activateAPINotAllowedDatasetNotPublic, {
          parent: nonPublicParent,
          count: 2,
        });
        await registry.get('dialogs').confirm(message, null, null, (confirm) => {
          if (confirm) {
            this.activateAPI();
          }
        });
      }
    }
  },
  /**
   * validate that files can be converted to API
   *  - gathers the newly added files to be merged into the api OR all the files in the distribution (refresh all)
   * checks:
   *  1) maxFileSizeForAPI is reached
   *  2) files are not csv
   * show respective dialogs if some checks are not specified
   * @returns {Promise<any[] | never>}
   */
  validateFiles(newFilesURI = null) {
    if (newFilesURI) {
      this.fileURIs = newFilesURI; // refresh the API only with the new files
      this.totalNoFiles = newFilesURI.length;
    } else {
      // get all file resource URIs from the dcat:downloadURL property
      this.fileURIs = getDistributionFileRURIs(this.distributionEntry);
      this.totalNoFiles = this.fileURIs.length;
    }

    // asynchronously get the file infos and make checks
    return getDistributionFilesInfo(this.distributionEntry)
      .then((files) => {
        // calculate total size of all files
        let totalFilesSize = 0;
        let hasNonCSV = false;

        for (const file of files) { // eslint-disable-line
          // keep a count of files sizes
          totalFilesSize += file.sizeOfFile || 0;

          // CHECK 1 - check if any of the files are not csv
          // TODO check if errors are caught
          if (!hasNonCSV) {
            hasNonCSV = !file.format || (file.format !== 'text/csv') ? file.format : false;
          }
        }
        // CHECK 2 - Max file(s) size
        if (config.catalog && totalFilesSize > config.get('catalog.maxFileSizeForAPI')) {
          const acknowledgeMsg =
            template(this.escaFiles.activateAPINotAllowedFileToBig)({ size: config.get('catalog.maxFileSizeForAPI') });

          return registry.get('dialogs').acknowledge(acknowledgeMsg)
            .then(() => {
              throw Error('Stop API refresh, file(s) to big');
            });
        }

        if (hasNonCSV) {
          return registry.get('dialogs')
            .confirm(template(this.escaFiles.onlyCSVSupported)({ format: hasNonCSV || '-' }),
              this.escaFiles.confirmAPIActivation,
              this.escaFiles.abortAPIActivation);
        }

        return Promise.resolve();
      });
  },
  /**
   * Update the state of the progress dialog and re-render
   *
   * @param state
   * @param hasError
   * @param errorMessage
   */
  updateProgressDialogState(state = {}, hasError = false, errorMessage = '') {
    this.tasks = merge(this.tasks, state);
    this.updateProgressDialog(this.tasks, hasError, errorMessage);
  },
  /**
   * For each of the files uris execute the pipeline sequentially
   *
   * @param fileResourceURIs
   * @param pipelineResource
   * @returns {*}
   * @private
   */
  _processFiles(fileResourceURIs, pipelineResource) {
    registry.get('asynchandler').addIgnore('execute', true, true);
    return promiseUtil.forEach(fileResourceURIs, fileResourceURI =>
      registry.get('entrystoreutil').getEntryByResourceURI(fileResourceURI)
        .then(fileEntry => pipelineResource.execute(fileEntry, {}))
        .then(result => apiUtil.checkStatusOnRepeat(result[0]))
        .then(() => {
          // Update the UI
          this.noOfFiles += 1;
          const apiFileProcessedNLS = this.hasOnlyAddedFiles ?
            this.escaApiProgress.apiFileProcessedOnlyAddition : this.escaApiProgress.apiFileProcessed;
          const apiFileProcessed = i18n.renderNLSTemplate(apiFileProcessedNLS, {
            number: this.noOfFiles,
            totalFiles: this.totalNoFiles,
          });
          this.updateProgressDialogState({ fileprocess: { message: apiFileProcessed } });
        })
        .catch((err) => {
          // TODO Failure
          this.updateProgressDialogState({
            fileprocess: { status: 'failed' },
          }, true, this.escaApiProgress.apiProgressError); // change with nls
          throw err;
        }));
  },
  /**
   * @async
   * @param {store/Pipeline} pipelineResource
   * @private
   */
  async _createDistribution(pipelineResource) {
    // create new distribution for the newly created API
    await this.distributionRow.createDistributionForAPI(pipelineResource);
    this.updateProgressDialogState({ fileprocess: { status: 'done' } });
    this.showFooterResult();

    // update UI
    this.datasetRow.fileEntryURIs.push(this.distributionEntry.getResourceURI());
    this.distributionRow.clearDropdownMenu();
    this.distributionRow.renderDropdownMenu();
    // this.datasetRow.showDistributionInList(apiDistributionEntry);
    this.datasetRow.clearDistributions();
    this.datasetRow.listDistributions();
  },
  /**
   *
   * @returns {Promise<void>}
   */
  async activateAPI() {
    const async = registry.get('asynchandler');
    async.addIgnore('execute', true, true);
    let tempFileURIs = clone(this.fileURIs);

    try {
      /**
       * // TODO type
       * @type store/Pipeline
       */
      const pipelineResource = await pipelineUtil.getPipelineResource();
      this.updateProgressDialogState({ init: { status: 'progress' } });

      /**
       *
       * @param resource
       * @returns {*}
       */
      const transformId = pipelineResource.getTransformForType(pipelineResource.transformTypes.ROWSTORE);
      pipelineResource.setTransformArguments(transformId, {});
      pipelineResource.setTransformArguments(transformId, { action: 'create' });
      await pipelineResource.commit();

      /**
       * @returns {entryPromise}
       */
      const esu = registry.get('entrystoreutil');
      const fileEntry = await esu.getEntryByResourceURI(tempFileURIs[0]);

      /**
       *
       * @param entry
       * @returns {*}
       */
      const pipelineResultURIs = await pipelineResource.execute(fileEntry, {});
      this.updateProgressDialogState({
        init: { status: 'done' },
        fileprocess: { status: 'progress' },
      });

      /**
       *
       * @param result
       * @returns {store|Entry|entryPromise|*|*}
       */
      tempFileURIs = tempFileURIs.slice(1); // remove first file entry
      if (tempFileURIs.length === 0) {
        this._createDistribution(pipelineResultURIs[0]);
      } else {
        const pipelineResultEntry = await registry.get('entrystore').getEntry(pipelineResultURIs[0]);

        /**
         *
         * @param pipelineResultEntry
         * @returns {Promise<any | never>}
         */
        pipelineResource.setTransformArguments(transformId, {});
        pipelineResource.setTransformArguments(transformId, {
          action: 'append',
          datasetURL: pipelineResultEntry.getResourceURI(), // pipelineResultEntryURI
        });
        await pipelineResource.commit();

        /**
         * processFiles
         * @returns {Promise<any | never>}
         */
        this.noOfFiles += 1;
        this.updateProgressDialogState({
          fileprocess: {
            message: i18n.renderNLSTemplate(this.escaApiProgress.apiFileProcessed, {
              number: this.noOfFiles,
              totalFiles: this.totalNoFiles,
            }),
          },
        });
        await this._processFiles(tempFileURIs, pipelineResource);

        /**
         * createDistribution
         */
        this._createDistribution(pipelineResultURIs[0]);
      }
    } catch (err) {
      const message = this.escaApiProgress.apiProgressError;
      this.updateProgressDialogState({ fileprocess: { status: 'failed' } }, true, message);
    }
  },

  /**
   * Update distribution metadata
   *  dcterms:modified, dcat:accessURL, dcterms:conformsTo
   * @returns {Promise<store/Entry>}
   */
  updateApiDistribution() {
    const distMetadata = this.apiDistEntry.getMetadata();
    const distResourceURI = this.apiDistEntry.getResourceURI();
    distMetadata.findAndRemove(distResourceURI, 'dcterms:modified');
    distMetadata.addD(distResourceURI, 'dcterms:modified', stamp.toISOString(new Date()), 'xsd:date');
    const apiURI = distMetadata.findFirstValue(distResourceURI, 'dcat:accessURL');
    if (apiURI) { // Should never fail for API distributions.
      const swaggerURI = `${apiURI}/swagger`;
      distMetadata.findAndRemove(distResourceURI, 'dcterms:conformsTo', swaggerURI);
      distMetadata.add(distResourceURI, 'dcterms:conformsTo', swaggerURI);
    }
    return this.apiDistEntry.commitMetadata();
  },
  /**
   *
   * @returns {Promise<void>}
   */
  async refreshAPI() {
    const esu = registry.get('entrystoreutil');
    let tempFileURIs = clone(this.fileURIs);

    // Ignore spinner for this async task
    const async = registry.get('asynchandler');
    async.addIgnore('execute', true, true);
    try {
      // TODO explain
      const pipelineResource = await pipelineUtil.getPipelineResource();
      const fileEntry = await esu.getEntryByResourceURI(tempFileURIs[0]);
      const transformId = pipelineResource.getTransformForType(pipelineResource.transformTypes.ROWSTORE);
      const etlEntryResourceURI = this.apiDistEntry.getMetadata().findFirstValue(null, 'dcat:accessURL');
      pipelineResource.setTransformArguments(transformId, {});
      pipelineResource.setTransformArguments(transformId, {
        action: 'replace',
        datasetURL: etlEntryResourceURI, // etl Entry
      });
      await pipelineResource.commit();
      this.updateProgressDialogState({ init: { status: 'done' }, fileprocess: { status: 'progress' } });

      // TODO explain
      const result = await pipelineResource.execute(fileEntry, {});
      await apiUtil.checkStatusOnRepeat(result[0]);
      tempFileURIs = tempFileURIs.slice(1); // remove first file entry
      if (tempFileURIs.length === 0) {
        this.updateProgressDialogState({ fileprocess: { status: 'done' } });
      } else {
        // check here
        pipelineResource.setTransformArguments(transformId, {
          action: 'append',
          datasetURL: etlEntryResourceURI, // etlEntry
        });
        await pipelineResource.commit();
        this.noOfFiles += 1;
        const apiFileProcessedNLS = this.hasOnlyAddedFiles ?
          this.escaApiProgress.apiFileProcessedOnlyAddition : this.escaApiProgress.apiFileProcessed;
        const apiFileProcessed = i18n.renderNLSTemplate(apiFileProcessedNLS, {
          number: this.noOfFiles,
          totalFiles: this.totalNoFiles,
        });
        this.updateProgressDialogState({ fileprocess: { message: apiFileProcessed } });

        await this._processFiles(tempFileURIs, pipelineResource);
        this.updateProgressDialogState({ fileprocess: { status: 'done' } });
      }
      // update distribution and UI
      await this.updateApiDistribution();
      await this.showFooterResult();
    } catch (err) {
      // TODO Error code here
      const errMessage = `${this.escaApiProgress.apiProgressError}
        ${err}`;
      this.updateProgressDialogState({
        fileprocess: { status: 'failed' },
      }, true, errMessage);
      throw Error(err);
    }
  },
  showFooterResult(message = null) {
    const modalFooter = this.progressDialog.getModalFooter();
    const onclick = this.progressDialog.hide.bind(this.progressDialog);
    m.render(modalFooter, m(Row, {
      classNames: ['spaSideDialogFooter'],
      columns: [{
        size: 12,
        value: [
          m(Button, {
            element: 'button',
            type: message ? 'default' : 'primary',
            classNames: ['pull-right', 'col-md-2'],
            text: message ?
              this.escaApiProgress.nlsProgressCancel : this.escaApiProgress.nlsProgressDone,
            onclick,
          }),
          m(Alert, {
            element: 'span',
            type: message ? 'danger' : 'success',
            classNames: ['pull-left', 'col-md-8'],
            text: message || this.escaApiProgress.nlsProgressSuccess,
            children: null,
          })],
      }],
    }));
  },
  done() {
    this.progressDialog.hide();
  },
});
