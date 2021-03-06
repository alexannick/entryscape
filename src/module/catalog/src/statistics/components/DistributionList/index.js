import escaStatistics from 'catalog/nls/escaStatistics.nls';
import { i18n } from 'esi18n';
import './index.scss';

/**
 * Call the parent callback with the dataset attributes
 *
 * @param {function} callback
 * @param {Event} e
 */
const onclickListItem = (callback, e) => callback({ ...e.currentTarget.dataset });

export default () => ({
  oninit(vnode) {
    this.handleListItemClick = onclickListItem.bind(null, vnode.attrs.onclick);
  },
  onbeforeupdate(vnode, old) {
    // make sure not to stop data flow, if new onclick is passed then update the callback
    if (vnode.attrs.onclick !== old.attrs.onclick) {
      this.handleListItemClick = onclickListItem.bind(null, vnode.attrs.onclick);
    }
  },
  view(vnode) {
    const { items, filteredItems, selected } = vnode.attrs;
    const toRenderItems = filteredItems || items;
    const hasData = !!toRenderItems.length > 0;
    const escaStatisticsNLS = i18n.getLocalization(escaStatistics);

    return hasData ?
      <div class="stats__row__wrapper--file">
        <div className="stats-header">
          <span className="distribution__head__title">{escaStatisticsNLS.tabHeaderTitle}</span>
          <div className="flex header--wrapper--right">
            <span className="distribution__head__title">{escaStatisticsNLS.tabHeaderFormat}</span>
            <span title={escaStatisticsNLS.rowHeaderFile} className="distribution__head__title fas fa-download"/>
          </div>
        </div>
        {hasData ?
          toRenderItems.map(item =>
            (<div
              key={item.uri}
              onclick={this.handleListItemClick}
              tabIndex="0"
              data-uri={item.uri}
              data-name={item.filename || item.name || item.subname}
              className={`stats__row flex--sb `}>
              <div className="row__title--wrapper">
                {
                  item.filename ?
                    <span className="row__title"><i className="fas fa-file"/><span>{item.filename}</span></span>
                    : null
                }
                <span className="row__text">{escaStatisticsNLS.datasetPrefix} {item.name}</span>
              </div>
              <div className="flex--sb row--right--wrapper">
                <span
                  className="row__text label badge" data-format={item.format}
                  title={item.format}>{item.abbrevFormat || item.format}
                </span>
                <span className="row__text stat__count">{item.count}</span>
              </div>
            </div>)) :
          <div class="no-data">{escaStatisticsNLS.timeRangeNoDataAvailable}</div>
        }
      </div> :
      <div class="no-data">{escaStatisticsNLS.timeRangeNoDataAvailable}</div>;
  },
});
