"use client";

import { Suspense } from "react";

import dynamic from "next/dynamic";

const SubscriptionContentNoSSR = dynamic(
  () => import("./subscription-content"),
  {
    ssr: false,
  },
);

export default function SubscriptionPage() {
  return (
    <Suspense>
      <SubscriptionContentNoSSR />
    </Suspense>
  );
}
