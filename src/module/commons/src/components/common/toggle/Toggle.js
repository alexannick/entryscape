import m from 'mithril';

export default () => ({
  view(vnode) {
    const {
      toggleState = false,
      onToggle,
      title,
      isEnabled = true,
    } = vnode.attrs;
    const disabledClass = isEnabled ? '' : 'disabled';
    const toggledOnClass = toggleState ? '' : 'fa-rotate-180';

    return (
      <button
        class={`fa fa-toggle-on fa-lg  btn--publish ${disabledClass} ${toggledOnClass}`}
        title={title}
        onclick={isEnabled ? onToggle : undefined}
      ></button>
    );
  },
});
