import React from 'react';
import '../Panel.css';
import './TestingPanel.css';

import TestingManager from 'builder/TestingManager.js';
import TestList from './components/TestList.js';

class TestingPanel extends React.Component
{
  constructor(props)
  {
    super(props);

    this.container = React.createRef();

    this.state = {
      errorCheckMode: this.props.tester.getErrorCheckMode()
    };

    this.onChangeErrorCheckMode = this.onChangeErrorCheckMode.bind(this);
  }

  onChangeErrorCheckMode(e)
  {
    const value = e.target.value;
    const tester = this.props.tester;
    const machineBuilder = this.props.machineBuilder;
    tester.setErrorCheckMode(value);

    //HACK: this should automatically be updated by testing manager on set error check mode
    if (!tester.shouldCheckError)
    {
      machineBuilder.machineErrorChecker.clear();
    }
    else
    {
      machineBuilder.onGraphChange(machineBuilder.graph);
    }

    this.setState({errorCheckMode: value});
  }

  render()
  {
    const machineBuilder = this.props.machineBuilder;
    const tester = this.props.tester;

    return <div className="panel-container" id="testing" ref={ref=>this.container=ref}>
      <div className="panel-title">
        <h1>{I18N.toString("TESTING_PANEL_TITLE")}</h1>
      </div>

      <div className="panel-content">
        <TestList machineBuilder={machineBuilder} tester={tester}/>
        <hr />

        <div id="test-errorcheck">
          <label>{I18N.toString("ERROR_CHECK_LABEL")}</label>
          <select className="panel-select"
            value={this.state.errorCheckMode}
            onChange={this.onChangeErrorCheckMode}>
            <option value={TestingManager.NO_ERROR_CHECK}>{I18N.toString("NO_ERROR_CHECK")}</option>
            <option value={TestingManager.DELAYED_ERROR_CHECK}>{I18N.toString("DELAYED_ERROR_CHECK")}</option>
            <option value={TestingManager.IMMEDIATE_ERROR_CHECK}>{I18N.toString("IMMEDIATE_ERROR_CHECK")}</option>
          </select>
        </div>
        <div className="panel-checkbox">
          <input id="test-step" type="checkbox" onChange={(e) => {
            //HACK: this needs to default to tester.getStepByStepMode first
            tester.setStepByStepMode(e.target.checked);
            if (tester.getStepByStepMode())
            {
              if (tester.testMode.isStarted()) tester.testMode.onStop();
              tester.testMode.onStart();
            }
            else
            {
              if (tester.testMode.isStarted()) tester.testMode.onStop();
            }
          }}/>
          <label htmlFor="test-step">{I18N.toString("STEP_BY_STEP_MODE")}</label>
        </div>
        <div className="panel-checkbox">
          <input id="test-closure" type="checkbox" disabled="true"/>
          <label htmlFor="test-closure">{I18N.toString("TRANSITION_BY_CLOSURE")}</label>
        </div>
      </div>

      <div className="panel-bottom"></div>
    </div>;
  }
}

export default TestingPanel;
