import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, ArrowLeft } from 'lucide-react';
import { authApi } from '../../services';
import { Button, Input } from '../../components/ui';

const schema = z.object({ email: z.string().email('Invalid email') });
type FormData = z.infer<typeof schema>;

const ForgotPasswordPage: React.FC = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.forgotPassword(data.email);
    } catch {
      // Always show success to prevent email enumeration
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-gray-500 text-sm mt-1">We'll send you a reset link</p>
        </div>

        <div className="card p-8">
          {isSubmitSuccessful ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-700 text-sm">If that email exists, a reset link has been sent. Check your inbox.</p>
              <Link to="/login" className="btn-primary btn w-full justify-center">Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input label="Email address" type="email" placeholder="you@campus.edu" error={errors.email?.message} {...register('email')} />
              <Button type="submit" className="w-full" loading={isSubmitting}>Send Reset Link</Button>
            </form>
          )}

          <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 mt-6">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
