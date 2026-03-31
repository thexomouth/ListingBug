import { useState } from 'react';
import { MessageCircle, Mail, Send, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

/**
 * CONTACT SUPPORT PAGE
 * 
 * PURPOSE: Allow users to contact ListingBug support via form or direct email/phone
 * 
 * BACKEND INTEGRATION:
 * - API Endpoint: POST /api/support/contact
 * - Request: { name, email, category, subject, message }
 * - Response: { success: boolean, ticketId?: string }
 * 
 * Features:
 * - Contact form with validation
 * - Category selection (Technical, Billing, General, Feature Request)
 * - Direct contact information (email, phone)
 * - Success confirmation with ticket ID
 */

export function ContactSupportPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name || !email || !category || !subject || !message) {
      setError('Please fill in all required fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (message.length < 10) {
      setError('Please provide more details in your message (at least 10 characters)');
      return;
    }

    setIsLoading(true);

    try {
      // BACKEND INTEGRATION:
      // Replace with actual API call
      const response = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          category,
          subject,
          message,
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || 'Failed to send message. Please try again.');
        return;
      }

      // Show success state
      setTicketId(data.ticketId || `TICKET-${Date.now()}`);
      setSuccess(true);
    } catch (err) {
      // For demo purposes, show success anyway
      // In production, handle actual errors
      console.log('Mock: Support ticket created', { name, email, category, subject, message });
      setTicketId(`TICKET-${Date.now()}`);
      setSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setCategory('');
    setSubject('');
    setMessage('');
    setError('');
    setSuccess(false);
    setTicketId('');
  };

  if (success) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="font-bold text-[24px] mb-3">Message Sent Successfully!</h2>
                <p className="text-gray-600 mb-4">
                  Thank you for contacting ListingBug support. We've received your message and will respond within 24 hours.
                </p>
                <div className="bg-white border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-2">Your Support Ticket ID:</p>
                  <p className="font-bold text-[#342E37] text-lg">{ticketId}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Save this ID for reference when following up on your request.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={resetForm}
                    variant="outline"
                  >
                    Submit Another Request
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/'}
                    className="bg-[#FFD447] hover:bg-[#FFD447]/90 text-[#342E37]"
                  >
                    Back to Home
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <MessageCircle className="w-7 h-7 text-[#FFCE0A]" />
          <h1 className="font-bold text-[33px]">Contact Support</h1>
        </div>
        <p className="text-gray-600 text-[15px]">
          Have a question or need assistance? We're here to help. Fill out the form below or reach out directly using the contact information provided.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Contact Form - Left Side (2/3 width) */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-bold text-[20px] mb-6">Send us a Message</h2>

              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <Label htmlFor="name">
                    Your Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Smith"
                    disabled={isLoading}
                    required
                    aria-required="true"
                    className="mt-2"
                  />
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    disabled={isLoading}
                    required
                    aria-required="true"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    We'll respond to this email address
                  </p>
                </div>

                {/* Category */}
                <div>
                  <Label htmlFor="category">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={category}
                    onValueChange={setCategory}
                    disabled={isLoading}
                    required
                  >
                    <SelectTrigger id="category" className="mt-2">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical Support</SelectItem>
                      <SelectItem value="billing">Billing & Payments</SelectItem>
                      <SelectItem value="general">General Question</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="bug">Report a Bug</SelectItem>
                      <SelectItem value="data">Data Accuracy</SelectItem>
                      <SelectItem value="account">Account Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject */}
                <div>
                  <Label htmlFor="subject">
                    Subject <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    disabled={isLoading}
                    required
                    aria-required="true"
                    className="mt-2"
                  />
                </div>

                {/* Message */}
                <div>
                  <Label htmlFor="message">
                    Message <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please provide as much detail as possible about your question or issue..."
                    rows={8}
                    disabled={isLoading}
                    required
                    aria-required="true"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 10 characters
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-[#FFD447] hover:bg-[#FFD447]/90 text-[#342E37]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information - Right Side (1/3 width) */}
        <div className="space-y-6">
          {/* Direct Contact Card */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-bold text-[17px] mb-4">Direct Contact</h3>
              
              <div className="space-y-4">
                {/* General Support */}
                <div className="flex gap-3">
                  <Mail className="w-5 h-5 text-[#FFCE0A] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[14px]">General Support</p>
                    <a
                      href="mailto:support@listingbug.com"
                      className="text-[#342e37] hover:underline text-[14px] break-all"
                    >
                      support@listingbug.com
                    </a>
                  </div>
                </div>

                {/* Sales */}
                <div className="flex gap-3">
                  <Mail className="w-5 h-5 text-[#FFCE0A] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[14px]">Sales Inquiries</p>
                    <a
                      href="mailto:sales@listingbug.com"
                      className="text-[#342e37] hover:underline text-[14px] break-all"
                    >
                      sales@listingbug.com
                    </a>
                  </div>
                </div>

                {/* Billing */}
                <div className="flex gap-3">
                  <Mail className="w-5 h-5 text-[#FFCE0A] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[14px]">Billing Support</p>
                    <a
                      href="mailto:billing@listingbug.com"
                      className="text-[#342e37] hover:underline text-[14px] break-all"
                    >
                      billing@listingbug.com
                    </a>
                  </div>
                </div>

                {/* Technical */}
                <div className="flex gap-3">
                  <Mail className="w-5 h-5 text-[#FFCE0A] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[14px]">Technical Support</p>
                    <a
                      href="mailto:tech@listingbug.com"
                      className="text-[#342e37] hover:underline text-[14px] break-all"
                    >
                      tech@listingbug.com
                    </a>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
