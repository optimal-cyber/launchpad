import { AlertTriangle, Search, Gitlab } from 'lucide-react';

interface StateErrorProps {
  message?: string;
  onRetry?: () => void;
}

interface StateNoVulnerabilitiesProps {
  onCtaClick?: () => void;
}

export function StateError({ message = 'Something went wrong', onRetry }: StateErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
      <p className="text-gray-500 text-center mb-6 max-w-md">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function StateNoVulnerabilities({ onCtaClick }: StateNoVulnerabilitiesProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Search className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Vulnerabilities Found</h3>
      <p className="text-gray-500 text-center mb-6 max-w-md">
        No vulnerabilities match your current filters. Try adjusting your search criteria or check if there are any active security scans.
      </p>
      <div className="flex space-x-3">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Refresh
        </button>
        {onCtaClick && (
          <button
            onClick={onCtaClick}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Gitlab className="h-4 w-4 mr-2" />
            Check GitLab
          </button>
        )}
      </div>
    </div>
  );
}

