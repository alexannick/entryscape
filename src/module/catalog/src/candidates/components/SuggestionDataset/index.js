import dateUtil from 'commons/util/dateUtil';
import {
  getModifiedDate,
  getTitle,
} from 'commons/util/metadata';
import bindActions from './actions';
import './index.scss';

export default (vnode) => {
  const { entry, onRemove } = vnode.attrs;

  const actions = bindActions(entry);

  const removeDatasetReference = () => {
    const datasetURI = entry.getResourceURI();

    onRemove && onRemove(datasetURI);
  };

  return {
    view(vnode) {
      const { entry } = vnode.attrs;
      const title = getTitle(entry);
      const modificationDate = dateUtil.getMultipleDateFormats(getModifiedDate(entry));

      return (
        <div class="suggestionChild d-flex align-items-center" onclick={actions.navigateToDataset}>
          <p class="title flex-grow-1">
            <span class="fas fa-cubes"></span>
            {title}
          </p>
          <p class="date">{modificationDate.short}</p>
          <div
            class="remove"
            onclick={removeDatasetReference}
          >×</div>
        </div>
      );
    },
  };
};
