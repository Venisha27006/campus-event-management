import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, Award, Calendar, User } from 'lucide-react';
import { certificatesApi } from '../../services';
import { Spinner } from '../../components/ui';
import { formatDate } from '../../utils';

const VerifyCertificatePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['verify-cert', token],
    queryFn: () => certificatesApi.verify(token!).then((r) => r.data.data),
    enabled: !!token,
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Certificate Verification</h1>
          <p className="text-gray-500 text-sm mt-1">Campus Event Management System</p>
        </div>

        <div className="card p-8">
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner size="lg" /></div>
          ) : !data ? (
            <div className="text-center py-8">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900">Certificate Not Found</p>
              <p className="text-sm text-gray-500 mt-1">This certificate could not be verified.</p>
            </div>
          ) : data.valid ? (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                <span className="badge-green text-sm px-4 py-1.5">VALID CERTIFICATE</span>
              </div>

              <div className="space-y-4 divide-y divide-gray-100">
                <div className="flex items-center gap-3 pb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Participant</p>
                    <p className="font-semibold text-gray-900">{data.participantName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-4">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Event</p>
                    <p className="font-semibold text-gray-900">{data.eventName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-4">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Event Date</p>
                    <p className="font-semibold text-gray-900">{data.eventDate ? formatDate(data.eventDate) : '—'}</p>
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-xs text-gray-500">Certificate ID</p>
                  <p className="font-mono text-sm text-gray-700 mt-0.5">{data.certificateId}</p>
                  <p className="text-xs text-gray-400 mt-1">Issued: {data.issuedAt ? formatDate(data.issuedAt) : '—'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900">Invalid Certificate</p>
              <p className="text-sm text-gray-500 mt-1">This certificate has been revoked or is no longer valid.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyCertificatePage;
