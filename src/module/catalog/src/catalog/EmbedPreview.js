import TitleDialog from 'commons/dialog/TitleDialog';
import ListDialogMixin from 'commons/list/common/ListDialogMixin';
import htmlUtil from 'commons/util/htmlUtil';
import escaEmbedPreview from 'catalog/nls/escaEmbedPreview.nls';
import declare from 'dojo/_base/declare';
import './escaEmbedPreview.css';

export default declare([TitleDialog.ContentNLS, ListDialogMixin], {
  maxWidth: 800,
  nlsBundles: [{ escaEmbedPreview }],
  nlsHeaderTitle: 'embedPreviewHeader',
  includeFooter: false,
  bid: 'escaEmbedPreview',
  postCreate() {
    this.dialog.containerNode.style.height = '100%';
    this.dialog.containerNode.innerHTML = '';
    this.inherited(arguments);
  },
  open(params) {
    this.inherited(arguments);
    if (this.iframe) {
      this.iframe.parentNode.removeChild(this.iframe);
      this.iframe = null;
    }
    this.iframe = htmlUtil.create('iframe', {
      class: `${this.bid}__embedCode`,
    }, this.dialog.containerNode);
    const embedCode = params.embededCode;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${embedCode}</body></html>`;
    setTimeout(() => {
      this.iframe.contentWindow.document.open();
      this.iframe.contentWindow.document.write(html);
      this.iframe.contentWindow.document.close();
    }, 1);
    this.dialog.show();
  },
});
