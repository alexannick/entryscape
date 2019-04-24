import esadUser from "admin/nls/esadUser.nls";
import { isAPIDistribution } from 'catalog/datasets/utils/distributionUtil';
import escaStatistics from "catalog/nls/escaStatistics.nls";
import Chart from 'catalog/statistics/components/BarChart';
import TimeRangeDropdown from 'catalog/statistics/components/TimeRangeDropdown';
import timeRangeUtil from 'catalog/statistics/utils/timeRange';
import { getRowstoreAPIUUID } from 'catalog/utils/rowstoreApi';
import TitleDialog from 'commons/dialog/TitleDialog';
import escoVersions from "commons/nls/escoVersions.nls";
import registry from 'commons/registry';
import statsAPI from 'commons/statistics/api';
import { createSetState } from 'commons/util/util';
import declare from 'dojo/_base/declare';
import { i18n } from "esi18n";

const getChartData = async (entries, context, timeRange) => {
  const chartData = { datasets: [] };
  const labels = [];
  const entryStatisticsPromises = entries.map((entry) => {
    const label = entry.getMetadata().findFirstValue(null, 'dcterms:title');
    labels.push(label);
    const entryId = isAPIDistribution(entry) ? entry.getId() : getRowstoreAPIUUID(entry); // @todo @valentino check if this works with aliasses
    return statsAPI.getEntryStatistics(context.getId(), entryId, timeRangeUtil.toAPIRequestPath(timeRange));
  });

  await Promise.all(entryStatisticsPromises).then((allEntriesStatsData) => {
    allEntriesStatsData.forEach((statsData, idx) => {
      delete statsData.count;
      const data = timeRangeUtil.normalizeChartData(timeRange, statsData);
      console.log(data);
      const label = labels[idx];
      chartData.datasets.push({ data, label });
    });
  });

  return chartData;
};

let component = null;
const timeRangesItems = timeRangeUtil.getTimeRanges();

const state = {
  data: [],
  timeRangeSelected: 'this-month',
};

const setState = createSetState(state);

const getControllerComponent = (entries, elementId, name) => {
  if (component) {
    return component;
  }

  const onclickTimeRange = (range) => {
    setState({
      timeRangeSelected: range,
    });

    getChartData(entries, registry.getContext(), state.timeRangeSelected).then(data => setState({ data }));
  };


  component = {
    elementId,
    name,
    oninit() {
      getChartData(entries, registry.getContext(), state.timeRangeSelected).then(data => setState({ data }));
    },
    view() {
      const escaStatisticsNLS = i18n.getLocalization(escaStatistics);
      return <section>
        <div className="chooser__wrapper">
          <h4>{escaStatisticsNLS.statsDialogTimeRange}</h4>
          <TimeRangeDropdown
            items={timeRangesItems}
            selected={state.timeRangeSelected}
            onclickTimeRange={onclickTimeRange}/>
        </div>
        <Chart data={state.data} elementId={this.elementId} name={this.name}/>
      </section>;
    },
  };

  return component;
};

export default declare([TitleDialog.ContentComponent], {
  nlsBundles: [{ escaStatistics }],
  nlsHeaderTitle: 'statsDialogTitle',
  nlsFooterButtonLabel: 'statsDialogFooter',
  postCreate() {
    this.inherited(arguments);
    this.dialog.footerButtonAction = () => {
      component = null;
    };
  },
  open(params) {
    const elementId = 'distribution-dialog-statistics';
    const name = 'test';
    this.dialog.show();
    const controllerComponent = getControllerComponent(params.entries, elementId, name);
    this.show(controllerComponent);
  },
});
