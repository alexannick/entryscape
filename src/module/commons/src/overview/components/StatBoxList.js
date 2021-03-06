import m from 'mithril';
import StatBox from './StatBoxInline';

export default {
  view(vnode) {
    return m('.row.statBoxList', vnode.attrs.bList.map((item) => {
      const { label, value, link } = item;
      return m(StatBox, {
        label,
        value,
        link,
      });
    }));
  },
};
