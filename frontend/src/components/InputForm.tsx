'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, LocateIcon } from 'lucide-react';
import axios from 'axios';
import { Slider } from './ui/slider';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';

const contactMethods = ['Phone', 'Email', 'Text message', 'In-person'];

const FormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  occurrenceDuration: z
    .string()
    .min(1, { message: 'Please specify a duration.' }),
  durationUnit: z.string().default('months'),
  frequency: z.string().min(1, { message: 'Please specify a frequency.' }),
  preferredContact: z
    .array(z.enum(['Phone', 'Email', 'Text message', 'In-person']))
    .min(1, {
      message: 'Please select at least one contact method.',
    }),
  currentSituation: z
    .string()
    .min(5, { message: 'Please describe the current situation.' }),
  culprit: z.string().min(5, { message: 'Please describe the culprit.' }),
});

export function InputForm({
  setText,
  setCoordinates,
}: {
  setText: (resText: string) => void;
  setCoordinates?: (coords: { lat: number; lng: number }) => void;
}) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      location: { lat: 0, lng: 0 },
      occurrenceDuration: '',
      durationUnit: 'months',
      frequency: '',
      preferredContact: [],
      currentSituation: '',
      culprit: '',
    },
  });

  const [occurrenceDuration, setOccurrenceDuration] = useState(0);
  const [durationUnit, setDurationUnit] = useState('months');
  const [frequency, setFrequency] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedContactMethods, setSelectedContactMethods] = useState<
    string[]
  >([]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          form.setValue('location', { lat: latitude, lng: longitude });
          setCoordinates?.({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Error fetching location:', error);
        },
        { enableHighAccuracy: true }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  };

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      setLoading(true);
      setCoordinates?.(data.location);
      const res = await axios.post('/api/generate-text', data);
      console.log('res:', res.data);
      if (res.data.expanded_text) {
        setText(res.data.expanded_text);
      } else {
        console.log('Text setting failed');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-2xl mx-auto space-y-6 w-full"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="preferredContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Contact Method</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  {contactMethods.map((method) => (
                    <div key={method} className="flex items-center gap-2">
                      <Checkbox
                        checked={field.value.includes(
                          method as
                            | 'Phone'
                            | 'Email'
                            | 'Text message'
                            | 'In-person'
                        )}
                        onCheckedChange={(checked) => {
                          const newValue = checked
                            ? [...field.value, method]
                            : field.value.filter((item) => item !== method);
                          field.onChange(newValue);
                          setSelectedContactMethods(newValue);
                        }}
                        className="border-orange-400 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                      />
                      <span>{method}</span>
                    </div>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedContactMethods.includes('Phone') && (
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Your phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedContactMethods.includes('Email') && (
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Your email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder={
                      field.value.lat === 0 && field.value.lng === 0
                        ? 'Click "Auto-detect Location" to set your coordinates'
                        : `Lat: ${field.value.lat}, Lon: ${field.value.lng}`
                    }
                    value={
                      field.value.lat === 0 && field.value.lng === 0
                        ? ''
                        : `Lat: ${field.value.lat}, Lon: ${field.value.lng}`
                    }
                    readOnly
                  />
                </div>
              </FormControl>
              <Button
                type="button"
                onClick={getUserLocation}
                className="mt-2 flex items-center gap-2"
                variant={'outline'}
              >
                <LocateIcon className="h-5 w-5" />
                Auto-detect Location
              </Button>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="occurrenceDuration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>How long has it been occurring</FormLabel>
              <FormControl>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Slider
                      {...field}
                      value={[occurrenceDuration]}
                      min={1}
                      max={100}
                      className="flex-1"
                      onValueChange={(value) => {
                        setOccurrenceDuration(value[0]);
                        field.onChange(`${value[0]} ${durationUnit}`);
                      }}
                    />
                    <span className="min-w-[80px] text-right">{occurrenceDuration} {durationUnit}</span>
                  </div>
                  <div className="flex gap-2">
                    {['days', 'weeks', 'months', 'years'].map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => {
                          setDurationUnit(unit);
                          form.setValue('durationUnit', unit);
                          field.onChange(`${occurrenceDuration} ${unit}`);
                        }}
                        className={`px-3 py-1 text-sm rounded-xl transition duration-150 ${
                          durationUnit === unit
                            ? 'bg-orange-600 text-white'
                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        }`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frequency of Incidents</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Slider
                    {...field}
                    value={[frequency]}
                    min={1}
                    max={100}
                    className="flex-1"
                    onValueChange={(value) => {
                      setFrequency(value[0]);
                      field.onChange(`${value[0]} times`);
                    }}
                  />
                  <span>{frequency} times</span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="currentSituation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Describe the Current Situation</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Keywords describing the situation (e.g., emotional abuse, hurts child)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="culprit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Describe the Culprit</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Keywords describing the culprit (e.g., dark skin, tall, blue eyes)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="flex items-center gap-2 duration-200 ease-in-out"
        >
          Generate Text
          <Loader2
            className={`h-5 w-5 ${loading ? 'animate-spin' : 'hidden'}`}
          />
        </Button>
      </form>
    </Form>
  );
}
