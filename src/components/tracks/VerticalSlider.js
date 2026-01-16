import './VerticalSlider.css';
import {Component} from "react";
import PropTypes from "prop-types";

class VerticalSlider extends Component {
  static propTypes = {
    value: PropTypes.number,
    onChange: PropTypes.func,
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    disabled: PropTypes.bool,
  }

  static defaultProps = {
    min: 0,
    max: 1,
    step: 0.01,
    disabled: false,
  }

  constructor(props) {
    super(props);
    this.timeoutId = null;
    this.handleSliderChange = this.handleSliderChange.bind(this);
  }

  handleSliderChange(event) {
    if(this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      this.props.onChange(parseFloat(event.target.value));
    }, 50);
  }

  render() {
    return (
      <div className="vertical-slider">
        <input
            type="range"
            min={this.props.min}
            max={this.props.max}
            step={this.props.step}
            value={this.props.value}
            disabled={this.props.disabled}
            className="vertical-slider"
            onChange={this.handleSliderChange}
        />
      </div>
    );
  }
}

export default VerticalSlider;