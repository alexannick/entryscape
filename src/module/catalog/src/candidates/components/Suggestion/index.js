import dateUtil from 'commons/util/dateUtil';
import {
  getTitle,
  getModifiedDate,
} from 'commons/util/metadata';
import DOMUtil from 'commons/util/htmlUtil';
import CollapsableCard from 'commons/components/bootstrap/Collapse/Card';
import ProgressBar from '../ProgressBar';
import SuggestionDataset from '../SuggestionDataset';
import SuggestionRequest from '../SuggestionRequest';
import SuggestionActions from '../SuggestionActions';
import bindActions from './actions';
import './index.scss';

export default (vnode) => {
  const { entry, updateParent = () => {} } = vnode.attrs;
  const actions = bindActions(entry, DOMUtil.preventBubbleWrapper);

  const editSuggestion = e => actions.editSuggestion(e, () => m.redraw());
  const editChecklist = e => actions.editChecklist(e, () => m.redraw());
  const createDataset = e => actions.createDataset(e, () => {});
  const cardId = `suggestion${entry.getId()}`;

  const getDatasets = datasetResourceURIs => registry.get('entrystore')
    .newSolrQuery()
    .rdfType('dcat:Dataset')
    .uriProperty('dcterms:references', datasetResourceURIs)
    .getEntries();

  return {
    view() {
      const title = getTitle(entry);
      const modificationDate = dateUtil.getMultipleDateFormats(getModifiedDate(entry));

      return (
        <div class="suggestion d-flex">
          <ProgressBar
            progressPercent="50"
            incomplete={false}
            onclick={editChecklist}
          />
          <CollapsableCard
            title={title}
            subTitle={[modificationDate.short, <SuggestionActions entry={entry} updateParent={updateParent} />]}
            className="flex-fill"
            cardId={cardId}
          >
            <SuggestionRequest entry={entry} />
            <SuggestionDataset entry={entry} />
          </CollapsableCard>

        </div>
      );
    },
  };
};
