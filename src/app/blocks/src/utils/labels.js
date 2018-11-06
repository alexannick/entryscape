import registry from 'commons/registry';

    const rdfutils = registry.get("rdfutils");
    const localize = registry.get("localize");
    const es = registry.get('entrystore');
    const cache = es.getCache();

    export default (values, valueType = 'uri') => {
      const val2choice = registry.get("itemstore_choices");
      const val2named = registry.get("blocks_named");

      const toLoad = {};
        const labels = {};
        const getLabel = (value) => {
            const named = val2named[value];
            const choice = val2choice[value];
            const entryArr = cache.getByResourceURI(value);
            if (named) {
              return localize(named);
            } else if (choice) {
                return localize(choice.label);
            } else if (entryArr.length > 0) {
                return rdfutils.getLabel(entryArr[0]);
            }
        };
        values.forEach(function(value) {
            let label = getLabel(value);
            if (label) {
                labels[value] = label;
            } else if (valueType === 'uri') {
                toLoad[value] = true;
            } else {
                labels[value] = value;
            }
        });
        let toLoadArr = Object.keys(toLoad);
        if (toLoadArr.length === 0) {
            return new Promise((resolve) => resolve(labels));
        }
        return es.newSolrQuery().resource(toLoadArr).list().forEach(function(entry) {
            labels[entry.getResourceURI()] = rdfutils.getLabel(entry);
        }).then(function() {
            return labels;
        });
    }
