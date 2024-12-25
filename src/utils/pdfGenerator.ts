import jsPDF from 'jspdf';
import type { Prescription } from '../types';
import { getGlobalSettings } from '../stores/globalSettingsStore';

const formatPrescriptionDetails = (prescription: Partial<Prescription>) => {
  const globalSettings = getGlobalSettings();
  const doctor = {
    name: globalSettings.doctorName || 'Dr. Ram Kumar',
    qualifications: globalSettings.doctorQualifications || 'MBBS, MD, MPH (USA)',
    regNo: globalSettings.doctorRegNo || 'Regd No: 54371',
    specialization: globalSettings.doctorSpecialization || 'Physician & Consultant (General Medicine)'
  };

  // Ensure we get patient details from all possible sources
  const patientName = prescription.patientName || prescription.patient?.name || 'Unknown Patient';
  const patientGender = prescription.gender || prescription.patient?.gender || 'Not Specified';
  const patientAge = prescription.age || prescription.patient?.age?.toString() || 'Not Specified';
  const patientPhone = prescription.phone || prescription.patient?.phoneNumber || 'Not Provided';

  return {
    clinic: {
      name: globalSettings.clinicName || 'Suguna Clinic',
      address: globalSettings.clinicAddress || 'Vinayak Nagar, Hyderabad',
      location: globalSettings.clinicLocation || 'Hyderabad, Telangana',
      phone: globalSettings.clinicPhone || 'Ph: 9618994555',
      website: globalSettings.clinicWebsite || 'Website: sugunaclinic.com'
    },
    doctor,
    prescription: {
      id: prescription.prescriptionId || `OPD${Date.now()}`,
      date: new Date().toLocaleDateString(),
      visitId: prescription.visitId || `OCID${Date.now()}`,
      patientDetails: {
        name: patientName,
        gender: patientGender,
        age: patientAge,
        weight: prescription.vitalSigns?.weight || '',
        bp: prescription.vitalSigns?.bloodPressure || '',
        temperature: prescription.vitalSigns?.temperature ? `${prescription.vitalSigns.temperature} F` : '',
        phone: patientPhone,
        allergies: prescription.knownAllergies || ''
      },
      symptoms: prescription.symptoms || '',
      medications: prescription.medications || [],
      labTests: prescription.labTests || [],
      advice: prescription.advice || ''
    }
  };
};

export const generatePrescriptionPDF = async (prescription: Partial<Prescription>, returnBlob: boolean = false): Promise<{ blob: Blob; url: string } | void> => {
  const doc = new jsPDF();
  const details = formatPrescriptionDetails(prescription);
  
  // Add clinic logo if available
  const clinicLogo = getGlobalSettings().clinicLogo;
  if (clinicLogo) {
    try {
      doc.addImage(clinicLogo, 'PNG', 15, 10, 30, 30);
    } catch (error) {
      console.error('Error adding clinic logo:', error);
    }
  }

  // Header - Clinic Details (Left Side)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(details.clinic.name, 50, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(details.clinic.address, 50, 25);
  doc.text(details.clinic.location, 50, 30);
  doc.text(details.clinic.phone, 50, 35);
  doc.text(details.clinic.website, 50, 40);

  // Header - Doctor Details (Right Side)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(details.doctor.name, 140, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(details.doctor.qualifications, 140, 25);
  doc.text(details.doctor.specialization, 140, 30);
  doc.text(details.doctor.regNo, 140, 35);

  // Prescription Details
  doc.line(15, 45, 195, 45); // Horizontal line

  // Prescription ID and Date
  doc.setFontSize(10);
  doc.text(`Prescription ${details.prescription.id}`, 15, 55);
  doc.text(`Date : ${details.prescription.date}`, 140, 55);

  // Patient Details - Left Column
  let y = 65;
  doc.text('OPD ID', 15, y);
  doc.text(': ' + details.prescription.id, 60, y);
  doc.text('OPD Visit ID', 110, y);
  doc.text(': ' + details.prescription.visitId, 160, y);

  y += 7;
  doc.text('Patient Name', 15, y);
  doc.text(': ' + details.prescription.patientDetails.name, 60, y);
  doc.text('Age', 110, y);
  doc.text(': ' + details.prescription.patientDetails.age + ' years', 160, y);

  y += 7;
  doc.text('Gender', 15, y);
  doc.text(': ' + details.prescription.patientDetails.gender, 60, y);
  doc.text('Phone', 110, y);
  doc.text(': ' + details.prescription.patientDetails.phone, 160, y);

  y += 7;
  doc.text('BP', 15, y);
  doc.text(': ' + details.prescription.patientDetails.bp, 60, y);
  doc.text('Temperature', 110, y);
  doc.text(': ' + details.prescription.patientDetails.temperature, 160, y);

  y += 7;
  doc.text('Weight', 15, y);
  doc.text(': ' + details.prescription.patientDetails.weight + ' kg', 60, y);
  doc.text('Allergies', 110, y);
  doc.text(': ' + details.prescription.patientDetails.allergies, 160, y);

  y += 7;
  doc.text('Consultant Doctor', 15, y);
  doc.text(': ' + details.doctor.name, 60, y);

  // Symptoms 
  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('Symptoms:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(details.prescription.symptoms, 25, y + 7);

  // Medications
  y += 25;
  doc.setFont('helvetica', 'bold');
  doc.text('Medicines', 15, y);

  // Medication Table Headers
  y += 7;
  doc.setFontSize(9);
  doc.text('#', 15, y);
  doc.text('Category', 25, y);
  doc.text('Medicine', 45, y);
  doc.text('Dosage', 105, y);
  doc.text('Interval', 130, y);
  doc.text('Duration', 160, y);
  doc.text('Instruction', 185, y);

  // Medication Rows
  doc.setFont('helvetica', 'normal');
  details.prescription.medications.forEach((med, index) => {
    y += 7;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text((index + 1).toString(), 15, y);
    doc.text('Tab', 25, y);
    doc.text(med.name, 45, y);
    doc.text(med.dosage, 105, y);
    doc.text(med.interval, 130, y);
    doc.text(med.duration, 160, y);
    doc.text(med.instructions, 185, y);
  });

  // Lab Tests
  if (details.prescription.labTests.length > 0) {
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('Pathology Test', 15, y);
    details.prescription.labTests.forEach((test, index) => {
      y += 7;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'normal');
      doc.text(`${index + 1}. ${test}`, 15, y);
    });
  }

  // Additional Advice
  if (details.prescription.advice) {
    y += 15;
    doc.setFont('helvetica', 'normal');
    doc.text(details.prescription.advice, 15, y);
  }

  // Return blob and URL or save file
  if (returnBlob) {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    return { blob, url };
  } else {
    const filename = `prescription-${details.prescription.id}-${Date.now()}.pdf`;
    try {
      doc.save(filename);
      console.log(`PDF saved: ${filename}`);
    } catch (error) {
      console.error('Error saving PDF:', error);
      throw error;
    }
  }
};
