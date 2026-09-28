import { useEffect, useState } from 'react';
import { Joyride, Step, EventData, STATUS } from 'react-joyride';

export default function ProductTour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Only run the tour once per user, stored in localStorage
    const hasSeenTour = localStorage.getItem('unveil_tour_seen');
    if (!hasSeenTour) {
      // Small delay to ensure DOM is ready and data is loaded
      setTimeout(() => setRun(true), 2000);
    }
  }, []);

  const steps: Step[] = [
    {
      target: '.tour-search',
      content: 'Start your investigation here. Type a dark web handle, like "ShadowFox", and press enter to trace their identity.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '.tour-canvas',
      content: 'The canvas visualizes the actor network. Nodes are dark web aliases, and threads are evidence-backed links between them.',
      placement: 'center',
    },
    {
      target: '.tour-timeline',
      content: 'The timeline tracks all events chronologically. You can expand it to see migration patterns between different aliases over time.',
      placement: 'top',
    },
  ];

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      localStorage.setItem('unveil_tour_seen', 'true');
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      onEvent={handleJoyrideCallback}
      styles={{
        tooltipContainer: {
          fontFamily: '"SF Mono", "Fira Code", monospace',
          fontSize: '12px',
          textAlign: 'left',
        },

        buttonPrimary: {
          backgroundColor: '#8B4B3B',
          fontFamily: '"Cinzel Decorative", serif',
          fontSize: '12px',
          borderRadius: '2px',
        },

        buttonBack: {
          color: '#5B7C99',
          fontFamily: '"Cinzel Decorative", serif',
          fontSize: '12px',
        },

        buttonSkip: {
          color: '#5B7C99',
          fontFamily: '"Cinzel Decorative", serif',
          fontSize: '12px',
        }
      }}
      options={{
        showProgress: true,
        arrowColor: '#26241F',
        backgroundColor: '#26241F',
        overlayColor: 'rgba(0, 0, 0, 0.7)',
        primaryColor: '#8B4B3B',
        textColor: '#E9E2D0',
        zIndex: 1000,
        buttons: ['back', 'close', 'primary', 'skip']
      }} />
  );
}
