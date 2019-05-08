import escaStatistics from 'catalog/nls/escaStatistics.nls';
import Chart from 'chart.js';
import { i18n } from 'esi18n';

const BACKGROUND_COLOURS = [
  'rgba(0, 131, 143,0.2)',
  'rgba(22, 91, 152,0.2)',
  'rgba(174, 213, 129,0.2)',
  'rgba(251, 192, 45,0.2)',
  'rgba(233, 30, 99,0.2)',
];
export default () => {
  let chart;

  return {
    oncreate(vnode) {
      const { elementId } = vnode.attrs;
      const ctx = document.getElementById(elementId);
      chart = new Chart(ctx, {
        type: 'doughnut',
        options: {
          circumference: Math.PI, // half doughnut
          rotation: -Math.PI,
        },
      });
    },

    view(vnode) {
      const { data, elementId } = vnode.attrs;

      let noData = true;
      if (chart && data
        && data.datasets && data.datasets.length > 0
        && data.datasets[0].data.length > 0) { // @todo refactor
        noData = false;

        // update chart data and xAxis if needed

        data.datasets[0].backgroundColor = BACKGROUND_COLOURS;
        data.datasets[0].label = 'what is this?';
        chart.data = data;
        chart.update();
      }

      return (<div className="chart-container">
        <div
          className={`no-data ${noData ? '' : 'hidden'}`}>{i18n.localize(escaStatistics, 'timeRangeNoDataAvailable')}</div>
        <canvas
          className={` ${noData ? 'hidden' : ''}`}
          id={elementId}
          aria-label="Statistics chart" role="img"/>
      </div>);
    },
  };
};
