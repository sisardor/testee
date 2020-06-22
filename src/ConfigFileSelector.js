import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

class ConfigFileForum extends React.Component {
  render() {
    console.log(this.props);

    let options = this.props.configs.map(item => <option key={item} value={item}>{item}</option>)
    return (
      <div>
        <div className="uk-margin">
          {/* Select config file: */}
          <select className="uk-select" value={this.props.selectedConfig} onChange={this.props.onConfigSelect}>
            <option value="" disabled>-- Select config file -- </option>
            {options}
          </select>
        </div>
      </div>
    )
  }
}

export default ConfigFileForum;