import {i18n} from 'esi18n';
import DOMUtil from '../util/htmlUtil';
import TitleDialog from './TitleDialog';
import declare from 'dojo/_base/declare';
import superagent from 'superagent';

const getContentHTML = path => superagent.get(path).set('Accept', 'text/html');

export default declare([TitleDialog], {
  includeFooter: false,
  maxWidth: 800,
  postCreate() {
    this.inherited('postCreate', arguments);
    this.mainNode = DOMUtil.create('div', null, this.containerNode);
  },
  getContentHTML(path) {
    return superagent.get(path).set('Accept', 'text/html');
  },
  show(path, title, callback) {
    if (!path || path === '') {
      const errorTxt = 'No path given to acknowledge text';
      console.error(errorTxt);
      return Promise.reject(new Error(errorTxt));
    }
    this.inherited(arguments);
    const p = new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        reject(new Error(`Timeout when loading file: ${path}`));
      }, 500);
      this.titleNode.innerHTML = title;
      const containerNode = this.mainNode;
      const language = i18n.getLocale() !== 'en' ? `_${i18n.getLocale()}` : '';
      this.getContentHTML(`${path}_${language}.html`)
        .then(res => {
          containerNode.innerHTML = res.body;
          resolve(true);
          clearTimeout(t);
        });
    }, () => {
      this.getContentHTML(`${path}.html`)
        .then(res => {
          containerNode.innerHTML = res.body;
          resolve(true);
          clearTimeout(t);
        });
    });
    if (callback) {
      p.then(callback);
    }
    return p;
  }
  ,
})
;