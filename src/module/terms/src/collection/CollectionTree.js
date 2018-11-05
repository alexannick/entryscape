import CollectionTreeModel from './CollectionTreeModel';
import registry from 'commons/registry';
import Tree from 'commons/tree/Tree';
import htmlUtil from 'commons/util/htmlUtil';
import jquery from 'jquery';
import declare from 'dojo/_base/declare';
import 'jstree';

const ns = registry.get('namespaces');

export default declare([Tree], {
  showEntry(entry, collectionEntry) {
    // this.inherited(arguments);
    if (this.model) {
      jquery(this.treeNode).jstree('destroy');
      this.model.destroy();
    }
    this.treeNode = htmlUtil.create('div', null, this.domNode);
    this.model = new CollectionTreeModel({
      membershipToRootProperty: ns.expand('skos:inScheme'),
      fromRootProperty: ns.expand('skos:hasTopConcept'),
      toRootProperty: ns.expand('skos:topConceptOf'),
      toChildProperty: ns.expand('skos:narrower'),
      toParentProperty: ns.expand('skos:broader'),
      rootEntry: entry,
      domNode: this.treeNode,
      collectionEntry,
    });
  },
});