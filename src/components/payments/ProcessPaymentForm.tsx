import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CreditCard, Copy, Check } from "lucide-react";
import { PaymentInfo } from "./types";

interface InteracTransferMessageProps {
  userEmail?: string;
  leagueName?: string;
}

function InteracTransferMessage({ userEmail, leagueName }: InteracTransferMessageProps) {
  const [copied, setCopied] = useState(false);

  const parts = [userEmail, leagueName].filter(Boolean);
  const message = parts.join(" | ");

  if (!message) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = message;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <p className="text-sm font-medium text-blue-800 mb-2">
        Include this message with your Interac e-Transfer:
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-white px-3 py-2 rounded border border-blue-200 text-sm text-[#6F6F6F] break-all">
          {message}
        </code>
        <Button
          onClick={handleCopy}
          variant="outline"
          size="sm"
          className="shrink-0 border-blue-300 hover:bg-blue-100"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
        </Button>
      </div>
    </div>
  );
}

interface ProcessPaymentFormProps {
  paymentInfo: PaymentInfo;
  depositAmount: string;
  paymentMethod: string;
  paymentNotes: string;
  processingPayment: boolean;
  userEmail?: string;
  leagueName?: string;
  onDepositAmountChange: (amount: string) => void;
  onPaymentMethodChange: (method: string) => void;
  onPaymentNotesChange: (notes: string) => void;
  onProcessPayment: () => void;
}

export function ProcessPaymentForm({
  paymentInfo,
  depositAmount,
  paymentMethod,
  paymentNotes,
  processingPayment,
  userEmail,
  leagueName,
  onDepositAmountChange,
  onPaymentMethodChange,
  onPaymentNotesChange,
  onProcessPayment,
}: ProcessPaymentFormProps) {
  const amountOwing = paymentInfo.amount_due - paymentInfo.amount_paid;

  if (amountOwing <= 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
        <span className="text-green-800 font-medium">
          Payment completed in full
        </span>
      </div>
    );
  }

  return (
    <div className="border-t pt-6">
      <h4 className="text-lg font-bold text-[#6F6F6F] mb-4">Process Payment</h4>

      {paymentMethod === 'e_transfer' && (
        <InteracTransferMessage userEmail={userEmail} leagueName={leagueName} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-[#6F6F6F] mb-2">
            Amount ($)
          </label>
          <Input
            type="number"
            step="any"
            min="0.01"
            max={amountOwing}
            value={depositAmount}
            onChange={(e) => onDepositAmountChange(e.target.value)}
            placeholder="0.00"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#6F6F6F] mb-2">
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => onPaymentMethodChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#B20000] focus:ring-[#B20000]"
          >
            <option value="e_transfer">E-Transfer</option>
            <option value="stripe">Online</option>
            <option value="cash">Cash</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-[#6F6F6F] mb-2">
          Payment Notes (Optional)
        </label>
        <textarea
          value={paymentNotes}
          onChange={(e) => onPaymentNotesChange(e.target.value)}
          placeholder="Add any notes about this payment..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#B20000] focus:ring-[#B20000]"
        />
      </div>

      <div className="mt-6 flex gap-4">
        <Button
          onClick={onProcessPayment}
          disabled={
            processingPayment ||
            !depositAmount ||
            parseFloat(depositAmount) <= 0
          }
          className="bg-green-600 hover:bg-green-700 text-white rounded-[10px] px-6 py-2 flex items-center gap-2"
        >
          <CreditCard className="h-4 w-4" />
          {processingPayment ? "Processing..." : "Process Payment"}
        </Button>
      </div>
    </div>
  );
}
