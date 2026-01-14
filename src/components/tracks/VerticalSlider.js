import './VerticalSlider.css';
import {Component} from "react";
import PropTypes from "prop-types";

// This component will be used to control the volume of the audio
// It will be a vertical slider that will control the volume of the audio
// It will be used in the MixerBoard component
// Bottom is lowest volume and top is highest volume

class VerticalSlider extends Component {
  static propTypes = {
    volume: PropTypes.number,
    setComponentVolume: PropTypes.func,
  }

  constructor(props) {
    super(props);

    this.state = {
      muteButtonClassName: this.props.mute ? 'd-none' : '',
      muteOffButtonClassName: this.props.mute ? '' : 'd-none',
    };
    
    this.timeoutIdForVolume = null;
    this.timeoutIdForPan = null;

    this.handleMuteClick = this.handleMuteClick.bind(this);
    this.handlePanChange = this.handlePanChange.bind(this);
    this.handleSliderChange = this.handleSliderChange.bind(this);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.mute !== prevProps.mute) {
      this.setState({
        muteButtonClassName: this.props.mute ? 'd-none' : '',
        muteOffButtonClassName: this.props.mute ? '' : 'd-none',
      });
    }
  }

  handleSliderChange(event) {
    if(this.timeoutIdForVolume) {
      clearTimeout(this.timeoutIdForVolume);
    }
    this.timeoutIdForVolume = setTimeout(() => {
      this.props.setComponentVolume(parseFloat(event.target.value));
    }, 400);
  }

  handlePanChange(event) {
    if(this.timeoutIdForPan) {
      clearTimeout(this.timeoutIdForPan);
    }
    this.timeoutIdForPan = setTimeout(() => {
      this.props.setComponentPan(this.props.component, parseInt(event.target.value,10) / 100.0);
    }, 400);
  }

  handleMuteClick() {
    this.props.setComponentMute(this.props.component);
  }

  render() {
    return (
      <div className="vertical-slider">
        <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            defaultValue={this.props.volume}
            className="vertical-slider"
            id={this.props.component}
            onChange={this.handleSliderChange}
        />
      </div>
    );
  }
}

export default VerticalSlider;