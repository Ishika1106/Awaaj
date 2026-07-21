'use client';

import React, { useState, useEffect } from 'react';
import { InputForm } from '@/components/InputForm';
import Share from '@/components/Share';
import HorizontalLinearStepper from '@/components/MultiStep';
import ImageGen from '@/components/ImageGen';

function Page() {
  const [resImage, setResImage] = useState<string | null>(null);
  const [resText, setText] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (resText) {
      setActiveStep(1);
    }
  }, [resText]);

  useEffect(() => {
    if (resImage) {
      setActiveStep(2);
    }
  }, [resImage]);

  useEffect(() => {
    if (shared) {
      setActiveStep(3);
    }
  }, [shared]);

  const stepContent = [
    <InputForm key="step1" setText={setText} setCoordinates={setCoordinates} />,
    <ImageGen key="step2" text={resText || ''} setResImage={setResImage} />,
    <Share
      key="step3"
      imageURL={resImage || ''}
      setShared={setShared}
      resText={resText || ''}
      coordinates={coordinates}
    />,
  ];

  const showHeader = activeStep < 3;

  return (
    <div className="flex-1 bg-gradient-to-b from-orange-50/50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {showHeader && (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Create Post
            </h1>
            <p className="text-gray-500 mb-6">
              Share your story safely. Your identity stays protected.
            </p>
          </>
        )}
        {showHeader ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8">
            <HorizontalLinearStepper
              activeStep={activeStep}
              stepContent={stepContent}
              coordinates={coordinates}
            />
          </div>
        ) : (
          <HorizontalLinearStepper
            activeStep={activeStep}
            stepContent={stepContent}
            coordinates={coordinates}
          />
        )}
      </div>
    </div>
  );
}

export default Page;
