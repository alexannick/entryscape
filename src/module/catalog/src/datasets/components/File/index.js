import { i18n } from 'esi18n';
import dateUtil from 'commons/util/dateUtil';
import Dropdown from 'commons/components/common/Dropdown';
import Button from 'catalog/datasets/components/Button';
import escaDatasetNLS from 'catalog/nls/escaDataset.nls';
import {
  getTitle,
  getModifiedDate,
} from 'commons/util/metadata';
import bindActions from './actions';

/**
 * Displays a file row
 *
 * @returns {object} A Mithril component
 */
export default (vnode) => {
  const { entry, distribution, onUpdate } = vnode.attrs;
  const actions = bindActions(entry, distribution, onUpdate);

  return {
    view() {
      const title = getTitle(entry);
      const modifiedDate = dateUtil.getMultipleDateFormats(getModifiedDate(entry));
      const escaDataset = i18n.getLocalization(escaDatasetNLS);

      return (
        <div class="distribution__fileRow">
          <div class="distribution__format">
            <p class="distribution__title">{title}</p>
          </div>
          <div>
            <div class="flex--sb">
              <p class="distributionFile__date">{modifiedDate.short}</p>
              <Dropdown>
                <Button
                  class="btn--distribution fas fa-fw fa-bookmark"
                  title={escaDataset.removeDistributionTitle}
                  onclick={actions.removeFile}
                >
                  {escaDataset.removeDistributionTitle}
                </Button>
                <Button
                  class="btn--distribution fas fa-fw fa-exchange"
                  title={escaDataset.replaceFileTitle}
                  onclick={actions.replaceFile}
                >
                  {escaDataset.replaceFile}
                </Button>
                <Button
                  class="btn--distribution fas fa-fw fa-download"
                  title={escaDataset.downloadButtonTitle}
                  onclick={actions.downloadFile}
                >
                  {escaDataset.downloadButtonTitle}
                </Button>
              </Dropdown>
            </div>
          </div>
        </div>
      );
    },
  };
};
