import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';
import { authApi } from '../../services';
import { Spinner } from '../../components/ui';

const VerifyEmailPage: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    authApi.getSessions() // just to check — actually call verify
      .catch(() => {});
    // Call verify endpoint
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/verify-email?token=${token}`)
      .then((r) => (r.ok ? setStatus('success') : setStatus('error')))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4">
            <Calendar className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="card p-8 text-center space-y-4">
          {status === 'loading' && <><Spinner size="lg" className="mx-auto" /><p className="text-gray-600">Verifying your email...</p></>}
          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-xl font-bold text-gray-900">Email Verified!</h2>
              <p className="text-gray-600 text-sm">Your email has been verified. You can now sign in.</p>
              <Link to="/login" className="btn-primary btn w-full justify-center">Go to Login</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto" />
              <h2 className="text-xl font-bold text-gray-900">Verification Failed</h2>
              <p className="text-gray-600 text-sm">The link is invalid or has expired.</p>
              <Link to="/login" className="btn-secondary btn w-full justify-center">Back to Login</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
