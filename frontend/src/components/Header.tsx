'use client';
import Image from 'next/image';
import React, { useState } from 'react';
import Link from 'next/link';
import hero from '../assets/img4.jpeg';
import {
  Shield,
  Lock,
  Eye,
  HeartHandshake,
  ArrowRight,
  ChevronDown,
  FileText,
  ImageIcon,
  Share2,
  UserCheck,
} from 'lucide-react';
import { FlipWords } from '@/components/ui/flip-words';
import { Timeline } from '@/components/ui/timeline';

const features = [
  {
    icon: Shield,
    title: 'Safe Reporting',
    desc: 'Securely report incidents with your identity fully protected through encrypted submissions.',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    icon: Lock,
    title: 'Steganography Protection',
    desc: 'Messages hidden inside images — invisible to everyone except authorized admins.',
    gradient: 'from-red-500 to-orange-500',
  },
  {
    icon: Eye,
    title: 'Anonymous Sharing',
    desc: 'Share on social media without revealing any sensitive content.',
    gradient: 'from-amber-500 to-yellow-500',
  },
  {
    icon: HeartHandshake,
    title: 'Get Support',
    desc: 'Admin dashboard tracks reports and nearby resources so help can reach you quickly.',
    gradient: 'from-orange-500 to-red-500',
  },
];

const timelineData = [
  {
    title: 'Step 1',
    content: (
      <div>
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
          <FileText className="h-6 w-6 text-white" />
        </div>
        <h4 className="mb-2 text-base font-bold text-gray-900 md:text-lg">
          Fill the Form
        </h4>
        <p className="text-xs leading-relaxed text-gray-500 md:text-sm">
          Provide details about your situation. Your location is auto-detected
          and all data is handled with care.
        </p>
      </div>
    ),
  },
  {
    title: 'Step 2',
    content: (
      <div>
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg">
          <ImageIcon className="h-6 w-6 text-white" />
        </div>
        <h4 className="mb-2 text-base font-bold text-gray-900 md:text-lg">
          AI Generates Content
        </h4>
        <p className="text-xs leading-relaxed text-gray-500 md:text-sm">
          Our AI creates a detailed report and generates a harmless cover image
          for your story.
        </p>
      </div>
    ),
  },
  {
    title: 'Step 3',
    content: (
      <div>
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 shadow-lg">
          <Share2 className="h-6 w-6 text-white" />
        </div>
        <h4 className="mb-2 text-base font-bold text-gray-900 md:text-lg">
          Hide and Share
        </h4>
        <p className="text-xs leading-relaxed text-gray-500 md:text-sm">
          Your message is hidden inside the image using steganography. Post it
          anywhere safely.
        </p>
      </div>
    ),
  },
  {
    title: 'Step 4',
    content: (
      <div>
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
          <UserCheck className="h-6 w-6 text-white" />
        </div>
        <h4 className="mb-2 text-base font-bold text-gray-900 md:text-lg">
          Admin Responds
        </h4>
        <p className="text-xs leading-relaxed text-gray-500 md:text-sm">
          Authorized admins decode the message, review, and reach out to provide
          the help you need.
        </p>
      </div>
    ),
  },
];

const faqs = [
  {
    q: 'What is Awaaj?',
    a: 'Awaaj is a safe, anonymous platform for domestic abuse victims to report their situation. Your information is hidden inside an ordinary image using steganography, so only authorized admins can access it.',
  },
  {
    q: 'Is my identity really protected?',
    a: 'Yes. You do not need to create an account or provide personal details. Your report is embedded into an image that looks completely normal to anyone who sees it.',
  },
  {
    q: 'How does steganography work?',
    a: 'Steganography hides your report text inside the pixels of an image by making tiny changes to the color values that are invisible to the human eye. The image looks exactly the same, but contains your hidden message.',
  },
  {
    q: 'Who can see my report?',
    a: 'Only authorized admins with the proper credentials can extract and read the hidden report from the image. No one else can tell the image contains any hidden information.',
  },
  {
    q: 'Can I find nearby help?',
    a: 'After submitting your report, you can optionally search for nearby NGOs, police stations, hospitals, and shelters using your location.',
  },
  {
    q: 'What happens after I submit?',
    a: 'Your report is saved securely. An admin will review it and reach out to provide assistance. You keep the image and can share it anywhere.',
  },
];

