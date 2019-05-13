import { isAPIDistribution } from 'catalog/datasets/utils/distributionUtil';
import escaStatistics from 'catalog/nls/escaStatistics.nls';
import timeRangeUtil from 'catalog/statistics/utils/timeRange';
import { getRowstoreAPIUUID } from 'catalog/utils/rowstoreApi';
import Chart from 'commons/components/common/chart/TimeBarChart';
import SearchSelect from 'commons/components/common/select/SearchSelect';
import TitleDialog from 'commons/dialog/TitleDialog';
import registry from 'commons/registry';
import statsAPI from 'commons/statistics/api';
import { getEntryRenderName } from 'commons/util/entryUtil';
import { createSetState } from 'commons/util/util';
import declare from 'dojo/_base/declare';
import { i18n } from 'esi18n';

const getChartData = async (entries, context, timeRange) => {
  const chartData = { datasets: [] };
  const labels = [];
  const entryStatisticsPromises = entries.map((entry) => {
    const label = getEntryRenderName(entry);
    labels.push(label);
    const entryId = isAPIDistribution(entry) ? entry.getId() : getRowstoreAPIUUID(entry); // @todo @valentino check if this works with aliasses
    return statsAPI.getEntryStatistics(context.getId(), entryId, timeRangeUtil.toAPIRequestPath(timeRange));
  });

  await Promise.all(entryStatisticsPromises).then((allEntriesStatsData) => {
    allEntriesStatsData.forEach((statsData, idx) => {
      delete statsData.count;
      const data = timeRangeUtil.normalizeChartData(timeRange, statsData);
      const label = labels[idx];
      chartData.datasets.push({ data, label });
    });
  });

  return chartData;
};

const timeRangesItems = timeRangeUtil.getTimeRanges();

const getControllerComponent = (entries) => {
  const state = {
    data: [],
  };

  const setState = createSetState(state);

  const timeRangeSelected = 'this-month';
  const elementId = `distribution-dialog-statistics-${Math.random().toString(36).substring(4)}`;

  const onclickTimeRange = (range) => {
    getChartData(entries, registry.getContext(), range)
      .then(data => setState({ data }));
  };

  return {
    oninit() {
      getChartData(entries, registry.getContext(), timeRangeSelected)
        .then(data => setState({ data }));
    },
    view() {
      const escaStatisticsNLS = i18n.getLocalization(escaStatistics);
      return <section>
        <div>
          <h4>Combined Statistics</h4>
          <p>Here you can see a combined view of different user actions through time</p>
        </div>
        <div className="chooser__wrapper">
          <h4>{escaStatisticsNLS.statsDialogTimeRange}</h4>
          <SearchSelect
            options={timeRangesItems}
            selectedOptions={[timeRangeSelected]}
            onChange={onclickTimeRange}
          />
        </div>
        <Chart data={state.data} elementId={elementId}/>
      </section>;
    },
  };
};

export default declare([TitleDialog.ContentComponent], {
  nlsBundles: [{ escaStatistics }],
  nlsHeaderTitle: 'statsDialogTitle',
  nlsFooterButtonLabel: 'statsDialogFooter',
  postCreate() {
    this.inherited(arguments);
    this.dialog.footerButtonAction = () => {
      this.hide();
    };
  },
  open(params) {
    this.dialog.show();
    const controllerComponent = getControllerComponent(params.entries);
    this.show(controllerComponent);
  },
});
