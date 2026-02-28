import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  User, 
  Car, 
  Users, 
  CreditCard,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Check,
  Edit,
  ClipboardCheck,
  FileText,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VehicleSelector, VehicleSelection } from '@/components/VehicleSelector';
import { ImageUploadWithCamera } from '@/components/ImageUploadWithCamera';
import DateOnlyPicker from '@/components/DateOnlyPicker';
import TimeOnlyPicker from '@/components/TimeOnlyPicker';
import { AccessoriesChecklist, defaultAccessories, AccessoriesData } from '@/components/AccessoriesChecklist';
import { SignatureCanvas } from '@/components/SignatureCanvas';
import { VehicleConditionChecklist, defaultVehicleCondition, VehicleConditionData } from '@/components/VehicleConditionChecklist';
import { DentsScratchesReport, defaultDentsScratches, DentsScratchesData } from '@/components/DentsScratchesReport';
import { SmartPricingCalculator, defaultSmartPricing, SmartPricingData } from '@/components/SmartPricingCalculator';
import { SuccessDialog } from '@/components/SuccessDialog';
import { compressRentalImages } from '@/lib/imageCompression';
import { 
  formatCurrency 
} from '@/lib/storage';
import { getRentalsOnce, updateRentalInFirestore } from '@/lib/firestoreService';
import { Client, Vehicle, Witness, RentType, PaymentStatus, Rental } from '@/types/rental';
import { toast } from 'sonner';

const steps = [
  { id: 1, title: 'Client', icon: User },
  { id: 2, title: 'Vehicle', icon: Car },
  { id: 3, title: 'Condition', icon: ClipboardCheck },
  { id: 4, title: 'Period', icon: Calendar },
  { id: 5, title: 'Witness', icon: Users },
  { id: 6, title: 'Payment', icon: CreditCard },
  { id: 7, title: 'Agreement', icon: FileText },
];

const EditBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [duration, setDuration] = useState({ hours: 0, days: 0, weeks: 0, months: 0 });
  
  const [client, setClient] = useState<Client>({
    id: '',
    fullName: '',
    cnic: '',
    phone: '',
    address: '',
  });
  
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleSelection, setVehicleSelection] = useState<VehicleSelection>({
    brand: '',
    model: '',
    year: '',
    color: '',
    logo: '',
    carNumber: '',
  });
  
  const [rentalDetails, setRentalDetails] = useState({
    deliveryDate: '',
    deliveryTime: '',
    returnDate: '',
    returnTime: '',
    rentType: 'daily' as RentType,
    customDays: 0,
  });
  
  const [witness, setWitness] = useState<Witness>({
    name: '',
    cnic: '',
    phone: '',
    address: '',
  });
  
  const [payment, setPayment] = useState({
    totalAmount: 0,
    advancePayment: 0,
    balance: 0,
    paymentStatus: 'pending' as PaymentStatus,
    notes: '',
  });
  
  const [agreementNumber, setAgreementNumber] = useState('');
  
  const [accessories, setAccessories] = useState<AccessoriesData>(defaultAccessories);
  const [vehicleCondition, setVehicleCondition] = useState<VehicleConditionData>(defaultVehicleCondition);
  const [dentsScratches, setDentsScratches] = useState<DentsScratchesData>(defaultDentsScratches);
  const [clientSignature, setClientSignature] = useState('');
  const [ownerSignature, setOwnerSignature] = useState('');
  const [smartPricing, setSmartPricing] = useState<SmartPricingData>(defaultSmartPricing);
  const [showSuccess, setShowSuccess] = useState(false);
  const [vehicleImage, setVehicleImage] = useState('');

  useEffect(() => {
    const loadRental = async () => {
      if (!id) return;
      try {
        const rentals = await getRentalsOnce();
        const rental = rentals.find(r => r.id === id);
        
        if (rental) {
          setClient(rental.client);
          setSelectedVehicle(rental.vehicle);
          setVehicleSelection({
            brand: rental.vehicle.brand || '',
            model: rental.vehicle.model || '',
            year: rental.vehicle.year || '',
            color: rental.vehicle.color || '',
            logo: rental.vehicle.logo || '',
            carNumber: rental.vehicle.carNumber || '',
          });
          setRentalDetails({
            deliveryDate: rental.deliveryDate,
            deliveryTime: rental.deliveryTime,
            returnDate: rental.returnDate,
            returnTime: rental.returnTime,
            rentType: rental.rentType,
            customDays: rental.customDays || 0,
          });
          setWitness(rental.witness);
          setPayment({
            totalAmount: rental.totalAmount,
            advancePayment: rental.advancePayment,
            balance: rental.balance,
            paymentStatus: rental.paymentStatus,
            notes: rental.notes || '',
          });
          setAgreementNumber(rental.agreementNumber || '');
          setAccessories(rental.accessories || defaultAccessories);
          setVehicleCondition(rental.vehicleCondition || defaultVehicleCondition);
          setDentsScratches(rental.dentsScratches || defaultDentsScratches);
          setClientSignature(rental.clientSignature || '');
          setOwnerSignature(rental.ownerSignature || '');
          setSmartPricing(rental.smartPricing || defaultSmartPricing);
          setVehicleImage(rental.vehicle.image || '');
          
          setIsManualOverride(true); // Preserve loaded payment values
        } else {
          toast.error('Rental not found');
          navigate('/rentals');
        }
      } catch (error) {
        console.error('Error loading rental:', error);
        toast.error('Failed to load rental details');
      } finally {
        setLoading(false);
      }
    };
    loadRental();
  }, [id, navigate]);

  useEffect(() => {
    if (rentalDetails.deliveryDate && rentalDetails.deliveryTime && 
        rentalDetails.returnDate && rentalDetails.returnTime) {
      const delivery = new Date(`${rentalDetails.deliveryDate}T${rentalDetails.deliveryTime}`);
      const returnD = new Date(`${rentalDetails.returnDate}T${rentalDetails.returnTime}`);
      const diffMs = returnD.getTime() - delivery.getTime();
      
      if (diffMs > 0) {
        const hours = Math.ceil(diffMs / (1000 * 60 * 60));
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const weeks = Math.max(1, Math.ceil(days / 7));
        const months = Math.max(1, Math.ceil(days / 30));
        
        setDuration({ hours, days: Math.max(1, days), weeks, months });
      }
    }
  }, [rentalDetails.deliveryDate, rentalDetails.deliveryTime, rentalDetails.returnDate, rentalDetails.returnTime]);

  const calculateDynamicPrice = (rentType: RentType): number => {
    const perDay = smartPricing.perDayPrice || (selectedVehicle?.dailyRate || 0);
    if (perDay <= 0) return 0;
    
    switch (rentType) {
      case 'hourly':
        return Math.round(perDay / 24) * duration.hours;
      case 'daily':
        return perDay * duration.days;
      case 'weekly':
        return perDay * 7 * duration.weeks;
      case 'monthly':
        return perDay * 30 * duration.months;
      case 'custom':
        return perDay * rentalDetails.customDays;
      default:
        return 0;
    }
  };

  useEffect(() => {
    if (!isManualOverride && !loading) {
      const perDay = smartPricing.perDayPrice;
      if (perDay > 0) {
        let total = 0;
        if (rentalDetails.rentType === 'custom' && rentalDetails.customDays > 0) {
          total = perDay * rentalDetails.customDays;
        } else if (rentalDetails.customDays > 0) {
          total = perDay * rentalDetails.customDays;
        } else if (duration.days > 0) {
          total = calculateDynamicPrice(rentalDetails.rentType);
        }
        
        setPayment(prev => ({
          ...prev,
          totalAmount: total,
          balance: total - prev.advancePayment,
        }));
      }
    }
  }, [smartPricing.perDayPrice, rentalDetails.rentType, rentalDetails.customDays, duration, isManualOverride, loading]);

  useEffect(() => {
    if (!loading) {
      setPayment(prev => ({
        ...prev,
        balance: prev.totalAmount - prev.advancePayment,
        paymentStatus: prev.advancePayment >= prev.totalAmount ? 'paid' : 
                       prev.advancePayment > 0 ? 'partial' : 'pending',
      }));
    }
  }, [payment.advancePayment, payment.totalAmount, loading]);

  const validateCNIC = (cnic: string): boolean => {
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    return cnicRegex.test(cnic);
  };

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!client.fullName || !client.cnic || !client.phone || !client.address) {
          toast.error('Please fill all client details');
          return false;
        }
        if (!validateCNIC(client.cnic)) {
          toast.error('Invalid CNIC format. Use: 12345-1234567-1');
          return false;
        }
        return true;
      case 2:
        if (!vehicleSelection.brand || !vehicleSelection.model) {
          toast.error('Please select a vehicle brand and model');
          return false;
        }
        if (!vehicleSelection.year) {
          toast.error('Please enter the manufacturing year');
          return false;
        }
        if (!vehicleSelection.color) {
          toast.error('Please enter the car color');
          return false;
        }
        return true;
      case 3:
        return true;
      case 4:
        if (!rentalDetails.deliveryDate || !rentalDetails.deliveryTime ||
            !rentalDetails.returnDate || !rentalDetails.returnTime) {
          toast.error('Please fill all rental period details');
          return false;
        }
        const delivery = new Date(`${rentalDetails.deliveryDate}T${rentalDetails.deliveryTime}`);
        const returnD = new Date(`${rentalDetails.returnDate}T${rentalDetails.returnTime}`);
        if (returnD <= delivery) {
          toast.error('Return date must be after delivery date');
          return false;
        }
        return true;
      case 5:
        if (!witness.name || !witness.cnic || !witness.phone || !witness.address) {
          toast.error('Please fill all witness details');
          return false;
        }
        if (!validateCNIC(witness.cnic)) {
          toast.error('Invalid witness CNIC format. Use: 12345-1234567-1');
          return false;
        }
        return true;
      case 6:
        if (payment.advancePayment < 0) {
          toast.error('Advance payment cannot be negative');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 7));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!id || !validateStep()) {
      toast.error('Please complete all required fields');
      return;
    }
    
    setSubmitting(true);

    const vehicleWithImage = {
      ...selectedVehicle!,
      ...vehicleSelection,
      image: vehicleImage || selectedVehicle?.image || '',
    };

    const rentalData = {
      agreementNumber: agreementNumber,
      client: { ...client },
      vehicle: vehicleWithImage,
      witness,
      deliveryDate: rentalDetails.deliveryDate,
      deliveryTime: rentalDetails.deliveryTime,
      returnDate: rentalDetails.returnDate,
      returnTime: rentalDetails.returnTime,
      rentType: rentalDetails.rentType,
      customDays: rentalDetails.customDays,
      totalAmount: payment.totalAmount,
      advancePayment: payment.advancePayment,
      balance: payment.balance,
      paymentStatus: payment.paymentStatus,
      notes: payment.notes,
      accessories,
      vehicleCondition,
      dentsScratches,
      clientSignature,
      ownerSignature,
      smartPricing,
      updatedAt: new Date().toISOString(),
    };

    try {
      const compressedRental = await compressRentalImages(rentalData);
      
      if (!id.startsWith('local_')) {
        await updateRentalInFirestore(id, compressedRental);
        toast.success('✅ Booking updated in cloud!');
      }
      
      // Update LocalStorage
      const existingRentals = JSON.parse(localStorage.getItem('rentals') || '[]');
      const updatedRentals = existingRentals.map((r: any) => 
        r.id === id ? { ...compressedRental, id } : r
      );
      localStorage.setItem('rentals', JSON.stringify(updatedRentals));
      
      localStorage.setItem('last_rental_id', id);
      setShowSuccess(true);
    } catch (error: any) {
      console.error('❌ Update error:', error);
      toast.error(`Failed to update: ${error?.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessClose = (open: boolean) => {
    setShowSuccess(open);
    if (!open) {
      navigate(`/agreement/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="page-header">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2 text-white">Edit Booking</h1>
        <p className="text-white/90">Update rental agreement details</p>
      </div>

      <div className="card-elevated overflow-hidden mb-6">
        <div className="bg-primary p-4 text-white">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            Booking Progress
          </h2>
        </div>
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center min-w-max">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentStep === step.id 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : currentStep > step.id 
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-xs mt-2 hidden md:block ${
                    currentStep >= step.id ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-4 md:w-8 lg:w-12 h-0.5 mx-1 transition-all duration-300 ${
                    currentStep > step.id ? 'bg-success' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="bg-primary p-4 text-white">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            {steps.find(s => s.id === currentStep)?.title} Details
          </h2>
        </div>
        <div className="p-6 md:p-8">
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={client.fullName}
                    onChange={(e) => setClient({ ...client, fullName: e.target.value })}
                    className="input-styled"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnic">CNIC *</Label>
                  <Input
                    id="cnic"
                    value={client.cnic}
                    onChange={(e) => setClient({ ...client, cnic: e.target.value })}
                    className="input-styled"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={client.phone}
                    onChange={(e) => setClient({ ...client, phone: e.target.value })}
                    className="input-styled"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={client.address}
                    onChange={(e) => setClient({ ...client, address: e.target.value })}
                    className="input-styled"
                  />
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ImageUploadWithCamera
                  label="CNIC Front"
                  value={client.cnicFrontImage}
                  onChange={(img) => setClient({ ...client, cnicFrontImage: img })}
                />
                <ImageUploadWithCamera
                  label="CNIC Back"
                  value={client.cnicBackImage}
                  onChange={(img) => setClient({ ...client, cnicBackImage: img })}
                />
                <ImageUploadWithCamera
                  label="Client Photo"
                  value={client.photo}
                  onChange={(img) => setClient({ ...client, photo: img })}
                />
                <ImageUploadWithCamera
                  label="Driving License"
                  value={client.drivingLicenseImage}
                  onChange={(img) => setClient({ ...client, drivingLicenseImage: img })}
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <VehicleSelector 
                value={vehicleSelection}
                onChange={setVehicleSelection}
              />
              <div className="space-y-2">
                <Label>Vehicle Image</Label>
                <ImageUploadWithCamera
                  value={vehicleImage}
                  onChange={setVehicleImage}
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8 animate-fade-in">
              <VehicleConditionChecklist
                value={vehicleCondition}
                onChange={setVehicleCondition}
              />
              <DentsScratchesReport
                value={dentsScratches}
                onChange={setDentsScratches}
              />
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-display font-semibold text-lg flex items-center gap-2 text-primary">
                    <Calendar className="w-5 h-5" />
                    Delivery Details
                  </h3>
                  <div className="grid gap-4">
                    <DateOnlyPicker
                      label="Delivery Date"
                      value={rentalDetails.deliveryDate}
                      onChange={(date) => setRentalDetails({ ...rentalDetails, deliveryDate: date })}
                    />
                    <TimeOnlyPicker
                      label="Delivery Time"
                      value={rentalDetails.deliveryTime}
                      onChange={(time) => setRentalDetails({ ...rentalDetails, deliveryTime: time })}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-display font-semibold text-lg flex items-center gap-2 text-primary">
                    <Calendar className="w-5 h-5" />
                    Return Details
                  </h3>
                  <div className="grid gap-4">
                    <DateOnlyPicker
                      label="Return Date"
                      value={rentalDetails.returnDate}
                      onChange={(date) => setRentalDetails({ ...rentalDetails, returnDate: date })}
                    />
                    <TimeOnlyPicker
                      label="Return Time"
                      value={rentalDetails.returnTime}
                      onChange={(time) => setRentalDetails({ ...rentalDetails, returnTime: time })}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-xl border border-border">
                <SmartPricingCalculator
                  value={smartPricing}
                  onChange={setSmartPricing}
                />
              </div>

              <div className="space-y-4">
                <Label>Rent Type</Label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['hourly', 'daily', 'weekly', 'monthly', 'custom'] as RentType[]).map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={rentalDetails.rentType === type ? 'default' : 'outline'}
                      onClick={() => setRentalDetails({ ...rentalDetails, rentType: type })}
                      className="capitalize"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
                {rentalDetails.rentType === 'custom' && (
                  <div className="mt-4">
                    <Label htmlFor="custom-days">Custom Days</Label>
                    <Input
                      id="custom-days"
                      type="number"
                      value={rentalDetails.customDays}
                      onChange={(e) => setRentalDetails({ ...rentalDetails, customDays: parseInt(e.target.value) || 0 })}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="w-name">Witness Name *</Label>
                  <Input
                    id="w-name"
                    value={witness.name}
                    onChange={(e) => setWitness({ ...witness, name: e.target.value })}
                    className="input-styled"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="w-cnic">Witness CNIC *</Label>
                  <Input
                    id="w-cnic"
                    value={witness.cnic}
                    onChange={(e) => setWitness({ ...witness, cnic: e.target.value })}
                    className="input-styled"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="w-phone">Witness Phone *</Label>
                  <Input
                    id="w-phone"
                    value={witness.phone}
                    onChange={(e) => setWitness({ ...witness, phone: e.target.value })}
                    className="input-styled"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="w-address">Witness Address *</Label>
                  <Input
                    id="w-address"
                    value={witness.address}
                    onChange={(e) => setWitness({ ...witness, address: e.target.value })}
                    className="input-styled"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="total-amount">Total Amount</Label>
                  <Input
                    id="total-amount"
                    type="number"
                    value={payment.totalAmount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setPayment({ ...payment, totalAmount: val, balance: val - payment.advancePayment });
                      setIsManualOverride(true);
                    }}
                    className="input-styled"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advance">Advance Payment</Label>
                  <Input
                    id="advance"
                    type="number"
                    value={payment.advancePayment}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setPayment({ ...payment, advancePayment: val, balance: payment.totalAmount - val });
                    }}
                    className="input-styled"
                  />
                </div>
              </div>
              <div className="p-4 bg-primary/10 rounded-xl">
                <p className="text-sm text-primary font-medium">Balance Due: {formatCurrency(payment.balance)}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={payment.notes}
                  onChange={(e) => setPayment({ ...payment, notes: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}

          {currentStep === 7 && (
            <div className="space-y-8 animate-fade-in">
              <AccessoriesChecklist
                value={accessories}
                onChange={setAccessories}
              />
              <div className="grid md:grid-cols-2 gap-8">
                <SignatureCanvas
                  label="Client Signature"
                  value={clientSignature}
                  onChange={setClientSignature}
                />
                <SignatureCanvas
                  label="Owner Signature"
                  value={ownerSignature}
                  onChange={setOwnerSignature}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ag-num">Agreement Number</Label>
                <Input
                  id="ag-num"
                  value={agreementNumber}
                  onChange={(e) => setAgreementNumber(e.target.value)}
                  className="font-mono font-bold"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-8 border-t border-border mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || submitting}
              className="px-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            {currentStep < 7 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="px-8 btn-accent-gradient"
              >
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-10 btn-accent-gradient"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Agreement
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <SuccessDialog
        open={showSuccess}
        onOpenChange={handleSuccessClose}
        title="Agreement Updated!"
        description="The rental agreement has been successfully updated in the system."
      />
    </div>
  );
};

export default EditBooking;
