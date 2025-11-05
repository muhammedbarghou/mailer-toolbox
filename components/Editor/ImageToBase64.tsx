"use client";

import { useState, ChangeEvent } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ImageToBase64() {
  const [base64, setBase64] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const result = reader.result as string;

      // Example: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...
      const base64String = result.split(",")[1]; // remove the prefix
      setBase64(base64String);

      // store the file type too
      const match = result.match(/^data:(.*?);base64/);
      if (match && match[1]) setFileType(match[1]);
    };
  };

  const handleCopy = () => {
    if (base64) {
      navigator.clipboard.writeText(base64);
      toast.success("Base64 copied to clipboard!");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 border rounded-2xl shadow-sm max-w-lg mx-auto">
      <h2 className="text-xl font-semibold">Image to Base64 Converter</h2>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="border rounded-lg p-2 cursor-pointer"
      />

      {preview && (
        <div className="mt-4">
          <Image
            src={preview}
            alt="Uploaded Preview"
            width={250}
            height={250}
            className="rounded-lg object-cover"
          />
        </div>
      )}

      {base64 && (
        <div className="w-full mt-4">
          <p className="text-sm text-gray-500 mb-1">
            File type: <span className="font-mono">{fileType}</span>
          </p>
          <textarea
            value={base64}
            readOnly
            rows={6}
            className="w-full border rounded-lg p-2 text-sm font-mono"
          />
          <div className="flex justify-end mt-2">
            <Button onClick={handleCopy}>Copy Base64</Button>
          </div>
        </div>
      )}
    </div>
  );
}
