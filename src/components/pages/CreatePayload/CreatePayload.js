import React from 'react';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import {Step1SelectOS} from './Step1SelectOS';
import {Step2SelectPayloadType} from './Step2SelectPayloadType';
import {Step3SelectCommands} from './Step3SelectCommands';
import {Step4C2Profiles} from './Step4C2Profiles';
import {Step5Build} from './Step5Build';

function getSteps(){
    return ['Select Target OS', 'Payload Type', 'Select Commands', 'Select C2 Profiles', 'Build']
}

export function CreatePayload(props){
    const [payload, setPayload] = React.useState({}); 
    const [activeStep, setActiveStep] = React.useState(0);
    const getStepContent = (step) => {
          switch (step) {
            case 0:
              return <Step1SelectOS buildOptions={payload} prevData={payload[0]} finished={handleStepData} canceled={cancelStep} first={true} last={false}/>;
            case 1:
              return <Step2SelectPayloadType buildOptions={payload[0]} prevData={payload[1]} finished={handleStepData} canceled={cancelStep} first={false} last={false}/>;
            case 2:
              return <Step3SelectCommands buildOptions={payload[1]} prevData={payload[2]} finished={handleStepData} canceled={cancelStep} first={false} last={false} />;
            case 3:
              return <Step4C2Profiles buildOptions={payload[1]} prevData={payload[3]} finished={handleStepData} canceled={cancelStep} first={false} last={false} />;
            case 4:
              return <Step5Build buildOptions={payload} canceled={cancelStep} first={false} last={true} startOver={startOver} />;
            default:
              return 'Unknown step';
          }
        }
      const handleStepData = (stepData) => {
        setPayload({...payload, [activeStep]: stepData}); 
        handleNext();
      }
      const cancelStep = () => {
        handleBack();
      }
      React.useEffect( () => {
        startOver();
      }, [props.location.key])
      const steps = getSteps();

      const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
      };

      const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
      };
      const startOver = () => {
        setActiveStep(0);
      }

    return (
        <div style={{height: "calc(95vh)"}}>
            <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label, index) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            {getStepContent(activeStep)}
        </div>
    );
} 
