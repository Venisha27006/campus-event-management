import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Award, Download, ExternalLink, Calendar } from 'lucide-react';
import { certificatesApi } from '../../services';
import type { Certificate } from '../../types';
import { Button, Spinner, EmptyState } from '../../components/ui';
import { formatDate } from '../../utils';

const CertificatesPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => certificatesApi.getMyCertificates().then((r) => r.data.data),
  });

  const handleDownload = async (cert: Certificate) => {
    if (cert.pdfUrl) {
      window.open(cert.pdfUrl, '_blank');
    }
  };

  const certificates: Certificate[] = data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
        <p className="text-gray-500 text-sm mt-1">Download and verify your earned certificates</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !certificates.length ? (
        <EmptyState
          icon={<Award className="w-16 h-16" />}
          title="No certificates yet"
          description="Attend events to earn certificates of participation."
          action={<Link to="/events"><Button>Browse Events</Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {certificates.map((cert) => (
            <div key={cert.id} className="card overflow-hidden hover:shadow-md transition-shadow">
              {/* Certificate Preview */}
              <div className="h-40 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 flex flex-col items-center justify-center p-6 text-center">
                <Award className="w-10 h-10 text-white mb-2" />
                <p className="text-white font-bold text-sm leading-tight">Certificate of Participation</p>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                    {cert.event?.title || 'Event'}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Calendar className="w-3 h-3" />
                    {cert.event?.startDate ? formatDate(cert.event.startDate) : formatDate(cert.issuedAt)}
                  </div>
                </div>

                <div className="text-xs text-gray-400 font-mono">
                  ID: {cert.certificateId}
                </div>

                <div className="flex gap-2">
                  {cert.pdfUrl && (
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleDownload(cert)}>
                      <Download className="w-3.5 h-3.5" /> Download
                    </Button>
                  )}
                  <Link
                    to={`/certificates/verify/${cert.verifyToken}`}
                    target="_blank"
                    className="flex-1"
                  >
                    <Button variant="ghost" size="sm" className="w-full">
                      <ExternalLink className="w-3.5 h-3.5" /> Verify
                    </Button>
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
