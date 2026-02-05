'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  FileText, 
  Mail, 
  Users, 
  Send, 
  Calendar,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { campaignFormSchema, type CampaignFormData } from '@/lib/schemas/campaign';
import { campaignsApi } from '@/lib/api/campaigns';
import { accountsApi } from '@/lib/api/accounts';
import { toast } from 'sonner';
import Papa from 'papaparse';

const steps = [
  { id: 1, name: 'Details', icon: FileText },
  { id: 2, name: 'Content', icon: Mail },
  { id: 3, name: 'Recipients', icon: Users },
  { id: 4, name: 'Senders', icon: Send },
  { id: 5, name: 'Schedule', icon: Calendar },
  { id: 6, name: 'Review', icon: Eye },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [recipientsText, setRecipientsText] = useState('');
  const [selectedSenders, setSelectedSenders] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      send_immediately: true,
      priority: 5,
      recipients: [],
      sender_account_ids: [],
    },
  });

  const { data: senderAccounts = [] } = useQuery({
    queryKey: ['sender-accounts'],
    queryFn: () => accountsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CampaignFormData) => campaignsApi.create(data as any),
    onSuccess: () => {
      toast.success('Campaign created successfully');
      router.push('/dashboard/campaigns');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create campaign');
    },
  });

  const watchAllFields = watch();

  const parseRecipients = () => {
    const emails: string[] = [];
    const lines = recipientsText.split('\n');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed) {
        // Check if it's a CSV line
        if (trimmed.includes(',')) {
          const parsed = Papa.parse(trimmed, { header: false });
          parsed.data.forEach((row: any) => {
            if (Array.isArray(row)) {
              row.forEach((cell: string) => {
                const email = cell.trim();
                if (email && emailRegex.test(email)) {
                  emails.push(email);
                }
              });
            }
          });
        } else if (emailRegex.test(trimmed)) {
          emails.push(trimmed);
        }
      }
    });
    
    return [...new Set(emails)]; // Remove duplicates
  };

  const handleNext = () => {
    if (currentStep === 3) {
      const emails = parseRecipients();
      setValue('recipients', emails);
      if (emails.length === 0) {
        toast.error('Please add at least one recipient');
        return;
      }
    }
    
    if (currentStep === 4) {
      setValue('sender_account_ids', selectedSenders);
      if (selectedSenders.length === 0) {
        toast.error('Please select at least one sender account');
        return;
      }
    }
    
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: CampaignFormData) => {
    createMutation.mutate(data);
  };

  const availableCapacity = senderAccounts
    .filter(account => selectedSenders.includes(account.id))
    .reduce((sum, account) => sum + (account.daily_limit - account.daily_sent), 0);

  const recipientCount = parseRecipients().length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create New Campaign</h1>
        <p className="text-muted-foreground mt-1">
          Follow the steps to set up your email campaign
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep > step.id
                      ? 'bg-primary border-primary text-primary-foreground'
                      : currentStep === step.id
                      ? 'border-primary text-primary'
                      : 'border-gray-300 text-gray-300'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span className="text-xs mt-2 text-center hidden sm:block">{step.name}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <Progress value={(currentStep / steps.length) * 100} className="mt-4" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].name}</CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Enter basic information about your campaign'}
              {currentStep === 2 && 'Create the email content for your campaign'}
              {currentStep === 3 && 'Add recipients who will receive this campaign'}
              {currentStep === 4 && 'Select sender accounts to distribute the emails'}
              {currentStep === 5 && 'Choose when to send your campaign'}
              {currentStep === 6 && 'Review and confirm all campaign details'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Campaign Details */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="e.g., Spring Sale 2024"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Brief description of this campaign..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="sponsor_id">Sponsor ID (optional)</Label>
                  <Input
                    id="sponsor_id"
                    {...register('sponsor_id')}
                    placeholder="e.g., SPONSOR-12345"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Email Content */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="from_name">From Name *</Label>
                  <Input
                    id="from_name"
                    {...register('from_name')}
                    placeholder="e.g., Marketing Team"
                  />
                  {errors.from_name && (
                    <p className="text-sm text-red-500 mt-1">{errors.from_name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="subject">Subject Line *</Label>
                  <Input
                    id="subject"
                    {...register('subject')}
                    placeholder="e.g., Don't miss our spring sale!"
                  />
                  {errors.subject && (
                    <p className="text-sm text-red-500 mt-1">{errors.subject.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="html_body">HTML Body *</Label>
                  <Textarea
                    id="html_body"
                    {...register('html_body')}
                    placeholder="<html><body>Your email content here...</body></html>"
                    rows={10}
                    className="font-mono text-sm"
                  />
                  {errors.html_body && (
                    <p className="text-sm text-red-500 mt-1">{errors.html_body.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="text_body">Plain Text Body (optional)</Label>
                  <Textarea
                    id="text_body"
                    {...register('text_body')}
                    placeholder="Plain text version of your email..."
                    rows={5}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Recipients */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="recipients">Email Recipients *</Label>
                  <Textarea
                    id="recipients"
                    value={recipientsText}
                    onChange={(e) => setRecipientsText(e.target.value)}
                    placeholder="Enter email addresses (one per line) or paste CSV content"
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Paste email addresses, one per line, or CSV data. Emails will be extracted automatically.
                  </p>
                </div>
                {recipientCount > 0 && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Valid Recipients Found:</span>
                      <Badge variant="secondary">{recipientCount.toLocaleString()}</Badge>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Sender Selection */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <Label>Select Sender Accounts *</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose which accounts will send this campaign
                  </p>
                  <div className="space-y-3">
                    {senderAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <Checkbox
                          id={`sender-${account.id}`}
                          checked={selectedSenders.includes(account.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSenders([...selectedSenders, account.id]);
                            } else {
                              setSelectedSenders(selectedSenders.filter(id => id !== account.id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <Label htmlFor={`sender-${account.id}`} className="font-medium cursor-pointer">
                            {account.email}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {account.display_name} • {account.auth_type}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                              {account.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Capacity: {account.daily_sent}/{account.daily_limit} today
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedSenders.length > 0 && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Selected Accounts:</span>
                      <Badge variant="secondary">{selectedSenders.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Available Capacity:</span>
                      <Badge variant="secondary">{availableCapacity.toLocaleString()}</Badge>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Schedule */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <Label>Send Time</Label>
                  <RadioGroup
                    value={watchAllFields.send_immediately ? 'immediate' : 'scheduled'}
                    onValueChange={(value) => setValue('send_immediately', value === 'immediate')}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="immediate" id="immediate" />
                      <Label htmlFor="immediate" className="font-normal cursor-pointer">
                        Send immediately after creation
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="scheduled" id="scheduled" />
                      <Label htmlFor="scheduled" className="font-normal cursor-pointer">
                        Schedule for later
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {!watchAllFields.send_immediately && (
                  <div>
                    <Label htmlFor="scheduled_at">Schedule Date & Time</Label>
                    <Input
                      id="scheduled_at"
                      type="datetime-local"
                      {...register('scheduled_at')}
                      className="mt-2"
                    />
                  </div>
                )}

                <Separator />

                <div>
                  <Label>Priority Level: {watchAllFields.priority || 5}</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Higher priority campaigns are processed first (1 = lowest, 10 = highest)
                  </p>
                  <Slider
                    value={[watchAllFields.priority || 5]}
                    onValueChange={(value) => setValue('priority', value[0])}
                    min={1}
                    max={10}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Review */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Campaign Summary</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Campaign Name</Label>
                        <p className="font-medium">{watchAllFields.name}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">From Name</Label>
                        <p className="font-medium">{watchAllFields.from_name}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Subject</Label>
                        <p className="font-medium">{watchAllFields.subject}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Priority</Label>
                        <p className="font-medium">{watchAllFields.priority}/10</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Recipients</Label>
                        <p className="font-medium">{recipientCount.toLocaleString()} addresses</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Sender Accounts</Label>
                        <p className="font-medium">{selectedSenders.length} accounts</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Available Capacity</Label>
                        <p className="font-medium">{availableCapacity.toLocaleString()} emails/day</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Send Time</Label>
                        <p className="font-medium">
                          {watchAllFields.send_immediately ? 'Immediately' : 'Scheduled'}
                        </p>
                      </div>
                    </div>

                    {recipientCount > availableCapacity && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          ⚠️ Warning: You have {recipientCount.toLocaleString()} recipients but only{' '}
                          {availableCapacity.toLocaleString()} available capacity. 
                          The campaign will be sent over multiple days.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          {currentStep < 6 ? (
            <Button type="button" onClick={handleNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Campaign'}
              <Check className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
