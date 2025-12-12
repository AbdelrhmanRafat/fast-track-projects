import React, { Suspense } from 'react';
import CreateProjectClient from './pageClient';
import Loading from './loading';

export default function CreateProjectPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CreateProjectClient />
    </Suspense>
  );
}
