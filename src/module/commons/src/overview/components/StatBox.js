import m from 'mithril';
/**
 *
 * A box with a value and label (used for stats purposes mainly). Eg 25 terms, 2 collections)
 */
const StatBox = {
  view(vnode) {
    return m('.row', vnode.attrs.bList.map((item) => {
      const { label, value, link } = item;
      return m('.col-md-6 escoOverview__statBox', [
        m('a', { href: link }, [
          m('p', { class: 'escoOverview__statCount' }, value),
        ]),
        m('label', { class: 'escoOverview__statLabel' }, label),
      ]);
    }));
  },
};

export { StatBox };
export default StatBox;