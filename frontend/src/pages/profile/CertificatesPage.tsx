import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, Download, ExternalLink, Calendar } from 'lucide-react';
import { certificatesApi } from '../../services';
import type { Certificate } from '../../types';
import { Button, Spinner, EmptyState } from '../../components/ui';
import { formatDate } from '../../utils';
import { Link } from 'react-router-dom';

const CertificatesPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => certificatesApi.getMyCertificates().then((r) => r.data.data),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
        <p className="text-gray-500 text-sm">Download and verify your participation certificates</p>
      </div>

      {!data?.length ? (
        <EmptyState icon={<Award className="w-16 h-16" />} title="No certificates yet" description="Attend events and get your certificates here." action={<Link to="/events"><Button>Browse Events</Button></Link>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.map((cert: Certificate) => (
            <div key={cert.id} className="card overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-36 bg-gradient-to-br from-primary-600 to-indigo-700 flex flex-col items-center justify-center p-4 text-white">
                <Award className="w-10 h-10 mb-2 opacity-80" />
                <p className="text-xs font-medium opacity-70 uppercase tracking-wider">Certificate of Participation</p>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="font-semibold text-gray-900 line-clamp-1">{(cert.event as { title?: string })?.title}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    {(cert.event as { startDate?: string })?.startDate ? formatDate((cert.event as { startDate: string }).startDate) : '—'}
                  </p>
                </div>
                <p className="text-xs font-mono text-gray-400">{cert.certificateId}</p>
                <div className="flex gap-2">
                  {cert.pdfUrl && (
                    <a href={cert.pdfUrl} target="_blank" rel="noreferrer" className="flex-1">
                      <Button size="sm" className="w-full"><Download className="w-3.5 h-3.5" />Download</Button>
                    </a>
                  )}
                  <Link to={`/verify-certificate/${cert.verifyToken}`} className="flex-1">
                    <Button size="sm" variant="secondary" className="w-full"><ExternalLink className="w-3.5 h-3.5" />Verify</Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificatesPage;
