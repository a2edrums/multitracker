import React from 'react';
import { Badge, Button, ButtonGroup } from 'react-bootstrap';
import { FaPlay, FaPause, FaStop, FaCircle, FaHeadphones } from 'react-icons/fa';
import { formatTime } from '../../utils/timeUtils.js';
import Metronome from './Metronome.js';

const TransportControls = ({
  isPlaying,
  currentTime,
  onPlay,
  onPause,
  onStop,
  onRecord,
  isRecording = false,
  isMonitoring = false,
  onMonitorToggle,
  armedTrackCount = 0,
  onRecordError,
  // Metronome props
  bpm = 120,
  isMetronomeOn = false,
  onMetronomeToggle,
  onBpmChange
}) => {
  const hasArmedTracks = armedTrackCount > 0;

  const handleRecordClick = () => {
    if (!hasArmedTracks) {
      if (onRecordError) {
        onRecordError('Arm at least one track to record');
      }
      return;
    }
    onRecord();
  };

  return (
    <div className="studio-transport d-flex align-items-center justify-content-between">
      <ButtonGroup>
        <Button
          variant={isMonitoring ? 'success' : 'outline-light'}
          className="studio-button"
          onClick={onMonitorToggle}
        >
          <FaHeadphones />
        </Button>

        <Button
          variant="outline-light"
          className="studio-button btn-record"
          onClick={handleRecordClick}
          disabled={isPlaying}
          style={!hasArmedTracks && !isRecording ? { opacity: 0.5 } : undefined}
        >
          <FaCircle className={isRecording ? 'text-danger' : ''} />
          {hasArmedTracks && (
            <Badge
              bg="danger"
              pill
              className="ms-1"
              style={{ fontSize: '0.65em', verticalAlign: 'top' }}
            >
              {armedTrackCount}
            </Badge>
          )}
        </Button>

        <Button
          variant="outline-light"
          className="studio-button btn-play"
          onClick={isPlaying ? onPause : onPlay}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </Button>

        <Button
          variant="outline-light"
          className="studio-button"
          onClick={onStop}
        >
          <FaStop />
        </Button>
      </ButtonGroup>

      <div className="time-display">
        <span className="h5 mb-0">{formatTime(currentTime)}</span>
      </div>

      <Metronome
        bpm={bpm}
        isPlaying={isMetronomeOn}
        onToggle={onMetronomeToggle}
        onBpmChange={onBpmChange}
      />
    </div>
  );
}


export default TransportControls;