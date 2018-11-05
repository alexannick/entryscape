import merge from 'commons/merge';
import adminConfig from 'admin/config/config';
import catalogConfig from 'catalog/config/config';
import workbenchConfig from 'workbench/config/config';

const mergedConfig = merge(adminConfig, catalogConfig, workbenchConfig, {
  entryscape: {
    static: {
      url: 'https://static.entryscape.com/',
      app: 'suite',
      version: 'latest',
    }
  },
  theme: {
    appName: 'Registry',
    showModuleNameInHeader: true,
    startBanner: {
      header: {
        en: 'EntryScape Registry',
        sv: 'EntryScape Registry',
        de: 'Register offener Verwaltungsdaten',
      },
      text: {
        en: 'EntryScape Registry is a supplement to an open data portal. Here are tools that are helpful for organizations that want to make available its open data.',
        sv: 'EntryScape Registry är ett komplement till en öppen dataportal. Här finns verktyg som är till hjälp för organisationer som vill tillgängliggöra sina öppna data.',
        de: 'Hier finden Sie die Werkzeuge für Behörden, die Daten der öffentlichen Verwaltung zur Weiterverwendung durch Dritte bereitstellen wollen.',
      },
      icon: '',
      details: {
        buttonLabel: {en: 'Get started', sv: 'Kom igång', de: 'Anfangen'},
        header: {en: 'Getting started guide', sv: 'Kom-igång guide', de: 'Erste Schritte Anleitung'},
        path: '',
      },
    },
  },
  locale: {
    fallback: 'en',
    supported: [
      {
        lang: 'de', flag: 'de', label: 'Deutsch', labelEn: 'German',
      },
      {
        lang: 'en', flag: 'gb', label: 'English', labelEn: 'English',
      },
      {
        lang: 'sv', flag: 'se', label: 'Svenska', labelEn: 'Swedish',
      },
    ],
  },
  itemstore: {
    bundles: [
//        'registry/templates/faq',
    ],
  },
  registry: {
    validationProfiles: [
      {name: 'dcat_ap_se', label: {en: 'Swedish DCAT-AP profile'}},
      {name: 'dcat_ap_dk', label: {en: 'Danish DCAT-AP profile'}},
    ],
    validationTypes: [
      'dcat:Catalog',
      'dcat:Dataset',
      'dcat:Distribution',
      'vcard:Kind',
      'vcard:Individual',
      'vcard:Organization',
      'foaf:Agent'],
    mandatoryValidationTypes: [
      'dcat:Catalog',
      'dcat:Dataset',
    ],
    recipes: ['DCAT', 'INSPIRE', 'CKAN'],
  },
  catalog: {
    catalogLimit: 1,
    datasetLimit: 3,
    fileuploadDistribution: false,
    catalogCollaboration: false,
    excludeEmptyCatalogsInSearch: true,
  },
  entitytypes: {
    question: {
      label: {en: 'Question'},
      rdfType: 'http://schema.org/Question',
      template: 'faq:Question',
      includeInternal: true,
      inlineCreation: true,
      split: true,
      publishable: true,
      faClass: 'question',
      contentviewers: [{
        name: 'answerview',
        relation: 'http://schema.org/acceptedAnswer',
        linkedEntityType: 'answer',
      }],
    },
    answer: {
      label: {en: 'Answer'},
      rdfType: 'http://schema.org/Answer',
      template: 'faq:Answer',
      includeInternal: true,
      inlineCreation: true,
      dependant: true,
    },
  },
  contentviewers: {
    answerview: {
      class: 'LinkedEntriesView', // TODO
      label: {en: 'Answer', sv: 'Answer'},
    },
  },
}, __entryscape_config);


export default mergedConfig;