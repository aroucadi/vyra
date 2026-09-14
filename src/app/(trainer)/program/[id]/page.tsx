"use client";

import { use } from "react";
import ProgramBuilderPage from "../new/page";

export default function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  return <ProgramBuilderPage programId={resolvedParams.id} />;
}
