import { Rental } from '@/types/rental';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/storage';
import { Check, AlertCircle } from 'lucide-react';

interface BookingSummaryDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  rental: Partial<Rental>;
  isSubmitting: boolean;
}

export const BookingSummaryDialog = ({ open, onClose, onConfirm, rental, isSubmitting }: BookingSummaryDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <Check className="w-6 h-6" />
            Review Booking Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Agreement Number */}
          <div className="border-2 border-primary rounded-lg p-4 bg-primary/10 mb-4">
            <h3 className="font-bold text-lg mb-1 text-primary">📄 Agreement Number</h3>
            <div className="text-2xl font-mono font-black text-primary tracking-wider">
              {rental.agreementNumber || 'PENDING'}
            </div>
          </div>

          {/* Client Info */}
          <div className="border-2 border-primary/20 rounded-lg p-4 bg-primary/5">
            <h3 className="font-bold text-lg mb-3 text-primary">👤 Client Information</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Name:</span> <strong>{rental.client?.fullName}</strong></div>
              <div><span className="text-muted-foreground">CNIC:</span> <strong>{rental.client?.cnic}</strong></div>
              <div><span className="text-muted-foreground">Phone:</span> <strong>{rental.client?.phone}</strong></div>
              <div><span className="text-muted-foreground">Address:</span> <strong>{rental.client?.address}</strong></div>
            </div>
          </div>

          {/* Witness Info */}
          <div className="border-2 border-muted rounded-lg p-4">
            <h3 className="font-bold text-lg mb-3">👥 Witness Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Name:</span> <strong>{rental.witness?.name}</strong></div>
              <div><span className="text-muted-foreground">CNIC:</span> <strong>{rental.witness?.cnic}</strong></div>
              <div><span className="text-muted-foreground">Phone:</span> <strong>{rental.witness?.phone}</strong></div>
              <div><span className="text-muted-foreground">Address:</span> <strong>{rental.witness?.address}</strong></div>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="border-2 border-primary/20 rounded-lg p-4 bg-orange-50 dark:bg-orange-950/20">
            <h3 className="font-bold text-lg mb-3 text-primary">🚗 Vehicle Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Car:</span> <strong>{rental.vehicle?.brand} {rental.vehicle?.model}</strong></div>
              <div><span className="text-muted-foreground">Reg. Number:</span> <strong className="font-mono text-lg">{rental.vehicle?.carNumber}</strong></div>
              <div><span className="text-muted-foreground">Year:</span> <strong>{rental.vehicle?.year}</strong></div>
              <div><span className="text-muted-foreground">Color:</span> <strong>{rental.vehicle?.color}</strong></div>
              <div><span className="text-muted-foreground">Type:</span> <strong>{rental.vehicle?.type}</strong></div>
            </div>
          </div>

          {/* Rental Period */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
              <h4 className="font-bold text-sm mb-2 text-green-700 dark:text-green-400">🚀 Delivery</h4>
              <div className="text-sm">
                <div><strong>{formatDate(rental.deliveryDate)}</strong></div>
                <div className="text-muted-foreground">{rental.deliveryTime}</div>
              </div>
            </div>
            <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
              <h4 className="font-bold text-sm mb-2 text-red-700 dark:text-red-400">🏁 Return</h4>
              <div className="text-sm">
                <div><strong>{formatDate(rental.returnDate)}</strong></div>
                <div className="text-muted-foreground">{rental.returnTime}</div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="border-2 border-primary rounded-lg p-4 bg-primary/10">
            <h3 className="font-bold text-lg mb-3 text-primary">💰 Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Rent Type:</span>
                <strong className="uppercase">{rental.rentType}</strong>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Amount:</span>
                <strong>{formatCurrency(rental.totalAmount)}</strong>
              </div>
              <div className="flex justify-between text-sm">
                <span>Advance Payment:</span>
                <strong className="text-green-600">{formatCurrency(rental.advancePayment)}</strong>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-primary/30">
                <span>Balance Due:</span>
                <span className="text-primary">{formatCurrency(rental.balance)}</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-900 dark:text-orange-200">
              <strong>Please review all details carefully.</strong> Once saved, this booking will be added to your records and a rental agreement will be generated.
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel & Edit
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 min-w-[150px]"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Confirm & Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
