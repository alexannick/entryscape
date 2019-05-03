import m from 'mithril';
import { createSetState } from 'commons/util/util';
import Map from 'commons/rdforms/choosers/components/Map';
import BarChartTime from 'catalog/statistics/components/BarChartTime';
import { i18n } from 'esi18n';
import escaVisualizationNLS from 'catalog/nls/escaVisualization.nls';
import TypeSelector from 'catalog/visualization/components/TypeSelector';
import VisualizationChart from 'catalog/visualization/components/VisualizationChart';
import AxisSelector from 'catalog/visualization/components/AxisSelector';
import './index.scss';




export default (vnode) => {
  const state = {
  };

  const setState = createSetState(state);

  return {
    view(vnode) {
      const escaVisualization = i18n.getLocalization(escaVisualizationNLS);


      return (
        <div className='visualizations__sandbox'>
          <h3>{escaVisualization.vizSandboxTitle}</h3>
          <div class="viz__wrapper">
          
            <div class="vizOptions__wrapper">
              <section class="datasets__wrapper">
                <header>
                  <h4>{escaVisualization.vizSandboxDatasetTitle}</h4>
                  <button alt="Add dataset" class="btn btn-primary btn--add btn-fab btn-raised"><span class="fa fa-plus"></span></button>
                </header>
                <div class="datasetSelector">
                  <select class="form-control">
                    <option>Dataset 1</option>
                  </select>
                  <button class="btn btn-secondary fas fa-times"></button>
                </div>
                
              </section>

              <section class="vizTypes__wrapper">
                <header>
                  <h4>{escaVisualization.vizSandboxTypeTitle}</h4>
                </header>
                <TypeSelector
                  type={state.chartType}
                />
              </section>

              <section class="axesOperations__wrapper">
                <header>
                  <h4>{escaVisualization.vizSandboxAxesTitle}</h4>
                </header>

                <AxisSelector></AxisSelector>
              </section>
            </div>

            <section class="vizGraph__wrapper">
              <div>
                <VisualizationChart></VisualizationChart>
                <img src="https://static.vaadin.com/directory/user35550/screenshot/file8494337878231358249_15061520778722017-09-2309_33_26-VaadinChart.jsAddon.png"></img>
              </div>
            </section>

          </div>
          <section class="vizNotes__wrapper">
            <div class="vizNotes__errors">

            </div>
            <div class="vizNotes__help">
              <p>{escaVisualization.vizSandboxHelpDataset}</p>
              <p>{escaVisualization.vizSandboxHelpType}</p>
              <p>{escaVisualization.vizSandboxHelpAxes}</p>
            </div>
          </section>

          <Map
            value={[
              'POINT(30 10)',
              'POINT(31 10)',
            ]}
          />
          {/* <BarChartTime
            data={{
              series: [{
                name: '',
                data: [{}],
              }],
            }}
          />
          */}
        </div>
      );
    },
  };
};
