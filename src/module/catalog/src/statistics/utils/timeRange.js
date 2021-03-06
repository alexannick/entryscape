import escaStatistics from 'catalog/nls/escaStatistics.nls';
import { i18n } from 'esi18n';

/**
 * @todo make map?
 * @return {*[]}
 */
const getTimeRanges = () => {
  const escaStatisticsNLS = i18n.getLocalization(escaStatistics);
  return [
    {
      value: 'today',
      label: escaStatisticsNLS.timeRangeToday,
    },
    {
      value: 'yesterday',
      label: escaStatisticsNLS.timeRangeYesterday,
    },
    {
      value: 'this-month',
      label: escaStatisticsNLS.timeRangeThisMonth,
    },
    {
      value: 'last-month',
      label: escaStatisticsNLS.timeRangeLastMonth,
    },
    {
      value: 'this-year',
      label: escaStatisticsNLS.timeRangeThisYear,
    },
    {
      value: 'last-year',
      label: escaStatisticsNLS.timeRangeLastYear,
    },
  ];
};

/**
 *
 * @param selected
 * @return {*}
 */
const toAPIRequestPath = (selected) => {
  const date = new Date();
  switch (selected) {
    case 'today':
      break;
    case 'yesterday':
      date.setDate(date.getDate() - 1);
      break;
    case 'this-month':
      return {
        year: date.getFullYear(),
        month: date.getMonth(),
      };
    case 'last-month':
      date.setMonth(date.getMonth() - 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth(),
      };
    case 'this-year':
      return {
        year: date.getFullYear(),
      };
    case 'last-year':
      date.setFullYear(date.getFullYear() - 1);
      return {
        year: date.getFullYear(),
      };
    case 'custom':
      break;
    default:
  }
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    date: date.getDate(),
  };
};

/**
 *
 * @param selected
 * @param data
 * @return {Array}
 */
const normalizeChartData = (selected, data) => {
  const date = new Date();
  const wholeData = [];
  let max;
  let day;
  let month;
  let year;

  // having index day as 0 refers to the previous month
  const daysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();

  switch (selected) {
    case 'today':
      max = 24;
      day = date.getDate();
      month = date.getMonth();
      year = date.getFullYear();
      break;
    case 'yesterday':
      date.setDate(date.getDate() - 1); // update date
      max = 24;
      day = date.getDate();
      month = date.getMonth();
      year = date.getFullYear();
      break;
    case 'this-month':
      max = daysInMonth(date.getMonth(), date.getFullYear());
      day = date.getDate();
      month = date.getMonth();
      year = date.getFullYear();
      break;
    case 'last-month':
      date.setMonth(date.getMonth() - 1); // update date
      max = daysInMonth(date.getMonth(), date.getFullYear());
      day = date.getDate();
      month = date.getMonth();
      year = date.getFullYear();
      break;
    case 'this-year':
      max = 12;
      day = date.getDate();
      month = date.getMonth();
      year = date.getFullYear();
      break;
    case 'last-year':
      date.setFullYear(date.getFullYear() - 1);
      max = 12;
      month = date.getMonth();
      year = date.getFullYear();
      break;
    case 'custom':
      break;
    default:
  }

  let hasApiDiffIndex = false;
  let i;
  if (selected === 'this-year' || selected === 'last-year') {
    i = 0;
    hasApiDiffIndex = true;
  } else {
    i = 1;
    max += 1;
  }

  // loop through either one of hours, days or months
  for (; i < max; i++) {
    let x; // datetime
    let y = 0; // count

    // try to extract count from data if it exists
    // take care of monthIndex inconsistency between JS and the api data
    const datetimeApiIndex = hasApiDiffIndex ? i + 1 : i;
    const datetimeProperty = datetimeApiIndex < 10 ? `0${datetimeApiIndex}` : datetimeApiIndex;
    if (datetimeProperty in data) {
      y = data[datetimeProperty].count;
    }

    switch (selected) {
      case 'today':
      case 'yesterday':
        x = new Date(year, month, day, i);
        break;
      case 'this-month':
      case 'last-month':
        x = new Date(year, month, i);
        break;
      case 'this-year':
      case 'last-year':
        x = new Date(year, i, 1);
        break;
      default:
    }

    wholeData.push({ x, y });
  }

  return wholeData;
};

export default {
  getTimeRanges,
  toAPIRequestPath,
  normalizeChartData,
};
