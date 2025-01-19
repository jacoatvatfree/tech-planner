import React, { useState } from "react";
import { ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/20/solid";

export function CopyButton({ text, className = "" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-1 rounded hover:bg-gray-100 transition-colors ${className}`}
      title="Copy to clipboard"
    >
      {copied ? (
        <CheckIcon className="h-5 w-5 text-green-500" />
      ) : (
        <ClipboardDocumentIcon className="h-5 w-5 text-gray-400" />
      )}
    </button>
  );
}
