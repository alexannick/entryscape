import m from 'mithril';
import registry from 'commons/registry';
import config from 'config';
import { i18n } from 'esi18n';
import dateUtil from 'commons/util/dateUtil';
import { engine, utils as rdformsUtils } from 'rdforms';
import { createSetState } from 'commons/util/util';
import {
  isAPIDistribution,
} from 'catalog/datasets/utils/distributionUtil';
import {
  getTitle,
  getModifiedDate,
} from 'commons/util/metadata';
import escaDatasetNLS from 'catalog/nls/escaDataset.nls';
import DistributionActions from '../DistributionActions';
import './index.scss';

export default (vnode) => {
  const { distribution, dataset } = vnode.attrs;
  const state = {
    isExpanded: false,
    fileEntries: [],
  };
  const setState = createSetState(state);

  const expandDistribution = () => {
    setState({
      isExpanded: !state.isExpanded,
    });
  };

  const updateFileEntries = () => {
    const entryStoreUtil = registry.get('entrystoreutil');
    Promise.all(
      distribution
        .getMetadata()
        .find(distribution.getResourceURI(), 'dcat:downloadURL')
        .map(statement => entryStoreUtil.getEntryByResourceURI(statement.getValue())),
    ).then(fileEntries => setState({ fileEntries }));
  };

  const getSafeTitle = (entry) => {
    const title = getTitle(entry);

    if (title == null) {
      const namespaces = registry.get('namespaces');
      const escaDatasetLocalized = i18n.getLocalization(escaDatasetNLS);
      const subj = entry.getResourceURI();
      const metadata = entry.getMetadata();
      const downloadURI = metadata.findFirstValue(subj, namespaces.expand('dcat:downloadURL'));
      const source = metadata.findFirstValue(subj, namespaces.expand('dcterms:source'));

      if (downloadURI != null && downloadURI !== '') {
        return escaDatasetLocalized.defaultDownloadTitle;
      } else if (source != null && source !== '') {
        return escaDatasetLocalized.autoGeneratedAPI;
      }

      return escaDatasetLocalized.defaultAccessTitle;
    }

    return title;
  };

  const getDistributionMetadata = (entry) => {
    const namespaces = registry.get('namespaces');
    const md = entry.getMetadata();
    const subj = entry.getResourceURI();
    const accessURI = md.findFirstValue(subj, namespaces.expand('dcat:accessURL'));
    const downloadURI = md.findFirstValue(subj, namespaces.expand('dcat:downloadURL'));
    const description = md.findFirstValue(subj, namespaces.expand('dcterms:description'));
    const fileEntries = md.find(subj, 'dcat:downloadURL');

    // @scazan WHAT IS TEMPLATE DRIVEN FORMAT?
    let format;
    // Check for template driven format
    const formatTemplate = config.catalog.formatTemplateId
      ? registry
        .get('itemstore')
        .getItem(config.catalog.formatTemplateId)
      : undefined;
    if (formatTemplate) {
      format = rdformsUtils.findFirstValue(engine, md, subj, formatTemplate);
    }
    // Alternatively check for pure value via array of properties
    if (!format && config.catalog.formatProp) {
      const formatPropArr = typeof config.catalog.formatProp === 'string'
        ? [config.catalog.formatProp]
        : config.catalog.formatProp;
      formatPropArr.find((prop) => {
        format = md.findFirstValue(subj, namespaces.expand(prop));
        return format != null;
      });
    }

    return { format, accessURI, downloadURI, description, fileEntries };
  };

  return {
    view(vnode) {
      const { fileEntryURIs } = vnode.attrs;
      const title = getSafeTitle(distribution);
      const {
        format,
        accessURI,
        downloadURI,
        description,
      } = getDistributionMetadata(distribution);
      const modificationDate = dateUtil.getMultipleDateFormats(getModifiedDate(distribution));

      const expandedClass = state.isExpanded ? 'expanded' : '';
      const distributionArrowClass = state.isExpanded ? 'fa-angle-up' : 'fa-angle-down';
      const escaDataset = i18n.getLocalization(escaDatasetNLS);

      return (
        <div>
          <div tabindex="0" class="distribution__row flex--sb">
            <div class="distribution__format">
              <p class="distribution__title">{title}</p>
              <p class="file__format">
                <span class="file__format--short">{format}</span>
              </p>
            </div>
            <div class="flex--sb">
              <p class="distribution__date">{modificationDate.short}</p>
            
            <DistributionActions
              distribution={distribution}
              dataset={dataset}
              fileEntryURIs={fileEntryURIs}
            />
           </div>
          </div>

          <div class={`distribution__expand ${expandedClass}`}>
            <div>
              <div class="flex--sb">
                <div class="metadata--wrapper">
                  { description &&
                    <div class="distribution__description">
                      <h2 class="title">{escaDataset.distributionDescriptionTitle}</h2>
                      <p class="text">
                        { description }
                      </p>
                    </div>
                  }
                  <div class="distribution__format">
                    <h2 class="title">{escaDataset.distributionFormatTitle}</h2>
                    <p class="text">
                      { i18n.renderNLSTemplate(
                        escaDataset.distributionFiles,
                        { numFiles: state.fileEntries.length },
                      ) }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    },
  };
};
