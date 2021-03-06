import m from 'mithril';
import { createSetState } from 'commons/util/util';
import registry from 'commons/registry';
import config from 'config';
import { i18n } from 'esi18n';
import dateUtil from 'commons/util/dateUtil';
import comments from 'commons/comments/comments';
import escaPublicNLS from 'catalog/nls/escaPublic.nls';
import escaDatasetNLS from 'catalog/nls/escaDataset.nls';
import escoListNLS from 'commons/nls/escoList.nls';
import {
  getTitle,
  getDescription,
  getModifiedDate,
  getThemeLabels,
  getParentCatalogEntry,
  getContributors,
  getIdeas,
  getShowcases,
} from 'commons/util/metadata';
import StatBoxInline from 'commons/overview/components/StatBoxInline';
import Toggle from 'commons/components/common/toggle/Toggle';
import RDFormsPresentDialog from 'commons/rdforms/RDFormsPresentDialog';
import { isDatasetPSI } from '../../utils/distributionUtil';
import DistributionList from '../DistributionList';
import MoreMetadata from '../MoreMetadata';
import Button from '../Button';
import bindActions from './actions';
import './index.scss';

export default (vnode) => {
  const { entry } = vnode.attrs;
  const entryInfo = entry.getEntryInfo();
  const rdfutils = registry.get('rdfutils');

  const state = {
    metadataHidden: true,
    publishTemporarilyDisabled: false,
  };
  const setState = createSetState(state);
  const actions = bindActions(entry, vnode.dom);

  // @scazan Keeping this here for Phase II
  const toggleMetadata = () => {
    openMoreMetadata();
  };

  const togglePublish = () => {
    const publishButton = vnode.dom.querySelector('.externalPublish .btn--publish');
    // Temporarily toggle the button for fast UI response. This will immediately be overwritten on next vdom render
    if (publishButton) {
      if (state.publishTemporarilyDisabled) {
        return false;
      }

      // Also, disable the button clicking until re-render (while waiting for XHR response)
      setState({ publishTemporarilyDisabled: true });
    }

    actions.setPublishedState(entry.isPublic(), () => {
      setState({ publishTemporarilyDisabled: false });
    });

    return true;
  };

  const toggleInternalPublish = () => {
    actions.setInternalPublishedState(isDatasetPSI(entry));
  };

  let catalogEntry;
  const setParentCatalogEntry = () => {
    getParentCatalogEntry(entry)
      .then((parentEntry) => {
        catalogEntry = parentEntry;
        m.redraw();
      });
  };

  let contributors;
  const setContributors = () => {
    getContributors(entry).then((entries) => {
      contributors = entries;
      m.redraw();
    });
  };

  let ideas = [];
  const setIdeas = () => {
    getIdeas(entry, (entries) => {
      ideas = entries;
      m.redraw();
    });
  };

  let showcases = [];
  const setShowcases = () => {
    getShowcases(entry, (entries) => {
      showcases = entries;
      m.redraw();
    });
  };

  let numComments = 0;
  const refreshComments = (explicitNumComments) => {
    if (explicitNumComments) {
      numComments = explicitNumComments;
      m.redraw();
      return explicitNumComments;
    }

    return comments.getNrOfComments(entry).then((numberComments) => {
      numComments = numberComments;
      m.redraw();
      return numComments;
    });
  };

  const openCommentsDialog = () => actions.openComments(refreshComments);

  const removeDataset = () => actions.removeDataset(numComments);

  const openMoreMetadata = () => {
    const dataTemplate = registry.get('itemstore').getItem(config.catalog.datasetTemplateId);
    const dialog = new RDFormsPresentDialog({ maxWidth: 800 });
    dialog.title = getTitle(entry);
    dialog.localeChange();
    dialog.show(
      entry.getResourceURI(),
      entry.getMetadata(),
      dataTemplate,
    );
  };

  let isPublishable = false;
  const getCatalogPublicStateAndSetFlag = () => {
    entry
      .getContext()
      .getEntry()
      .then((contextEntry) => {
        // Set the dataset as publishable only if the parent catalog is public
        isPublishable = contextEntry.isPublic();
      });
  };

  return {
    oninit() {
      // Cache the entry context
      getCatalogPublicStateAndSetFlag();
      setParentCatalogEntry();
      setContributors();
      refreshComments();
      setIdeas();
      setShowcases();
    },
    view: () => {
      const escaDataset = i18n.getLocalization(escaDatasetNLS);
      const escaPublic = i18n.getLocalization(escaPublicNLS);
      const escoList = i18n.getLocalization(escoListNLS);

      const title = getTitle(entry);
      const lastUpdatedDate = dateUtil.getMultipleDateFormats(getModifiedDate(entry));
      const description = getDescription(entry);
      const numRevisions = entryInfo.getMetadataRevisions().length;
      const themes = getThemeLabels(entry);
      const isPublished = entry.isPublic();
      const isDatasetMarkedAsPSI = isDatasetPSI(entry);
      const isRemoveable = !isPublished;
      const publishToggleString = isPublished ? escaDataset.publishedTitle : escaDataset.unpublishedTitle;
      const publishToggleTooltip = isPublished ? escaDataset.publicDatasetTitle : escaDataset.privateDatasetTitle;
      const internalToggleString = isDatasetMarkedAsPSI ? escaDataset.psiDataset : escaDataset.notPsiDataset;
      const internalToggleTooltip = isDatasetMarkedAsPSI ? escaDataset.psiDatasetTitle : escaDataset.notPsiDatasetTitle;

      const catalogName = catalogEntry ? rdfutils.getLabel(catalogEntry) : null;
      const contributorsNames = contributors ? contributors.map(contributor => rdfutils.getLabel(contributor)) : null;

      return (
        <main class="overview__wrapper">
          <Button class="btn-link btn-sm  btn-back" onclick={actions.navigateToDatasets}>
            <span class="fas fa-arrow-left"></span>
            {escaDataset.backTitle}
          </Button>
          <div class="flex--sb">
            <div class="metadata--wrapper">
              <div class="intro--wrapper">
                <h2 class="title">{ title }</h2>
                <p class="description">{ description }</p>
              </div>
              <div class="metadata--basic">
                { catalogName && (
                  <p><span class="metadata__label">
                    {escaPublic.datasetBelongsToCatalog}: </span> {catalogName}
                  </p>
                )}
                { themes.length > 0 && (
                  <p>
                    <span class="metadata__label">{escaDataset.themeTitle}: </span>{themes.join(', ')}
                  </p>
                )}

                <p><span class="metadata__label">{escaDataset.lastUpdateLabel}: </span> {lastUpdatedDate.short}</p>
                { contributorsNames && (
                  <p>
                    <span class="metadata__label">{escaDataset.editedTitle}: </span>
                    {contributorsNames.join(', ')}
                  </p>
                )}
                <div class="cards--wrapper">
                  <StatBoxInline
                    value={numRevisions}
                    label={escoList.versionsLabel}
                    onclick={actions.openRevisions}/>
                  <StatBoxInline
                    value={numComments}
                    label={escaDataset.commentMenu}
                    onclick={openCommentsDialog}/>
                  <StatBoxInline
                    value={ideas.length}
                    label={escaDataset.showideas}
                    onclick={actions.openIdeas}/>
                  <StatBoxInline
                    value={showcases.length}
                    label={escaDataset.showresults}
                    onclick={actions.openShowcases}/>
                </div>
              </div>

            </div>

            <div class="btn__wrapper">
              <Button class="btn--edit btn-primary"
                onclick={actions.openEditDialog}>
                {escaDataset.editDatasetTitle}
              </Button>
              <Button class="btn btn-default" onclick={actions.openPreview}>{escaDataset.previewDatasetTitle}</Button>
              <Button class="btn-default" onclick={actions.downgrade}>{escaDataset.downgrade}</Button>
              <Button class="btn-default" onclick={actions.clone}>{escaDataset.cloneMenu}</Button>
              <Button
                class={`btn-default ${isRemoveable ? '' : 'disabled'}`}
                title={isRemoveable ? '' : escaDataset.cannotRemoveDatasetPublishedTitle}
                onclick={isRemoveable && removeDataset}
              >
                {escaDataset.removeDatasetTitle}
              </Button>

              <div class="externalPublish flex--sb">
                <div class="icon--wrapper">
                  <span class="icons fas fa-globe"></span>
                  <p>{publishToggleString}</p>
                </div>
                <Toggle
                  title={isPublishable ? publishToggleTooltip : escaDataset.privateDisabledDatasetTitle}
                  toggleState={isPublished}
                  onToggle={togglePublish}
                  isEnabled={!state.publishTemporarilyDisabled && isPublishable}
                ></Toggle>
              </div>
              { config.catalog.allowInternalDatasetPublish &&
                <div class="psiPublish flex--sb">
                  <div class="icon--wrapper">
                    <span class="icons fas fa-eye"></span>
                    <p>{internalToggleString}</p>
                  </div>
                  <Toggle
                    title={internalToggleTooltip}
                    toggleState={isDatasetMarkedAsPSI}
                    onToggle={toggleInternalPublish}
                  ></Toggle>
                </div>
              }
            </div>
          </div>

          <div class="metadata--wrapper">
            <MoreMetadata
              isHidden={state.metadataHidden}
              entry={entry}
            ></MoreMetadata>
          </div>

          <div class="flex--sb">
            <DistributionList dataset={entry}></DistributionList>

          </div>
        </main>
      );
    },
  };
};
