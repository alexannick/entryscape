import ListDialogMixin from 'commons/list/common/ListDialogMixin';
import registry from 'commons/registry';
import { isUri } from 'commons/util/util';
import _TemplatedMixin from 'dijit/_TemplatedMixin';
import _WidgetBase from 'dijit/_WidgetBase';
import declare from 'dojo/_base/declare';
import { NLSMixin } from 'esi18n';
import { renderingContext } from 'rdforms';
import esteScheme from 'terms/nls/esteScheme.nls';
import template from './CreateTerminologyTemplate.html';

export default declare([_WidgetBase, _TemplatedMixin, ListDialogMixin, NLSMixin.Dijit], {
  templateString: template,
  nlsBundles: [{ esteScheme }],
  // * to be removed in nls * nlsHeaderTitle: 'createSchemeHeader',
  // * to be removed in nls * nlsFooterButtonLabel: 'createSchemeButton',

  postCreate() {
    this.inherited(arguments);
    this.schemeName.addEventListener('keyup', this.checkValidInfoDelayed.bind(this));
    this.schemeNamespace.addEventListener('keyup', this.checkValidInfoDelayed.bind(this));
  },
  open() {
    if (this.list.onLimit()) {
      console.log('Limit hit!'); // TODO what happens here?
    }
  },
  checkValidInfoDelayed() {
    if (this.delayedCheckTimout != null) {
      clearTimeout(this.delayedCheckTimout);
    }
    this.delayedCheckTimeout = setTimeout(this.checkValidInfo.bind(this), 300);
  },
  checkValidInfo() {
    // check validity of name input
    const name = this.schemeName.value;
    if (name === '') {
      this.dialog.lockFooterButton();
      return;
    }

    // check validity of namespace input
    const namespace = this.schemeNamespace.value;
    if (namespace !== '' && !isUri(namespace)) {
      this.dialog.lockFooterButton();
      return;
    }

    this.dialog.unlockFooterButton();
  },

  /**
   * Clears and resets the form
   *
   * @returns {undefined}
   */
  clearFields() {
    this.schemeName.value = '';
    this.schemeDesc.value = '';
  },

  clear() {
    this.list.getView().clearSearch();
    this.clearFields();
  },
  footerButtonAction() {
    let group;
    let hc;
    const name = this.schemeName.value;
    const desc = this.schemeDesc.value;
    const namespace = this.schemeNamespace.value;

    if (name === '') {
      // TODO remove this nls string as it will never happen (checkValidInfo method above)
      return this.NLSLocalized0.insufficientInfoToCreateScheme;
    }

    /** @type {entrystore-js/Context} */
    let context;

    const store = registry.get('entrystore');
    return store.createGroupAndContext()
      .then((entry) => {
        group = entry;
        hc = entry.getResource(true).getHomeContext();

        context = store.getContextById(hc);
        return entry;
      })
      .then(() => {
        // create an entry with a preset resource uri
        const conceptSchemeEntry = context.newLink(namespace);
        const resourceURI = conceptSchemeEntry.getResourceURI();
        const md = conceptSchemeEntry.getMetadata();
        const lang = renderingContext.getDefaultLanguage();
        md.add(resourceURI, 'rdf:type', 'skos:ConceptScheme');
        md.addL(resourceURI, 'dcterms:title', name, lang);
        if (desc) {
          md.addL(resourceURI, 'dcterms:description', desc, lang);
        }
        if (namespace) { // void:uriSpace is actually a URL literal
          md.addL(resourceURI, 'void:uriSpace', namespace);
        }
        return conceptSchemeEntry.commit();
      })
      .then((skos) => {
        context.getEntry().then((ctxEntry) => {
          const hcEntryInfo = ctxEntry.getEntryInfo();
          hcEntryInfo.getGraph().add(ctxEntry.getResourceURI(),
            'rdf:type', 'esterms:TerminologyContext');
          // TODO remove when entrystore is changed so groups have read access
          // to homecontext metadata by default.
          // Start fix with missing metadata rights on context for group
          const acl = hcEntryInfo.getACL(true);
          acl.mread.push(group.getId());
          hcEntryInfo.setACL(acl);
          // End fix
          return hcEntryInfo.commit().then(() => {
            if (!registry.get('hasAdminRights')) {
              this.list.entryList.setGroupIdForContext(context.getId(), group.getId());
            }
            const row = this.list.getView().addRowForEntry(skos);
            this.list.rowMetadataUpdated(row);
            this.clearFields();
            const userEntry = registry.get('userEntry');
            userEntry.setRefreshNeeded();
            return userEntry.refresh();
          });
        });
      });
  },
});
