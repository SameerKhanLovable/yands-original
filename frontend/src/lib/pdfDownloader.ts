import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Rental } from '@/types/rental';
import { formatCurrency, formatDate } from '@/lib/storage';
import { getCompanyInfo } from '@/components/CompanySettings';
import { URDU_TERMS_LIST, TERMS_TITLE } from '@/lib/termsAndConditions';

// Brand Colors - ORANGE THEME
const BRAND_ORANGE = '#F47C2C';
const BRAND_RED = '#D8432E';
const BRAND_ORANGE_LIGHT = '#FFA366';
const BRAND_GRAY_800 = '#1F2933';
const BRAND_GRAY_500 = '#6B7280';
const BRAND_GRAY_200 = '#E5E7EB';

const formatTime = (time: string) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export const downloadPDFDirect = async (rental: Rental): Promise<void> => {
  const displayAgreementNumber = rental.agreementNumber || rental.id.toUpperCase();
  const company = getCompanyInfo();
  
  // Create a hidden container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // A4 width at 96 DPI
  container.style.background = 'white';
  document.body.appendChild(container);

  // Client images section
  const clientImages = [];
  if (rental.client.photo) clientImages.push({ label: 'Client Photo', src: rental.client.photo });
  if (rental.client.cnicFrontImage) clientImages.push({ label: 'CNIC Front', src: rental.client.cnicFrontImage });
  if (rental.client.cnicBackImage) clientImages.push({ label: 'CNIC Back', src: rental.client.cnicBackImage });
  if (rental.client.drivingLicenseImage) clientImages.push({ label: 'Driving License', src: rental.client.drivingLicenseImage });

  // Dents & Scratches images
  const dentsImages = rental.dentsScratches?.images || [];

  // Accessories checklist
  const accessoriesList = rental.accessories ? Object.entries(rental.accessories)
    .filter(([_, v]) => v)
    .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim())
    .join(', ') : 'None';

  container.innerHTML = `
    <div id="pdf-content" style="padding: 24px; font-family: 'Inter', Arial, sans-serif; color: ${BRAND_GRAY_800}; line-height: 1.5;">
      <!-- Header with Centered Logo - NO BACKGROUND -->
      <div style="text-align: center; padding-bottom: 20px; margin-bottom: 20px; border-bottom: 5px solid ${BRAND_ORANGE};">
        <!-- Centered Brand Logo - LARGE, NO BACKGROUND -->
        <div style="margin: 0 auto 15px auto; width: 180px; height: 180px; display: flex; align-items: center; justify-content: center;">
          <img src="https://raw.githubusercontent.com/yousif-sons/assets/main/logo-orange.png" onerror="this.src='/src/assets/brand-logo.png'" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));" alt="Company Logo" />
        </div>
        
        <!-- Company Info -->
        <div style="margin-bottom: 12px;">
          <div style="font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: ${BRAND_ORANGE}; margin-bottom: 4px;">${company.name || 'Yousif & Sons'}</div>
          <div style="color: ${BRAND_GRAY_500}; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">${company.tagline || 'Rent A Car & Travel Management'}</div>
          <div style="font-size: 11px; color: ${BRAND_GRAY_500}; font-style: italic; margin-top: 3px;">${company.tagline ? '' : 'Your Ride, Your Way!'}</div>
        </div>
        
        <!-- Owner Contact Details -->
        <div style="background: #FFF5EC; padding: 12px; border-radius: 10px; margin: 15px auto; max-width: 600px; border: 1px solid ${BRAND_ORANGE};">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
            ${company.phone ? `<div style="text-align: left;"><span style="color: ${BRAND_GRAY_500};">📞 Phone:</span> <strong style="color: ${BRAND_GRAY_800};">${company.phone}</strong></div>` : ''}
            ${company.phone2 ? `<div style="text-align: right;"><span style="color: ${BRAND_GRAY_500};">📱 Alt:</span> <strong style="color: ${BRAND_GRAY_800};">${company.phone2}</strong></div>` : ''}
            ${company.email ? `<div style="text-align: left;"><span style="color: ${BRAND_GRAY_500};">📧 Email:</span> <strong style="color: ${BRAND_GRAY_800};">${company.email}</strong></div>` : ''}
            ${company.address ? `<div style="grid-column: 1 / -1; text-align: center; margin-top: 4px;"><span style="color: ${BRAND_GRAY_500};">📍 Address:</span> <strong style="color: ${BRAND_GRAY_800};">${company.address}</strong></div>` : ''}
          </div>
        </div>
        
        <!-- Agreement Number Badge -->
        <div style="margin-top: 15px;">
          <div style="background: ${BRAND_ORANGE}; color: white; padding: 10px 24px; border-radius: 10px; font-weight: 800; font-size: 16px; display: inline-block; box-shadow: 0 4px 10px rgba(244, 124, 44, 0.3);">
            AGREEMENT REF: #${displayAgreementNumber}
          </div>
          <div style="color: ${BRAND_GRAY_500}; font-size: 10px; margin-top: 6px;">Issued: ${formatDate(rental.createdAt)}</div>
        </div>
      </div>

      <!-- Vehicle Hero Section with Brand Logo -->
      <div style="background: linear-gradient(135deg, ${BRAND_ORANGE} 0%, ${BRAND_RED} 100%); color: white; border-radius: 15px; padding: 18px; display: flex; align-items: center; gap: 20px; margin-bottom: 20px; box-shadow: 0 10px 20px rgba(244, 124, 44, 0.2);">
        <div style="width: 150px; height: 95px; background: white; border-radius: 10px; padding: 5px; display: flex; align-items: center; justify-content: center;">
          ${rental.vehicle.image ? `<img src="${rental.vehicle.image}" alt="Vehicle" style="width: 100%; height: 100%; object-fit: contain; border-radius: 6px;">` : `<div style="font-size: 32px; font-weight: 900; color: ${BRAND_ORANGE};">${rental.vehicle.brand?.charAt(0) || 'V'}</div>`}
        </div>
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            ${rental.vehicle.logo ? `<img src="${rental.vehicle.logo}" alt="${rental.vehicle.brand}" style="height: 35px; width: auto; object-fit: contain; background: white; padding: 4px 8px; border-radius: 6px;" onerror="this.style.display='none'">` : ''}
            <div style="font-size: 20px; font-weight: 800;">${rental.vehicle.brand} ${rental.vehicle.model}</div>
          </div>
          ${rental.vehicle.year ? `<div style="font-size: 13px; font-weight: 600; opacity: 0.95; margin-bottom: 4px;">Year: ${rental.vehicle.year}</div>` : ''}
          <div style="font-size: 26px; font-weight: 900; letter-spacing: 2px; border: 2px dashed rgba(255,255,255,0.5); padding: 4px 12px; display: inline-block; border-radius: 8px; margin-top: 4px;">${rental.vehicle.carNumber || 'N/A'}</div>
          <div style="margin-top: 8px; font-weight: 600; font-size: 12px; opacity: 0.95;">Type: ${rental.vehicle.type} • Color: ${rental.vehicle.color || 'N/A'}</div>
        </div>
      </div>

      <!-- Main Grid: Client & Witness -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 18px;">
        <!-- Client Info -->
        <div style="border: 1.5px solid ${BRAND_GRAY_200}; border-radius: 12px; overflow: hidden; background: white;">
          <div style="background: #FFF5EC; padding: 9px 14px; font-weight: 800; font-size: 11px; text-transform: uppercase; color: ${BRAND_ORANGE}; border-bottom: 1.5px solid ${BRAND_GRAY_200};">👤 Client Information</div>
          <div style="padding: 14px;">
            <div style="display: flex; margin-bottom: 7px; font-size: 12px; border-bottom: 1px solid #F9FAFB; padding-bottom: 4px;">
              <span style="color: ${BRAND_GRAY_500}; width: 85px; flex-shrink: 0; font-weight: 600;">Full Name</span>
              <span style="font-weight: 700; color: ${BRAND_GRAY_800};">${rental.client.fullName}</span>
            </div>
            <div style="display: flex; margin-bottom: 7px; font-size: 12px; border-bottom: 1px solid #F9FAFB; padding-bottom: 4px;">
              <span style="color: ${BRAND_GRAY_500}; width: 85px; flex-shrink: 0; font-weight: 600;">CNIC No</span>
              <span style="font-weight: 700; color: ${BRAND_GRAY_800};">${rental.client.cnic}</span>
            </div>
            <div style="display: flex; margin-bottom: 7px; font-size: 12px; border-bottom: 1px solid #F9FAFB; padding-bottom: 4px;">
              <span style="color: ${BRAND_GRAY_500}; width: 85px; flex-shrink: 0; font-weight: 600;">Phone</span>
              <span style="font-weight: 700; color: ${BRAND_GRAY_800};">${rental.client.phone}</span>
            </div>
            <div style="display: flex; font-size: 12px;">
              <span style="color: ${BRAND_GRAY_500}; width: 85px; flex-shrink: 0; font-weight: 600;">Address</span>
              <span style="font-weight: 700; color: ${BRAND_GRAY_800};">${rental.client.address}</span>
            </div>
          </div>
        </div>

        <!-- Witness Info -->
        <div style="border: 1.5px solid ${BRAND_GRAY_200}; border-radius: 12px; overflow: hidden; background: white;">
          <div style="background: #FFF5EC; padding: 9px 14px; font-weight: 800; font-size: 11px; text-transform: uppercase; color: ${BRAND_ORANGE}; border-bottom: 1.5px solid ${BRAND_GRAY_200};">👥 Witness Details</div>
          <div style="padding: 14px;">
            <div style="display: flex; margin-bottom: 7px; font-size: 12px; border-bottom: 1px solid #F9FAFB; padding-bottom: 4px;">
              <span style="color: ${BRAND_GRAY_500}; width: 85px; flex-shrink: 0; font-weight: 600;">Full Name</span>
              <span style="font-weight: 700; color: ${BRAND_GRAY_800};">${rental.witness.name}</span>
            </div>
            <div style="display: flex; margin-bottom: 7px; font-size: 12px; border-bottom: 1px solid #F9FAFB; padding-bottom: 4px;">
              <span style="color: ${BRAND_GRAY_500}; width: 85px; flex-shrink: 0; font-weight: 600;">CNIC No</span>
              <span style="font-weight: 700; color: ${BRAND_GRAY_800};">${rental.witness.cnic}</span>
            </div>
            <div style="display: flex; margin-bottom: 7px; font-size: 12px; border-bottom: 1px solid #F9FAFB; padding-bottom: 4px;">
              <span style="color: ${BRAND_GRAY_500}; width: 85px; flex-shrink: 0; font-weight: 600;">Phone</span>
              <span style="font-weight: 700; color: ${BRAND_GRAY_800};">${rental.witness.phone}</span>
            </div>
            <div style="display: flex; font-size: 12px;">
              <span style="color: ${BRAND_GRAY_500}; width: 85px; flex-shrink: 0; font-weight: 600;">Address</span>
              <span style="font-weight: 700; color: ${BRAND_GRAY_800};">${rental.witness.address}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Rental Period Timeline -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 18px;">
        <div style="border-radius: 10px; padding: 12px; text-align: center; background: linear-gradient(135deg, #ecfdf5, #d1fae5); border: 2px solid #6ee7b7;">
          <div style="font-size: 9px; color: ${BRAND_GRAY_500}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 700;">🚀 Delivery (Check Out)</div>
          <div style="font-weight: 700; font-size: 13px; color: ${BRAND_GRAY_800};">📅 ${formatDate(rental.deliveryDate)}</div>
          <div style="font-weight: 600; font-size: 11px; margin-top: 2px; color: #059669;">⏰ ${formatTime(rental.deliveryTime)}</div>
        </div>
        <div style="border-radius: 10px; padding: 12px; text-align: center; background: linear-gradient(135deg, #fef2f2, #fecaca); border: 2px solid #fca5a5;">
          <div style="font-size: 9px; color: ${BRAND_GRAY_500}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 700;">🏁 Return (Check In)</div>
          <div style="font-weight: 700; font-size: 13px; color: ${BRAND_GRAY_800};">📅 ${formatDate(rental.returnDate)}</div>
          <div style="font-weight: 600; font-size: 11px; margin-top: 2px; color: #e11d48;">⏰ ${formatTime(rental.returnTime)}</div>
        </div>
      </div>

      <!-- Equipment & Payment Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 18px;">
        <!-- Accessories & Vehicle Condition -->
        <div style="border: 1.5px solid ${BRAND_GRAY_200}; border-radius: 12px; overflow: hidden; background: white;">
          <div style="background: #FFF5EC; padding: 9px 14px; font-weight: 800; font-size: 11px; text-transform: uppercase; color: ${BRAND_ORANGE}; border-bottom: 1.5px solid ${BRAND_GRAY_200};">🔧 Equipment & Condition</div>
          <div style="padding: 14px;">
            <div style="margin-bottom: 10px;">
              <div style="font-size: 10px; font-weight: 700; color: ${BRAND_GRAY_500}; margin-bottom: 5px; text-transform: uppercase;">Accessories:</div>
              <div style="font-size: 11px; color: ${BRAND_GRAY_800}; line-height: 1.6;">${accessoriesList}</div>
            </div>
            ${rental.vehicleCondition ? `
            <div style="display: flex; margin-bottom: 6px; font-size: 11px; border-bottom: 1px solid #F9FAFB; padding-bottom: 3px;">
              <span style="color: ${BRAND_GRAY_500}; width: 75px; flex-shrink: 0; font-weight: 600;">Fuel Level</span>
              <span style="font-weight: 700; color: ${BRAND_GRAY_800}; text-transform: capitalize;">${rental.vehicleCondition.fuelLevel || 'N/A'}</span>
            </div>
            <div style="display: flex; margin-bottom: 6px; font-size: 11px; border-bottom: 1px solid #F9FAFB; padding-bottom: 3px;">
              <span style="color: ${BRAND_GRAY_500}; width: 75px; flex-shrink: 0; font-weight: 600;">Mileage</span>
              <span style="font-weight: 700; color: ${BRAND_GRAY_800};">${rental.vehicleCondition.mileage || 'N/A'} KM</span>
            </div>
            <div style="display: flex; margin-bottom: 6px; font-size: 11px; border-bottom: 1px solid #F9FAFB; padding-bottom: 3px;">
              <span style="color: ${BRAND_GRAY_500}; width: 75px; flex-shrink: 0; font-weight: 600;">AC Working</span>
              <span style="font-weight: 700; color: ${BRAND_GRAY_800}; text-transform: capitalize;">${rental.vehicleCondition.acWorking || 'N/A'}</span>
            </div>
            <div style="display: flex; font-size: 11px;">
              <span style="color: ${BRAND_GRAY_500}; width: 75px; flex-shrink: 0; font-weight: 600;">Scratches</span>
              <span style="font-weight: 700; color: ${BRAND_GRAY_800}; text-transform: capitalize;">${rental.vehicleCondition.scratchesDents || 'N/A'}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Payment Summary -->
        <div style="background: #FFF5EC; border: 2px solid ${BRAND_ORANGE}; border-radius: 12px; overflow: hidden;">
          <div style="background: transparent; padding: 9px 14px; font-weight: 800; font-size: 11px; text-transform: uppercase; color: ${BRAND_ORANGE}; border-bottom: 1px solid rgba(0,0,0,0.1);">💰 Payment Summary</div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 11px 18px; font-size: 12px; border-bottom: 1px solid ${BRAND_GRAY_200};">Total Amount (${rental.rentType})</td>
              <td style="text-align: right; font-weight: 800; font-size: 14px; padding: 11px 18px; border-bottom: 1px solid ${BRAND_GRAY_200};">${formatCurrency(rental.totalAmount)}</td>
            </tr>
            <tr>
              <td style="padding: 11px 18px; font-size: 12px; border-bottom: 1px solid ${BRAND_GRAY_200};">Advance Payment</td>
              <td style="text-align: right; font-weight: 800; font-size: 14px; color: #16a34a; padding: 11px 18px; border-bottom: 1px solid ${BRAND_GRAY_200};">-${formatCurrency(rental.advancePayment)}</td>
            </tr>
            <tr style="background: ${BRAND_ORANGE}; color: white;">
              <td style="padding: 11px 18px; border-color: transparent;"><strong>BALANCE DUE</strong></td>
              <td style="text-align: right; font-size: 20px; font-weight: 800; padding: 11px 18px; border-color: transparent;">${formatCurrency(rental.balance)}</td>
            </tr>
          </table>
        </div>
      </div>

      ${clientImages.length > 0 ? `
      <!-- Client Documents -->
      <div style="margin-bottom: 18px;">
        <div style="font-weight: 800; font-size: 11px; color: ${BRAND_ORANGE}; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid ${BRAND_GRAY_200}; text-transform: uppercase;">📋 Client Documents</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
          ${clientImages.map(img => `
            <div style="background: #FFF5EC; border: 1px solid #FFD7B3; border-radius: 10px; padding: 8px; text-align: center;">
              <p style="font-weight: 700; font-size: 9px; color: ${BRAND_ORANGE}; margin-bottom: 6px; text-transform: uppercase;">${img.label}</p>
              <img src="${img.src}" alt="${img.label}" style="width: 100%; max-height: 80px; object-fit: contain; border-radius: 6px; background: white;">
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      ${rental.vehicleCondition ? `
      <!-- Detailed Vehicle Condition Report -->
      <div style="margin-bottom: 18px;">
        <div style="font-weight: 800; font-size: 11px; color: ${BRAND_ORANGE}; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid ${BRAND_GRAY_200}; text-transform: uppercase;">🔍 Vehicle Condition Report</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
          ${rental.vehicleCondition.tyresCondition ? `<div style="background: #F9FAFB; border: 1px solid ${BRAND_GRAY_200}; padding: 6px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; display: flex; align-items: center; gap: 5px;"><span style="color: ${BRAND_ORANGE}; font-size: 12px;">●</span>Tyres: ${rental.vehicleCondition.tyresCondition}</div>` : ''}
          ${rental.vehicleCondition.tyrePressure ? `<div style="background: #F9FAFB; border: 1px solid ${BRAND_GRAY_200}; padding: 6px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; display: flex; align-items: center; gap: 5px;"><span style="color: ${BRAND_ORANGE}; font-size: 12px;">●</span>Pressure: ${rental.vehicleCondition.tyrePressure}</div>` : ''}
          ${rental.vehicleCondition.frontBumper ? `<div style="background: #F9FAFB; border: 1px solid ${BRAND_GRAY_200}; padding: 6px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; display: flex; align-items: center; gap: 5px;"><span style="color: ${BRAND_ORANGE}; font-size: 12px;">●</span>Front Bumper: ${rental.vehicleCondition.frontBumper}</div>` : ''}
          ${rental.vehicleCondition.backBumper ? `<div style="background: #F9FAFB; border: 1px solid ${BRAND_GRAY_200}; padding: 6px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; display: flex; align-items: center; gap: 5px;"><span style="color: ${BRAND_ORANGE}; font-size: 12px;">●</span>Back Bumper: ${rental.vehicleCondition.backBumper}</div>` : ''}
          ${rental.vehicleCondition.sideMirrors ? `<div style="background: #F9FAFB; border: 1px solid ${BRAND_GRAY_200}; padding: 6px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; display: flex; align-items: center; gap: 5px;"><span style="color: ${BRAND_ORANGE}; font-size: 12px;">●</span>Mirrors: ${rental.vehicleCondition.sideMirrors}</div>` : ''}
          ${rental.vehicleCondition.windowsGlass ? `<div style="background: #F9FAFB; border: 1px solid ${BRAND_GRAY_200}; padding: 6px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; display: flex; align-items: center; gap: 5px;"><span style="color: ${BRAND_ORANGE}; font-size: 12px;">●</span>Windows: ${rental.vehicleCondition.windowsGlass}</div>` : ''}
          ${rental.vehicleCondition.heaterWorking ? `<div style="background: #F9FAFB; border: 1px solid ${BRAND_GRAY_200}; padding: 6px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; display: flex; align-items: center; gap: 5px;"><span style="color: ${BRAND_ORANGE}; font-size: 12px;">●</span>Heater: ${rental.vehicleCondition.heaterWorking}</div>` : ''}
          ${rental.vehicleCondition.horn ? `<div style="background: #F9FAFB; border: 1px solid ${BRAND_GRAY_200}; padding: 6px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; display: flex; align-items: center; gap: 5px;"><span style="color: ${BRAND_ORANGE}; font-size: 12px;">●</span>Horn: ${rental.vehicleCondition.horn}</div>` : ''}
          ${rental.vehicleCondition.wipers ? `<div style="background: #F9FAFB; border: 1px solid ${BRAND_GRAY_200}; padding: 6px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; display: flex; align-items: center; gap: 5px;"><span style="color: ${BRAND_ORANGE}; font-size: 12px;">●</span>Wipers: ${rental.vehicleCondition.wipers}</div>` : ''}
          ${rental.vehicleCondition.seatCondition ? `<div style="background: #F9FAFB; border: 1px solid ${BRAND_GRAY_200}; padding: 6px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; display: flex; align-items: center; gap: 5px;"><span style="color: ${BRAND_ORANGE}; font-size: 12px;">●</span>Seats: ${rental.vehicleCondition.seatCondition}</div>` : ''}
          ${rental.vehicleCondition.seatBelts ? `<div style="background: #F9FAFB; border: 1px solid ${BRAND_GRAY_200}; padding: 6px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; display: flex; align-items: center; gap: 5px;"><span style="color: ${BRAND_ORANGE}; font-size: 12px;">●</span>Seat Belts: ${rental.vehicleCondition.seatBelts}</div>` : ''}
          ${rental.vehicleCondition.radiator ? `<div style="background: #F9FAFB; border: 1px solid ${BRAND_GRAY_200}; padding: 6px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; display: flex; align-items: center; gap: 5px;"><span style="color: ${BRAND_ORANGE}; font-size: 12px;">●</span>Radiator: ${rental.vehicleCondition.radiator}</div>` : ''}
        </div>
      </div>
      ` : ''}

      ${rental.dentsScratches && (rental.dentsScratches.notes || dentsImages.length > 0) ? `
      <!-- Dents & Scratches Report -->
      <div style="margin-bottom: 18px;">
        <div style="font-weight: 800; font-size: 11px; color: ${BRAND_ORANGE}; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid ${BRAND_GRAY_200}; text-transform: uppercase;">⚠️ Dents & Scratches Report</div>
        ${rental.dentsScratches.notes ? `<div style="background: #FFF5EC; padding: 12px; border-radius: 8px; color: ${BRAND_GRAY_800}; border-left: 4px solid ${BRAND_ORANGE}; font-size: 11px; margin-bottom: 10px;">${rental.dentsScratches.notes}</div>` : ''}
        ${dentsImages.length > 0 ? `
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
          ${dentsImages.map((img, idx) => `
            <div style="background: #F9FAFB; border: 1px solid ${BRAND_GRAY_200}; border-radius: 8px; padding: 5px; text-align: center;">
              <img src="${img}" alt="Damage ${idx + 1}" style="width: 100%; max-height: 70px; object-fit: cover; border-radius: 6px;">
              <p style="font-size: 9px; color: ${BRAND_GRAY_500}; margin-top: 4px; font-weight: 600;">Damage ${idx + 1}</p>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
      ` : ''}

      ${rental.notes ? `
      <!-- Additional Notes -->
      <div style="margin-bottom: 18px;">
        <div style="font-weight: 800; font-size: 11px; color: ${BRAND_ORANGE}; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid ${BRAND_GRAY_200}; text-transform: uppercase;">📝 Additional Notes</div>
        <div style="background: #FFF5EC; padding: 12px; border-radius: 8px; color: ${BRAND_GRAY_800}; border-left: 4px solid ${BRAND_ORANGE}; font-size: 11px;">${rental.notes}</div>
      </div>
      ` : ''}

      <!-- Terms & Conditions (Urdu) -->
      <div style="margin-top: 20px; padding: 18px; background: #FFFCF5; border: 2px solid #FFE8BF; border-radius: 15px; direction: rtl; font-family: 'Noto Nastaliq Urdu', serif;">
        <h2 style="font-size: 16px; font-weight: 700; color: ${BRAND_RED}; margin-bottom: 8px; text-align: center; border-bottom: 1px solid #FFE8BF; padding-bottom: 5px;">شرائط و ضوابط (Terms & Conditions)</h2>
        <div style="font-size: 11px; line-height: 2; color: #333; text-align: justify;">
          ${URDU_TERMS_LIST.map((term, index) => `${index + 1}. ${term}`).join('<br>')}
        </div>
      </div>

      <!-- Signatures -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-top: 30px; padding-top: 16px;">
        <div style="text-align: center;">
          <div style="border-bottom: 3px solid ${BRAND_GRAY_800}; height: 60px; margin-bottom: 8px; display: flex; align-items: flex-end; justify-content: center;">
            ${rental.clientSignature ? `<img src="${rental.clientSignature}" alt="Client Signature" style="max-height: 55px; max-width: 220px; object-fit: contain;">` : ''}
          </div>
          <div style="font-size: 12px; font-weight: 800; color: ${BRAND_ORANGE}; text-transform: uppercase;">Client Signature</div>
        </div>
        <div style="text-align: center;">
          <div style="border-bottom: 3px solid ${BRAND_GRAY_800}; height: 60px; margin-bottom: 8px; display: flex; align-items: flex-end; justify-content: center;">
            ${rental.ownerSignature ? `<img src="${rental.ownerSignature}" alt="Owner Signature" style="max-height: 55px; max-width: 220px; object-fit: contain;">` : ''}
          </div>
          <div style="font-size: 12px; font-weight: 800; color: ${BRAND_ORANGE}; text-transform: uppercase;">Authorized Signature</div>
        </div>
      </div>

      <!-- Footer -->
      <div style="border-top: 2px solid ${BRAND_GRAY_200}; padding-top: 16px; margin-top: 25px; text-align: center;">
        <div style="font-size: 15px; font-weight: 700; color: ${BRAND_ORANGE};">${company.name || 'Yousif & Sons'}</div>
        <div style="font-size: 10px; color: ${BRAND_GRAY_500}; font-style: italic; margin-top: 2px;">${company.tagline || 'Your Ride, Your Way!'}</div>
        <p style="margin-top: 8px; font-size: 9px; color: ${BRAND_GRAY_500};">This document is an electronic record generated by ${company.name || 'Yousif & Sons'} Management System.</p>
        <p style="font-size: 9px; color: ${BRAND_GRAY_500}; font-weight: 600;">Thank you for choosing us!</p>
      </div>
    </div>
  `;

  try {
    // Wait for images to load
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const element = container.querySelector('#pdf-content') as HTMLElement;
    if (!element) {
      throw new Error('PDF content element not found');
    }
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
    // Save the PDF
    pdf.save(`Agreement-${displayAgreementNumber}.pdf`);
  } catch (error) {
    console.error('PDF generation error:', error);
    // Fallback to print-based PDF
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(container.innerHTML);
        printWindow.document.close();
        printWindow.print();
      } else {
        alert('Failed to generate PDF. Please allow popups and try again.');
      }
    } catch (fallbackError) {
      alert('Failed to generate PDF. Please try again.');
    }
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};
