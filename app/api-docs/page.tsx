'use client';

import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    const loadSpec = async () => {
      const response = await fetch('/api-docs/spec');
      const data = await response.json();
      setSpec(data);
    };
    loadSpec();
  }, []);

  if (!spec) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading API documentation...</p>
      </div>
    );
  }

  return <SwaggerUI spec={spec} />;
}
