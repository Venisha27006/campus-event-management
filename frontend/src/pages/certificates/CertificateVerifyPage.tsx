import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, Award, Calendar, User, Hash } from 'lucide-react';
import { certificatesApi } from '../../services';
import { Spinner } from '../../components/ui';
import { formatDate } from '../../utils';

const CertificateVerifyPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['verify-cert', token],
    queryFn: () => certificatesApi.verify(token!).then((r) => r.data.data),
    enabled: !!token,
    retry: false,
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Certificate Verification</h1>
          <p className="text-gray-500 text-sm mt-1">Campus Event Management System</p>
        </div>

        <div className="card p-8">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Spinner size="lg" />
              <p className="text-gray-500 text-sm">Verifying certificate...</p>
            </div>
          ) : isError || !data ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Invalid Certificate</h2>
                <p className="text-gray-500 text-sm mt-1">
                  This certificate could not be verified. It may be invalid or expired.
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm font-medium">Status: INVALID</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status */}
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-700 font-semibold">Status: VALID ✓</p>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-start gap-3">
                  <Hash className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Certificate ID</p>
                    <p className="font-mono text-sm font-medium text-gray-900">{data.certificateId}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Participant</p>
                    <p className="font-semibold text-gray-900">{data.userName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Award className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Event</p>
                    <p className="font-semibold text-gray-900">{data.eventTitle}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Issued Date</p>
                    <p className="font-medium text-gray-900">{formatDate(data.issuedAt)}</p>
                  </div>
                </div>
              </div>

              {data.verificationCount > 0 && (
                <p className="text-xs text-gray-400 text-center border-t pt-3">
                  Verified {data.verificationCount} time{data.verificationCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link to="/events" className="hover:text-primary-600">Browse Events</Link>
          {' · '}
          <Link to="/login" className="hover:text-primary-600">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default CertificateVerifyPage;
