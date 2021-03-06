import EntryRow from 'commons/list/EntryRow';
import declare from 'dojo/_base/declare';
import templateString from './HarvestingRowTemplate.html';

const checkStr = "<i data-dojo-attach-point='statusNode' class='fas fa-check fa-lg'></i>";

export default declare([EntryRow], {
  templateString,
  entry: null,
  showCol1: true,
  showCol3: true,
  rowButtonMenu: null,
  nlsDateTitle: 'creationDateTitle',

  /**
   * @param generic
   * @param specific
   */
  updateLocaleStrings() {
    this.inherited(arguments);
  },
  render() {
    this.inherited(arguments);
    const md = this.entry.getMetadata();
    if (md.findFirstValue(null, 'storepr:check')) {
      this.psiPage.innerHTML = checkStr;
    }
    if (md.findFirstValue(null, 'storepr:merge')) {
      this.dcatAP.innerHTML = checkStr;
    }
    this.renderDate();
  },
});