function Header() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section className="w-full">
      {/* Hero - Full viewport background image with text overlay */}
      <div className="relative h-screen w-full overflow-hidden">
        <Image
          src={hero}
          alt="Awaaj"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4 max-w-4xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight">
              Your Voice{' '}
              <span className="bg-gradient-to-r from-orange-400 via-red-400 to-amber-400 bg-clip-text text-transparent">
                Matters
              </span>
            </h1>

            <p className="mt-6 text-white/80 text-sm sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Report domestic abuse{' '}
              <FlipWords
                words={['safely', 'anonymously', 'securely', 'privately']}
              />{' '}
              using steganography. Your story stays hidden in plain sight.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
              <Link
                href="/create-post"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 text-sm sm:text-base shadow-xl shadow-orange-600/30 hover:shadow-orange-600/50 hover:-translate-y-0.5"
              >
                Get Help Now
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center gap-2 bg-white/10 border border-white/20 hover:bg-white/20 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 text-sm sm:text-base backdrop-blur-sm"
              >
                How It Works
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-gradient-to-b from-background to-orange-50/30 py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why{' '}
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Awaaj
              </span>
              ?
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base md:text-lg">
              Every feature is designed with your safety and anonymity as the
              top priority.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="group relative bg-white rounded-2xl border border-orange-100 p-6 sm:p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    {f.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {f.desc}
                  </p>
                  <div
                    className={`absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r ${f.gradient} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div
        id="how-it-works"
        className="relative overflow-hidden bg-gradient-to-b from-orange-50/40 to-white py-20 sm:py-28"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">
              How It{' '}
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Works
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-gray-500 sm:text-base md:text-lg">
              Four simple steps to get the help you need, safely and
              anonymously.
            </p>
          </div>

          <Timeline data={timelineData} />
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-gradient-to-b from-orange-50/50 to-background py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked{' '}
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Questions
              </span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base">
              Everything you need to know about how Awaaj works and keeps you
              safe.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-orange-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="text-sm sm:text-base font-semibold text-gray-900 pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-orange-500 flex-shrink-0 transition-transform duration-200 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFaq === i ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-red-600 to-amber-700 py-16 sm:py-24 px-4 sm:px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-300 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Your Voice Matters
          </h2>
          <p className="text-white/90 text-sm sm:text-base md:text-xl max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed">
            Every story shared on Awaaj is encrypted and hidden within an image
            using steganography. Only authorized admins can decode and respond.
          </p>
          <Link
            href="/create-post"
            className="inline-flex items-center gap-2 bg-white text-orange-700 font-bold px-8 sm:px-12 py-3.5 sm:py-4 rounded-xl hover:bg-orange-50 transition-all duration-200 text-base sm:text-lg shadow-xl hover:shadow-2xl hover:scale-105"
          >
            Share Your Story
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
            <div className="text-center md:text-left">
              <p className="text-3xl font-black tracking-tight">
                Awa
                <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  a
                </span>
                j
              </p>
              <p className="text-gray-500 mt-1 text-sm">
                Safe. Anonymous. Encrypted.
              </p>
            </div>
            <div className="flex items-center gap-6 sm:gap-8 text-sm text-gray-400">
              <Link
                href="/"
                className="hover:text-orange-400 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/create-post"
                className="hover:text-orange-400 transition-colors"
              >
                Create Post
              </Link>
              <Link
                href="/dashboard"
                className="hover:text-orange-400 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-xs">
              &copy; {new Date().getFullYear()} Awaaj. All rights reserved.
            </p>
            <p className="text-gray-600 text-xs">
              Built with care for those who need it most.
            </p>
          </div>
        </div>
      </footer>
    </section>
  );
}

export default Header;
