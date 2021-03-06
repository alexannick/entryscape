export default {
  itemstore: {
    choosers: [
      'SkosChooser',
    ],
  },
  terms: {
    conceptTemplateId: 'skosmos:concept',
  },
  entitytypes: {
    concept: {
      label: { en: 'Concept' },
      rdfType: ['http://www.w3.org/2004/02/skos/core#Concept'],
      module: 'terms',
      template: 'skosmos:concept',
      includeInternal: true,
      includeFile: false,
      includeLink: true,
      inlineCreation: false,
      faClass: 'cube',
    },
    conceptcollection: {
      label: { en: 'Collection' },
      rdfType: ['http://www.w3.org/2004/02/skos/core#Collection'],
      module: 'terms',
      template: 'skosmos:conceptScheme',
      includeInternal: true,
      includeFile: false,
      includeLink: true,
      inlineCreation: false,
      faClass: 'cubes',
    },
    conceptscheme: {
      label: { en: 'Terminology' },
      rdfType: ['http://www.w3.org/2004/02/skos/core#ConceptScheme'],
      module: 'terms',
      template: 'skosmos:conceptScheme',
      includeInternal: true,
      includeFile: false,
      includeLink: true,
      inlineCreation: false,
    },
  },
};
