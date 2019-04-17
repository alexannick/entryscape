import escaStatistics from 'catalog/nls/escaStatistics.nls';
import Chart from 'chart.js';
import 'chartist-plugin-legend';
import 'chartist-plugin-tooltips';
import 'chartist-plugin-tooltips/dist/chartist-plugin-tooltip.css';
import { i18n } from 'esi18n';
import moment from 'moment';
import './index.scss';

/**
 * Given a length guess what date format is appropriate to render.
 *
 * @param {number} dataLength
 * @return {string}
 */
const guessAxisFormatFromData = (dataLength) => {
  let xAxisDateFormat = 'day';
  if (dataLength > 10 && dataLength < 13) {
    xAxisDateFormat = 'month';
  } else if (dataLength < 25) {
    xAxisDateFormat = 'hour';
  } else if (dataLength < 32) {
    xAxisDateFormat = 'day';
  }

  return xAxisDateFormat;
};

export default () => {
  let chart;

  const updateXAxis = (vnode) => {
    const { data } = vnode.attrs;
    if (data) {
      const type = guessAxisFormatFromData(data.length);
      if (vnode.state && vnode.state.type !== type) {
        vnode.state.type = type;

        let titleCallback;
        switch (type) {
          case 'hour':
            titleCallback = items => moment(items[0].label).format('MMMM Do YYYY, h A');
            break;
          case 'day':
            titleCallback = items => moment(items[0].label).format('MMM Do, YYYY');
            break;
          case 'month':
            titleCallback = items => moment(items[0].label).format('MMMM YYYY');
            break;
          default:
        }
        chart.options.tooltips.callbacks.title = titleCallback;
      }
    }
  };

  return {
    oncreate(vnode) {
      const { elementId } = vnode.attrs;
      const ctx = document.getElementById(elementId);
      chart = new Chart(ctx, {
        type: 'bar',
        label: 'test',
        options: {
          maintainAspectRatio: false,
          tooltips: {
            callbacks: {
              title(item) {
                return moment(item[0].label).format('MMM Do, YYYY');
              },
            },
          },
          scales: {
            xAxes: [{
              type: 'time',
              time: {
                unit: 'month',
              },
            }],
          },
        },
      });

      updateXAxis(vnode);
    },

    onbeforeupdate: updateXAxis,

    view(vnode) {
      const { data, elementId, name: label, chartDimensions = {} } = vnode.attrs;
      const { width = 400, height = 400 } = chartDimensions;

      let noData = true;
      if (chart && data) {
        noData = false;
        const timeUnit = guessAxisFormatFromData(data.length);

        // update chart data and xAxis if needed
        chart.data = {
          labels: [],
          datasets: [{
            data,
            label,
            borderColor: '#165b98',
            backgroundColor: 'rgba(22, 91, 152,0.2)',
            borderWidth: 3,
          }],
        };
        chart.options.scales.xAxes[0].time.unit = timeUnit;
        chart.update();
      }
      return (<div className="chart-container">
        <div
          className={`no-data ${noData ? '' : 'hidden'}`}>{i18n.localize(escaStatistics, 'timeRangeNoDataAvailable')}</div>
        <canvas id={elementId} width={width} height={height}/>
      </div>);
    },
  };
};
