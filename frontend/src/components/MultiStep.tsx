'use client';
import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import { CheckCircleIcon, Home, Shield } from 'lucide-react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Link from 'next/link';
import NearbyPlaces from './NearbyPlaces';

const awaajTheme = createTheme({
  palette: {
    primary: {
      main: '#ea580c',
    },
    secondary: {
      main: '#dc2626',
    },
  },
});

const steps = [
  'Fill out the form',
  'Review and Generate Image',
  'Submit post',
  'Submission complete',
];

interface HorizontalLinearStepperProps {
  activeStep: number;
  stepContent: React.ReactNode[];
  coordinates?: { lat: number; lng: number } | null;
}

export default function HorizontalLinearStepper({
  activeStep,
  stepContent,
  coordinates,
}: HorizontalLinearStepperProps) {
  return (
    <ThemeProvider theme={awaajTheme}>
      <div className="max-w-4xl mx-auto w-full mt-6">
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {activeStep >= steps.length - 1 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              mt: 6,
              mb: 4,
            }}
          >
            <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mb-6">
              <CheckCircleIcon style={{ fontSize: 48, color: '#ea580c' }} />
            </div>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', textAlign: 'center' }}>
              Thank You
            </Typography>
            <Typography variant="h6" sx={{ color: '#ea580c', fontWeight: 600, mt: 1, textAlign: 'center' }}>
              We have received your report.
            </Typography>
            <Typography variant="body1" sx={{ color: '#6b7280', mt: 2, maxWidth: 480, textAlign: 'center', lineHeight: 1.6 }}>
              Our team will review your submission and get back to you as soon
              as possible. Your safety and privacy are our top priority.
            </Typography>

            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>

            <div className="mt-8 w-full border-t border-gray-100 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-orange-600" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#374151' }}>
                  Need Immediate Help?
                </Typography>
              </div>
              <Typography variant="body2" sx={{ color: '#6b7280', mb: 3, textAlign: 'center' }}>
                View NGOs, police stations, hospitals and shelters near your location.
              </Typography>
              <NearbyPlaces coordinates={coordinates} />
            </div>
          </Box>
        ) : (
          <Box sx={{ mt: 2, mb: 1 }}>{stepContent[activeStep]}</Box>
        )}
      </div>
    </ThemeProvider>
  );
}
