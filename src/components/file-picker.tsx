import { AppText } from '@/components/app-text';

/** Uploading is done from a web browser (see file-picker.web.tsx). */
export function FilePicker({
  label,
}: {
  label: string;
  accept: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  return <AppText secondary>{label}: please use the web version to upload files.</AppText>;
}
