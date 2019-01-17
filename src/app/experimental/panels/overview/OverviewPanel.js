import React from 'react';
import Style from './OverviewPanel.css';

import PanelSection from 'experimental/panels/PanelSection.js';

import StateListView from './states/StateListView.js';
import AlphabetListView from './alphabet/AlphabetListView.js';
import TransitionTable from './transitions/TransitionTable.js';
import TransitionFunction from './transitions/TransitionFunction.js';

class OverviewPanel extends React.Component
{
  constructor(props)
  {
    super(props);
  }

  //Override
  render()
  {
    const drawer = this.props.drawer;
    const currentModule = this.props.currentModule;
    const graphController = currentModule.getGraphController();
    const machineController = currentModule.getMachineController();
    const machineBuilder = machineController.getMachineBuilder();

    const drawerFull = drawer.isDrawerFullscreen();

    return (
      <div id={this.props.id}
        className={Style.panel_container +
          " " + this.props.className}
        style={this.props.style}>
        <div className={Style.panel_title}>
          <h1>{OverviewPanel.TITLE}</h1>
        </div>
        <div className={Style.panel_content}>
          <PanelSection title={"States"} initial={true} full={drawerFull}>
            <StateListView graphController={graphController}/>
          </PanelSection>
          <PanelSection title={"Alphabet"} initial={true} full={drawerFull}>
            <AlphabetListView machineController={machineController}/>
          </PanelSection>
          <div className={Style.panel_divider}></div>
          <PanelSection title={"Transition Chart"} full={drawerFull}>
            <TransitionFunction machineBuilder={machineBuilder}/>
          </PanelSection>
          <PanelSection title={"Transition Table"} full={drawerFull}>
            <TransitionTable machineBuilder={machineBuilder}/>
          </PanelSection>
        </div>
      </div>
    );
  }
}
Object.defineProperty(OverviewPanel, 'TITLE', {
  get: function() { return I18N.toString("component.overview.title"); }
});

export default OverviewPanel;
