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
import StatBox from 'commons/overview/components/StatBox';
import Toggle from 'commons/components/common/toggle/Toggle';
import DistributionList from '../DistributionList';
import MoreMetadata from '../MoreMetadata';
import RDFormsPresentDialog from 'commons/rdforms/RDFormsPresentDialog';
import Button from '../Button';
import bindActions from './actions';
import './index.scss';


export default (vnode) => {
  const { entry } = vnode.attrs;
  const entryInfo = entry.getEntryInfo();
  const rdfutils = registry.get('rdfutils');

  const state = {
    metadataHidden: true,
    isPublished: false,
    psiPublished: false,
  };
  const setState = createSetState(state);
  const actions = bindActions(entry, vnode.dom);

  const toggleMetadata = () => {
    openMoreMetadata();
    // setState({ metadataHidden: !state.metadataHidden });
  };

  const togglePublish = () => {
    actions.setPublished(entry.isPublic());
  };

  const togglePsiPublish = () => {
    setState({ psiPublished: !state.psiPublished });
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

  return {
    oninit() {
      // Cache the entry context
      entry.getContext().getEntry();
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
      const publishToggleString = isPublished ? escaDataset.publishedTitle : escaDataset.unpublishedTitle;
      const catalogName = catalogEntry ? rdfutils.getLabel(catalogEntry) : null;
      const contributorsNames = contributors ? contributors.map(contributor => rdfutils.getLabel(contributor)) : null;

      return (
        <main class="overview__wrapper">
        <Button class="btn-primary btn-sm btn-back">Back</Button>
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
                <Button class=" btn-sm btn-secondary" onclick={toggleMetadata}>{escaDataset.showMoreTitle}</Button>

              </div>
            </div>

            <div class="btn__wrapper">
              <Button class="btn--edit btn-primary"
                onclick={actions.openEditDialog}>
                {escaDataset.editDatasetTitle}
              </Button>
              <Button class=" btn-secondary " onclick={actions.openPreview}>{escaDataset.previewDatasetTitle}</Button>
              <Button class=" btn-secondary " onclick={actions.openDowngrade}>{escaDataset.downgrade}</Button>
              <Button class=" btn-secondary " onclick={actions.removeDataset}>{escaDataset.removeDatasetTitle}</Button>

              <div class="externalPublish flex--sb">
                <div class="icon--wrapper">
                  <span class="icons fa fa-globe"></span>
                  <p>{publishToggleString}</p>
                </div>
                <Toggle isEnabled={isPublished} onToggle={togglePublish}></Toggle>
              </div>
              <div class="psiPublish flex--sb">
                <div class="icon--wrapper">
                  <span class="icons fa fa-eye"></span>
                  <p>{escaDataset.psiDatasetTitle}</p>
                </div>
                <Toggle isEnabled={state.psiPublished} onToggle={togglePsiPublish}></Toggle>
              </div>
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
            <div class="cards--wrapper">
              <StatBox value={numRevisions} label={escoList.versionsLabel} onclick={actions.openRevisions}/>
              <StatBox value={numComments} label={escaDataset.commentMenu} onclick={openCommentsDialog}/>
              <StatBox value={ideas.length} label={escaDataset.showideas} onclick={actions.openIdeas}/>
              <StatBox value={showcases.length} label={escaDataset.showresults} onclick={actions.openShowcases}/>
            </div>
          </div>
        </main>
      );
    },
  };
};
